-- Offero v1 — RLS-Policies (Default deny; auth-Clients sehen nur eigene Zeilen) + RPC-Funktionen.
-- Datenzugriff läuft primär serverseitig via Service-Role (umgeht RLS); Policies sind Defense-in-Depth
-- für den Fall direkter Client-Zugriffe mit dem publishable Key. auth.uid() in (select ...) für Perf.

-- ── profile ──────────────────────────────────────────────────────────────────
create policy offero_profile_select on public.offero_profile for select to authenticated
  using (user_id = (select auth.uid()));
create policy offero_profile_insert on public.offero_profile for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy offero_profile_update on public.offero_profile for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy offero_profile_delete on public.offero_profile for delete to authenticated
  using (user_id = (select auth.uid()));

-- ── application ──────────────────────────────────────────────────────────────
create policy offero_app_select on public.offero_application for select to authenticated
  using (user_id = (select auth.uid()));
create policy offero_app_insert on public.offero_application for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy offero_app_update on public.offero_application for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy offero_app_delete on public.offero_application for delete to authenticated
  using (user_id = (select auth.uid()));

-- ── generation_version: lesen via Application-Ownership; Schreiben nur Service-Role ──
create policy offero_genver_select on public.offero_generation_version for select to authenticated
  using (
    exists (
      select 1 from public.offero_application a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );

-- ── edit_log: Owner lesen/schreiben (append-only) ────────────────────────────
create policy offero_edit_select on public.offero_edit_log for select to authenticated
  using (user_id = (select auth.uid()));
create policy offero_edit_insert on public.offero_edit_log for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ── media_asset: Owner lesen; Schreiben nur Service-Role ─────────────────────
create policy offero_media_select on public.offero_media_asset for select to authenticated
  using (user_id = (select auth.uid()));

-- ── credit_wallet / credit_ledger: nur lesen; Schreiben ausschließlich via RPC ──
create policy offero_wallet_select on public.offero_credit_wallet for select to authenticated
  using (user_id = (select auth.uid()));
create policy offero_ledger_select on public.offero_credit_ledger for select to authenticated
  using (user_id = (select auth.uid()));

-- ── purchase / subscription: Owner lesen; Schreiben nur Service-Role (Webhook) ──
create policy offero_purchase_select on public.offero_purchase for select to authenticated
  using (user_id = (select auth.uid()));
create policy offero_subscription_select on public.offero_subscription for select to authenticated
  using (user_id = (select auth.uid()));

-- offero_page_view: KEINE Client-Policy (Radar-Logging + Anzeige laufen serverseitig via Service-Role).
-- RLS aktiv ohne Policy = deny-all für Clients (gewollt).

-- ── RPC: lazy User-Init (kein auth-Trigger; idempotent) ──────────────────────
create or replace function public.offero_init_user(p_user_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.offero_profile (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  insert into public.offero_credit_wallet (user_id, balance, free_rerolls_remaining, plan)
    values (p_user_id, 1, 3, 'free')
    on conflict (user_id) do nothing;
end;
$$;

-- ── RPC: transaktionaler, idempotenter Credit-Verbrauch ──────────────────────
-- Generierung: −1 · Feinschliff: 0 (nicht hierüber) · Re-Roll: erst free_rerolls, dann −1.
create or replace function public.offero_spend_credits(
  p_user_id uuid, p_reason text, p_ref_id text, p_is_reroll boolean
)
returns table (balance int, free_rerolls_remaining int, charged int)
language plpgsql security definer set search_path = ''
as $$
declare
  w record;
  v_charge int := 0;
begin
  -- Idempotenz: existiert die Buchung schon → unveränderten Stand zurückgeben.
  if exists (
    select 1 from public.offero_credit_ledger
    where user_id = p_user_id and reason = p_reason and ref_id = p_ref_id
  ) then
    select cw.balance, cw.free_rerolls_remaining into balance, free_rerolls_remaining
      from public.offero_credit_wallet cw where cw.user_id = p_user_id;
    charged := 0; return next; return;
  end if;

  select * into w from public.offero_credit_wallet where user_id = p_user_id for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;

  if p_is_reroll then
    if w.free_rerolls_remaining > 0 then
      update public.offero_credit_wallet
        set free_rerolls_remaining = free_rerolls_remaining - 1, updated_at = now()
        where user_id = p_user_id;
      v_charge := 0;
    else
      v_charge := 1;
    end if;
  else
    v_charge := 1;
  end if;

  if v_charge > 0 and w.balance < v_charge then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  if v_charge > 0 then
    update public.offero_credit_wallet
      set balance = balance - v_charge, updated_at = now()
      where user_id = p_user_id;
  end if;

  -- delta 0 bei Free-Reroll wird bewusst gebucht (Idempotenz-Spur, sonst Doppel-Decrement bei Retry).
  insert into public.offero_credit_ledger (user_id, delta, reason, ref_id)
    values (p_user_id, -v_charge, p_reason, p_ref_id);

  select cw.balance, cw.free_rerolls_remaining into balance, free_rerolls_remaining
    from public.offero_credit_wallet cw where cw.user_id = p_user_id;
  charged := v_charge; return next;
end;
$$;

-- ── RPC: idempotente Gutschrift (Käufe/Abo, Webhook) ─────────────────────────
create or replace function public.offero_grant_credits(
  p_user_id uuid, p_delta int, p_reason text, p_ref_id text,
  p_plan text default null, p_free_rerolls int default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.offero_credit_ledger
    where user_id = p_user_id and reason = p_reason and ref_id = p_ref_id
  ) then
    return;  -- idempotent
  end if;

  insert into public.offero_credit_wallet (user_id, balance, free_rerolls_remaining, plan)
    values (p_user_id, greatest(p_delta, 0), coalesce(p_free_rerolls, 3), coalesce(p_plan, 'free'))
    on conflict (user_id) do update set
      balance = public.offero_credit_wallet.balance + p_delta,
      plan = coalesce(p_plan, public.offero_credit_wallet.plan),
      free_rerolls_remaining = coalesce(p_free_rerolls, public.offero_credit_wallet.free_rerolls_remaining),
      updated_at = now();

  insert into public.offero_credit_ledger (user_id, delta, reason, ref_id)
    values (p_user_id, p_delta, p_reason, p_ref_id);
end;
$$;

-- Ausführungsrechte: Schreibpfade nur über diese Funktionen.
revoke all on function public.offero_init_user(uuid) from public;
revoke all on function public.offero_spend_credits(uuid, text, text, boolean) from public;
revoke all on function public.offero_grant_credits(uuid, int, text, text, text, int) from public;
grant execute on function public.offero_init_user(uuid) to authenticated, service_role;
grant execute on function public.offero_spend_credits(uuid, text, text, boolean) to authenticated, service_role;
grant execute on function public.offero_grant_credits(uuid, int, text, text, text, int) to service_role;
