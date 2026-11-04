"use client";

import { useState, useTransition } from "react";
import { KeyRound, Phone, Plus, UserPlus, Users, Mail, Lock, UserRound } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, inputClass } from "@/components/ui/Button";
import { Modal, Field } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { addMember, resetPassword, setAccess } from "@/app/(app)/members/actions";
import { toBn } from "@/lib/bn";
import type { Profile } from "@/lib/types";

const iconCls = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

export function MembersClient({ members, meId }: { members: Profile[]; meId: string }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [resetFor, setResetFor] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [newPass, setNewPass] = useState("");

  const online = () => {
    if (navigator.onLine) return true;
    toast("ইন্টারনেট নেই, সংযোগ ছাড়া এটি করা যাবে না", "error");
    return false;
  };

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!online()) return;
    start(async () => {
      const r = await addMember(form);
      if (!r.ok) return toast(r.error, "error");
      toast("নতুন সদস্য যোগ হয়েছে");
      setForm({ name: "", phone: "", email: "", password: "" });
      setAddOpen(false);
    });
  }

  function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetFor || !online()) return;
    start(async () => {
      const r = await resetPassword(resetFor.id, newPass);
      if (!r.ok) return toast(r.error, "error");
      toast("পাসওয়ার্ড পরিবর্তন হয়েছে");
      setNewPass("");
      setResetFor(null);
    });
  }

  function toggle(m: Profile) {
    if (!online()) return;
    start(async () => {
      const r = await setAccess(m.id, !m.is_active);
      if (!r.ok) return toast(r.error, "error");
      toast(!m.is_active ? "অ্যাক্সেস চালু হয়েছে" : "অ্যাক্সেস বন্ধ করা হয়েছে");
    });
  }

  return (
    <>
      <SectionCard
        tone="purple"
        title={`সদস্য তালিকা (${toBn(members.length)} জন)`}
        icon={<Users size={18} />}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-semibold text-purple-700 shadow-sm hover:bg-purple-50"
          >
            <UserPlus size={18} /> <span className="hidden sm:inline">নতুন সদস্য যোগ করুন</span>
            <span className="sm:hidden">যোগ</span>
          </button>
        }
      >
        {members.length === 0 ? (
          <EmptyState text="কোনো সদস্য নেই" icon={<Users size={48} />} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-lg font-bold text-white">
                    {m.full_name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {m.full_name} {m.id === meId && <span className="text-sm text-slate-400">(আমি)</span>}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-slate-500">
                      <Phone size={14} /> {m.phone ? toBn(m.phone) : "—"}
                    </p>
                  </div>
                  <Badge tone={m.role === "admin" ? "purple" : "blue"}>{m.role === "admin" ? "অ্যাডমিন" : "সদস্য"}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    role="switch"
                    aria-checked={m.is_active}
                    disabled={pending || m.id === meId}
                    onClick={() => toggle(m)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold disabled:opacity-60 ${
                      m.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span className={`relative h-6 w-11 rounded-full transition ${m.is_active ? "bg-emerald-500" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${m.is_active ? "left-[22px]" : "left-0.5"}`} />
                    </span>
                    {m.is_active ? "অ্যাক্সেস আছে" : "বন্ধ"}
                  </button>
                  <Button variant="secondary" onClick={() => setResetFor(m)} className="!px-3">
                    <KeyRound size={18} /> পাসওয়ার্ড রিসেট
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="নতুন সদস্য যোগ করুন"
        subtitle="অ্যাকাউন্ট তৈরি হলে সাথে সাথে অ্যাক্সেস পাবে"
        icon={<UserPlus size={22} />}
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>বাতিল</Button>
            <Button type="submit" form="add-member-form" loading={pending} className="flex-[2]"><Plus size={18} /> যোগ করুন</Button>
          </div>
        }
      >
        <form id="add-member-form" onSubmit={submitAdd} className="space-y-4">
          <Field label="নাম" htmlFor="m-name"><div className="relative"><UserRound size={19} className={iconCls} /><input id="m-name" required className={`${inputClass} pl-11`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div></Field>
          <Field label="ফোন" htmlFor="m-phone"><div className="relative"><Phone size={19} className={iconCls} /><input id="m-phone" type="tel" inputMode="tel" className={`${inputClass} pl-11`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></Field>
          <Field label="ইমেইল" htmlFor="m-email"><div className="relative"><Mail size={19} className={iconCls} /><input id="m-email" type="email" required className={`${inputClass} pl-11`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></Field>
          <Field label="পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" htmlFor="m-pass"><div className="relative"><Lock size={19} className={iconCls} /><input id="m-pass" type="text" minLength={8} required autoComplete="off" className={`${inputClass} pl-11`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div></Field>
        </form>
      </Modal>

      <Modal
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title="পাসওয়ার্ড রিসেট"
        subtitle={resetFor?.full_name}
        icon={<KeyRound size={22} />}
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setResetFor(null)}>বাতিল</Button>
            <Button type="submit" form="reset-form" loading={pending} className="flex-[2]">পরিবর্তন করুন</Button>
          </div>
        }
      >
        <form id="reset-form" onSubmit={submitReset} className="space-y-4">
          <Field label="নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" htmlFor="r-pass">
            <div className="relative"><Lock size={19} className={iconCls} /><input id="r-pass" type="text" minLength={8} required autoComplete="off" className={`${inputClass} pl-11`} value={newPass} onChange={(e) => setNewPass(e.target.value)} /></div>
          </Field>
        </form>
      </Modal>
    </>
  );
}
