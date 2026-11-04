# শেখ ভিলা (Sheikh Villa) — v1

## Run
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values (see below).
3. `npm run dev` → http://localhost:3000 (the service worker is off in dev).
4. Production check: `npm run build && npm start`.

## Supabase setup
1. Create a project. In **Authentication → Providers → Email**, turn **OFF** "Allow new users to sign up".
2. Run `supabase/schema.sql` in **SQL Editor**.
3. **Settings → API**: copy the Project URL, anon key and service_role key into `.env.local`.
   `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.

## Create the first admin
In **Authentication → Users → Add user**, enter your email and password and tick "Auto Confirm User".
The first user created automatically becomes admin and is active. Log in at `/login`, then add the rest of the family from **সদস্য তালিকা**.

## Deploy (Vercel)
Import the repo and add the three env vars. Deploy.

## Phone test checklist
- [ ] Login works, and a wrong password shows "ইমেইল বা পাসওয়ার্ড সঠিক নয়"
- [ ] A member with access turned off is kicked out with the "অ্যাক্সেস নেই" message
- [ ] Bangla digits and dates display everywhere
- [ ] Bottom nav, hamburger drawer and floating "+" work
- [ ] Add, edit and delete an expense; a non-admin cannot edit others' entries
- [ ] Shopping list: add an item, tick it as bought, delete it
- [ ] Summary: month arrows work, and the print/PDF button gives a clean page
- [ ] Admin: add a member, reset a password, toggle access
- [ ] "Add to Home Screen" works and the app opens standalone
- [ ] Turn on airplane mode: the offline page shows, and writes show an error toast
- [ ] Logout, then press back: you land on login with no data visible
