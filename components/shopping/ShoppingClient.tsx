"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, ShoppingBasket, Trash2, PackageCheck, Tag, Scale, Undo2, Wallet, ListChecks, Hash } from "lucide-react";
import { SectionCard, StatCard, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, inputClass } from "@/components/ui/Button";
import { Modal, Field } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { BuyModal, type BuyerOption } from "./BuyModal";
import { createClient } from "@/lib/supabase/client";
import { revalidateShopping } from "@/app/(app)/actions";
import { dhakaDateKey, formatDateBn, formatDateTimeBn, formatShortDateBn, formatTaka, toBn } from "@/lib/bn";
import { todayDhaka } from "@/lib/month";
import type { ShoppingItem } from "@/lib/types";

type Range = "today" | "week" | "month" | "all";
const RANGES: { value: Range; label: string }[] = [
  { value: "today", label: "আজ" },
  { value: "week", label: "এই সপ্তাহ" },
  { value: "month", label: "এ মাস" },
  { value: "all", label: "সব" },
];

const shiftKey = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** The week starts on Saturday in Bangladesh. */
function weekStartKey(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return shiftKey(today, -((dow + 1) % 7));
}

export function ShoppingClient({
  items,
  names,
  members,
  meId,
  meName,
  isAdmin,
}: {
  items: ShoppingItem[];
  names: Record<string, string>;
  members: BuyerOption[];
  meId: string;
  meName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // optimistic changes, dropped as soon as fresh data arrives from the server
  const [patches, setPatches] = useState<Record<string, Partial<ShoppingItem>>>({});
  useEffect(() => setPatches({}), [items]);

  const [buying, setBuying] = useState<{ item: ShoppingItem; mode: "buy" | "edit" } | null>(null);
  const [savingBuy, setSavingBuy] = useState(false);
  const [range, setRange] = useState<Range>("month");
  const [memberFilter, setMemberFilter] = useState("");

  const list = useMemo(
    () => items.map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i)),
    [items, patches],
  );
  const pending = list.filter((i) => !i.is_bought);
  const boughtKey = (i: ShoppingItem) => dhakaDateKey(i.bought_at ?? i.created_at);

  const today = todayDhaka();
  const filteredBought = list
    .filter((i) => i.is_bought)
    .filter((i) => {
      const k = boughtKey(i);
      if (range === "today") return k === today;
      if (range === "week") return k >= weekStartKey(today) && k <= today;
      if (range === "month") return k.slice(0, 7) === today.slice(0, 7);
      return true;
    })
    .filter((i) => !memberFilter || i.bought_by === memberFilter)
    .sort((a, b) => (b.bought_at ?? b.created_at).localeCompare(a.bought_at ?? a.created_at));

  const total = filteredBought.reduce((s, i) => s + (i.price ?? 0), 0);

  const groups: { key: string; items: ShoppingItem[]; sum: number }[] = [];
  for (const i of filteredBought) {
    const k = boughtKey(i);
    let g = groups.find((x) => x.key === k);
    if (!g) groups.push((g = { key: k, items: [], sum: 0 }));
    g.items.push(i);
    g.sum += i.price ?? 0;
  }
  const dayLabel = (k: string) => (k === today ? "আজ" : k === shiftKey(today, -1) ? "গতকাল" : formatDateBn(k));

  const canManage = (i: ShoppingItem) => isAdmin || i.bought_by === meId;

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
    await revalidateShopping();
    router.refresh();
  }

  /** Optimistic update; rolls back and shows an error when the database refuses. */
  async function save(i: ShoppingItem, patch: Partial<ShoppingItem>, successMsg: string) {
    if (offline()) return false;
    setPatches((p) => ({ ...p, [i.id]: patch }));
    const { data, error } = await createClient().from("shopping_items").update(patch).eq("id", i.id).select("id");
    if (error || !data || data.length === 0) {
      setPatches((p) => {
        const n = { ...p };
        delete n[i.id];
        return n;
      });
      toast(error ? "পরিবর্তন করা যায়নি" : "এটি বদলানোর অনুমতি আপনার নেই", "error");
      return false;
    }
    toast(successMsg);
    await revalidateShopping();
    router.refresh();
    return true;
  }

  async function confirmBuy(price: number, buyerId: string) {
    if (!buying) return;
    const { item, mode } = buying;
    setSavingBuy(true);
    setBuying(null);
    if (mode === "buy") {
      await save(
        item,
        { is_bought: true, price, bought_by: buyerId, bought_at: new Date().toISOString() },
        `${formatTaka(price)} দিয়ে কেনা হিসেবে সেভ হয়েছে`,
      );
    } else {
      await save(item, { price }, `দাম ${formatTaka(price)} করা হয়েছে`);
    }
    setSavingBuy(false);
  }

  async function untick(i: ShoppingItem) {
    if (!window.confirm(`“${i.name}” কি আবার “কিনতে হবে” তালিকায় ফেরাবেন? দাম ও কেনার তথ্য মুছে যাবে।`)) return;
    setBusy(i.id);
    await save(i, { is_bought: false, price: null, bought_by: null, bought_at: null }, "আবার কিনতে হবে তালিকায় ফেরানো হয়েছে");
    setBusy(null);
  }

  function onCheck(i: ShoppingItem) {
    if (!i.is_bought) return setBuying({ item: i, mode: "buy" });
    if (canManage(i)) return untick(i);
    toast("শুধু যিনি কিনেছেন বা অ্যাডমিন এটি বদলাতে পারবেন", "error");
  }

  async function remove(i: ShoppingItem) {
    if (!window.confirm(`“${i.name}” মুছে ফেলবেন?`)) return;
    if (offline()) return;
    setBusy(i.id);
    const { error } = await createClient().from("shopping_items").delete().eq("id", i.id);
    setBusy(null);
    if (error) return toast("মুছে ফেলা যায়নি", "error");
    toast("মুছে ফেলা হয়েছে");
    await revalidateShopping();
    router.refresh();
  }

  const checkbox = (i: ShoppingItem) => {
    const locked = i.is_bought && !canManage(i);
    return (
      <button
        onClick={() => onCheck(i)}
        disabled={busy === i.id}
        role="checkbox"
        aria-checked={i.is_bought}
        aria-label={i.is_bought ? "কেনা হয়নি হিসেবে চিহ্নিত করুন" : "কেনা হয়েছে হিসেবে চিহ্নিত করুন"}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition ${
          i.is_bought
            ? `border-emerald-600 bg-emerald-600 text-white ${locked ? "opacity-70" : ""}`
            : "border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-300"
        }`}
      >
        <Check size={24} />
      </button>
    );
  };

  const deleteBtn = (i: ShoppingItem) =>
    (i.requested_by === meId || isAdmin) && (
      <button onClick={() => remove(i)} aria-label="মুছুন" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red-600 hover:bg-red-50">
        <Trash2 size={19} />
      </button>
    );

  const pendingRow = (i: ShoppingItem) => (
    <li key={i.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70">
      {checkbox(i)}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">{i.name}</p>
        <p className="text-sm text-slate-500">
          চেয়েছেন: {names[i.requested_by] ?? "—"} · {formatShortDateBn(dhakaDateKey(i.created_at))}
        </p>
      </div>
      {i.quantity && <Badge tone="orange">{i.quantity}</Badge>}
      {deleteBtn(i)}
    </li>
  );

  const boughtRow = (i: ShoppingItem) => (
    <li key={i.id} className="px-4 py-3 transition-colors hover:bg-slate-50/70">
      <div className="flex items-start gap-3">
        {checkbox(i)}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-800">{i.name}</p>
            {i.quantity && <Badge tone="gray">{i.quantity}</Badge>}
            {i.price !== null ? <Badge tone="green">{formatTaka(i.price)}</Badge> : <Badge tone="gray">দাম দেওয়া নেই</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            কিনেছেন: {i.bought_by ? names[i.bought_by] ?? "—" : "—"}
            {i.bought_at && <> · {formatDateTimeBn(i.bought_at)}</>}
          </p>
        </div>
        {deleteBtn(i)}
      </div>
      {canManage(i) && (
        <div className="mt-2 flex flex-wrap gap-2 pl-14">
          <button
            onClick={() => setBuying({ item: i, mode: "edit" })}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-50 px-3 text-sm font-bold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
          >
            <Pencil size={17} /> দাম সম্পাদনা
          </button>
          <button
            onClick={() => untick(i)}
            disabled={busy === i.id}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-60"
          >
            <Undo2 size={17} /> পূর্বাবস্থায় ফেরান
          </button>
        </div>
      )}
    </li>
  );

  const chip = (active: boolean) =>
    `flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition ${
      active ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25" : "border-slate-100 bg-white text-slate-700 shadow-sm hover:bg-emerald-50"
    }`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard tone="orange" icon={<ListChecks size={22} />} badge="বাকি" label="কিনতে হবে" value={toBn(pending.length)} />
        <StatCard tone="emerald" icon={<Wallet size={22} />} badge={RANGES.find((r) => r.value === range)!.label} label="মোট কেনা" value={formatTaka(total)} />
        <StatCard tone="blue" icon={<Hash size={22} />} badge={RANGES.find((r) => r.value === range)!.label} label="আইটেম সংখ্যা" value={toBn(filteredBought.length)} />
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto py-1">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)} aria-pressed={range === r.value} className={chip(range === r.value)}>
              {r.label}
            </button>
          ))}
        </div>
        <select
          aria-label="সদস্য অনুযায়ী ফিল্টার"
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className={`${inputClass} sm:max-w-[260px]`}
        >
          <option value="">সবাই</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name}</option>
          ))}
        </select>
      </div>

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
          <ul className="divide-y divide-slate-100">{pending.map(pendingRow)}</ul>
        )}
      </SectionCard>

      <SectionCard
        tone="emerald"
        title="কেনা হয়েছে"
        icon={<PackageCheck size={18} />}
        action={<span className="rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">{toBn(filteredBought.length)} টি · {formatTaka(total)}</span>}
      >
        {groups.length === 0 ? (
          <EmptyState text="এখনো কিছু কেনা হয়নি" icon={<PackageCheck size={48} />} />
        ) : (
          groups.map((g) => (
            <div key={g.key}>
              <div className="flex items-center justify-between gap-2 border-y border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-sm font-semibold text-emerald-900 first:border-t-0">
                <span>{dayLabel(g.key)}</span>
                <span>{g.key === today ? "আজকের মোট" : "এ দিনের মোট"}: {formatTaka(g.sum)}</span>
              </div>
              <ul className="divide-y divide-slate-100">{g.items.map(boughtRow)}</ul>
            </div>
          ))
        )}
      </SectionCard>

      <button
        onClick={() => setOpen(true)}
        aria-label="নতুন জিনিস যোগ করুন"
        className="animate-pop no-print fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg ring-4 ring-white/70 hover:bg-orange-600 sm:hidden"
      >
        <Plus size={28} />
      </button>

      <BuyModal
        open={!!buying}
        onClose={() => setBuying(null)}
        item={buying?.item ?? null}
        mode={buying?.mode ?? "buy"}
        meId={meId}
        meName={meName}
        isAdmin={isAdmin}
        members={members}
        saving={savingBuy}
        onConfirm={confirmBuy}
      />

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
