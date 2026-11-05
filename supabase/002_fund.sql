-- ============================================================
-- Sheikh Villa — FUND feature (run ONCE in Supabase SQL Editor,
-- AFTER the main sheikh-villa-schema.sql has already been run)
-- ============================================================

-- ---------- 1. FUND ENTRIES (who put money in / took money out, and when) ----------
create table public.fund_entries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id),   -- who gave / who received
  kind text not null default 'deposit' check (kind in ('deposit', 'withdrawal')),
  amount numeric(12, 2) not null check (amount > 0),
  entry_date date not null default current_date,
  note text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

create index fund_entries_date_idx on public.fund_entries (entry_date);
create index fund_entries_member_idx on public.fund_entries (member_id);

-- ---------- 2. EXPENSES: mark an expense as paid from the fund ----------
alter table public.expenses add column from_fund boolean not null default false;

-- ---------- 3. RLS: everyone approved can SEE the fund; only ADMIN changes it ----------
alter table public.fund_entries enable row level security;

create policy "fund_select" on public.fund_entries
  for select to authenticated using (public.is_member());
create policy "fund_admin_insert" on public.fund_entries
  for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());
create policy "fund_admin_update" on public.fund_entries
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "fund_admin_delete" on public.fund_entries
  for delete to authenticated using (public.is_admin());

-- only the admin may mark an expense as "paid from fund"
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;

create policy "expenses_insert" on public.expenses
  for insert to authenticated
  with check (
    public.is_member()
    and created_by = auth.uid()
    and (paid_by = auth.uid() or public.is_admin())
    and (not from_fund or public.is_admin())
  );
create policy "expenses_update" on public.expenses
  for update to authenticated
  using (public.is_member() and (created_by = auth.uid() or public.is_admin()))
  with check (
    public.is_member()
    and (created_by = auth.uid() or public.is_admin())
    and (not from_fund or public.is_admin())
  );

-- ---------- 4. FUND SUMMARY (current balance) ----------
-- usage: select * from fund_summary();
-- balance = total deposits - total withdrawals - expenses paid from fund
create or replace function public.fund_summary()
returns table (
  total_deposit numeric,
  total_withdrawal numeric,
  total_spent numeric,
  balance numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.v,
    w.v,
    s.v,
    d.v - w.v - s.v
  from
    (select coalesce(sum(f.amount), 0) as v from public.fund_entries f where f.kind = 'deposit') d,
    (select coalesce(sum(f.amount), 0) as v from public.fund_entries f where f.kind = 'withdrawal') w,
    (select coalesce(sum(x.amount), 0) as v from public.expenses x where x.from_fund) s;
$$;

-- ---------- 5. FUND BY MEMBER (who gave how much, last deposit date) ----------
-- usage: select * from fund_by_member();
create or replace function public.fund_by_member()
returns table (
  member_id uuid,
  full_name text,
  deposited numeric,
  withdrawn numeric,
  net numeric,
  last_deposit date
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    coalesce(sum(case when f.kind = 'deposit' then f.amount end), 0),
    coalesce(sum(case when f.kind = 'withdrawal' then f.amount end), 0),
    coalesce(sum(case when f.kind = 'deposit' then f.amount end), 0)
      - coalesce(sum(case when f.kind = 'withdrawal' then f.amount end), 0),
    max(case when f.kind = 'deposit' then f.entry_date end)
  from public.profiles p
  left join public.fund_entries f on f.member_id = p.id
  where p.is_active
  group by p.id, p.full_name
  order by 3 desc, p.full_name;
$$;

-- ---------- 6. MONTHLY SUMMARY: expenses paid from the fund are NOT split among members ----------
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
      and not x.from_fund
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
