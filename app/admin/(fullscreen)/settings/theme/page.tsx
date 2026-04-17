import { getSettings } from "@/lib/admin-db";
import ThemeSettingsForm from "@/components/admin/ThemeSettingsForm";

export const metadata = { title: "Apparence" };

export default async function ThemeSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Apparence</h1>
        <p className="text-slate-500 text-sm mt-1">Personnalisez les couleurs et la police du site.</p>
      </div>
      <ThemeSettingsForm settings={settings} />
    </div>
  );
}
