import { AppShell } from "@/components/layout/AppShell";
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
      {children}
    </AppShell>
  );
}
