import Link from "next/link";
import { PiggyBank, Wallet, ArrowDownCircle, ArrowUpCircle, Receipt, Users, AlertTriangle } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageBanner } from "@/components/ui/PageBanner";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { PrintButton } from "@/components/ui/PrintButton";
import { SectionCard, StatCard, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FundLedger, type LedgerItem } from "@/components/fund/FundLedger";
import { MemberFilter } from "@/components/fund/MemberFilter";
import { formatShortDateBn, formatTaka, toBn } from "@/lib/bn";
import { monthLabel, monthRange, parseMonth, todayDhaka } from "@/lib/month";
import type { Expense, FundEntry, FundMemberRow, FundSummary, Profile } from "@/lib/types";

export const metadata = { title: "ফান্ড — শেখ ভিলা" };

const TYPES = [
  { value: "", label: "সব" },
  { value: "deposit", label: "জমা" },
  { value: "withdrawal", label: "ফেরত" },
  { value: "expense", label: "খরচ" },
] as const;

export default async function FundPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; mem?: string; t?: string }>;
}) {
  const sp = await searchParams;
  const { profile } = await requireMember();
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  const all = sp.m === "all" || !sp.m;
  const month = all ? "all" : parseMonth(sp.m);
  const type = TYPES.find((t) => t.value === sp.t)?.value ?? "";

  let entriesQ = supabase.from("fund_entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false });
  let spentQ = supabase.from("expenses").select("id, title, amount, expense_date, paid_by, note, created_at").eq("from_fund", true).order("expense_date", { ascending: false });
  if (!all) {
    const [start, end] = monthRange(month);
    entriesQ = entriesQ.gte("entry_date", start).lt("entry_date", end);
    spentQ = spentQ.gte("expense_date", start).lt("expense_date", end);
  }

  const [summaryR, byMemberR, entriesR, spentR, profsR] = await Promise.all([
    supabase.rpc("fund_summary"),
    supabase.rpc("fund_by_member"),
    entriesQ,
    spentQ,
    supabase.from("profiles").select("id, full_name, is_active"),
  ]);

  // The fund migration has not been run yet
  if (entriesR.error || summaryR.error) {
    return (
      <div className="space-y-5">
        <PageBanner icon={<PiggyBank size={28} />} label="ফান্ড" title="পারিবারিক ফান্ড" />
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-900">
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">ফান্ডের ডাটাবেস এখনো সেটআপ হয়নি</p>
            <p className="text-sm">
              Supabase SQL Editor-এ <code>supabase/002_fund.sql</code> এবং তারপর <code>supabase/003_fund_grants.sql</code> চালান, তারপর পেজ রিফ্রেশ করুন।
            </p>
          </div>
        </div>
      </div>
    );
  }

  const raw = (summaryR.data ?? [])[0] as FundSummary | undefined;
  const summary = {
    total_deposit: Number(raw?.total_deposit ?? 0),
    total_withdrawal: Number(raw?.total_withdrawal ?? 0),
    total_spent: Number(raw?.total_spent ?? 0),
    balance: Number(raw?.balance ?? 0),
  };
  const byMember = ((byMemberR.data ?? []) as FundMemberRow[]).map((r) => ({
    ...r,
    deposited: Number(r.deposited),
    withdrawn: Number(r.withdrawn),
    net: Number(r.net),
  }));
  const profs = (profsR.data ?? []) as Profile[];
  const members = profs.filter((p) => p.is_active).map((p) => ({ id: p.id, full_name: p.full_name }));
  const nameOf = new Map(profs.map((p) => [p.id, p.full_name]));
  const memFilter = members.find((m) => m.id === sp.mem)?.id ?? "";

  const items: LedgerItem[] = [
    ...((entriesR.data ?? []) as FundEntry[]).map((e) => ({
      key: `f-${e.id}`,
      date: e.entry_date,
      memberName: nameOf.get(e.member_id) ?? "—",
      type: e.kind,
      amount: Number(e.amount),
      note: e.note,
      entry: { ...e, amount: Number(e.amount) },
      _member: e.member_id,
      _created: e.created_at,
    })),
    ...((spentR.data ?? []) as Pick<Expense, "id" | "title" | "amount" | "expense_date" | "paid_by" | "note" | "created_at">[]).map((x) => ({
      key: `x-${x.id}`,
      date: x.expense_date,
      memberName: nameOf.get(x.paid_by) ?? "—",
      type: "expense" as const,
      amount: Number(x.amount),
      note: x.note,
      title: x.title,
      _member: x.paid_by,
      _created: x.created_at,
    })),
  ]
    .filter((i) => (!type || i.type === type) && (!memFilter || i._member === memFilter))
    .sort((a, b) => b.date.localeCompare(a.date) || b._created.localeCompare(a._created))
    .map(({ _member, _created, ...rest }) => rest);

  const net = items.reduce((s, i) => s + (i.type === "deposit" ? i.amount : -i.amount), 0);
  const maxDeposit = Math.max(1, ...byMember.map((r) => r.deposited));
  const neg = summary.balance < 0;

  const q = (over: { m?: string; t?: string; mem?: string }) => {
    const p = new URLSearchParams();
    p.set("m", over.m ?? month);
    const t = over.t ?? type;
    const mem = over.mem ?? memFilter;
    if (t) p.set("t", t);
    if (mem) p.set("mem", mem);
    return `/fund?${p.toString()}`;
  };
  const extra = `${type ? `&t=${type}` : ""}${memFilter ? `&mem=${memFilter}` : ""}`;
  const chip = (active: boolean) =>
    `flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition ${
      active ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25" : "border-slate-100 bg-white text-slate-700 shadow-sm hover:bg-emerald-50"
    }`;

  return (
    <div className="space-y-5">
      <PageBanner
        className="no-print"
        icon={<PiggyBank size={28} />}
        label="ফান্ড"
        title="পারিবারিক ফান্ড"
        subtitle={isAdmin ? "জমা, ফেরত ও ফান্ড থেকে খরচের হিসাব রাখুন।" : "ফান্ডে কত আছে আর কে কত জমা দিয়েছে, সবাই দেখতে পারবেন।"}
      >
        <PrintButton />
      </PageBanner>
      <h2 className="hidden text-xl font-bold print:block">শেখ ভিলা — ফান্ডের হিসাব</h2>

      {neg && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="shrink-0" /> ফান্ডের ব্যালেন্স ঋণাত্মক — অ্যাডমিনকে জানান
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard tone="emerald" icon={<Wallet size={22} />} badge="এখন" label="বর্তমান ব্যালেন্স"
          value={`${neg ? "−" : ""}${formatTaka(Math.abs(summary.balance))}`} valueClass={neg ? "text-red-600" : "text-emerald-600"} />
        <StatCard tone="blue" icon={<ArrowDownCircle size={22} />} badge="মোট" label="মোট জমা" value={formatTaka(summary.total_deposit)} />
        <StatCard tone="orange" icon={<ArrowUpCircle size={22} />} badge="মোট" label="ফেরত দেওয়া হয়েছে" value={formatTaka(summary.total_withdrawal)} />
        <StatCard tone="purple" icon={<Receipt size={22} />} badge="মোট" label="ফান্ড থেকে খরচ" value={formatTaka(summary.total_spent)} />
      </div>

      {/* Filters */}
      <div className="no-print space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {all ? (
            <Link href={q({ m: todayDhaka().slice(0, 7) })} className={chip(false)}>মাস অনুযায়ী দেখুন</Link>
          ) : (
            <>
              <MonthPicker month={month} basePath="/fund" extraQuery={extra} />
              <Link href={q({ m: "all" })} className={chip(false)}>সব সময়</Link>
            </>
          )}
          {all && <span className={chip(true)}>সব সময়</span>}
          <MemberFilter members={members} value={memFilter} month={month} type={type} />
        </div>
        <div className="flex gap-2 overflow-x-auto py-1">
          {TYPES.map((t) => (
            <Link key={t.value} href={q({ t: t.value })} className={chip(type === t.value)}>{t.label}</Link>
          ))}
        </div>
        <p className="text-sm text-slate-500">{all ? "সব সময়ের লেনদেন" : `${monthLabel(month)}-এর লেনদেন`}</p>
      </div>

      <FundLedger items={items} members={members} meId={profile.id} isAdmin={isAdmin} net={net} />

      <SectionCard tone="purple" title="সদস্যভিত্তিক হিসাব" icon={<Users size={18} />}>
        {byMember.length === 0 ? (
          <EmptyState text="ফান্ডে এখনো কোনো জমা নেই" icon={<Users size={48} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">সদস্য</th>
                  <th className="px-3 py-3 font-semibold">মোট জমা</th>
                  <th className="px-3 py-3 font-semibold">ফেরত</th>
                  <th className="px-3 py-3 font-semibold">নেট</th>
                  <th className="px-5 py-3 font-semibold">শেষ জমা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byMember.map((r) => (
                  <tr key={r.member_id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">{r.full_name.slice(0, 1)}</span>
                        <div>
                          <p className="font-semibold text-slate-800">{r.full_name}</p>
                          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div className="bar-grow h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${(r.deposited / maxDeposit) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><Badge tone="green">{formatTaka(r.deposited)}</Badge></td>
                    <td className="px-3 py-3 text-slate-600">{formatTaka(r.withdrawn)}</td>
                    <td className="px-3 py-3 font-semibold text-slate-800">{formatTaka(r.net)}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{r.last_deposit ? formatShortDateBn(r.last_deposit) : "এখনো জমা দেননি"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
