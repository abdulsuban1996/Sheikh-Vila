import Link from "next/link";
import { Home, Users, Wallet, HandCoins, Scale, Receipt, ShoppingBasket, BarChart3, Star } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, SectionCard, StatCard, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddExpenseFab } from "@/components/expenses/AddExpenseFab";
import { formatDateBn, formatShortDateBn, formatTaka, toBn } from "@/lib/bn";
import { monthLabel, monthRange, todayDhaka } from "@/lib/month";
import type { Expense, Profile, ShoppingItem, SummaryRow } from "@/lib/types";

export const metadata = { title: "ড্যাশবোর্ড — শেখ ভিলা" };

export default async function DashboardPage() {
  const { profile } = await requireMember();
  const supabase = await createClient();
  const month = todayDhaka().slice(0, 7);
  const [start, end] = monthRange(month);

  const [profilesR, expensesR, recentR, shopR, summaryR] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, is_active"),
    supabase.from("expenses").select("paid_by, amount").gte("expense_date", start).lt("expense_date", end),
    supabase.from("expenses").select("*").order("expense_date", { ascending: false }).order("created_at", { ascending: false }).limit(8),
    supabase.from("shopping_items").select("*").eq("is_bought", false).order("created_at", { ascending: false }),
    supabase.rpc("monthly_summary", { p_month: start }),
  ]);

  const members = ((profilesR.data ?? []) as Profile[]).filter((p) => p.is_active);
  const nameOf = new Map(members.map((m) => [m.id, m.full_name]));
  const monthExpenses = (expensesR.data ?? []) as Pick<Expense, "paid_by" | "amount">[];
  const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const myPaid = monthExpenses.filter((e) => e.paid_by === profile.id).reduce((s, e) => s + Number(e.amount), 0);
  const summary = (summaryR.data ?? []) as SummaryRow[];
  const mine = summary.find((r) => r.member_id === profile.id);
  const balance = Number(mine?.balance ?? 0);
  const recent = (recentR.data ?? []) as Expense[];
  const pending = (shopR.data ?? []) as ShoppingItem[];
  const adminCount = members.filter((m) => m.role === "admin").length;

  const byMember = members
    .map((m) => ({
      id: m.id,
      name: m.full_name,
      paid: monthExpenses.filter((e) => e.paid_by === m.id).reduce((s, e) => s + Number(e.amount), 0),
    }))
    .sort((a, b) => b.paid - a.paid);
  const BAR = ["from-emerald-500 to-teal-500", "from-purple-500 to-fuchsia-500", "from-blue-500 to-cyan-500", "from-orange-500 to-amber-500"];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="hero-shine animate-rise flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-600 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <span className="animate-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Home size={28} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm text-emerald-50"><Star size={14} fill="currentColor" /> পারিবারিক ম্যানেজমেন্ট</p>
            <h2 className="text-xl font-bold sm:text-2xl">আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ!</h2>
            <p className="mt-1 text-emerald-50">
              শেখ ভিলায় স্বাগতম, {profile.full_name}। নিচে এ মাসের সংক্ষিপ্ত হিসাব দেওয়া হলো।
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white/15 px-4 py-3 sm:text-right">
          <p className="text-xs text-emerald-50">আজকের তারিখ</p>
          <p className="font-semibold">{formatDateBn(new Date())}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard tone="emerald" icon={<Users size={22} />} badge="সক্রিয়" label="মোট সদস্য" value={toBn(members.length)}
          chips={[`অ্যাডমিন ${toBn(adminCount)}`, `সদস্য ${toBn(members.length - adminCount)}`]} />
        <StatCard tone="purple" icon={<Wallet size={22} />} badge={monthLabel(month)} label="এ মাসের মোট খরচ" value={formatTaka(total)}
          chips={[`${toBn(monthExpenses.length)} টি এন্ট্রি`]} />
        <StatCard tone="blue" icon={<HandCoins size={22} />} badge="এ মাস" label="আমি দিয়েছি" value={formatTaka(myPaid)}
          chips={[total > 0 ? `মোটের ${toBn(Math.round((myPaid / total) * 100))}%` : "মোটের ০%"]} />
        <StatCard tone="orange" icon={<Scale size={22} />} badge={balance >= 0 ? "পাবো" : "দেবো"} label="আমার হিসাব"
          value={formatTaka(Math.abs(balance))}
          valueClass={balance >= 0 ? "text-emerald-600" : "text-red-600"}
          chips={[`ভাগ ${formatTaka(mine?.share ?? 0)}`]} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <SectionCard className="lg:col-span-3" tone="cyan" title="সাম্প্রতিক খরচ" icon={<Receipt size={18} />}
          action={<Link href="/expenses" className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30">সব দেখুন</Link>}>
          {recent.length === 0 ? (
            <EmptyState text="এখনো কোনো খরচ যোগ করা হয়নি" icon={<Receipt size={40} />} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{e.title}</p>
                    <p className="text-sm text-slate-500">
                      {nameOf.get(e.paid_by) ?? "—"} · <span className="text-slate-400">{formatShortDateBn(e.expense_date)}</span>
                    </p>
                  </div>
                  <Badge tone="green">{formatTaka(e.amount)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-2" tone="orange" title="বাজারের তালিকা" icon={<ShoppingBasket size={18} />}
          action={<span className="rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">{toBn(pending.length)} টি বাকি</span>}>
          {pending.length === 0 ? (
            <EmptyState text="তালিকায় কিছু বাকি নেই" icon={<ShoppingBasket size={40} />} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="font-medium text-slate-800">{i.name}</span>
                  {i.quantity && <Badge tone="orange">{i.quantity}</Badge>}
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 p-3 text-center">
            <Link href="/shopping" className="text-sm font-semibold text-emerald-700 hover:underline">তালিকা দেখুন →</Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard tone="purple" title="সদস্যভিত্তিক খরচ (এ মাস)" icon={<BarChart3 size={18} />}>
        {total === 0 ? (
          <EmptyState text="এ মাসে এখনো কোনো খরচ নেই" icon={<BarChart3 size={40} />} />
        ) : (
          <ul className="space-y-4 p-5">
            {byMember.map((m, i) => {
              const pct = Math.round((m.paid / total) * 100);
              return (
                <li key={m.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-bold text-purple-700">{toBn(i + 1)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate font-medium text-slate-700">{m.name}</span>
                      <span className="text-slate-500">{formatTaka(m.paid)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className={`bar-grow h-full rounded-full bg-gradient-to-r ${BAR[i % BAR.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-slate-700">{toBn(pct)}%</span>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <AddExpenseFab members={members.map((m) => ({ id: m.id, full_name: m.full_name }))} meId={profile.id} isAdmin={profile.role === "admin"} />
    </div>
  );
}
