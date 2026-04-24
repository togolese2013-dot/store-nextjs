import { apiGet } from "@/lib/api";

export default async function AnnouncementBar() {
  const settings = await apiGet<{ settings: Record<string, string> }>(
    "/api/settings/public", { noAuth: true }
  ).then(r => r.settings).catch(() => ({} as Record<string, string>));

  const text = settings.announcement_bar?.trim();
  if (!text) return null;

  // Respect enabled toggle
  if (settings.announcement_bar_enabled === "false") return null;

  const now   = new Date();
  const start = settings.announcement_bar_start ? new Date(settings.announcement_bar_start) : null;
  const end   = settings.announcement_bar_end   ? new Date(settings.announcement_bar_end)   : null;
  if (start && now < start) return null;
  if (end   && now > end)   return null;

  const bg    = settings.announcement_bar_bg    || "#14532d";
  const color = settings.announcement_bar_color || "#ffffff";

  return (
    <div
      className="text-xs font-medium py-2 px-4 text-center"
      style={{ backgroundColor: bg, color }}
    >
      {text}
    </div>
  );
}
