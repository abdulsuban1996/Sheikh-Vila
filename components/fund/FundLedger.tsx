"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { FundEntryModal, type FundMember } from "./FundEntryModal";
import { createClient } from "@/lib/supabase/client";
import { revalidateAll } from "@/app/(app)/actions";
import { formatShortDateBn, formatTaka, toBn } from "@/lib/bn";
import type { FundEntry } from "@/lib/types";

export interface LedgerItem {
  key: string;
  date: string;
  memberName: string;
  type: "deposit" | "withdrawal" | "expense";
  amount: number;
  note: string | null;
  title?: string;
  /** present only for editable fund_entries rows */
  entry?: FundEntry;
}

const TYPE_PILL = {
  deposit: { tone: "green", label: "জমা", sign: "+" },
  withdrawal: { tone: "orange", label: "ফেরত", sign: "−" },
  expense: { tone: "red", label: "খরচ", sign: "−" },
} as const;

export function FundLedger({
  items,
  members,
  meId,
  isAdmin,
  net,
}: {
  items: LedgerItem[];
  members: FundMember[];
  meId: string;
  isAdmin: boolean;
  net: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FundEntry | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (e: FundEntry) => { setEditing(e); setOpen(true); };

  async function remove(it: LedgerItem) {
    if (!it.entry) return;
    if (!window.confirm(`${it.memberName}-এর ${formatTaka(it.amount)} এই লেনদেনটি মুছে ফেলবেন?`)) return;
    if (!navigator.onLine) return toast("ইন্টারনেট নেই, সংযোগ ছাড়া মুছা যাবে না", "error");
    setBusy(it.key);
    const { error } = await createClient().from("fund_entries").delete().eq("id", it.entry.id);
    setBusy(null);
    if (error) return toast("মুছে ফেলা যায়নি", "error");
    toast("লেনদেন মুছে ফেলা হয়েছে");
    await revalidateAll();
    router.refresh();
  }

  const actions = (it: LedgerItem) =>
    isAdmin && it.entry ? (
      <div className="flex justify-end gap-1 no-print">
        <button onClick={() => openEdit(it.entry!)} aria-label="সম্পাদনা" className="flex h-10 w-10 items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50">
          <Pencil size={18} />
        </button>
        <button onClick={() => remove(it)} disabled={busy === it.key} aria-label="মুছুন" className="flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50">
          <Trash2 size={18} />
        </button>
      </div>
    ) : null;

  return (
    <>
      <SectionCard
        tone="blue"
        title="ফান্ডের হিসাব"
        icon={<PiggyBank size={18} />}
        action={
          isAdmin ? (
            <button onClick={openNew} className="no-print flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
              <Plus size={18} /> <span className="hidden sm:inline">জমা / ফেরত যোগ করুন</span>
              <span className="sm:hidden">যোগ</span>
            </button>
          ) : undefined
        }
      >
        {items.length === 0 ? (
          <EmptyState text="ফান্ডে এখনো কোনো জমা নেই" icon={<PiggyBank size={48} />} />
        ) : (
          <>
            <table className="hidden w-full text-left sm:table">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">তারিখ</th>
                  <th className="px-3 py-3 font-semibold">সদস্য</th>
                  <th className="px-3 py-3 font-semibold">ধরন</th>
                  <th className="px-3 py-3 font-semibold">পরিমাণ</th>
                  <th className="px-3 py-3 font-semibold">নোট</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => {
                  const p = TYPE_PILL[it.type];
                  return (
                    <tr key={it.key} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-sm text-slate-500">{formatShortDateBn(it.date)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{it.memberName}</td>
                      <td className="px-3 py-3"><Badge tone={p.tone}>{p.label}</Badge></td>
                      <td className="px-3 py-3"><Badge tone={p.tone}>{p.sign}{formatTaka(it.amount)}</Badge></td>
                      <td className="px-3 py-3 text-sm text-slate-600">
                        {it.title && <span className="font-semibold text-slate-800">{it.title}</span>}
                        {it.title && it.note ? " · " : ""}
                        {it.note}
                        {!it.title && !it.note && "—"}
                      </td>
                      <td className="px-5 py-3">{actions(it)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-5 py-3 text-right font-semibold text-slate-600">এই তালিকার নেট ({toBn(items.length)} টি)</td>
                  <td colSpan={3} className="px-3 py-3">
                    <Badge tone={net >= 0 ? "green" : "red"} className="!text-base">{net < 0 ? "−" : ""}{formatTaka(Math.abs(net))}</Badge>
                  </td>
                </tr>
              </tfoot>
            </table>

            <ul className="divide-y divide-slate-100 sm:hidden">
              {items.map((it) => {
                const p = TYPE_PILL[it.type];
                return (
                  <li key={it.key} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{it.memberName}</p>
                        <p className="text-sm text-slate-500">{formatShortDateBn(it.date)}</p>
                      </div>
                      <Badge tone={p.tone}>{p.sign}{formatTaka(it.amount)}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Badge tone={p.tone}>{p.label}</Badge>
                        {(it.title || it.note) && (
                          <p className="mt-1 text-sm text-slate-600">{it.title}{it.title && it.note ? " · " : ""}{it.note}</p>
                        )}
                      </div>
                      {actions(it)}
                    </div>
                  </li>
                );
              })}
              <li className="flex items-center justify-between bg-slate-50 p-4 font-semibold text-slate-700">
                <span>নেট ({toBn(items.length)} টি)</span>
                <Badge tone={net >= 0 ? "green" : "red"}>{net < 0 ? "−" : ""}{formatTaka(Math.abs(net))}</Badge>
              </li>
            </ul>
          </>
        )}
      </SectionCard>

      {isAdmin && (
        <>
          <button
            onClick={openNew}
            aria-label="জমা বা ফেরত যোগ করুন"
            className="animate-pop no-print fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg ring-4 ring-white/70 hover:bg-teal-700 sm:hidden"
          >
            <Plus size={28} />
          </button>
          <FundEntryModal open={open} onClose={() => setOpen(false)} members={members} meId={meId} entry={editing} />
        </>
      )}
    </>
  );
}
