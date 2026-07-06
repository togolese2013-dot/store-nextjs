import { getSettings } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/auth";
import SettingsTabs from "@/components/admin/SettingsTabs";

export const metadata = { title: "Réglages" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [session, { tab }] = await Promise.all([getAdminSession(), searchParams]);
  const settings = await getSettings(session?.shop_id ?? 1);
  const initialTab = tab === "theme" || tab === "boutique" ? tab : "site";
  return <SettingsTabs settings={settings} initialTab={initialTab} />;
}
