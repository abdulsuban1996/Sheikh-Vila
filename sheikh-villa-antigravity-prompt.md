# Antigravity Prompt — Sheikh Villa (Version 1)

Put BOTH files in the same place: paste this prompt into Antigravity and also add `sheikh-villa-schema.sql` to the project (Antigravity should save it as `supabase/schema.sql`).

---

Build a Bangla-first, mobile-friendly PWA called **"শেখ ভিলা"** — a household management app for one family home where 10 members eat together. Version 1 covers: login, bazar/expense entry, shopping list, and a monthly hisab (who paid how much vs equal share).

## Stack
Next.js (App Router, TypeScript), Tailwind CSS, Supabase (Auth + Postgres, `@supabase/ssr`), lucide-react icons, deploy on Vercel. Do NOT use any other UI library. The database schema is in the attached file `sheikh-villa-schema.sql` (save it as `supabase/schema.sql`; I will run it myself in the Supabase SQL Editor — do NOT try to run it or change it) — tables: `profiles`, `expenses`, `shopping_items`, function `monthly_summary(p_month date)`, helpers `is_admin()` and `is_member()`. RLS only lets approved members (`is_active = true`) access data. Do not change the schema; read it and code against it.

## Language & numbers
- All UI text in Bangla. Use the font **Hind Siliguri** via `next/font/google` (subsets: bengali, latin; weights 400/500/600/700).
- Create `lib/bn.ts` with `toBn(n)` (convert digits to Bangla ০১২৩৪৫৬৭৮৯), `formatTaka(n)` (e.g. ৳১২,৫০০ with Bangla digits) and `formatDateBn(date)` (e.g. বুধবার, ৪ নভেম্বর, ২০২৬). Use them everywhere numbers or dates are shown.

## Design system (match the existing "madrasa dashboard" look exactly in spirit)
- **Page background:** slate-100 (`#f1f5f9`). **Cards:** white, `rounded-2xl`, `shadow-sm`, subtle border `border-slate-100`. Each stat card has a faint translucent colored circle decoration at the bottom-right corner.
- **Sidebar (desktop, 256px):** deep emerald background (emerald-900 / `#064e3b`), white text, outline lucide icons. Top: round logo tile + "শেখ ভিলা" + small subtitle "পারিবারিক ম্যানেজমেন্ট". Active item = darker pill (`bg-black/25`, rounded-xl). Fixed height, scrolls independently.
- **Top header:** white, page title on the left (bold, Bangla), right side: green status dot + role label ("অ্যাডমিন প্যানেল" or "সদস্য প্যানেল"), a thin vertical divider, then today's date in Bangla.
- **Hero banner (dashboard top):** `rounded-2xl`, gradient `from-emerald-600 via-emerald-500 to-cyan-600`, white text. Left: translucent rounded-square icon tile (home icon), small label "★ পারিবারিক ম্যানেজমেন্ট", big greeting "আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ!", and one line "শেখ ভিলায় স্বাগতম, <member name>। নিচে এ মাসের সংক্ষিপ্ত হিসাব দেওয়া হলো।". Right: "আজকের তারিখ" + Bangla date.
- **Stat cards (4 in a row on desktop, 2×2 on mobile):** 4px colored top border (emerald, purple, blue, orange), icon in a tinted rounded-xl square, small pill badge top-right, label, big bold number (Bangla digits), and two small tinted sub-chips.
- **Section cards:** each has a **gradient header strip** with white icon + title (blue→indigo, purple, blue→cyan, orange variants), then the white body. Tables: light gray header row, rows separated by hairlines; ID/receipt-like values in blue pill badges, amounts in green pill badges, dates in muted gray.
- **Progress bars:** thick, rounded-full, gradient fill, with a small numbered/iconic tile at the left and percentage at the right.
- Forms and buttons: rounded-xl, emerald primary buttons, soft focus rings, large touch targets (min 44px) — this will be used mostly on phones by all family members including older ones. Keep text size comfortable (base 16px+).

## Layout / responsive
- Desktop: fixed sidebar + header + content.
- Mobile: sidebar becomes a slide-in drawer (hamburger in header) AND a **bottom navigation bar** with 4 items: ড্যাশবোর্ড, খরচ, তালিকা, হিসাব. Add a floating "+" button on the dashboard and expense page to add an expense quickly.

