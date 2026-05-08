import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BoutiqueStatsManager from "@/components/admin/BoutiqueStatsManager";
import { BarChart2 } from "lucide-react";
import AdminZonePage from "@/components/admin/AdminZonePage";

export const metadata = { title: "Statistiques Boutique — Admin" };

export default async function BoutiqueStatsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminZonePage
      title="Statistiques"
      description="Rapports, tendances de ventes et performances produits de la boutique."
      icon={BarChart2}
      iconClass="bg-amber-100 text-amber-700"
      maxWidth="6xl"
    >
      <BoutiqueStatsManager />
    </AdminZonePage>
  );
}
