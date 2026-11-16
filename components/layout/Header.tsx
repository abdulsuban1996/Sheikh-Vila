"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { pageTitle } from "./nav";

export function Header({
  isAdmin,
  dateText,
  onMenu,
}: {
  isAdmin: boolean;
  dateText: string;
  onMenu: () => void;
}) {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-30 flex min-h-[64px] items-center gap-3 border-b border-emerald-900/30 bg-gradient-to-r from-emerald-800 to-emerald-700 px-4 shadow-md sm:px-6 lg:border-slate-100 lg:bg-none lg:bg-white lg:shadow-none">
      <button
        onClick={onMenu}
        aria-label="মেনু খুলুন"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-white hover:bg-white/10 lg:text-slate-700 lg:hover:bg-slate-100 lg:hidden"
      >
        <Menu size={24} />
      </button>
      <h1 className="flex-1 truncate text-lg font-bold text-white sm:text-xl lg:text-slate-800">
        {pageTitle(pathname)}
      </h1>
      <div className="flex items-center gap-3 text-sm text-emerald-50 lg:text-slate-600">
        <span className="flex items-center gap-2 font-medium">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 lg:bg-emerald-500" />
          <span className="hidden sm:inline">
            {isAdmin ? "অ্যাডমিন প্যানেল" : "সদস্য প্যানেল"}
          </span>
        </span>
        <span className="hidden h-5 w-px bg-slate-200 md:block" />
        <span className="hidden text-slate-500 md:inline">{dateText}</span>
      </div>
    </header>
  );
}
