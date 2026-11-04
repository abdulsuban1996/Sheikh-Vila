"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, inputClass } from "@/components/ui/Button";
import { Field } from "@/components/ui/Modal";
import { toBn } from "@/lib/bn";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

export function LoginForm({ notApproved }: { notApproved: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    notApproved ? "আপনার অ্যাকাউন্টের অ্যাক্সেস নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।" : "",
  );
  const [loading, setLoading] = useState(false);
  const [fails, setFails] = useState(0);
  const [lock, setLock] = useState(0);

  useEffect(() => {
    if (lock <= 0) return;
    const t = setTimeout(() => setLock((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [lock]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lock > 0 || loading) return;
    setError("");
    if (!email.trim() || !password) {
      setError("ইমেইল ও পাসওয়ার্ড দিন");
      return;
    }
    if (!navigator.onLine) {
      setError("ইন্টারনেট নেই, অনুগ্রহ করে সংযোগ চেক করুন");
      return;
    }
    setLoading(true);
    const { error: err } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setLoading(false);
      const n = fails + 1;
      setFails(n);
      setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়");
      if (n >= MAX_ATTEMPTS) {
        setLock(LOCK_SECONDS);
        setFails(0);
      }
      return;
    }
    // full navigation so middleware re-checks approval with fresh cookies
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {lock > 0 && (
        <p role="alert" className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
          অনেকবার ভুল হয়েছে। {toBn(lock)} সেকেন্ড পর আবার চেষ্টা করুন।
        </p>
      )}
      <Field label="ইমেইল" htmlFor="email">
        <input id="email" type="email" autoComplete="username" inputMode="email" className={inputClass}
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field label="পাসওয়ার্ড" htmlFor="password">
        <input id="password" type="password" autoComplete="current-password" className={inputClass}
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Button type="submit" loading={loading} disabled={lock > 0} className="w-full">
        লগইন করুন
      </Button>
    </form>
  );
}
