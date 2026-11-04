"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Bottom sheet on phones, centered dialog on larger screens. Rendered in a portal. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;
  return createPortal(
    <div
      className="animate-fade no-print fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-600 px-5 py-4 text-white">
          {icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{title}</h2>
            {subtitle && <p className="truncate text-sm text-emerald-50">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25"
          >
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
