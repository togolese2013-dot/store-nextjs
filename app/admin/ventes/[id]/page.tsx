import { apiGet } from "@/lib/api";
import { notFound } from "next/navigation";
import FactureDetailPage from "@/components/admin/FactureDetailPage";
import { adminCan } from "@/lib/admin-session";
import type { Facture } from "@/lib/admin-db";

export const dynamic = "force-dynamic";

export default async function VenteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const canAddPaiement = await adminCan("boutique", "add_paiement");
  try {
    const facture = await apiGet<Facture>(`/api/admin/ventes/factures/${id}`);
    if (!facture) return notFound();
    return <FactureDetailPage facture={facture} canAddPaiement={canAddPaiement} />;
  } catch {
    return notFound();
  }
}
