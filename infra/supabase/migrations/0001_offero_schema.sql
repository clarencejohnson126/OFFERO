-- Offero v1 — Schema (Tabellen, Indizes, RLS aktiviert; Policies/Funktionen in 0003).
-- Konvention (ADR 0006): Präfix offero_ im public-Schema (Projekt mit Alt-App geteilt).
-- Enums als Text + CHECK (migrationsfreundlich). FKs auf auth.users (Supabase Auth).

create extension if not exists pgcrypto with schema extensions;

-- ── profile (1:1 user) ───────────────────────────────────────────────────────
create table public.offero_profile (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  contact       jsonb not null default '{}'::jsonb,
  cv_raw        jsonb,                 -- StorageRef {bucket,path}
  cv_structured jsonb,
  photo         jsonb,                 -- StorageRef
  tool_stack    jsonb not null default '[]'::jsonb,
  languages     jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.offero_profile enable row level security;

-- ── application (1:N pro user) ───────────────────────────────────────────────
create table public.offero_application (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  tenant_slug        text not null,
  job_url            text,
  job_text           text,                          -- transient (DSGVO: nach ASSEMBLE leeren)
  company            jsonb not null default '{}'::jsonb,
  status             text not null default 'draft'
                       check (status in ('draft', 'generating', 'ready', 'shared', 'archived')),
  current_version_id uuid,                           -- FK unten (zirkulär)
  custom_domain      text,
  created_at         timestamptz not null default now()
);
create unique index offero_application_slug_lower_idx on public.offero_application (lower(tenant_slug));
create unique index offero_application_custom_domain_idx on public.offero_application (custom_domain)
  where custom_domain is not null;
create index offero_application_user_idx on public.offero_application (user_id);
alter table public.offero_application enable row level security;

-- ── generation_version (1:N pro application) + edit_log (ADR 0005) ───────────
create table public.offero_generation_version (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.offero_application (id) on delete cascade,
  kind           text not null check (kind in ('generation', 're_roll')),
  content        jsonb not null,                     -- typisierte Sektionen (zod-validiert in core)
  model_used     text,
  cost_cents     integer not null default 0 check (cost_cents >= 0),
  created_at     timestamptz not null default now()
);
create index offero_genver_app_idx on public.offero_generation_version (application_id, created_at desc);
alter table public.offero_generation_version enable row level security;

-- zirkulären FK nachziehen (on delete set null: Version löschen killt nicht die Application)
alter table public.offero_application
  add constraint offero_application_current_version_fk
  foreign key (current_version_id) references public.offero_generation_version (id) on delete set null;

-- Feinschliff = in-place Update der current version + leichter Audit-Eintrag (ADR 0005).
create table public.offero_edit_log (
  id         uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.offero_generation_version (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,  -- direkt für billige RLS
  patch      jsonb not null,
  created_at timestamptz not null default now()
);
create index offero_edit_log_version_idx on public.offero_edit_log (version_id, created_at);
alter table public.offero_edit_log enable row level security;

-- ── media_asset (N pro version) ──────────────────────────────────────────────
create table public.offero_media_asset (
  id          uuid primary key default gen_random_uuid(),
  version_id  uuid not null references public.offero_generation_version (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,  -- denormalisiert (RLS + Storage-Pfad)
  type        text not null check (type in ('image', 'video', 'pdf')),
  storage_ref jsonb,                                  -- null solange queued
  renderer    text not null check (renderer in ('gemini', 'remotion', 'ffmpeg_lite', 'headless_pdf')),
  cost_cents  integer not null default 0 check (cost_cents >= 0),
  meta        jsonb not null default '{}'::jsonb,
  status      text not null default 'queued' check (status in ('queued', 'running', 'ready', 'error')),
  created_at  timestamptz not null default now()
);
create index offero_media_version_idx on public.offero_media_asset (version_id);
create index offero_media_user_status_idx on public.offero_media_asset (user_id, status);
alter table public.offero_media_asset enable row level security;

-- ── credit_wallet (1:1) + credit_ledger (append-only, idempotent) ────────────
create table public.offero_credit_wallet (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  balance                integer not null default 0 check (balance >= 0),
  free_rerolls_remaining integer not null default 0 check (free_rerolls_remaining >= 0),
  plan                   text not null default 'free'
                           check (plan in ('free', 'starter', 'plus', 'pro', 'subscription')),
  updated_at             timestamptz not null default now()
);
alter table public.offero_credit_wallet enable row level security;

create table public.offero_credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  delta      integer not null,
  reason     text not null
               check (reason in ('purchase', 'generation', 're_roll', 'subscription_grant', 'refund')),
  ref_id     text not null,
  created_at timestamptz not null default now()
);
-- harte Doppelbuchungs-Sperre (Idempotenz):
create unique index offero_ledger_idem_idx on public.offero_credit_ledger (user_id, reason, ref_id);
create index offero_ledger_user_idx on public.offero_credit_ledger (user_id, created_at desc);
alter table public.offero_credit_ledger enable row level security;

-- ── purchase / subscription (Stripe; provider-Feld für späteres IAP) ─────────
create table public.offero_purchase (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  provider     text not null check (provider in ('stripe', 'apple_iap', 'google_iap')),
  external_id  text not null,
  product      text not null,
  amount_cents integer not null check (amount_cents >= 0),
  status       text not null check (status in ('pending', 'completed', 'refunded', 'failed')),
  created_at   timestamptz not null default now(),
  unique (provider, external_id)                       -- Webhook-Idempotenz
);
create index offero_purchase_user_idx on public.offero_purchase (user_id, created_at desc);
alter table public.offero_purchase enable row level security;

create table public.offero_subscription (
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
create index offero_subscription_user_active_idx on public.offero_subscription (user_id)
  where status = 'active';
alter table public.offero_subscription enable row level security;

-- ── page_view (Recruiter-Radar, cookieless, KEINE PII, kein user_id) ─────────
create table public.offero_page_view (
  id             bigint generated always as identity primary key,
  application_id uuid not null references public.offero_application (id) on delete cascade,
  ts             timestamptz not null default now(),
  coarse_signal  jsonb not null default '{}'::jsonb     -- grobe Region/Gerätetyp, keine IP/UA-Raw
);
create index offero_page_view_app_ts_idx on public.offero_page_view (application_id, ts desc);
alter table public.offero_page_view enable row level security;
