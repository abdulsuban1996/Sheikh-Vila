import { ShoppingBasket, ListTodo, CheckCheck, Layers } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageBanner } from "@/components/ui/PageBanner";
import { StatCard } from "@/components/ui/Card";
import { ShoppingClient } from "@/components/shopping/ShoppingClient";
import { toBn } from "@/lib/bn";
import type { Profile, ShoppingItem } from "@/lib/types";

export const metadata = { title: "বাজারের তালিকা — শেখ ভিলা" };

export default async function ShoppingPage() {
  const { profile } = await requireMember();
  const supabase = await createClient();
  const [{ data }, { data: profs }] = await Promise.all([
    supabase.from("shopping_items").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);
  const items = (data ?? []) as ShoppingItem[];
  const names = Object.fromEntries(((profs ?? []) as Profile[]).map((p) => [p.id, p.full_name]));
  const pending = items.filter((i) => !i.is_bought).length;
  const bought = items.length - pending;
  const pct = items.length ? Math.round((bought / items.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageBanner
        icon={<ShoppingBasket size={28} />}
        label="বাজারের তালিকা"
        title="কী কিনতে হবে, সবাই মিলে লিখুন"
        subtitle="কেনা হলে টিক দিন, তালিকা নিজেই গুছিয়ে যাবে।"
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard tone="orange" icon={<ListTodo size={22} />} badge="বাকি" label="কিনতে হবে" value={toBn(pending)} />
        <StatCard tone="emerald" icon={<CheckCheck size={22} />} badge="সম্পন্ন" label="কেনা হয়েছে" value={toBn(bought)} />
        <StatCard tone="blue" icon={<Layers size={22} />} badge="মোট" label="মোট জিনিস" value={toBn(items.length)} />
        <StatCard tone="purple" icon={<ShoppingBasket size={22} />} badge="অগ্রগতি" label="কেনা শেষ" value={`${toBn(pct)}%`} />
      </div>
      <ShoppingClient items={items} names={names} meId={profile.id} isAdmin={profile.role === "admin"} />
    </div>
  );
}
