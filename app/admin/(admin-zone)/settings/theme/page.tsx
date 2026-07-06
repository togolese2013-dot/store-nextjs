import { redirect } from "next/navigation";

// Migrated into the "Thème" tab of the consolidated /admin/settings page.
export default function ThemeSettingsPage() {
  redirect("/admin/settings?tab=theme");
}
