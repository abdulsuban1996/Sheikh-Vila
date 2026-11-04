import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`animate-rise print-card rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const HEADERS = {
  blue: "from-blue-600 to-indigo-600",
  purple: "from-purple-600 to-fuchsia-600",
  cyan: "from-blue-500 to-cyan-500",
  orange: "from-orange-500 to-amber-500",
  emerald: "from-emerald-600 to-teal-600",
} as const;

export function SectionCard({
  title,
  icon,
  tone = "blue",
  action,
  children,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  tone?: keyof typeof HEADERS;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div
        className={`flex items-center gap-3 bg-gradient-to-r ${HEADERS[tone]} px-5 py-3.5 text-white`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
          {icon}
        </span>
        <h2 className="flex-1 text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </Card>
  );
}

const TONES = {
  emerald: { border: "border-t-emerald-500", tile: "bg-emerald-50 text-emerald-600", circle: "bg-emerald-500/10", pill: "bg-emerald-50 text-emerald-700" },
  purple: { border: "border-t-purple-500", tile: "bg-purple-50 text-purple-600", circle: "bg-purple-500/10", pill: "bg-purple-50 text-purple-700" },
  blue: { border: "border-t-blue-500", tile: "bg-blue-50 text-blue-600", circle: "bg-blue-500/10", pill: "bg-blue-50 text-blue-700" },
  orange: { border: "border-t-orange-500", tile: "bg-orange-50 text-orange-600", circle: "bg-orange-500/10", pill: "bg-orange-50 text-orange-700" },
} as const;

export function StatCard({
  tone,
  icon,
  badge,
  label,
  value,
  valueClass = "text-slate-900",
  chips = [],
}: {
  tone: keyof typeof TONES;
  icon: ReactNode;
  badge?: string;
  label: string;
  value: string;
  valueClass?: string;
  chips?: string[];
}) {
  const t = TONES[tone];
  return (
    <div
      className={`animate-rise print-card relative overflow-hidden rounded-2xl border border-slate-100 border-t-4 bg-white p-4 shadow-sm sm:p-5 ${t.border}`}
    >
      <div
        className={`pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full ${t.circle}`}
      />
      <div className="relative flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.tile}`}>
          {icon}
        </span>
        {badge && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.pill}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="relative mt-3 text-sm font-medium text-slate-500">{label}</p>
      <p className={`relative mt-0.5 text-2xl font-bold sm:text-3xl ${valueClass}`}>
        {value}
      </p>
      {chips.length > 0 && (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className={`rounded-lg px-2 py-1 text-xs font-medium ${t.pill}`}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function EmptyState({
  text,
  icon,
}: {
  text: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-slate-500">
      {icon && <span className="text-slate-300">{icon}</span>}
      <p>{text}</p>
    </div>
  );
}
