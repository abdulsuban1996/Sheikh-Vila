"use client";

import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { logout } from "@/lib/logout";

export const SESSION_FLAG = "sv_session";

/**
 * Everyone (admin included) must press "login" every time the app is opened.
 * sessionStorage disappears when the app/tab is closed, so a missing flag means
 * a fresh visit: the old session is ended and the login page is shown.
 * Until this is verified a cover hides the app, so nothing flashes on screen.
 */
export function SessionGuard() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) setOk(true);
    else void logout();
  }, []);
  if (ok) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900 text-white">
      <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-white/15">
        <Home size={30} />
      </span>
    </div>
  );
}
