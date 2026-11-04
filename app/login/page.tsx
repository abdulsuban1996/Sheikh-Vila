import { Home } from "lucide-react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "লগইন — শেখ ভিলা" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-700 to-cyan-700 p-4">
      <div className="animate-rise w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900 text-white">
            <Home size={30} />
          </span>
          <h1 className="text-2xl font-bold text-slate-800">শেখ ভিলা</h1>
          <p className="text-sm text-slate-500">পারিবারিক ম্যানেজমেন্ট</p>
        </div>
        <LoginForm notApproved={error === "not_approved"} />
        <p className="mt-6 text-center text-sm text-slate-500">
          অ্যাকাউন্ট পেতে অ্যাডমিনের সাথে যোগাযোগ করুন
        </p>
      </div>
    </main>
  );
}
