"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type Kind = "success" | "error";
interface ToastItem {
  id: number;
  kind: Kind;
  text: string;
  action?: ToastAction;
}
export interface ToastAction {
  label: string;
  onClick: () => void;
}
const Ctx = createContext<(text: string, kind?: Kind, action?: ToastAction) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((text: string, kind: Kind = "success", action?: ToastAction) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, kind, text, action }]);
    // toasts with an Undo button stay a little longer
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), action ? 7000 : 4000);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg ${
              t.kind === "success" ? "bg-emerald-700" : "bg-red-600"
            }`}
          >
            {t.kind === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="flex-1 text-[15px] font-medium">{t.text}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  setItems((l) => l.filter((x) => x.id !== t.id));
                }}
                className="min-h-[36px] rounded-lg bg-white/20 px-3 text-sm font-bold hover:bg-white/30"
              >
                {t.action.label}
              </button>
            )}
            <button
              aria-label="বন্ধ করুন"
              onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
