"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, Check, FileText, PiggyBank, UserRound } from "lucide-react";
import { Modal, Field } from "@/components/ui/Modal";
import { Button, inputClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { revalidateAll } from "@/app/(app)/actions";
import { todayDhaka } from "@/lib/month";
import type { FundEntry, FundKind } from "@/lib/types";

export interface FundMember {
  id: string;
  full_name: string;
}

export function FundEntryModal({
  open,
  onClose,
  members,
  meId,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  members: FundMember[];
  meId: string;
  entry?: FundEntry | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [memberId, setMemberId] = useState("");
  const [kind, setKind] = useState<FundKind>("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDhaka());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setMemberId(entry?.member_id ?? members[0]?.id ?? "");
    setKind(entry?.kind ?? "deposit");
    setAmount(entry ? String(entry.amount) : "");
    setDate(entry?.entry_date ?? todayDhaka());
    setNote(entry?.note ?? "");
  }, [open, entry, members]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!memberId) return setError("সদস্য বেছে নিন");
    if (!amount || !Number.isFinite(amt) || amt <= 0) return setError("পরিমাণ ০ এর বেশি হতে হবে");
    setError("");
    if (!navigator.onLine) return toast("ইন্টারনেট নেই, সংযোগ ছাড়া সংরক্ষণ করা যাবে না", "error");
    setSaving(true);
    const supabase = createClient();
    const payload = { member_id: memberId, kind, amount: amt, entry_date: date, note: note.trim() || null };
    const { error: err } = entry
      ? await supabase.from("fund_entries").update(payload).eq("id", entry.id)
      : await supabase.from("fund_entries").insert({ ...payload, created_by: meId });
    setSaving(false);
    if (err) return toast("সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।", "error");
    toast(entry ? "লেনদেন আপডেট হয়েছে" : kind === "deposit" ? "জমা যোগ হয়েছে" : "ফেরত যোগ হয়েছে");
    onClose();
    await revalidateAll();
    router.refresh();
  }

  const iconCls = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";
  const seg = (active: boolean, tone: string) =>
    `flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition ${
      active ? tone : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
    }`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? "লেনদেন সম্পাদনা" : "জমা / ফেরত যোগ করুন"}
      subtitle="ফান্ডে টাকা জমা বা ফেরতের হিসাব"
      icon={<PiggyBank size={22} />}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">বাতিল</Button>
          <Button type="submit" form="fund-form" loading={saving} className="flex-[2]"><Check size={20} /> সংরক্ষণ করুন</Button>
        </div>
      }
    >
      <form id="fund-form" onSubmit={submit} className="space-y-5" noValidate>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div role="radiogroup" aria-label="ধরন" className="flex gap-3">
          <button type="button" role="radio" aria-checked={kind === "deposit"} onClick={() => setKind("deposit")}
            className={seg(kind === "deposit", "border-emerald-500 bg-emerald-50 text-emerald-800")}>
            <ArrowDownCircle size={22} /> জমা
          </button>
          <button type="button" role="radio" aria-checked={kind === "withdrawal"} onClick={() => setKind("withdrawal")}
            className={seg(kind === "withdrawal", "border-orange-500 bg-orange-50 text-orange-800")}>
            <ArrowUpCircle size={22} /> ফেরত
          </button>
        </div>

        <Field label="সদস্য" htmlFor="f-member">
          <div className="relative">
            <UserRound size={19} className={iconCls} />
            <select id="f-member" className={`${inputClass} pl-11`} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
        </Field>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <label htmlFor="f-amount" className="mb-1 block text-sm font-semibold text-emerald-800">টাকার পরিমাণ</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-600">৳</span>
            <input id="f-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="০"
              className={`${inputClass} !min-h-[56px] !rounded-2xl pl-10 text-2xl font-bold`}
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        <Field label="তারিখ" htmlFor="f-date">
          <div className="relative">
            <CalendarDays size={19} className={iconCls} />
            <input id="f-date" type="date" required className={`${inputClass} pl-11`} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </Field>

        <Field label="নোট (ঐচ্ছিক)" htmlFor="f-note">
          <div className="relative">
            <FileText size={19} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <textarea id="f-note" rows={2} className={`${inputClass} pl-11`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="কোনো বাড়তি তথ্য থাকলে লিখুন" />
          </div>
        </Field>
      </form>
    </Modal>
  );
}
