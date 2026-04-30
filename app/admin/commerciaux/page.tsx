import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommerciauxManager from "@/components/admin/CommerciauxManager";

export const metadata = { title: "Commerciaux — Boutique" };
export const dynamic  = "force-dynamic";

export default async function CommerciauxPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <CommerciauxManager />;
}
