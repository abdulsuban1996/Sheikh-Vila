import { AppShell } from "@/components/layout/AppShell";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { requireMember } from "@/lib/auth";
import { formatDateBn } from "@/lib/bn";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireMember();
  return (
    <AppShell isAdmin={profile.role === "admin"} dateText={formatDateBn(new Date())}>
      <SessionGuard />
      {children}
    </AppShell>
  );
}
