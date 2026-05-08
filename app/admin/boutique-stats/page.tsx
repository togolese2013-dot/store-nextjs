import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BoutiqueStatsManager from "@/components/admin/BoutiqueStatsManager";

export const metadata = { title: "Statistiques — Boutique" };

export default async function BoutiqueStatsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <BoutiqueStatsManager />;
}
