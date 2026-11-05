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

/** "কেনা হয়েছে" sheet: asks for the price (and, for admin, who bought it). */
export function BuyModal({
  open,
  onClose,
  item,
  mode,
  meId,
  meName,
  isAdmin,
  members,
  saving,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  item: ShoppingItem | null;
  /** buy = tick as bought, edit = correct the price of a bought item */
  mode: "buy" | "edit";
  meId: string;
  meName: string;
  isAdmin: boolean;
  members: BuyerOption[];
  saving: boolean;
  onConfirm: (price: number, buyerId: string) => void;
}) {
  const [price, setPrice] = useState("");
  const [buyer, setBuyer] = useState(meId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    setError("");
    setBuyer(meId);
    setPrice(mode === "edit" && item.price !== null ? String(item.price) : "");
  }, [open, item, mode, meId]);

  if (!item) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(price);
    if (price.trim() === "" || !Number.isFinite(n) || n < 0) {
      setError("সঠিক দাম লিখুন (০ বা তার বেশি)");
      return;
    }
    onConfirm(n, buyer);
  }

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
