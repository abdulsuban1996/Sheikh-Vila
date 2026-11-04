import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300",
} as const;

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold outline-none transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}

export const inputClass =
  "min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
