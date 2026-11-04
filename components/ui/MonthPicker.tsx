import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonth } from "@/lib/month";

export function MonthPicker({
  month,
  basePath,
  extraQuery = "",
}: {
  month: string;
  basePath: string;
  extraQuery?: string;
}) {
  const href = (m: string) => `${basePath}?m=${m}${extraQuery}`;
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return (
    <div className="no-print flex items-center gap-2">
      <Link href={href(shiftMonth(month, -1))} aria-label="আগের মাস" className={btn}>
        <ChevronLeft size={22} />
      </Link>
      <span className="min-w-[150px] rounded-xl bg-white px-4 py-2.5 text-center font-semibold text-slate-800 shadow-sm">
        {monthLabel(month)}
      </span>
      <Link href={href(shiftMonth(month, 1))} aria-label="পরের মাস" className={btn}>
        <ChevronRight size={22} />
      </Link>
    </div>
  );
}
