import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RapportsManager from "@/components/admin/RapportsManager";
import AdminZonePage from "@/components/admin/AdminZonePage";
import { BarChart2 } from "lucide-react";

export const metadata = { title: "Rapports — Admin" };

export default async function RapportsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminZonePage
      title="Rapports"
      description="Statistiques de ventes, tendances et performances de votre boutique."
      icon={BarChart2}
      iconClass="bg-violet-100 text-violet-700"
      maxWidth="6xl"
    >
      <RapportsManager />
    </AdminZonePage>
  );
}
