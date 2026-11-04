import { Calculator, Wallet, Users, Scale, TrendingUp, Printer } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { PrintButton } from "@/components/ui/PrintButton";
import { PageBanner } from "@/components/ui/PageBanner";
import { SectionCard, StatCard, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatTaka, toBn } from "@/lib/bn";
import { monthLabel, monthRange, parseMonth } from "@/lib/month";
import type { SummaryRow } from "@/lib/types";

export const metadata = { title: "মাসিক হিসাব — শেখ ভিলা" };

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const { profile } = await requireMember();
  const month = parseMonth(sp.m);
  const [start] = monthRange(month);
  const supabase = await createClient();
  const { data } = await supabase.rpc("monthly_summary", { p_month: start });
  const rows = ((data ?? []) as SummaryRow[]).map((r) => ({
    ...r,
    paid: Number(r.paid),
    share: Number(r.share),
    balance: Number(r.balance),
  }));
  const total = rows.reduce((s, r) => s + r.paid, 0);
  const perHead = rows[0]?.share ?? 0;
  const mine = rows.find((r) => r.member_id === profile.id);
  const myBal = mine?.balance ?? 0;
  const top = rows.reduce((m, r) => (r.paid > m.paid ? r : m), { full_name: "—", paid: 0 } as { full_name: string; paid: number });
  const maxPaid = Math.max(1, ...rows.map((r) => r.paid));

  return (
    <div className="space-y-5">
      <PageBanner
        className="no-print"
        icon={<Calculator size={28} />}
        label="মাসিক হিসাব"
        title={`${monthLabel(month)}-এর হিসাব`}
        subtitle="কে কত দিয়েছে আর কে কত পাবে বা দেবে, এক নজরে।"
      >
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker month={month} basePath="/summary" />
          <PrintButton />
        </div>
      </PageBanner>

      <h2 className="hidden text-xl font-bold print:block">শেখ ভিলা — মাসিক হিসাব ({monthLabel(month)})</h2>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard tone="purple" icon={<Wallet size={22} />} badge={monthLabel(month)} label="মোট খরচ" value={formatTaka(total)} />
        <StatCard tone="emerald" icon={<Users size={22} />} badge={`${toBn(rows.length)} জন`} label="জনপ্রতি ভাগ" value={formatTaka(perHead)} />
        <StatCard tone="orange" icon={<Scale size={22} />} badge={myBal >= 0 ? "পাবো" : "দেবো"} label="আমার হিসাব" value={formatTaka(Math.abs(myBal))}
          valueClass={myBal >= 0 ? "text-emerald-600" : "text-red-600"} chips={[`দিয়েছি ${formatTaka(mine?.paid ?? 0)}`]} />
        <StatCard tone="blue" icon={<TrendingUp size={22} />} badge="সর্বোচ্চ" label="সবচেয়ে বেশি দিয়েছে" value={top.paid > 0 ? top.full_name : "—"}
          valueClass="text-xl sm:text-2xl truncate" chips={top.paid > 0 ? [formatTaka(top.paid)] : []} />
      </div>

      <SectionCard tone="blue" title="সদস্যভিত্তিক হিসাব" icon={<Calculator size={18} />}>
        {rows.length === 0 ? (
          <EmptyState text="এ মাসের কোনো হিসাব নেই" icon={<Calculator size={48} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">সদস্য</th>
                  <th className="px-3 py-3 font-semibold">দিয়েছে</th>
                  <th className="px-3 py-3 font-semibold">ভাগ</th>
                  <th className="px-5 py-3 font-semibold">পাবে/দেবে</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const pos = r.balance >= 0;
                  return (
                    <tr key={r.member_id} className={`transition-colors hover:bg-slate-50/70 ${r.member_id === profile.id ? "bg-emerald-50/40" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                            {r.full_name.slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {r.full_name} {r.member_id === profile.id && <span className="text-sm text-slate-400">(আমি)</span>}
                            </p>
                            <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div className="bar-grow h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${(r.paid / maxPaid) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><Badge tone="green">{formatTaka(r.paid)}</Badge></td>
                      <td className="px-3 py-3 text-slate-600">{formatTaka(r.share)}</td>
                      <td className="px-5 py-3">
                        {r.balance === 0 ? (
                          <Badge tone="gray">হিসাব সমান</Badge>
                        ) : (
                          <Badge tone={pos ? "green" : "red"}>
                            {formatTaka(Math.abs(r.balance))} {pos ? "পাবে" : "দেবে"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <td className="px-5 py-3">মোট</td>
                  <td className="px-3 py-3">{formatTaka(total)}</td>
                  <td className="px-3 py-3">{formatTaka(perHead * rows.length)}</td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
