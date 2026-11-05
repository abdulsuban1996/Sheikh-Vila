"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/components/ui/Button";

/** Member filter for the fund ledger; keeps the other query params. */
export function MemberFilter({
  members,
  value,
  month,
  type,
}: {
  members: { id: string; full_name: string }[];
  value: string;
  month: string;
  type: string;
}) {
  const router = useRouter();
  return (
    <select
      aria-label="সদস্য অনুযায়ী ফিল্টার"
      value={value}
      onChange={(e) => {
        const q = new URLSearchParams({ m: month });
        if (type) q.set("t", type);
        if (e.target.value) q.set("mem", e.target.value);
        router.push(`/fund?${q.toString()}`);
      }}
      className={`${inputClass} no-print sm:max-w-[220px]`}
    >
      <option value="">সব সদস্য</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>{m.full_name}</option>
      ))}
    </select>
  );
}
