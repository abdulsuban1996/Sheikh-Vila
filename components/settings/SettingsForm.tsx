"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, Phone, UserRound, UserCog, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, inputClass } from "@/components/ui/Button";
import { Field } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/lib/logout";

const iconCls = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

export function SettingsForm({
  id,
  name: n0,
  phone: p0,
  email,
  isAdmin,
}: {
  id: string;
  name: string;
  phone: string;
  email: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(n0);
  const [phone, setPhone] = useState(p0);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast("নাম লিখুন", "error");
    if (!navigator.onLine) return toast("ইন্টারনেট নেই, সংযোগ ছাড়া সংরক্ষণ করা যাবে না", "error");
    setSaving(true);
    const { error } = await createClient()
      .from("profiles")
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq("id", id);
    setSaving(false);
    if (error) return toast("সংরক্ষণ করা যায়নি", "error");
    toast("তথ্য আপডেট হয়েছে");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="animate-rise flex items-center gap-4 rounded-2xl border border-slate-100 border-t-4 border-t-emerald-500 bg-white p-5 shadow-sm">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-2xl font-bold text-white">
          {n0.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-slate-800">{n0}</p>
          <p className="truncate text-sm text-slate-500">{email}</p>
        </div>
        <Badge tone={isAdmin ? "purple" : "blue"}>
          <ShieldCheck size={15} className="mr-1" /> {isAdmin ? "অ্যাডমিন" : "সদস্য"}
        </Badge>
      </div>

      <SectionCard tone="blue" title="প্রোফাইল তথ্য" icon={<UserCog size={18} />}>
        <form onSubmit={save} className="space-y-4 p-5">
          <Field label="ইমেইল" htmlFor="s-email">
            <div className="relative"><Mail size={19} className={iconCls} /><input id="s-email" className={`${inputClass} bg-slate-50 pl-11`} value={email} disabled /></div>
          </Field>
          <Field label="নাম" htmlFor="s-name">
            <div className="relative"><UserRound size={19} className={iconCls} /><input id="s-name" className={`${inputClass} pl-11`} value={name} onChange={(e) => setName(e.target.value)} /></div>
          </Field>
          <Field label="ফোন" htmlFor="s-phone">
            <div className="relative"><Phone size={19} className={iconCls} /><input id="s-phone" type="tel" inputMode="tel" className={`${inputClass} pl-11`} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </Field>
          <Button type="submit" loading={saving} className="w-full">সংরক্ষণ করুন</Button>
        </form>
      </SectionCard>

      <SectionCard tone="orange" title="অ্যাকাউন্ট" icon={<LogOut size={18} />}>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-600">লগআউট করলে এই ডিভাইসের সব সংরক্ষিত তথ্য মুছে যাবে।</p>
          <Button variant="danger" onClick={logout}><LogOut size={20} /> লগআউট</Button>
        </div>
      </SectionCard>
    </div>
  );
}
