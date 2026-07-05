import { getSettings } from "@/lib/admin-db";
import SettingsTabs from "@/components/admin/SettingsTabs";

export const metadata = { title: "Réglages" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsTabs settings={settings} />;
}
