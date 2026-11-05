-- Reference only (already applied in this project's database).
-- Shopping list: record the PRICE, WHO bought it and WHEN.
-- Run in the Supabase SQL Editor if you set up a fresh project.

alter table public.shopping_items
  add column if not exists price numeric(12, 2) check (price is null or price >= 0),
  add column if not exists bought_by uuid references public.profiles(id);

-- Any approved member can tick an unbought item. Once bought, only the buyer
-- or the admin can edit the price / untick it. When ticking, bought_by must be
-- the current user (admin may set another member).
drop policy if exists "shopping_update" on public.shopping_items;
create policy "shopping_update" on public.shopping_items
  for update to authenticated
  using (
    public.is_member()
    and (not is_bought or bought_by = auth.uid() or public.is_admin())
  )
  with check (
    public.is_member()
    and (bought_by is null or bought_by = auth.uid() or public.is_admin())
  );
