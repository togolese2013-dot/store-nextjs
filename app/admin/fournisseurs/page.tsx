import { listFournisseurs } from "@/lib/admin-db";
import FournisseursManager from "@/components/admin/FournisseursManager";

export const metadata = { title: "Fournisseurs" };

export default async function FournisseursPage() {
  const fournisseurs = await listFournisseurs().catch(() => []);
  return <FournisseursManager initial={fournisseurs} />;
}
