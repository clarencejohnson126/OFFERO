-- Offero v1 — RPCs auf service-role-only härten. Alle drei Funktionen werden ausschließlich
-- serverseitig (Repository-Adapter via Service-Role) aufgerufen, nie direkt vom Client.
-- Behebt die Advisor-Warnungen anon/authenticated_security_definer_function_executable für offero_*.

revoke all on function public.offero_init_user(uuid) from public, anon, authenticated;
revoke all on function public.offero_spend_credits(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.offero_grant_credits(uuid, int, text, text, text, int) from public, anon, authenticated;

grant execute on function public.offero_init_user(uuid) to service_role;
grant execute on function public.offero_spend_credits(uuid, text, text, boolean) to service_role;
grant execute on function public.offero_grant_credits(uuid, int, text, text, text, int) to service_role;
