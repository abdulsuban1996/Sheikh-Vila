"use client";

import { useEffect, useState } from "react";
import { Check, Wallet } from "lucide-react";
import { Modal, Field } from "@/components/ui/Modal";
import { Button, inputClass } from "@/components/ui/Button";
import type { ShoppingItem } from "@/lib/types";

export interface BuyerOption {
  id: string;
  full_name: string;
}

/**
 * "কেনা হয়েছে" / "দাম সম্পাদনা" sheet.
 *
 * Modes:
 *  - mode="buy"  + selectedItems.length === 1  → single-item buy (existing flow)
 *  - mode="buy"  + selectedItems.length >= 2   → bulk-buy (একসাথে কেনা)
 *  - mode="edit" + item != null                → edit price of a single item
 *  - mode="editBulk" + purchaseId != null      → edit total_price of a purchase
 */
export function BuyModal({
  open,
  onClose,
  item,
  selectedItems,
  mode,
  purchaseId,
  initialPrice,
  meId,
  meName,
  isAdmin,
  members,
  saving,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  /** For single-item modes (buy/edit). */
  item?: ShoppingItem | null;
  /** For bulk-buy mode (length >= 2 triggers bulk UI). */
  selectedItems?: ShoppingItem[];
  mode: "buy" | "edit" | "editBulk";
  /** For editBulk — the purchase to update. */
  purchaseId?: string | null;
  /** Pre-filled price for edit modes. */
  initialPrice?: number | null;
  meId: string;
  meName: string;
  isAdmin: boolean;
  members: BuyerOption[];
  saving: boolean;
  /** price, buyerId, note (note only used in bulk-buy mode) */
  onConfirm: (price: number, buyerId: string, note?: string) => void;
}) {
  const [price, setPrice] = useState("");
  const [buyer, setBuyer] = useState(meId);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const isBulk = mode === "buy" && (selectedItems?.length ?? 0) >= 2;

  useEffect(() => {
    if (!open) return;
    setError("");
    setBuyer(meId);
    setNote("");
    if (mode === "edit" && item?.price !== null && item?.price !== undefined) {
      setPrice(String(item.price));
    } else if (mode === "editBulk" && initialPrice !== null && initialPrice !== undefined) {
      setPrice(String(initialPrice));
    } else {
      setPrice("");
    }
  }, [open, item, mode, meId, initialPrice]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(price);
    if (price.trim() === "" || !Number.isFinite(n) || n < 0) {
      setError("সঠিক দাম লিখুন (০ বা তার বেশি)");
      return;
    }
    onConfirm(n, buyer, isBulk ? note : undefined);
  }

  /* ── Single-item (buy or edit) ───────────────────────────────────── */
  if (!isBulk && mode !== "editBulk") {
    if (!item) return null;
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={mode === "buy" ? "কেনা হয়েছে" : "দাম সম্পাদনা"}
        subtitle={`${item.name}${item.quantity ? ` · ${item.quantity}` : ""}`}
        icon={<Wallet size={22} />}
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">বাতিল</Button>
            <Button type="submit" form="buy-form" loading={saving} className="flex-[2]">
              <Check size={20} /> নিশ্চিত করুন
            </Button>
          </div>
        }
      >
        <form id="buy-form" onSubmit={submit} className="space-y-5" noValidate>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <label htmlFor="b-price" className="mb-1 block text-sm font-semibold text-emerald-800">কত টাকায় কিনলেন?</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-600">৳</span>
              <input
                id="b-price"
                type="number"
                inputMode="numeric"
                min="0"
                step="any"
                required
                autoFocus
                placeholder="যেমন: ২৪০"
                className={`${inputClass} !min-h-[56px] !rounded-2xl pl-10 text-2xl font-bold`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {mode === "buy" && (
            <>
              {isAdmin ? (
                <Field label="কে কিনেছেন?" htmlFor="b-buyer">
                  <select id="b-buyer" className={inputClass} value={buyer} onChange={(e) => setBuyer(e.target.value)}>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}{m.id === meId ? " (আমি)" : ""}</option>
                    ))}
                  </select>
                </Field>
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                  কিনেছেন: <span className="font-semibold">{meName}</span>
                </p>
              )}
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                সময়: <span className="font-semibold">এখন</span>
                <span className="block text-sm text-slate-500">সঠিক সময় নিজে থেকেই সেভ হবে</span>
              </p>
            </>
          )}
        </form>
      </Modal>
    );
  }

  /* ── editBulk — edit total_price of a purchase ───────────────────── */
  if (mode === "editBulk") {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="মোট দাম সম্পাদনা"
        subtitle="কেনার মোট দাম ঠিক করুন"
        icon={<Wallet size={22} />}
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">বাতিল</Button>
            <Button type="submit" form="buy-form" loading={saving} className="flex-[2]">
              <Check size={20} /> নিশ্চিত করুন
            </Button>
          </div>
        }
      >
        <form id="buy-form" onSubmit={submit} className="space-y-5" noValidate>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <label htmlFor="b-price" className="mb-1 block text-sm font-semibold text-emerald-800">মোট কত টাকা?</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-600">৳</span>
              <input
                id="b-price"
                type="number"
                inputMode="numeric"
                min="0"
                step="any"
                required
                autoFocus
                placeholder="যেমন: ৫৬০"
                className={`${inputClass} !min-h-[56px] !rounded-2xl pl-10 text-2xl font-bold`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </form>
      </Modal>
    );
  }

  /* ── Bulk-buy (2+ items) ─────────────────────────────────────────── */
  const bulkItems = selectedItems ?? [];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="একসাথে কেনা হয়েছে"
      subtitle={`${bulkItems.length} টি জিনিস একসাথে কেনা`}
      icon={<Wallet size={22} />}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">বাতিল</Button>
          <Button type="submit" form="buy-form" loading={saving} className="flex-[2]">
            <Check size={20} /> নিশ্চিত করুন
          </Button>
        </div>
      }
    >
      <form id="buy-form" onSubmit={submit} className="space-y-5" noValidate>
        {/* Item chips */}
        <div className="flex flex-wrap gap-2">
          {bulkItems.map((it) => (
            <span key={it.id} className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {it.name}{it.quantity ? ` · ${it.quantity}` : ""}
            </span>
          ))}
        </div>

        {/* Total price */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <label htmlFor="b-price" className="mb-1 block text-sm font-semibold text-emerald-800">সব মিলিয়ে মোট কত টাকা হলো?</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-600">৳</span>
            <input
              id="b-price"
              type="number"
              inputMode="numeric"
              min="0"
              step="any"
              required
              autoFocus
              placeholder="যেমন: ৫৬০"
              className={`${inputClass} !min-h-[56px] !rounded-2xl pl-10 text-2xl font-bold`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Optional note */}
        <Field label="নোট (ঐচ্ছিক — যেমন: কোন দোকান থেকে)" htmlFor="b-note">
          <input
            id="b-note"
            type="text"
            className={inputClass}
            placeholder="যেমন: কাওরান বাজার"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        {/* Buyer */}
        {isAdmin ? (
          <Field label="কে কিনেছেন?" htmlFor="b-buyer">
            <select id="b-buyer" className={inputClass} value={buyer} onChange={(e) => setBuyer(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}{m.id === meId ? " (আমি)" : ""}</option>
              ))}
            </select>
          </Field>
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
            কিনেছেন: <span className="font-semibold">{meName}</span>
          </p>
        )}

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
          সময়: <span className="font-semibold">এখন</span>
          <span className="block text-sm text-slate-500">সঠিক সময় নিজে থেকেই সেভ হবে</span>
        </p>
      </form>
    </Modal>
  );
}