## Pages (all protected except /login)
1. **/login** — centered card on the emerald gradient, email + password, Bangla error messages. Supabase email/password auth. Redirect to /dashboard on success. There is NO signup page and no register/forgot-password link. Under the form show a small note: "অ্যাকাউন্ট পেতে অ্যাডমিনের সাথে যোগাযোগ করুন".
2. **/dashboard** — hero banner, then 4 stat cards:
   - মোট সদস্য (count of active profiles)
   - এ মাসের মোট খরচ (sum of expenses this month)
   - আমি দিয়েছি (current user's paid total this month)
   - আমার হিসাব (balance from `monthly_summary`: positive = "পাবো", negative = "দেবো", colored green/red)
   Below: left card "সাম্প্রতিক খরচ" (blue→cyan header, last 8 expenses: title, who paid, date, amount pill, "সব দেখুন" link); right card "বাজারের তালিকা" (orange header, pending items, with count); and a purple-header card "সদস্যভিত্তিক খরচ (এ মাস)" with progress bars showing each member's share of total paid.
3. **/expenses** (বাজার ও খরচ) — month picker (prev/next arrows, Bangla month names), category filter chips (বাজার, বিল, ওষুধ, অন্যান্য), list/table of expenses, "নতুন খরচ যোগ করুন" modal/sheet with: title, amount, category, date (default today), paid_by (default me; admin can pick anyone), note. Edit/delete only own entries (admin: all) — rely on RLS but also hide buttons accordingly.
4. **/shopping** (বাজারের তালিকা) — quick-add input (name + optional quantity), list with big checkboxes to mark "কেনা হয়েছে" (sets `is_bought` and `bought_at`), pending on top, bought struck-through below; delete own items.
5. **/summary** (মাসিক হিসাব) — month picker, summary cards (মোট খরচ, জনপ্রতি ভাগ), and a table from `monthly_summary`: সদস্য | দিয়েছে | ভাগ | পাবে/দেবে (green/red). Add a "প্রিন্ট / PDF" button using `window.print()` with a clean print stylesheet.
6. **/members** (সদস্য তালিকা, admin only) — list of profiles with name, phone, role, and an **access toggle** (is_active: "অ্যাক্সেস আছে / বন্ধ"). Button "নতুন সদস্য যোগ করুন" (name, phone, email, password) and per-member "পাসওয়ার্ড রিসেট". See the privacy section for how these work.
7. **/settings** — change own name/phone, logout.

## Privacy & access control (IMPORTANT — only family members I approve may see anything)
- The Supabase schema already enforces this at the database level: a user can read/write data only if their `profiles.is_active = true` (RLS via `is_member()`). New users are created with `is_active = false`; the first user ever becomes admin automatically. Never weaken or bypass these rules and never use the service-role key for normal data reads.
- Public sign-up is disabled in Supabase. Do not build any signup flow.
- **Admin adds members** from /members via a **server action / route handler only** using `SUPABASE_SERVICE_ROLE_KEY` (server-side env var, NEVER prefixed with `NEXT_PUBLIC_`, never imported in client components): call `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`, then set that profile's `is_active = true` and save phone. Verify the caller is an active admin on the server before doing this. Password reset uses `supabase.auth.admin.updateUserById`. Toggling access just updates `is_active`.
- **Middleware / layout guard:** after checking the session, also load the user's profile; if no profile or `is_active = false`, sign them out and redirect to `/login?error=not_approved` with the Bangla message "আপনার অ্যাকাউন্টের অ্যাক্সেস নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।". Admin-only pages (/members) must also check role on the server.
- No page or API route may expose family data without an authenticated, approved user. No public pages except /login and the offline page.
- Hide the site from search engines: `robots: { index: false, follow: false }` in root metadata, plus `public/robots.txt` with `User-agent: * Disallow: /`.
- Service worker must NEVER cache Supabase/API responses or authenticated HTML — cache only static assets, fonts, icons and the offline page. On logout, clear any caches and local storage.
- Login protection: show a generic error ("ইমেইল বা পাসওয়ার্ড সঠিক নয়"), and add a simple client-side delay after 5 failed attempts.

## PWA requirements
- `app/manifest.ts`: name "শেখ ভিলা", short_name "শেখ ভিলা", `display: standalone`, `theme_color: #064e3b`, `background_color: #f1f5f9`, `lang: bn`, icons 192×192 and 512×512 (+ maskable). Generate a simple emerald rounded icon with a house glyph.
- Add a service worker with **Serwist** (or `next-pwa` if Serwist is incompatible): precache the app shell, runtime cache for static assets and font, and show a friendly Bangla offline page ("ইন্টারনেট নেই, অনুগ্রহ করে সংযোগ চেক করুন"). Data writes need internet in v1 — just show a clear toast if offline.
- Add `apple-touch-icon`, `viewport` with `viewport-fit=cover`, and an optional small "হোম স্ক্রিনে যোগ করুন" install hint banner.

## Technical notes
- Use `@supabase/ssr` with separate browser/server clients and a middleware that refreshes the session and redirects unauthenticated users to /login.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. Provide `.env.example` (with a comment that the service-role key must never be exposed to the browser).
- Use server components for data fetching where possible; client components only for forms/interactions. Show skeleton loaders (matching card shapes) and Bangla empty states ("এখনো কোনো খরচ যোগ করা হয়নি").
- Toasts in Bangla for success/error. Validate forms (amount > 0, required title).
- Keep the code clean: `components/ui` (Card, StatCard, SectionCard, Badge, Button, Modal), `components/layout` (Sidebar, Header, BottomNav), `lib/supabase`, `lib/bn.ts`.
- Accessibility: proper labels, focus states, contrast.

## Out of scope for v1 (do NOT build yet)
Meal counting, monthly utility bills tracking, notice board, task assignment, push notifications. Leave clean extension points (sidebar can later hold মিল, বিল, নোটিশ).

When done, give me: run steps, env setup, how to create the first admin user, and a short checklist to test on a phone.
