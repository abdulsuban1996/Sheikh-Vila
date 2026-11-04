import type { ReactNode } from "react";

const TONES = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
  orange: "bg-orange-50 text-orange-700",
  purple: "bg-purple-50 text-purple-700",
} as const;

export function Badge({
  tone = "gray",
  children,
  className = "",
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
