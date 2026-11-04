"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "./nav";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="প্রধান মেনু"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {BOTTOM_NAV.map((n) => {
          const active = pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                  active ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                <span className={`rounded-full px-4 py-1 ${active ? "bg-emerald-100" : ""}`}>
                  <Icon size={22} />
                </span>
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
