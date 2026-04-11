import { getSettings } from "@/lib/admin-db";
import GeneralSettingsForm from "@/components/admin/GeneralSettingsForm";

export const metadata = { title: "Réglages généraux" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Réglages généraux</h1>
        <p className="text-slate-500 text-sm mt-1">Nom du site, barre d'annonce, contacts WhatsApp flottants.</p>
      </div>
      <GeneralSettingsForm settings={settings} />
    </div>
  );
}
