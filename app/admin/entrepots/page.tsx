import { redirect } from "next/navigation";
import { adminCan } from "@/lib/admin-session";
import EntrepotsManager from "@/components/admin/EntrepotsManager";

export const metadata = { title: "Produits externes" };

export default async function EntrepotsPage() {
  const can = await adminCan("magasin", "entrepots");
  if (!can) redirect("/admin");
  return <EntrepotsManager />;
}
