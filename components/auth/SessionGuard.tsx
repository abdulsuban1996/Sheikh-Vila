"use client";

import { useEffect } from "react";
import { logout } from "@/lib/logout";

export const SESSION_FLAG = "sv_session";

/**
 * Non-admin members must log in every time they open the app.
 * sessionStorage disappears when the app/tab is closed, so a missing flag
 * means this is a fresh visit and the old session is ended.
 */
export function SessionGuard({ isAdmin }: { isAdmin: boolean }) {
  useEffect(() => {
    if (isAdmin) return;
    if (!sessionStorage.getItem(SESSION_FLAG)) void logout();
  }, [isAdmin]);
  return null;
}
