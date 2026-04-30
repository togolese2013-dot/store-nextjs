import { getSettings } from "@/lib/admin-db";
import DomainSettingsForm from "@/components/admin/DomainSettingsForm";
import AdminZonePage from "@/components/admin/AdminZonePage";
import { Globe } from "lucide-react";

export const metadata = { title: "Domaine & URL" };

export default async function DomainSettingsPage() {
  const settings = await getSettings();
  return (
    <AdminZonePage
      title="Domaine & URL"
      description="Configurez le nom de domaine, les redirections et consultez les enregistrements DNS."
      icon={Globe}
      iconClass="bg-sky-100 text-sky-700"
      maxWidth="3xl"
    >
      <DomainSettingsForm settings={settings} />
    </AdminZonePage>
  );
}
