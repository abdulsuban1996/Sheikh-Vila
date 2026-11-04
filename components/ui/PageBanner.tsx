import type { ReactNode } from "react";
import { Star } from "lucide-react";

/** Gradient page banner shared by all pages (same look as the dashboard hero). */
export function PageBanner({
  icon,
  label,
  title,
  subtitle,
  children,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`hero-shine animate-rise flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-600 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-4">
        <span className="animate-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm text-emerald-50">
            <Star size={14} fill="currentColor" /> {label}
          </p>
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-emerald-50">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
