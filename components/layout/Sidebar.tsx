"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, X } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { logout } from "@/lib/logout";

export function Sidebar({
  isAdmin,
  onNavigate,
  onClose,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-emerald-900 text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <Home size={22} />
        </span>
        <div className="flex-1 leading-tight">
          <p className="text-lg font-bold">শেখ ভিলা</p>
          <p className="text-xs text-emerald-200">পারিবারিক ম্যানেজমেন্ট</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="মেনু বন্ধ করুন" className="rounded-lg p-2 hover:bg-white/10">
            <X size={22} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.filter((n) => !n.adminOnly || isAdmin).map((n) => {
          const active = pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[46px] items-center gap-3 rounded-xl px-4 py-2.5 text-base font-medium transition ${
                active ? "bg-black/25" : "text-emerald-50/90 hover:bg-white/10"
              }`}
            >
              <Icon size={20} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-4 py-2.5 text-base font-medium text-emerald-50/90 hover:bg-white/10"
        >
          <LogOut size={20} />
          লগআউট
        </button>
      </div>
    </div>
  );
}
