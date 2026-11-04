"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, ShoppingBasket, Trash2, PackageCheck, Tag, Scale, Undo2 } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/ui/Card";
import { Modal, Field } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button, inputClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { toBn } from "@/lib/bn";
import type { ShoppingItem } from "@/lib/types";

export function ShoppingClient({
  items,
  names,
  meId,
  isAdmin,
}: {
  items: ShoppingItem[];
  names: Record<string, string>;
  meId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const pending = items.filter((i) => !i.is_bought);
  const bought = items.filter((i) => i.is_bought);

  function offline() {
    if (navigator.onLine) return false;
    toast("ইন্টারনেট নেই, সংযোগ ছাড়া পরিবর্তন করা যাবে না", "error");
    return true;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast("জিনিসের নাম লিখুন", "error");
    if (offline()) return;
    setAdding(true);
    const { error } = await createClient()
      .from("shopping_items")
      .insert({ name: name.trim(), quantity: qty.trim() || null, requested_by: meId });
    setAdding(false);
    if (error) return toast("যোগ করা যায়নি", "error");
    toast("তালিকায় যোগ হয়েছে");
    setName("");
    setQty("");
    setOpen(false);
    router.refresh();
  }

  async function setBought(i: ShoppingItem, next: boolean) {
    if (offline()) return;
    setBusy(i.id);
    const { error } = await createClient()
      .from("shopping_items")
      .update({ is_bought: next, bought_at: next ? new Date().toISOString() : null })
      .eq("id", i.id);
    setBusy(null);
    if (error) return toast("পরিবর্তন করা যায়নি", "error");
    toast(next ? `“${i.name}” কেনা হয়েছে হিসেবে চিহ্নিত` : `“${i.name}” আবার কিনতে হবে তালিকায়`);
    router.refresh();
  }

  const toggle = (i: ShoppingItem) => setBought(i, !i.is_bought);

  async function remove(i: ShoppingItem) {
    if (!window.confirm(`“${i.name}” মুছে ফেলবেন?`)) return;
    if (offline()) return;
    setBusy(i.id);
    const { error } = await createClient().from("shopping_items").delete().eq("id", i.id);
    setBusy(null);
    if (error) return toast("মুছে ফেলা যায়নি", "error");
    toast("মুছে ফেলা হয়েছে");
    router.refresh();
  }

  const row = (i: ShoppingItem) => (
    <li key={i.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70">
      <button
        onClick={() => toggle(i)}
        disabled={busy === i.id}
        role="checkbox"
        aria-checked={i.is_bought}
        aria-label={i.is_bought ? "কেনা হয়নি হিসেবে চিহ্নিত করুন" : "কেনা হয়েছে হিসেবে চিহ্নিত করুন"}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition ${
          i.is_bought ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-300"
        }`}
      >
        <Check size={24} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${i.is_bought ? "text-slate-400 line-through" : "text-slate-800"}`}>{i.name}</p>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            {(names[i.requested_by] ?? "—").slice(0, 1)}
          </span>
          {names[i.requested_by] ?? "—"}
        </p>
      </div>
      {i.quantity && <Badge tone={i.is_bought ? "gray" : "orange"}>{i.quantity}</Badge>}
      {i.is_bought && (
        <button
          onClick={() => setBought(i, false)}
          disabled={busy === i.id}
          aria-label="পূর্বাবস্থায় ফেরান, আবার কিনতে হবে তালিকায় নিন"
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-60"
        >
          <Undo2 size={18} /> <span className="hidden sm:inline">পূর্বাবস্থায় ফেরান</span>
          <span className="sm:hidden">ফেরান</span>
        </button>
      )}
      {(i.requested_by === meId || isAdmin) && (
        <button onClick={() => remove(i)} aria-label="মুছুন" className="flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50">
          <Trash2 size={19} />
        </button>
      )}
    </li>
  );

  return (
    <div className="space-y-5">
      <SectionCard
        tone="orange"
        title={`কিনতে হবে (${toBn(pending.length)} টি)`}
        icon={<ShoppingBasket size={18} />}
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-50"
          >
            <Plus size={18} /> <span className="hidden sm:inline">নতুন জিনিস যোগ করুন</span>
            <span className="sm:hidden">যোগ</span>
          </button>
        }
      >
        {pending.length === 0 ? (
          <EmptyState text="তালিকায় কিছু বাকি নেই" icon={<ShoppingBasket size={48} />} />
        ) : (
          <ul className="divide-y divide-slate-100">{pending.map(row)}</ul>
        )}
      </SectionCard>

      {bought.length > 0 && (
        <SectionCard
          tone="blue"
          title="কেনা হয়েছে"
          icon={<PackageCheck size={18} />}
          action={<span className="rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">{toBn(bought.length)} টি</span>}
        >
          <ul className="divide-y divide-slate-100">{bought.map(row)}</ul>
        </SectionCard>
      )}

      <button
        onClick={() => setOpen(true)}
        aria-label="নতুন জিনিস যোগ করুন"
        className="animate-pop no-print fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg ring-4 ring-white/70 hover:bg-orange-600 sm:hidden"
      >
        <Plus size={28} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="নতুন জিনিস যোগ করুন"
        subtitle="কী কিনতে হবে তালিকায় লিখে রাখুন"
        icon={<ShoppingBasket size={22} />}
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">বাতিল</Button>
            <Button type="submit" form="shopping-form" loading={adding} className="flex-[2]"><Plus size={20} /> যোগ করুন</Button>
          </div>
        }
      >
        <form id="shopping-form" onSubmit={add} className="space-y-4">
          <Field label="জিনিসের নাম" htmlFor="sh-name">
            <div className="relative">
              <Tag size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="sh-name" autoFocus className={`${inputClass} pl-11`} placeholder="যেমন: তেল" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </Field>
          <Field label="পরিমাণ (ঐচ্ছিক)" htmlFor="sh-qty">
            <div className="relative">
              <Scale size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="sh-qty" className={`${inputClass} pl-11`} placeholder="যেমন: ২ লিটার" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
