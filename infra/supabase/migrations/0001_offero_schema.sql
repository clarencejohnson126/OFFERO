-- Offero v1 — Schema im DEDIZIERTEN `offero`-Schema (getrennt von der Alt-App neatlify im public-Schema).
-- ADR 0006. Enums als Text + CHECK. FKs auf auth.users. RLS überall. Credit-Logik als idempotente RPCs.

create schema if not exists offero;
grant usage on schema offero to anon, authenticated, service_role;

-- ── profile (1:1 user) ───────────────────────────────────────────────────────
create table offero.profile (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  contact       jsonb not null default '{}'::jsonb,
  cv_raw        jsonb,
  cv_structured jsonb,
  photo         jsonb,
  tool_stack    jsonb not null default '[]'::jsonb,
  languages     jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table offero.profile enable row level security;

-- ── application (1:N pro user) ───────────────────────────────────────────────
create table offero.application (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  tenant_slug        text not null,
  job_url            text,
  job_text           text,
  company            jsonb not null default '{}'::jsonb,
  status             text not null default 'draft'
                       check (status in ('draft', 'generating', 'ready', 'shared', 'archived')),
  current_version_id uuid,
  custom_domain      text,
  created_at         timestamptz not null default now()
);
create unique index application_slug_lower_idx on offero.application (lower(tenant_slug));
create unique index application_custom_domain_idx on offero.application (custom_domain) where custom_domain is not null;
create index application_user_idx on offero.application (user_id);
alter table offero.application enable row level security;

-- ── generation_version + edit_log (ADR 0005) ─────────────────────────────────
create table offero.generation_version (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references offero.application (id) on delete cascade,
  kind           text not null check (kind in ('generation', 're_roll')),
  content        jsonb not null,
  model_used     text,
  cost_cents     integer not null default 0 check (cost_cents >= 0),
  created_at     timestamptz not null default now()
);
create index genver_app_idx on offero.generation_version (application_id, created_at desc);
alter table offero.generation_version enable row level security;

alter table offero.application
  add constraint application_current_version_fk
  foreign key (current_version_id) references offero.generation_version (id) on delete set null;

create table offero.edit_log (
  id         uuid primary key default gen_random_uuid(),
  version_id uuid not null references offero.generation_version (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  patch      jsonb not null,
  created_at timestamptz not null default now()
);
create index edit_log_version_idx on offero.edit_log (version_id, created_at);
alter table offero.edit_log enable row level security;

-- ── media_asset ──────────────────────────────────────────────────────────────
create table offero.media_asset (
  id          uuid primary key default gen_random_uuid(),
  version_id  uuid not null references offero.generation_version (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('image', 'video', 'pdf')),
  storage_ref jsonb,
  renderer    text not null check (renderer in ('gemini', 'remotion', 'ffmpeg_lite', 'headless_pdf')),
  cost_cents  integer not null default 0 check (cost_cents >= 0),
  meta        jsonb not null default '{}'::jsonb,
  status      text not null default 'queued' check (status in ('queued', 'running', 'ready', 'error')),
  created_at  timestamptz not null default now()
);
create index media_version_idx on offero.media_asset (version_id);
create index media_user_status_idx on offero.media_asset (user_id, status);
alter table offero.media_asset enable row level security;

-- ── credit_wallet + credit_ledger ────────────────────────────────────────────
create table offero.credit_wallet (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  balance                integer not null default 0 check (balance >= 0),
  free_rerolls_remaining integer not null default 0 check (free_rerolls_remaining >= 0),
  plan                   text not null default 'free'
                           check (plan in ('free', 'starter', 'plus', 'pro', 'subscription')),
  updated_at             timestamptz not null default now()
);
alter table offero.credit_wallet enable row level security;

create table offero.credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  delta      integer not null,
  reason     text not null
               check (reason in ('purchase', 'generation', 're_roll', 'subscription_grant', 'refund')),
  ref_id     text not null,
  created_at timestamptz not null default now()
);
create unique index ledger_idem_idx on offero.credit_ledger (user_id, reason, ref_id);
create index ledger_user_idx on offero.credit_ledger (user_id, created_at desc);
alter table offero.credit_ledger enable row level security;

-- ── purchase / subscription ──────────────────────────────────────────────────
create table offero.purchase (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  provider     text not null check (provider in ('stripe', 'apple_iap', 'google_iap')),
  external_id  text not null,
  product      text not null,
  amount_cents integer not null check (amount_cents >= 0),
  status       text not null check (status in ('pending', 'completed', 'refunded', 'failed')),
  created_at   timestamptz not null default now(),
  unique (provider, external_id)
);
create index purchase_user_idx on offero.purchase (user_id, created_at desc);
alter table offero.purchase enable row level security;

create table offero.subscription (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  provider    text not null check (provider in ('stripe', 'apple_iap', 'google_iap')),
  external_id text not null,
  product     text not null,
  status      text not null check (status in ('active', 'past_due', 'canceled')),
  period_end  timestamptz,
  created_at  timestamptz not null default now(),
  unique (provider, external_id)
);
create index subscription_user_active_idx on offero.subscription (user_id) where status = 'active';
alter table offero.subscription enable row level security;

-- ── page_view (Radar, cookieless, kein user_id) ──────────────────────────────
create table offero.page_view (
  id             bigint generated always as identity primary key,
  application_id uuid not null references offero.application (id) on delete cascade,
  ts             timestamptz not null default now(),
  coarse_signal  jsonb not null default '{}'::jsonb
);
create index page_view_app_ts_idx on offero.page_view (application_id, ts desc);
alter table offero.page_view enable row level security;

-- ── RLS-Policies (Default deny; auth-Clients sehen nur eigene Zeilen) ─────────
create policy profile_select on offero.profile for select to authenticated using (user_id = (select auth.uid()));
create policy profile_insert on offero.profile for insert to authenticated with check (user_id = (select auth.uid()));
create policy profile_update on offero.profile for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy profile_delete on offero.profile for delete to authenticated using (user_id = (select auth.uid()));

create policy app_select on offero.application for select to authenticated using (user_id = (select auth.uid()));
create policy app_insert on offero.application for insert to authenticated with check (user_id = (select auth.uid()));
create policy app_update on offero.application for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy app_delete on offero.application for delete to authenticated using (user_id = (select auth.uid()));

create policy genver_select on offero.generation_version for select to authenticated
  using (exists (select 1 from offero.application a where a.id = application_id and a.user_id = (select auth.uid())));

create policy edit_select on offero.edit_log for select to authenticated using (user_id = (select auth.uid()));
create policy edit_insert on offero.edit_log for insert to authenticated with check (user_id = (select auth.uid()));

create policy media_select on offero.media_asset for select to authenticated using (user_id = (select auth.uid()));

create policy wallet_select on offero.credit_wallet for select to authenticated using (user_id = (select auth.uid()));
create policy ledger_select on offero.credit_ledger for select to authenticated using (user_id = (select auth.uid()));
create policy purchase_select on offero.purchase for select to authenticated using (user_id = (select auth.uid()));
create policy subscription_select on offero.subscription for select to authenticated using (user_id = (select auth.uid()));
-- offero.page_view: bewusst KEINE Client-Policy (Radar serverseitig via Service-Role).

-- ── RPCs (service-role-only; Bodies referenzieren offero.*) ──────────────────
create function offero.init_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into offero.profile (user_id) values (p_user_id) on conflict (user_id) do nothing;
  insert into offero.credit_wallet (user_id, balance, free_rerolls_remaining, plan)
    values (p_user_id, 1, 3, 'free') on conflict (user_id) do nothing;
end;
$$;

create function offero.spend_credits(
  p_user_id uuid, p_reason text, p_ref_id text, p_is_reroll boolean
)
returns table (balance int, free_rerolls_remaining int, charged int)
language plpgsql security definer set search_path = '' as $$
declare
  w record;
  v_charge int := 0;
begin
  if exists (select 1 from offero.credit_ledger where user_id = p_user_id and reason = p_reason and ref_id = p_ref_id) then
    select cw.balance, cw.free_rerolls_remaining into balance, free_rerolls_remaining
      from offero.credit_wallet cw where cw.user_id = p_user_id;
    charged := 0; return next; return;
  end if;

  select * into w from offero.credit_wallet where user_id = p_user_id for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;

  if p_is_reroll then
    if w.free_rerolls_remaining > 0 then
      update offero.credit_wallet
        set free_rerolls_remaining = offero.credit_wallet.free_rerolls_remaining - 1, updated_at = now()
        where user_id = p_user_id;
      v_charge := 0;
    else
      v_charge := 1;
    end if;
  else
    v_charge := 1;
  end if;

  if v_charge > 0 and w.balance < v_charge then raise exception 'INSUFFICIENT_CREDITS'; end if;

  if v_charge > 0 then
    update offero.credit_wallet
      set balance = offero.credit_wallet.balance - v_charge, updated_at = now()
      where user_id = p_user_id;
  end if;

  insert into offero.credit_ledger (user_id, delta, reason, ref_id) values (p_user_id, -v_charge, p_reason, p_ref_id);

  select cw.balance, cw.free_rerolls_remaining into balance, free_rerolls_remaining
    from offero.credit_wallet cw where cw.user_id = p_user_id;
  charged := v_charge; return next;
end;
$$;

create function offero.grant_credits(
  p_user_id uuid, p_delta int, p_reason text, p_ref_id text,
  p_plan text default null, p_free_rerolls int default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from offero.credit_ledger where user_id = p_user_id and reason = p_reason and ref_id = p_ref_id) then
    return;
  end if;
  insert into offero.credit_wallet (user_id, balance, free_rerolls_remaining, plan)
    values (p_user_id, greatest(p_delta, 0), coalesce(p_free_rerolls, 3), coalesce(p_plan, 'free'))
    on conflict (user_id) do update set
      balance = offero.credit_wallet.balance + p_delta,
      plan = coalesce(p_plan, offero.credit_wallet.plan),
      free_rerolls_remaining = coalesce(p_free_rerolls, offero.credit_wallet.free_rerolls_remaining),
      updated_at = now();
  insert into offero.credit_ledger (user_id, delta, reason, ref_id) values (p_user_id, p_delta, p_reason, p_ref_id);
end;
$$;

-- ── Grants (Tabellen über RLS gegatet; Funktionen service-role-only) ─────────
grant select, insert, update, delete on all tables in schema offero to anon, authenticated;
grant all on all tables in schema offero to service_role;
grant usage, select on all sequences in schema offero to anon, authenticated, service_role;
alter default privileges in schema offero grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema offero grant all on tables to service_role;

revoke all on function offero.init_user(uuid) from public, anon, authenticated;
revoke all on function offero.spend_credits(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function offero.grant_credits(uuid, int, text, text, text, int) from public, anon, authenticated;
grant execute on function offero.init_user(uuid) to service_role;
grant execute on function offero.spend_credits(uuid, text, text, boolean) to service_role;
grant execute on function offero.grant_credits(uuid, int, text, text, text, int) to service_role;
