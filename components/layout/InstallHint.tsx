"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
}

/** Small "add to home screen" hint (Android prompt, iOS instructions). */
export function InstallHint() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone || localStorage.getItem("sv-install-dismissed")) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);
    const h = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (hidden) return null;
  const dismiss = () => {
    localStorage.setItem("sv-install-dismissed", "1");
    setHidden(true);
  };
  return (
    <div className="no-print mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
      <Download size={20} className="shrink-0" />
      <p className="flex-1">
        {ios
          ? "শেয়ার বাটনে চেপে “Add to Home Screen” বেছে নিয়ে হোম স্ক্রিনে যোগ করুন।"
          : "অ্যাপটি হোম স্ক্রিনে যোগ করুন, দ্রুত খুলতে পারবেন।"}
      </p>
      {evt && (
        <button
          onClick={async () => {
            await evt.prompt();
            dismiss();
          }}
          className="min-h-[40px] rounded-xl bg-emerald-600 px-3 font-semibold text-white"
        >
          হোম স্ক্রিনে যোগ করুন
        </button>
      )}
      <button onClick={dismiss} aria-label="বন্ধ করুন" className="p-1">
        <X size={18} />
      </button>
    </div>
  );
}
