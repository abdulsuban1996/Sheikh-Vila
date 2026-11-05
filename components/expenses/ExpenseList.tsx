"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Receipt, Trash2, StickyNote } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ExpenseModal, type MemberOption } from "./ExpenseModal";
import { CATEGORY_META } from "./category";
import { createClient } from "@/lib/supabase/client";
import { revalidateAll } from "@/app/(app)/actions";
import { formatShortDateBn, formatTaka, toBn } from "@/lib/bn";
import { categoryLabel, type Expense } from "@/lib/types";

function CatTile({ e }: { e: Expense }) {
  const m = CATEGORY_META[e.category];
  const Icon = m.icon;
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.tile}`}>
      <Icon size={22} />
    </span>
  );
}

export function ExpenseList({
  expenses,
  names,
  members,
  meId,
  isAdmin,
}: {
  expenses: Expense[];
  names: Record<string, string>;
  members: MemberOption[];
  meId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const canEdit = (e: Expense) => isAdmin || e.created_by === meId;

  async function remove(e: Expense) {
    if (!window.confirm(`“${e.title}” মুছে ফেলবেন?`)) return;
    if (!navigator.onLine) return toast("ইন্টারনেট নেই, সংযোগ ছাড়া মুছা যাবে না", "error");
    setBusy(e.id);
    const { error } = await createClient().from("expenses").delete().eq("id", e.id);
    setBusy(null);
    if (error) return toast("মুছে ফেলা যায়নি", "error");
    toast("খরচ মুছে ফেলা হয়েছে");
    await revalidateAll();
    router.refresh();
  }

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (e: Expense) => { setEditing(e); setOpen(true); };

  return (
    <>
      <SectionCard
        tone="cyan"
        title="খরচের তালিকা"
        icon={<Receipt size={18} />}
        action={
          <button
            onClick={openNew}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
          >
            <Plus size={18} /> <span className="hidden sm:inline">নতুন খরচ যোগ করুন</span>
            <span className="sm:hidden">যোগ</span>
          </button>
        }
      >
        {expenses.length === 0 ? (
          <EmptyState text="এখনো কোনো খরচ যোগ করা হয়নি" icon={<Receipt size={48} />} />
        ) : (
          <>
            {/* desktop table */}
            <table className="hidden w-full text-left sm:table">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">বিবরণ</th>
                  <th className="px-3 py-3 font-semibold">ধরন</th>
                  <th className="px-3 py-3 font-semibold">কে দিয়েছে</th>
                  <th className="px-3 py-3 font-semibold">তারিখ</th>
                  <th className="px-3 py-3 font-semibold">পরিমাণ</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <CatTile e={e} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{e.title}</p>
                          {e.note && (
                            <p className="flex items-center gap-1 text-sm text-slate-500">
                              <StickyNote size={13} /> {e.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ${CATEGORY_META[e.category].badge}`}>
                        {categoryLabel(e.category)}
                      </span>
                      {e.from_fund && <span className="ml-1.5 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-sm font-semibold text-teal-700">ফান্ড</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {(names[e.paid_by] ?? "—").slice(0, 1)}
                        </span>
                        {names[e.paid_by] ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-500">{formatShortDateBn(e.expense_date)}</td>
                    <td className="px-3 py-3"><Badge tone="green">{formatTaka(e.amount)}</Badge></td>
                    <td className="px-5 py-3">
                      {canEdit(e) && <Actions busy={busy === e.id} onEdit={() => openEdit(e)} onDelete={() => remove(e)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-right font-semibold text-slate-600">মোট ({toBn(expenses.length)} টি)</td>
                  <td colSpan={2} className="px-3 py-3">
                    <Badge tone="green" className="!text-base">
                      {formatTaka(expenses.reduce((s, e) => s + Number(e.amount), 0))}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* mobile cards */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {expenses.map((e) => (
                <li key={e.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <CatTile e={e} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800">{e.title}</p>
                        <Badge tone="green">{formatTaka(e.amount)}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {names[e.paid_by] ?? "—"} · {formatShortDateBn(e.expense_date)}
                      </p>
                      {e.note && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <StickyNote size={13} /> {e.note}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_META[e.category].badge}`}>
                            {categoryLabel(e.category)}
                          </span>
                          {e.from_fund && <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">ফান্ড</span>}
                        </span>
                        {canEdit(e) && <Actions busy={busy === e.id} onEdit={() => openEdit(e)} onDelete={() => remove(e)} />}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      <button
        onClick={openNew}
        aria-label="নতুন খরচ যোগ করুন"
        className="animate-pop no-print fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-white/70 hover:bg-emerald-700 sm:hidden"
      >
        <Plus size={28} />
      </button>

      <ExpenseModal open={open} onClose={() => setOpen(false)} members={members} meId={meId} isAdmin={isAdmin} expense={editing} />
    </>
  );
}

function Actions({ busy, onEdit, onDelete }: { busy: boolean; onEdit: () => void; onDelete: () => void }) {
  const b = "flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-50";
  return (
    <div className="flex justify-end gap-1">
      <button onClick={onEdit} aria-label="সম্পাদনা" className={`${b} text-blue-600 hover:bg-blue-50`}><Pencil size={18} /></button>
      <button onClick={onDelete} disabled={busy} aria-label="মুছুন" className={`${b} text-red-600 hover:bg-red-50`}><Trash2 size={18} /></button>
    </div>
  );
}
