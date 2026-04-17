import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TendancesManager from "@/components/admin/TendancesManager";

export const metadata = { title: "Tendances des ventes — Admin" };

export default async function TendancesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <TendancesManager />;
}
