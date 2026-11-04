import { requireMember } from "@/lib/auth";
import { Settings } from "lucide-react";
import { PageBanner } from "@/components/ui/PageBanner";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata = { title: "সেটিংস — শেখ ভিলা" };

export default async function SettingsPage() {
  const { profile, user } = await requireMember();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageBanner
        icon={<Settings size={28} />}
        label="সেটিংস"
        title="আমার প্রোফাইল"
        subtitle="নাম ও ফোন নম্বর বদলাতে পারবেন।"
      />
      <SettingsForm
        id={profile.id}
        name={profile.full_name}
        phone={profile.phone ?? ""}
        email={user.email ?? ""}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}
