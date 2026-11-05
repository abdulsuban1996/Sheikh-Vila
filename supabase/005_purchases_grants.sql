-- Run in the Supabase SQL Editor (this project does not auto-grant table access
-- to the `authenticated` role). RLS policies still decide who can do what.
grant select, insert, update, delete on public.shopping_purchases to authenticated;
grant execute on function public.buy_items_together(uuid[], numeric, uuid, text) to authenticated;
grant execute on function public.undo_purchase(uuid) to authenticated;
