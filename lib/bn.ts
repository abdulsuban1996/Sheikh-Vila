const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const BN_WEEKDAYS = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

/** Convert any digits in a number/string to Bangla digits. */
export function toBn(n: number | string): string {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** ৳১২,৫০০ — Bangla digits, up to 2 decimals (trailing zeros trimmed). */
export function formatTaka(n: number | string | null | undefined): string {
  const num = Number(n ?? 0);
  const safe = Number.isFinite(num) ? num : 0;
  const sign = safe < 0 ? "-" : "";
  const txt = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Math.abs(safe));
  return `${sign}৳${toBn(txt)}`;
}

/** Returns {y, m (0-11), d, wd} for a 'YYYY-MM-DD' string or a Date (Asia/Dhaka). */
function parts(date: Date | string) {
  if (typeof date === "string") {
    const [y, m, d] = date.slice(0, 10).split("-").map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return { y, m: m - 1, d, wd };
  }
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts(f);
}

/** বুধবার, ৪ নভেম্বর, ২০২৬ */
export function formatDateBn(date: Date | string): string {
  const { y, m, d, wd } = parts(date);
  return `${BN_WEEKDAYS[wd]}, ${toBn(d)} ${BN_MONTHS[m]}, ${toBn(y)}`;
}

/** ৪ নভেম্বর ২০২৬ (without weekday) */
export function formatShortDateBn(date: Date | string): string {
  const { y, m, d } = parts(date);
  return `${toBn(d)} ${BN_MONTHS[m]} ${toBn(y)}`;
}

/** YYYY-MM-DD of an instant, in Asia/Dhaka (used to group by day / filter ranges). */
export function dhakaDateKey(ts: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof ts === "string" ? new Date(ts) : ts);
}

function dhakaClock(ts: Date | string) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(typeof ts === "string" ? new Date(ts) : ts);
  const h = Number(f.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(f.find((p) => p.type === "minute")?.value ?? 0);
  return { h, m };
}

/** সকাল / দুপুর / বিকাল / রাত */
export function dayPeriodBn(hour: number): string {
  if (hour >= 4 && hour < 12) return "সকাল";
  if (hour >= 12 && hour < 16) return "দুপুর";
  if (hour >= 16 && hour < 18) return "বিকাল";
  return "রাত";
}

/** দুপুর ২:৩০ (Asia/Dhaka, Bangla digits) */
export function formatTimeBn(ts: Date | string): string {
  const { h, m } = dhakaClock(ts);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${dayPeriodBn(h)} ${toBn(h12)}:${toBn(String(m).padStart(2, "0"))}`;
}

/** ৪ নভেম্বর, দুপুর ২:৩০ (Asia/Dhaka) */
export function formatDateTimeBn(ts: Date | string): string {
  const { m, d } = parts(typeof ts === "string" ? new Date(ts) : ts);
  return `${toBn(d)} ${BN_MONTHS[m]}, ${formatTimeBn(ts)}`;
}
