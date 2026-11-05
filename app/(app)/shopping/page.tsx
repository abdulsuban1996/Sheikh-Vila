import { ShoppingBasket } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageBanner } from "@/components/ui/PageBanner";
import { ShoppingClient } from "@/components/shopping/ShoppingClient";
import type { Profile, ShoppingItem } from "@/lib/types";

export const metadata = { title: "বাজারের তালিকা — শেখ ভিলা" };

export default async function ShoppingPage() {
  const { profile } = await requireMember();
  const supabase = await createClient();
  const [{ data }, { data: profs }] = await Promise.all([
    supabase.from("shopping_items").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, is_active"),
  ]);
  const items = ((data ?? []) as ShoppingItem[]).map((i) => ({
    ...i,
    price: i.price === null || i.price === undefined ? null : Number(i.price),
  }));
  const all = (profs ?? []) as Profile[];
  const names = Object.fromEntries(all.map((p) => [p.id, p.full_name]));
  const members = all.filter((p) => p.is_active).map((p) => ({ id: p.id, full_name: p.full_name }));

  return (
    <div className="space-y-5">
      <PageBanner
        icon={<ShoppingBasket size={28} />}
        label="বাজারের তালিকা"
        title="কী কিনতে হবে, সবাই মিলে লিখুন"
        subtitle="কেনা হলে টিক দিন, দাম লিখুন, কে কিনলেন আর কখন, সব জমা থাকবে।"
      />
      <ShoppingClient
        items={items}
        names={names}
        members={members}
        meId={profile.id}
        meName={profile.full_name}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}
