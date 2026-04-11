import { getSettings } from "@/lib/admin-db";
import { unstable_noStore as noStore } from "next/cache";

export default async function AnnouncementBar() {
  noStore(); // always fetch fresh settings
  const settings = await getSettings();

  const text  = settings.announcement_bar?.trim();
  if (!text) return null;

  const now   = new Date();
  const start = settings.announcement_bar_start ? new Date(settings.announcement_bar_start) : null;
  const end   = settings.announcement_bar_end   ? new Date(settings.announcement_bar_end)   : null;

  if (start && now < start) return null;
  if (end   && now > end)   return null;

  return (
    <div className="bg-brand-900 text-white text-xs font-medium py-2 px-4 text-center">
      {text}
    </div>
  );
}
