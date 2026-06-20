-- Fix: in offero_spend_credits sind die UPDATE-RHS-Spalten mehrdeutig gegen die gleichnamigen
-- OUT-Parameter (balance/free_rerolls_remaining). Spaltenreferenzen mit Tabellennamen qualifizieren.
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
        set free_rerolls_remaining = public.offero_credit_wallet.free_rerolls_remaining - 1,
            updated_at = now()
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
      set balance = public.offero_credit_wallet.balance - v_charge, updated_at = now()
      where user_id = p_user_id;
  end if;

  insert into public.offero_credit_ledger (user_id, delta, reason, ref_id)
    values (p_user_id, -v_charge, p_reason, p_ref_id);

  select cw.balance, cw.free_rerolls_remaining into balance, free_rerolls_remaining
    from public.offero_credit_wallet cw where cw.user_id = p_user_id;
  charged := v_charge; return next;
end;
$$;

revoke all on function public.offero_spend_credits(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.offero_spend_credits(uuid, text, text, boolean) to service_role;
