import { createClient } from "@/lib/supabase/client";

/** Last username used on this device, kept so the login page can prefill it. */
export const LAST_USER_KEY = "sv_last_user";

/** Sign out and wipe all local caches / storage (except the remembered username). */
export async function logout() {
  let lastUser: string | null = null;
  try {
    lastUser = localStorage.getItem(LAST_USER_KEY);
  } catch {}
  try {
    await createClient().auth.signOut();
  } catch {}
  try {
    localStorage.clear();
    sessionStorage.clear();
    if (lastUser) localStorage.setItem(LAST_USER_KEY, lastUser);
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {}
  window.location.href = "/login";
}
