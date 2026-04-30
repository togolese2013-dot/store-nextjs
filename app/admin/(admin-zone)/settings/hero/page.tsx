import { getSettings } from "@/lib/admin-db";
import HeroSettingsForm from "@/components/admin/HeroSettingsForm";
import AdminZonePage from "@/components/admin/AdminZonePage";
import { Megaphone } from "lucide-react";

export const metadata = { title: "Hero & Bannière" };

export default async function HeroSettingsPage() {
  const settings = await getSettings();
  return (
    <AdminZonePage
      title="Hero & Bannière"
      description="Gérez les slides du carousel hero, les images, les CTA et la barre d'annonce."
      icon={Megaphone}
      iconClass="bg-brand-100 text-brand-700"
      maxWidth="5xl"
    >
      <HeroSettingsForm settings={settings} />
    </AdminZonePage>
  );
}
