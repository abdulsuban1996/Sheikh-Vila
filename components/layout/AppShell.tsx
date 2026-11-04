"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { InstallHint } from "./InstallHint";

export function AppShell({
  isAdmin,
  dateText,
  children,
}: {
  isAdmin: boolean;
  dateText: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="no-print hidden h-full w-64 shrink-0 lg:block">
        <Sidebar isAdmin={isAdmin} />
      </aside>

      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="animate-drawer absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <Sidebar isAdmin={isAdmin} onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header isAdmin={isAdmin} dateText={dateText} onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 pb-28 sm:p-6 lg:pb-8">
          <div className="mx-auto max-w-6xl">
            <InstallHint />
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
