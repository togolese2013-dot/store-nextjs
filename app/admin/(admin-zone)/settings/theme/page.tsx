import { getSettings } from "@/lib/admin-db";
import ThemeSettingsForm from "@/components/admin/ThemeSettingsForm";
import AdminZonePage from "@/components/admin/AdminZonePage";
import { Palette } from "lucide-react";

export const metadata = { title: "Apparence" };

export default async function ThemeSettingsPage() {
  const settings = await getSettings();
  return (
    <AdminZonePage
      title="Apparence"
      description="Personnalisez les couleurs, la police et le logo du site vitrine."
      icon={Palette}
      iconClass="bg-pink-100 text-pink-700"
      maxWidth="6xl"
    >
      <ThemeSettingsForm settings={settings} />
    </AdminZonePage>
  );
}
