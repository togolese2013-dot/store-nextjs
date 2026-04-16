import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BoutiqueClientsManager from "@/components/admin/BoutiqueClientsManager";

export default async function BoutiqueClientsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <BoutiqueClientsManager />;
}
