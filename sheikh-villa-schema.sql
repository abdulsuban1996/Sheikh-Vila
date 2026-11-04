-- ============================================================
-- Sheikh Villa v1 — Supabase schema
-- Run this whole file once in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ---------- 1. PROFILES (one row per family member) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'member' check (role in ('admin', 'member')),
  is_active boolean not null default false,  -- new users have NO access until the admin approves
  created_at timestamptz not null default now()
);

-- helper: is the current user an active admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

-- helper: is the current user an approved (active) family member?
create or replace function public.is_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- auto-create a profile whenever a new auth user is created
-- (the very first user becomes admin automatically; everyone after that
--  is created with NO access until the admin approves them)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;
  insert into public.profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when is_first then 'admin' else 'member' end,
    is_first
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. EXPENSES (bazar & other household costs) ----------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  paid_by uuid not null references public.profiles(id),
  category text not null default 'bazar'
    check (category in ('bazar', 'bill', 'medicine', 'other')),
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  note text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

create index expenses_date_idx on public.expenses (expense_date);
create index expenses_paid_by_idx on public.expenses (paid_by);

-- ---------- 3. SHOPPING LIST (bazarer talika) ----------
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity text,
  requested_by uuid not null default auth.uid() references public.profiles(id),
  is_bought boolean not null default false,
  bought_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- 4. MONTHLY SUMMARY (who paid how much vs equal share) ----------
-- usage: select * from monthly_summary('2026-11-01');
-- balance > 0  => should receive money, balance < 0 => owes money
create or replace function public.monthly_summary(p_month date)
returns table (
  member_id uuid,
  full_name text,
  paid numeric,
  share numeric,
  balance numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with b as (
    select
      date_trunc('month', p_month)::date as s,
      (date_trunc('month', p_month) + interval '1 month')::date as e
  ),
  pd_sum as (
    select x.paid_by, sum(x.amount) as amt
    from public.expenses x, b
    where x.expense_date >= b.s and x.expense_date < b.e
    group by x.paid_by
  ),
  tot as (
    select coalesce(sum(amt), 0) as total from pd_sum
  ),
  act as (
    select count(*)::numeric as n from public.profiles where is_active
  )
  select
    p.id,
    p.full_name,
    coalesce(pd_sum.amt, 0),
    round(tot.total / nullif(act.n, 0), 2),
    coalesce(pd_sum.amt, 0) - round(tot.total / nullif(act.n, 0), 2)
  from public.profiles p
  left join pd_sum on pd_sum.paid_by = p.id
  cross join tot
  cross join act
  where p.is_active
  order by p.full_name;
$$;

-- ---------- 5. ROW LEVEL SECURITY (only approved family members get in) ----------
alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.shopping_items enable row level security;

-- profiles: you can always read your own row (so the app can say "not approved");
-- approved members can see the family; only the admin changes role / access
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_member());
create policy "profiles_self_update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and is_active = (select p.is_active from public.profiles p where p.id = auth.uid())
  );
create policy "profiles_admin_update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles
  for delete to authenticated using (public.is_admin());

-- expenses: only approved members; add your own; edit/delete only your own (admin: all)
create policy "expenses_select" on public.expenses
  for select to authenticated using (public.is_member());
create policy "expenses_insert" on public.expenses
  for insert to authenticated
  with check (
    public.is_member()
    and created_by = auth.uid()
    and (paid_by = auth.uid() or public.is_admin())
  );
create policy "expenses_update" on public.expenses
  for update to authenticated
  using (public.is_member() and (created_by = auth.uid() or public.is_admin()))
  with check (public.is_member() and (created_by = auth.uid() or public.is_admin()));
create policy "expenses_delete" on public.expenses
  for delete to authenticated
  using (public.is_member() and (created_by = auth.uid() or public.is_admin()));

-- shopping list: only approved members see, add, tick items as bought
create policy "shopping_select" on public.shopping_items
  for select to authenticated using (public.is_member());
create policy "shopping_insert" on public.shopping_items
  for insert to authenticated
  with check (public.is_member() and requested_by = auth.uid());
create policy "shopping_update" on public.shopping_items
  for update to authenticated
  using (public.is_member()) with check (public.is_member());
create policy "shopping_delete" on public.shopping_items
  for delete to authenticated
  using (public.is_member() and (requested_by = auth.uid() or public.is_admin()));

-- ---------- 6. HOW ACCESS WORKS ----------
-- * Turn OFF public sign-ups in Supabase (Auth settings: "Allow new users to sign up").
-- * Create YOUR user first (Dashboard > Authentication > Users > Add user).
--   The very first user is automatically the admin.
-- * Later, add family members from the app's /members page (admin only).
-- * To block someone: set is_active = false on their profile — they lose all access at once.
