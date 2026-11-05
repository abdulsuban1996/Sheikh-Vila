-- Run AFTER 002_fund.sql.
-- This Supabase project does not auto-grant table/function access to the
-- `authenticated` role (same fix as the earlier grant_authenticated_access).
-- RLS policies still decide who can do what.
grant select, insert, update, delete on public.fund_entries to authenticated;
grant execute on function public.fund_summary(), public.fund_by_member() to authenticated;
