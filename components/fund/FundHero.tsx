import Link from "next/link";
import { PiggyBank, ArrowDownCircle, ArrowUpCircle, Receipt, AlertTriangle, ChevronRight } from "lucide-react";
import { formatTaka } from "@/lib/bn";

/** Wide fund balance card shown on the dashboard. Clicking opens /fund. */
export function FundHero({
  balance,
  deposit,
  withdrawal,
  spent,
}: {
  balance: number;
  deposit: number;
  withdrawal: number;
  spent: number;
}) {
  const neg = balance < 0;
  return (
    <Link
      href="/fund"
      aria-label="ফান্ডের বিস্তারিত দেখুন"
      className={`hero-shine animate-rise group relative block overflow-hidden rounded-2xl p-5 text-white shadow-sm transition hover:shadow-lg sm:p-6 ${
        neg ? "bg-gradient-to-r from-red-600 to-rose-500" : "bg-gradient-to-r from-teal-600 to-cyan-600"
      }`}
    >
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-4">
        <span className="animate-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <PiggyBank size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white/90">ফান্ডে এখন আছে</p>
          <p className="text-4xl font-bold leading-tight sm:text-5xl">
            {neg ? "−" : ""}{formatTaka(Math.abs(balance))}
          </p>
        </div>
        <ChevronRight className="shrink-0 opacity-70 transition group-hover:translate-x-1" />
      </div>
      {neg && (
        <p className="relative mt-3 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-medium">
          <AlertTriangle size={16} /> ফান্ডের ব্যালেন্স ঋণাত্মক — অ্যাডমিনকে জানান
        </p>
      )}
      <div className="relative mt-4 flex flex-wrap gap-2 text-sm">
        <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5"><ArrowDownCircle size={16} /> মোট জমা {formatTaka(deposit)}</span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5"><ArrowUpCircle size={16} /> ফেরত {formatTaka(withdrawal)}</span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5"><Receipt size={16} /> ফান্ড থেকে খরচ {formatTaka(spent)}</span>
      </div>
    </Link>
  );
}
