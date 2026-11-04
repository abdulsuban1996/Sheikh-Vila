import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Returns the signed-in, approved user + profile or redirects to /login. */
export const requireMember = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    redirect("/auth/signout?error=not_approved");
  }
  return { user, profile: profile as Profile };
});

export async function requireAdmin() {
  const ctx = await requireMember();
  if (ctx.profile.role !== "admin") redirect("/dashboard");
  return ctx;
}
