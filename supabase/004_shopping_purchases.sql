-- Reference only (already applied in this project's database).
-- Shopping list: buy SEVERAL items together and record ONE total price.
-- Mirrors what is currently in the database. If you set up a fresh project,
-- use your original sheikh-villa-bulk-purchase.sql instead.

create table public.shopping_purchases (
  id uuid primary key default gen_random_uuid(),
  total_price numeric(12, 2) not null check (total_price >= 0),
  bought_by uuid not null references public.profiles(id),
  bought_at timestamptz not null default now(),
  note text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);
create index shopping_purchases_bought_at_idx on public.shopping_purchases (bought_at);

alter table public.shopping_items
  add column purchase_id uuid references public.shopping_purchases(id) on delete restrict;
create index shopping_items_purchase_idx on public.shopping_items (purchase_id);

alter table public.shopping_purchases enable row level security;
create policy "purchases_select" on public.shopping_purchases
  for select to authenticated using (public.is_member());
create policy "purchases_insert" on public.shopping_purchases
  for insert to authenticated
  with check (public.is_member() and created_by = auth.uid() and (bought_by = auth.uid() or public.is_admin()));
create policy "purchases_update" on public.shopping_purchases
  for update to authenticated
  using (public.is_member() and (bought_by = auth.uid() or public.is_admin()))
  with check (public.is_member() and (bought_by = auth.uid() or public.is_admin()));
create policy "purchases_delete" on public.shopping_purchases
  for delete to authenticated
  using (public.is_member() and (bought_by = auth.uid() or public.is_admin()));

-- RPCs buy_items_together(p_item_ids uuid[], p_total numeric, p_bought_by uuid default null, p_note text default null)
-- and undo_purchase(p_purchase_id uuid) are SECURITY INVOKER plpgsql functions
-- (see your original SQL file for their bodies).
