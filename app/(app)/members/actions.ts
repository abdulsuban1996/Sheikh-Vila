"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

/** Verifies the caller is a signed-in, active admin. Returns their id or null. */
async function assertAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  return data && data.role === "admin" && data.is_active ? user.id : null;
}

const DENIED: Result = { ok: false, error: "এই কাজের অনুমতি নেই" };

export async function addMember(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
}): Promise<Result> {
  if (!(await assertAdmin())) return DENIED;
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (!name) return { ok: false, error: "নাম লিখুন" };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "সঠিক ইমেইল দিন" };
  if (input.password.length < 8) return { ok: false, error: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    const exists = /already|registered|exists/i.test(error?.message ?? "");
    return { ok: false, error: exists ? "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে" : "সদস্য তৈরি করা যায়নি" };
  }

  const { error: upErr } = await admin
    .from("profiles")
    .update({ is_active: true, phone: phone || null, full_name: name })
    .eq("id", data.user.id);
  if (upErr) return { ok: false, error: "অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু অ্যাক্সেস চালু করা যায়নি" };

  revalidatePath("/members");
  return { ok: true };
}

export async function resetPassword(memberId: string, password: string): Promise<Result> {
  if (!(await assertAdmin())) return DENIED;
  if (password.length < 8) return { ok: false, error: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" };
  const { error } = await createAdminClient().auth.admin.updateUserById(memberId, { password });
  return error ? { ok: false, error: "পাসওয়ার্ড পরিবর্তন করা যায়নি" } : { ok: true };
}

export async function setAccess(memberId: string, active: boolean): Promise<Result> {
  const adminId = await assertAdmin();
  if (!adminId) return DENIED;
  if (memberId === adminId && !active) {
    return { ok: false, error: "নিজের অ্যাক্সেস বন্ধ করা যাবে না" };
  }
  // Plain (RLS-bound) client: the admin policy allows this update.
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", memberId);
  if (error) return { ok: false, error: "পরিবর্তন করা যায়নি" };
  revalidatePath("/members");
  return { ok: true };
}
