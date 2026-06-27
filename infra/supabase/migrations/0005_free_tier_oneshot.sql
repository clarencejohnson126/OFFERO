-- Offero v1 — Free-Tier ist echtes One-Shot: 1 Credit, 0 Re-Rolls (ADR 0011, korrigiert 0006).
-- Doktrin (plan-catalog.ts: free.freeRerolls = 0): Die kostenlose Generierung ist EIN Versuch.
-- Iteration/Re-Roll ist der erste Upgrade-Grund (ADR 0009 / pricing.md) — kein Gratis-Re-Roll.
-- 0001 legte ein frisches Free-Wallet faktisch mit 3 Re-Rolls an (init_user + grant_credits-Default);
-- das widersprach der Produkt-Doktrin. Fix-Forward, nur das offero-Schema, sonst alles unverändert.

-- init_user: frisches Free-Wallet = balance 1, KEINE Re-Rolls. Body sonst identisch zu 0001
-- (Profil-Anlage, Idempotenz via on conflict do nothing, SECURITY DEFINER, search_path = '').
create or replace function offero.init_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into offero.profile (user_id) values (p_user_id) on conflict (user_id) do nothing;
  insert into offero.credit_wallet (user_id, balance, free_rerolls_remaining, plan)
    values (p_user_id, 1, 0, 'free') on conflict (user_id) do nothing;
end;
$$;

-- grant_credits: ohne explizites p_free_rerolls darf ein frisches Wallet KEINE Re-Rolls erben.
-- Bezahl-Pläne übergeben p_free_rerolls explizit (plan-catalog.ts → starter/plus/pro = 3) und sind
-- damit unberührt. Geändert nur der INSERT-Default 3 → 0; Idempotenz und Body sonst identisch zu 0001.
create or replace function offero.grant_credits(
  p_user_id uuid, p_delta int, p_reason text, p_ref_id text,
  p_plan text default null, p_free_rerolls int default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from offero.credit_ledger where user_id = p_user_id and reason = p_reason and ref_id = p_ref_id) then
    return;
  end if;
  insert into offero.credit_wallet (user_id, balance, free_rerolls_remaining, plan)
    values (p_user_id, greatest(p_delta, 0), coalesce(p_free_rerolls, 0), coalesce(p_plan, 'free'))
    on conflict (user_id) do update set
      balance = offero.credit_wallet.balance + p_delta,
      plan = coalesce(p_plan, offero.credit_wallet.plan),
      free_rerolls_remaining = coalesce(p_free_rerolls, offero.credit_wallet.free_rerolls_remaining),
      updated_at = now();
  insert into offero.credit_ledger (user_id, delta, reason, ref_id) values (p_user_id, p_delta, p_reason, p_ref_id);
end;
$$;
