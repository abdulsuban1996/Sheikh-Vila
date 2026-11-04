import { Users, UserCheck, UserX, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MembersClient } from "@/components/members/MembersClient";
import { PageBanner } from "@/components/ui/PageBanner";
import { StatCard } from "@/components/ui/Card";
import { toBn } from "@/lib/bn";
import type { Profile } from "@/lib/types";

export const metadata = { title: "সদস্য তালিকা — শেখ ভিলা" };

export default async function MembersPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  const members = (data ?? []) as Profile[];
  const active = members.filter((m) => m.is_active).length;

  return (
    <div className="space-y-5">
      <PageBanner
        icon={<Users size={28} />}
        label="সদস্য তালিকা"
        title="পরিবারের সদস্যদের ব্যবস্থাপনা"
        subtitle="নতুন সদস্য যোগ করুন, অ্যাক্সেস চালু বা বন্ধ করুন।"
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard tone="emerald" icon={<Users size={22} />} badge="মোট" label="মোট সদস্য" value={toBn(members.length)} />
        <StatCard tone="blue" icon={<UserCheck size={22} />} badge="চালু" label="অ্যাক্সেস আছে" value={toBn(active)} />
        <StatCard tone="orange" icon={<UserX size={22} />} badge="বন্ধ" label="অ্যাক্সেস বন্ধ" value={toBn(members.length - active)} />
        <StatCard tone="purple" icon={<ShieldCheck size={22} />} badge="অ্যাডমিন" label="অ্যাডমিন" value={toBn(members.filter((m) => m.role === "admin").length)} />
      </div>
      <MembersClient members={members} meId={profile.id} />
    </div>
  );
}
