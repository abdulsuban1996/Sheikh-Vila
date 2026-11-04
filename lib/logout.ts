import { createClient } from "@/lib/supabase/client";

/** Sign out and wipe all local caches / storage. */
export async function logout() {
  try {
    await createClient().auth.signOut();
  } catch {}
  try {
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {}
  window.location.href = "/login";
}
