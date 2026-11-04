import { BN_MONTHS, toBn } from "./bn";

/** Today's date (YYYY-MM-DD) in Bangladesh time. */
export function todayDhaka(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Validate a 'YYYY-MM' string, falling back to the current month. */
export function parseMonth(m?: string | string[]): string {
  const v = Array.isArray(m) ? m[0] : m;
  if (v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return v;
  return todayDhaka().slice(0, 7);
}

export function shiftMonth(m: string, delta: number): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** [start, endExclusive] as YYYY-MM-DD */
export function monthRange(m: string): [string, string] {
  return [`${m}-01`, `${shiftMonth(m, 1)}-01`];
}

export function monthLabel(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return `${BN_MONTHS[mo - 1]} ${toBn(y)}`;
}
