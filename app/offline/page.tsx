import { WifiOff } from "lucide-react";

export const metadata = { title: "ইন্টারনেট নেই" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-700 to-cyan-700 p-6">
      <div className="animate-rise max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <WifiOff size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-800">ইন্টারনেট নেই</h1>
        <p className="mt-2 text-slate-600">
          ইন্টারনেট নেই, অনুগ্রহ করে সংযোগ চেক করুন
        </p>
      </div>
    </main>
  );
}
