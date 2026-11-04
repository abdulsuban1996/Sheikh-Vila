"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ExpenseModal, type MemberOption } from "./ExpenseModal";

/** Floating "+" button that opens the quick add-expense sheet. */
export function AddExpenseFab({
  members,
  meId,
  isAdmin,
}: {
  members: MemberOption[];
  meId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="নতুন খরচ যোগ করুন"
        className="animate-pop no-print fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-white/70 transition hover:bg-emerald-700 focus-visible:ring-emerald-300 lg:bottom-8 lg:right-8"
      >
        <Plus size={28} />
      </button>
      <ExpenseModal open={open} onClose={() => setOpen(false)} members={members} meId={meId} isAdmin={isAdmin} />
    </>
  );
}
