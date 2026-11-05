"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, Pencil, Plus, ShoppingBasket, Trash2, PackageCheck, Tag, Scale,
  Undo2, Wallet, ListChecks, Hash, ShoppingCart, X,
} from "lucide-react";
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
import type { ShoppingItem, ShoppingPurchase } from "@/lib/types";

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

/** A display group: either a solo bought item or a purchase (1+ items). */
type DisplayEntry =
  | { kind: "solo"; item: ShoppingItem; dateKey: string }
  | { kind: "group"; purchase: ShoppingPurchase; items: ShoppingItem[]; dateKey: string };

export function ShoppingClient({
  items,
  purchases,
  names,
  members,
  meId,
  meName,
  isAdmin,
}: {
  items: ShoppingItem[];
  purchases: ShoppingPurchase[];
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

  // optimistic patches
  const [patches, setPatches] = useState<Record<string, Partial<ShoppingItem>>>({});
  useEffect(() => setPatches({}), [items]);

  // purchase optimistic (for untick/edit)
  const [purchasePatches, setPurchasePatches] = useState<Record<string, Partial<ShoppingPurchase>>>({});
  useEffect(() => setPurchasePatches({}), [purchases]);

  // multi-select for pending items
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // buy / edit modal state
  type BuyState =
    | { mode: "buy"; item: ShoppingItem }              // single-item buy
    | { mode: "bulkBuy"; items: ShoppingItem[] }       // bulk buy
    | { mode: "edit"; item: ShoppingItem }             // edit single price
    | { mode: "editBulk"; purchase: ShoppingPurchase } // edit purchase total
    | null;
  const [buying, setBuying] = useState<BuyState>(null);
  const [savingBuy, setSavingBuy] = useState(false);

  const [range, setRange] = useState<Range>("month");
  const [memberFilter, setMemberFilter] = useState("");

  const list = useMemo(
    () => items.map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i)),
    [items, patches],
  );
  const purchaseList = useMemo(
    () => purchases.map((p) => (purchasePatches[p.id] ? { ...p, ...purchasePatches[p.id] } : p)),
    [purchases, purchasePatches],
  );

  const pending = list.filter((i) => !i.is_bought);
  const boughtItems = list.filter((i) => i.is_bought);

  const today = todayDhaka();

  // ── Range / member filter for bought items ──────────────────────────
  function inRange(dateKey: string) {
    if (range === "today") return dateKey === today;
    if (range === "week") return dateKey >= weekStartKey(today) && dateKey <= today;
    if (range === "month") return dateKey.slice(0, 7) === today.slice(0, 7);
    return true;
  }

  // Build display entries: solos (no purchase_id) + groups
  const displayEntries = useMemo<DisplayEntry[]>(() => {
    const entries: DisplayEntry[] = [];
    const purchaseMap = new Map(purchaseList.map((p) => [p.id, p]));
    const usedPurchaseIds = new Set<string>();

    for (const item of boughtItems) {
      if (item.purchase_id) {
        // group member — handle via purchase
        if (!usedPurchaseIds.has(item.purchase_id)) {
          usedPurchaseIds.add(item.purchase_id);
          const purchase = purchaseMap.get(item.purchase_id);
          if (purchase) {
            const groupItems = boughtItems.filter((x) => x.purchase_id === item.purchase_id);
            const dateKey = dhakaDateKey(purchase.bought_at);
            entries.push({ kind: "group", purchase, items: groupItems, dateKey });
          }
          // If purchase not in our list (shouldn't happen), skip
        }
      } else {
        const dateKey = dhakaDateKey(item.bought_at ?? item.created_at);
        entries.push({ kind: "solo", item, dateKey });
      }
    }
    return entries;
  }, [boughtItems, purchaseList]);

  // Apply range + member filters
  const filteredEntries = useMemo(() => {
    return displayEntries
      .filter((e) => inRange(e.dateKey))
      .filter((e) => {
        if (!memberFilter) return true;
        if (e.kind === "solo") return e.item.bought_by === memberFilter;
        return e.purchase.bought_by === memberFilter;
      })
      .sort((a, b) => {
        const ta = a.kind === "solo" ? (a.item.bought_at ?? a.item.created_at) : a.purchase.bought_at;
        const tb = b.kind === "solo" ? (b.item.bought_at ?? b.item.created_at) : b.purchase.bought_at;
        return tb.localeCompare(ta);
      });
  }, [displayEntries, range, memberFilter, today]);

  // Totals (singles + purchases in filter)
  const total = useMemo(() => {
    return filteredEntries.reduce((s, e) => {
      if (e.kind === "solo") return s + (e.item.price ?? 0);
      return s + e.purchase.total_price;
    }, 0);
  }, [filteredEntries]);

  // Item count (singles + all items inside groups)
  const itemCount = useMemo(() => {
    return filteredEntries.reduce((s, e) => {
      if (e.kind === "solo") return s + 1;
      return s + e.items.length;
    }, 0);
  }, [filteredEntries]);

  // Day groups
  type DayGroup = { key: string; entries: DisplayEntry[]; sum: number };
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups: DayGroup[] = [];
    for (const e of filteredEntries) {
      let g = groups.find((x) => x.key === e.dateKey);
      if (!g) groups.push((g = { key: e.dateKey, entries: [], sum: 0 }));
      g.entries.push(e);
      if (e.kind === "solo") g.sum += e.item.price ?? 0;
      else g.sum += e.purchase.total_price;
    }
    return groups;
  }, [filteredEntries]);

  const dayLabel = (k: string) => (k === today ? "আজ" : k === shiftKey(today, -1) ? "গতকাল" : formatDateBn(k));

  const canManage = (boughtBy: string | null) => isAdmin || boughtBy === meId;

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

  /** Optimistic single-item update. */
  async function save(i: ShoppingItem, patch: Partial<ShoppingItem>, successMsg: string) {
    if (offline()) return false;
    setPatches((p) => ({ ...p, [i.id]: patch }));
    const { data, error } = await createClient().from("shopping_items").update(patch).eq("id", i.id).select("id");
    if (error || !data || data.length === 0) {
      setPatches((p) => { const n = { ...p }; delete n[i.id]; return n; });
      toast(error ? "পরিবর্তন করা যায়নি" : "এটি বদলানোর অনুমতি আপনার নেই", "error");
      return false;
    }
    toast(successMsg);
    await revalidateShopping();
    router.refresh();
    return true;
  }

  // ── Buy / confirm handlers ──────────────────────────────────────────
  async function confirmBuy(price: number, buyerId: string, note?: string) {
    if (!buying) return;
    setSavingBuy(true);
    setBuying(null);

    if (buying.mode === "buy") {
      await save(
        buying.item,
        { is_bought: true, price, bought_by: buyerId, bought_at: new Date().toISOString() },
        `${formatTaka(price)} দিয়ে কেনা হিসেবে সেভ হয়েছে`,
      );
    } else if (buying.mode === "edit") {
      await save(buying.item, { price }, `দাম ${formatTaka(price)} করা হয়েছে`);
    } else if (buying.mode === "bulkBuy") {
      // Call RPC buy_items_together
      if (offline()) { setSavingBuy(false); return; }
      const itemIds = buying.items.map((x) => x.id);
      const passedBuyer = buyerId === meId ? null : buyerId; // null = use auth.uid()
      // Optimistic: mark all as bought
      const now = new Date().toISOString();
      const optPatch: Partial<ShoppingItem> = { is_bought: true, bought_by: buyerId, bought_at: now };
      setPatches((prev) => {
        const next = { ...prev };
        itemIds.forEach((id) => { next[id] = optPatch; });
        return next;
      });
      setSelectedIds(new Set());
      const { data, error } = await createClient().rpc("buy_items_together", {
        p_item_ids: itemIds,
        p_total: price,
        p_bought_by: passedBuyer,
        p_note: note || null,
      });
      if (error) {
        // Revert
        setPatches((prev) => {
          const next = { ...prev };
          itemIds.forEach((id) => { delete next[id]; });
          return next;
        });
        toast(error.message || "একসাথে কেনা সেভ করা যায়নি", "error");
      } else {
        toast(`${toBn(itemIds.length)} টি জিনিস একসাথে ${formatTaka(price)} দিয়ে সেভ হয়েছে`);
        await revalidateShopping();
        router.refresh();
      }
    } else if (buying.mode === "editBulk") {
      if (offline()) { setSavingBuy(false); return; }
      const purchaseId = buying.purchase.id;
      setPurchasePatches((prev) => ({ ...prev, [purchaseId]: { total_price: price } }));
      const { error } = await createClient()
        .from("shopping_purchases")
        .update({ total_price: price })
        .eq("id", purchaseId);
      if (error) {
        setPurchasePatches((prev) => { const n = { ...prev }; delete n[purchaseId]; return n; });
        toast(error.message || "দাম পরিবর্তন করা যায়নি", "error");
      } else {
        toast(`মোট দাম ${formatTaka(price)} করা হয়েছে`);
        await revalidateShopping();
        router.refresh();
      }
    }

    setSavingBuy(false);
  }

  async function untick(i: ShoppingItem) {
    if (!window.confirm(`"${i.name}" কি আবার "কিনতে হবে" তালিকায় ফেরাবেন? দাম ও কেনার তথ্য মুছে যাবে।`)) return;
    setBusy(i.id);
    await save(i, { is_bought: false, price: null, bought_by: null, bought_at: null }, "আবার কিনতে হবে তালিকায় ফেরানো হয়েছে");
    setBusy(null);
  }

  async function undoPurchase(purchase: ShoppingPurchase) {
    const groupItems = boughtItems.filter((x) => x.purchase_id === purchase.id);
    const names_list = groupItems.map((x) => x.name).join(", ");
    if (!window.confirm(`"${names_list}" — এই ${toBn(groupItems.length)} টি জিনিসের কেনা বাতিল করবেন? সব আবার "কিনতে হবে" তালিকায় ফিরবে।`)) return;
    if (offline()) return;
    setBusy(purchase.id);
    const { error } = await createClient().rpc("undo_purchase", { p_purchase_id: purchase.id });
    setBusy(null);
    if (error) {
      toast(error.message || "কেনা বাতিল করা যায়নি", "error");
    } else {
      toast("কেনা বাতিল হয়েছে, জিনিসগুলো তালিকায় ফেরত এসেছে");
      await revalidateShopping();
      router.refresh();
    }
  }

  function onCheck(i: ShoppingItem) {
    if (!i.is_bought) {
      // If in selection mode, toggle selection; otherwise open single buy
      if (selectedIds.size > 0) {
        toggleSelect(i.id);
      } else {
        setBuying({ mode: "buy", item: i });
      }
      return;
    }
    if (canManage(i.bought_by)) return untick(i);
    toast("শুধু যিনি কিনেছেন বা অ্যাডমিন এটি বদলাতে পারবেন", "error");
  }

  async function remove(i: ShoppingItem) {
    if (!window.confirm(`"${i.name}" মুছে ফেলবেন?`)) return;
    if (offline()) return;
    setBusy(i.id);
    const { error } = await createClient().from("shopping_items").delete().eq("id", i.id);
    setBusy(null);
    if (error) return toast("মুছে ফেলা যায়নি", "error");
    toast("মুছে ফেলা হয়েছে");
    await revalidateShopping();
    router.refresh();
  }

  // ── Multi-select helpers ────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(pending.map((i) => i.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function openBuySheet() {
    const sel = pending.filter((i) => selectedIds.has(i.id));
    if (sel.length === 0) return;
    if (sel.length === 1) {
      setBuying({ mode: "buy", item: sel[0] });
    } else {
      setBuying({ mode: "bulkBuy", items: sel });
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────
  const chip = (active: boolean) =>
    `flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition ${
      active ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25" : "border-slate-100 bg-white text-slate-700 shadow-sm hover:bg-emerald-50"
    }`;

  const selectionCheckbox = (i: ShoppingItem) => (
    <button
      onClick={(e) => { e.stopPropagation(); toggleSelect(i.id); }}
      role="checkbox"
      aria-checked={selectedIds.has(i.id)}
      aria-label={selectedIds.has(i.id) ? "নির্বাচন বাতিল" : "নির্বাচন করুন"}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition ${
        selectedIds.has(i.id)
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-300 bg-white text-transparent hover:border-blue-400 hover:text-blue-200"
      }`}
    >
      <Check size={22} />
    </button>
  );

  const buyCheckbox = (i: ShoppingItem) => {
    const locked = i.is_bought && !canManage(i.bought_by);
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
      {/* When nothing is selected, show buy-checkbox. Once something is selected, show selection-checkbox. */}
      {selectedIds.size === 0 ? buyCheckbox(i) : selectionCheckbox(i)}
      {/* Item also acts as selection toggle */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => selectedIds.size > 0 && toggleSelect(i.id)}>
        <p className="font-semibold text-slate-800">{i.name}</p>
        <p className="text-sm text-slate-500">
          চেয়েছেন: {names[i.requested_by] ?? "—"} · {formatShortDateBn(dhakaDateKey(i.created_at))}
        </p>
      </div>
      {i.quantity && <Badge tone="orange">{i.quantity}</Badge>}
      {selectedIds.size === 0 && deleteBtn(i)}
    </li>
  );

  const boughtRow = (i: ShoppingItem) => (
    <li key={i.id} className="px-4 py-3 transition-colors hover:bg-slate-50/70">
      <div className="flex items-start gap-3">
        {buyCheckbox(i)}
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
      {canManage(i.bought_by) && (
        <div className="mt-2 flex flex-wrap gap-2 pl-14">
          <button
            onClick={() => setBuying({ mode: "edit", item: i })}
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

  /** Card for a purchase group (2+ items bought together). */
  const purchaseGroupCard = (purchase: ShoppingPurchase, groupItems: ShoppingItem[]) => {
    const manageble = canManage(purchase.bought_by);
    return (
      <li key={purchase.id} className="px-4 py-4 transition-colors hover:bg-slate-50/70">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ShoppingCart size={16} className="shrink-0 text-emerald-600" />
              <span className="font-semibold text-slate-800">একসাথে কেনা · {toBn(groupItems.length)} টি জিনিস</span>
              <Badge tone="green">{formatTaka(purchase.total_price)}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              কিনেছেন: {names[purchase.bought_by] ?? "—"} · {formatDateTimeBn(purchase.bought_at)}
            </p>
            {purchase.note && (
              <p className="mt-1 text-sm text-slate-500 italic">{purchase.note}</p>
            )}
          </div>
        </div>
        {/* Item chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {groupItems.map((it) => (
            <span key={it.id} className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
              {it.name}{it.quantity ? ` · ${it.quantity}` : ""}
            </span>
          ))}
        </div>
        {/* Actions */}
        {manageble && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setBuying({ mode: "editBulk", purchase })}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-50 px-3 text-sm font-bold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
            >
              <Pencil size={17} /> মোট দাম সম্পাদনা
            </button>
            <button
              onClick={() => undoPurchase(purchase)}
              disabled={busy === purchase.id}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-red-50 px-3 text-sm font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60"
            >
              <Undo2 size={17} /> কেনা বাতিল করুন
            </button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard tone="orange" icon={<ListChecks size={22} />} badge="বাকি" label="কিনতে হবে" value={toBn(pending.length)} />
        <StatCard tone="emerald" icon={<Wallet size={22} />} badge={RANGES.find((r) => r.value === range)!.label} label="মোট কেনা" value={formatTaka(total)} />
        <StatCard tone="blue" icon={<Hash size={22} />} badge={RANGES.find((r) => r.value === range)!.label} label="আইটেম সংখ্যা" value={toBn(itemCount)} />
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

      {/* Pending list */}
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

      {/* Bought list */}
      <SectionCard
        tone="emerald"
        title="কেনা হয়েছে"
        icon={<PackageCheck size={18} />}
        action={<span className="rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">{toBn(itemCount)} টি · {formatTaka(total)}</span>}
      >
        {dayGroups.length === 0 ? (
          <EmptyState text="এখনো কিছু কেনা হয়নি" icon={<PackageCheck size={48} />} />
        ) : (
          dayGroups.map((g) => (
            <div key={g.key}>
              <div className="flex items-center justify-between gap-2 border-y border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-sm font-semibold text-emerald-900 first:border-t-0">
                <span>{dayLabel(g.key)}</span>
                <span>{g.key === today ? "আজকের মোট" : "এ দিনের মোট"}: {formatTaka(g.sum)}</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {g.entries.map((e) =>
                  e.kind === "solo"
                    ? boughtRow(e.item)
                    : purchaseGroupCard(e.purchase, e.items)
                )}
              </ul>
            </div>
          ))
        )}
      </SectionCard>

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="নতুন জিনিস যোগ করুন"
        className="animate-pop no-print fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg ring-4 ring-white/70 hover:bg-orange-600 sm:hidden"
      >
        <Plus size={28} />
      </button>

      {/* Sticky selection action bar */}
      {selectedIds.size > 0 && (
        <div className="no-print fixed bottom-16 inset-x-0 z-40 sm:bottom-0 sm:left-auto sm:right-0 sm:max-w-sm sm:m-4">
          <div className="mx-3 mb-2 sm:mx-0 sm:mb-0 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
            <span className="min-w-0 flex-1 text-sm font-semibold">
              {toBn(selectedIds.size)} টি জিনিস বাছাই হয়েছে
            </span>
            <button
              onClick={selectAll}
              className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
            >
              সব বাছুন
            </button>
            <button
              onClick={clearSelection}
              aria-label="বাছাই বাতিল"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
            >
              <X size={16} />
            </button>
            <button
              onClick={openBuySheet}
              className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-bold hover:bg-emerald-400"
            >
              <Check size={18} /> কিনেছি
            </button>
          </div>
        </div>
      )}

      {/* Buy / edit modal */}
      <BuyModal
        open={!!buying}
        onClose={() => setBuying(null)}
        item={buying?.mode === "buy" ? buying.item : buying?.mode === "edit" ? buying.item : null}
        selectedItems={buying?.mode === "bulkBuy" ? buying.items : undefined}
        mode={
          buying?.mode === "buy" || buying?.mode === "bulkBuy"
            ? "buy"
            : buying?.mode === "editBulk"
            ? "editBulk"
            : "edit"
        }
        purchaseId={buying?.mode === "editBulk" ? buying.purchase.id : null}
        initialPrice={buying?.mode === "editBulk" ? buying.purchase.total_price : undefined}
        meId={meId}
        meName={meName}
        isAdmin={isAdmin}
        members={members}
        saving={savingBuy}
        onConfirm={confirmBuy}
      />

      {/* Add item modal */}
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
