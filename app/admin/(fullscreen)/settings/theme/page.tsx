import { getSettings } from "@/lib/admin-db";
import ThemeSettingsForm from "@/components/admin/ThemeSettingsForm";

export const metadata = { title: "Apparence" };

export default async function ThemeSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display font-800 text-2xl text-slate-900">Apparence</h1>
        <p className="text-slate-400 text-sm mt-1">
          Personnalisez les couleurs, la police et le logo du site vitrine.
        </p>
      </div>
      <ThemeSettingsForm settings={settings} />
    </div>
  );
}
