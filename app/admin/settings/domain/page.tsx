import { getSettings } from "@/lib/admin-db";
import DomainSettingsForm from "@/components/admin/DomainSettingsForm";

export const metadata = { title: "Domaine & URL" };

export default async function DomainSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Domaine &amp; URL</h1>
        <p className="text-slate-500 text-sm mt-1">Configurez le nom de domaine et consultez les enregistrements DNS requis.</p>
      </div>
      <DomainSettingsForm settings={settings} />
    </div>
  );
}
