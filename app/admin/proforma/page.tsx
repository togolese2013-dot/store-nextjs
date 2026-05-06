import { apiGet } from "@/lib/api";
import ProformaManager from "@/components/admin/ProformaManager";
import type { Devis } from "@/lib/admin-db";

export const metadata = { title: "Proforma" };
export const dynamic  = "force-dynamic";

export default async function ProformaPage() {
  try {
    const res = await apiGet<{ items: Devis[]; total: number }>("/api/admin/ventes/devis?limit=25");
    return <ProformaManager initialDevis={res.items} initialTotal={res.total} />;
  } catch {
    return <ProformaManager initialDevis={[]} initialTotal={0} />;
  }
}
