import { getSettings } from "@/lib/admin-db";
import HeroSettingsForm from "@/components/admin/HeroSettingsForm";

export const metadata = { title: "Hero & Bannière" };

export default async function HeroSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Hero & Bannière</h1>
        <p className="text-slate-400 text-sm mt-1">
          Gérez les slides du carousel hero (ajout, modification, suppression) et la barre d'annonce.
        </p>
      </div>
      <HeroSettingsForm settings={settings} />
    </div>
  );
}
