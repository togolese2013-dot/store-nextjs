import { getSettings } from "@/lib/admin-db";
import GeneralSettingsForm from "@/components/admin/GeneralSettingsForm";
import AdminZonePage from "@/components/admin/AdminZonePage";
import BackupManager from "@/components/admin/BackupManager";
import { Settings } from "lucide-react";

export const metadata = { title: "Réglages généraux" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <AdminZonePage
      title="Réglages généraux"
      description="Nom du site, barre d'annonce et contacts WhatsApp flottants."
      icon={Settings}
      iconClass="bg-slate-100 text-slate-700"
      maxWidth="3xl"
    >
      <GeneralSettingsForm settings={settings} />

      <hr className="my-8 border-slate-200" />

      <BackupManager />
    </AdminZonePage>
  );
}
