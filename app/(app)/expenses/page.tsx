import Link from "next/link";
import { Receipt, Hash, HandCoins, TrendingUp, Wallet, Star } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { StatCard } from "@/components/ui/Card";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { CATEGORY_META } from "@/components/expenses/category";
import { formatTaka, toBn } from "@/lib/bn";
import { monthLabel, monthRange, parseMonth } from "@/lib/month";
import { CATEGORIES, type Expense, type Profile } from "@/lib/types";

export const metadata = { title: "বাজার ও খরচ — শেখ ভিলা" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const { profile } = await requireMember();
  const month = parseMonth(sp.m);
  const cat = CATEGORIES.find((c) => c.value === sp.cat)?.value;
  const [start, end] = monthRange(month);
  const supabase = await createClient();

  const [{ data }, { data: profs }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .gte("expense_date", start)
      .lt("expense_date", end)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, is_active"),
  ]);

  const all = (data ?? []) as Expense[];
  const expenses = cat ? all.filter((e) => e.category === cat) : all;
  const members = ((profs ?? []) as Profile[]).filter((p) => p.is_active);
  const names = Object.fromEntries(((profs ?? []) as Profile[]).map((p) => [p.id, p.full_name]));

  const sum = (list: Expense[]) => list.reduce((s, e) => s + Number(e.amount), 0);
  const total = sum(expenses);
  const myPaid = sum(expenses.filter((e) => e.paid_by === profile.id));
  const biggest = expenses.reduce((m, e) => Math.max(m, Number(e.amount)), 0);
  const catLabel = cat ? CATEGORIES.find((c) => c.value === cat)!.label : "সব ধরন";

  const chip = (active: boolean) =>
    `flex min-h-[46px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
      active
        ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
        : "border-slate-100 bg-white text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50"
    }`;

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="hero-shine animate-rise flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-600 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <span className="animate-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Receipt size={28} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm text-emerald-50">
              <Star size={14} fill="currentColor" /> বাজার ও খরচ
            </p>
            <h2 className="text-xl font-bold sm:text-2xl">{monthLabel(month)}-এর খরচের হিসাব</h2>
            <p className="text-sm text-emerald-50">{catLabel} · {toBn(expenses.length)} টি এন্ট্রি</p>
          </div>
        </div>
        <MonthPicker month={month} basePath="/expenses" extraQuery={cat ? `&cat=${cat}` : ""} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard tone="emerald" icon={<Wallet size={22} />} badge={catLabel} label="মোট খরচ" value={formatTaka(total)} />
        <StatCard tone="purple" icon={<Hash size={22} />} badge="এ মাস" label="মোট এন্ট্রি" value={toBn(expenses.length)} />
        <StatCard tone="blue" icon={<HandCoins size={22} />} badge="আমার" label="আমি দিয়েছি" value={formatTaka(myPaid)}
          chips={[total > 0 ? `মোটের ${toBn(Math.round((myPaid / total) * 100))}%` : "মোটের ০%"]} />
        <StatCard tone="orange" icon={<TrendingUp size={22} />} badge="সর্বোচ্চ" label="সবচেয়ে বড় খরচ" value={formatTaka(biggest)} />
      </div>

      {/* Category chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
        <Link href={`/expenses?m=${month}`} className={chip(!cat)}>
          সব <span className={`rounded-full px-2 py-0.5 text-xs ${!cat ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>{toBn(all.length)}</span>
        </Link>
        {CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c.value];
          const Icon = meta.icon;
          const active = cat === c.value;
          const count = all.filter((e) => e.category === c.value).length;
          return (
            <Link key={c.value} href={`/expenses?m=${month}&cat=${c.value}`} className={chip(active)}>
              <Icon size={18} className={active ? "" : meta.tile.split(" ")[1]} />
              {c.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>{toBn(count)}</span>
            </Link>
          );
        })}
      </div>

      <ExpenseList
        expenses={expenses}
        names={names}
        members={members.map((m) => ({ id: m.id, full_name: m.full_name }))}
        meId={profile.id}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}
