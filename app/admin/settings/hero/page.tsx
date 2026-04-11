import { getSettings } from "@/lib/admin-db";
import HeroSettingsForm from "@/components/admin/HeroSettingsForm";

export const metadata = { title: "Hero & Bannières" };

export default async function HeroSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Hero & Bannières</h1>
        <p className="text-slate-400 text-sm mt-1">
          Modifiez les slides du carousel hero : titre, sous-titre, bouton CTA et image.
        </p>
      </div>
      <HeroSettingsForm settings={settings} />
    </div>
  );
}
