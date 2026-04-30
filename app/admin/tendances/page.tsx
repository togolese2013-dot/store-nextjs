import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TendancesManager from "@/components/admin/TendancesManager";
import AdminZonePage from "@/components/admin/AdminZonePage";
import { TrendingUp } from "lucide-react";

export const metadata = { title: "Tendances des ventes — Admin" };

export default async function TendancesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminZonePage
      title="Tendances"
      description="Analyse des tendances de ventes et produits les plus performants."
      icon={TrendingUp}
      iconClass="bg-violet-100 text-violet-700"
      maxWidth="6xl"
    >
      <TendancesManager />
    </AdminZonePage>
  );
}
