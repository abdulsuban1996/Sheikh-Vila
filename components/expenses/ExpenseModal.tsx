"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, FileText, Receipt, StickyNote, UserRound } from "lucide-react";
import { Modal, Field } from "@/components/ui/Modal";
import { Button, inputClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_META } from "./category";
import { createClient } from "@/lib/supabase/client";
import { toBn } from "@/lib/bn";
import { todayDhaka } from "@/lib/month";
import { CATEGORIES, type Category, type Expense, type Profile } from "@/lib/types";

export type MemberOption = Pick<Profile, "id" | "full_name">;

const QUICK = [100, 200, 500, 1000];

export function ExpenseModal({
  open,
  onClose,
  members,
  meId,
  isAdmin,
  expense,
}: {
  open: boolean;
  onClose: () => void;
  members: MemberOption[];
  meId: string;
  isAdmin: boolean;
  expense?: Expense | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("bazar");
  const [date, setDate] = useState(todayDhaka());
  const [paidBy, setPaidBy] = useState(meId);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setTitle(expense?.title ?? "");
    setAmount(expense ? String(expense.amount) : "");
    setCategory(expense?.category ?? "bazar");
    setDate(expense?.expense_date ?? todayDhaka());
    setPaidBy(expense?.paid_by ?? meId);
    setNote(expense?.note ?? "");
  }, [open, expense, meId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = "খরচের বিবরণ লিখুন";
    const amt = Number(amount);
    if (!amount || !Number.isFinite(amt) || amt <= 0) errs.amount = "পরিমাণ ০ এর বেশি হতে হবে";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!navigator.onLine) {
      toast("ইন্টারনেট নেই, সংযোগ ছাড়া সংরক্ষণ করা যাবে না", "error");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: title.trim(),
      amount: amt,
      category,
      expense_date: date,
      paid_by: isAdmin ? paidBy : meId,
      note: note.trim() || null,
    };
    const { error } = expense
      ? await supabase.from("expenses").update(payload).eq("id", expense.id)
      : await supabase.from("expenses").insert({ ...payload, created_by: meId });
    setSaving(false);
    if (error) {
      toast("সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।", "error");
      return;
    }
    toast(expense ? "খরচ আপডেট হয়েছে" : "খরচ যোগ হয়েছে");
    onClose();
    router.refresh();
  }

  const iconInput = "pl-11";
  const iconCls = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? "খরচ সম্পাদনা" : "নতুন খরচ যোগ করুন"}
      subtitle="বাজার বা অন্য খরচের হিসাব লিখে রাখুন"
      icon={<Receipt size={22} />}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">বাতিল</Button>
          <Button type="submit" form="expense-form" loading={saving} className="flex-[2]">
            <Check size={20} /> সংরক্ষণ করুন
          </Button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={submit} className="space-y-5" noValidate>
        {/* Amount */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <label htmlFor="x-amount" className="mb-1 block text-sm font-semibold text-emerald-800">পরিমাণ</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-600">৳</span>
            <input
              id="x-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="০"
              className={`${inputClass} !min-h-[56px] !rounded-2xl pl-10 text-2xl font-bold`}
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q} type="button"
                onClick={() => setAmount(String((Number(amount) || 0) + q))}
                className="min-h-[40px] rounded-full bg-white px-3.5 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-100"
              >
                +{toBn(q)}
              </button>
            ))}
            {amount && (
              <button type="button" onClick={() => setAmount("")} className="min-h-[40px] rounded-full px-3 text-sm font-medium text-slate-500 hover:bg-white">
                মুছুন
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <Field label="বিবরণ" htmlFor="x-title">
          <div className="relative">
            <FileText size={19} className={iconCls} />
            <input id="x-title" className={`${inputClass} ${iconInput}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: চাল, ডাল, সবজি" />
          </div>
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </Field>

        {/* Category */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-700">ধরন</p>
          <div role="radiogroup" aria-label="ধরন" className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c.value];
              const Icon = meta.icon;
              const active = category === c.value;
              return (
                <button
                  key={c.value} type="button" role="radio" aria-checked={active}
                  onClick={() => setCategory(c.value)}
                  className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 text-sm font-semibold transition ${
                    active ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.tile}`}><Icon size={19} /></span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date + payer */}
        <div className={`grid gap-4 ${isAdmin ? "sm:grid-cols-2" : ""}`}>
          <Field label="তারিখ" htmlFor="x-date">
            <div className="relative">
              <CalendarDays size={19} className={iconCls} />
              <input id="x-date" type="date" className={`${inputClass} ${iconInput}`} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </Field>
          {isAdmin && (
            <Field label="কে দিয়েছে" htmlFor="x-paid">
              <div className="relative">
                <UserRound size={19} className={iconCls} />
                <select id="x-paid" className={`${inputClass} ${iconInput}`} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}{m.id === meId ? " (আমি)" : ""}</option>
                  ))}
                </select>
              </div>
            </Field>
          )}
        </div>

        {/* Note */}
        <Field label="নোট (ঐচ্ছিক)" htmlFor="x-note">
          <div className="relative">
            <StickyNote size={19} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <textarea id="x-note" rows={2} className={`${inputClass} ${iconInput}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="কোনো বাড়তি তথ্য থাকলে লিখুন" />
          </div>
        </Field>
      </form>
    </Modal>
  );
}
