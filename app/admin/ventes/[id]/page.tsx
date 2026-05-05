import { apiGet } from "@/lib/api";
import { notFound } from "next/navigation";
import FactureDetailPage from "@/components/admin/FactureDetailPage";
import type { Facture } from "@/lib/admin-db";

export const dynamic = "force-dynamic";

export default async function VenteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const facture = await apiGet<Facture>(`/api/admin/ventes/factures/${id}`);
    if (!facture) return notFound();
    return <FactureDetailPage facture={facture} />;
  } catch {
    return notFound();
  }
}
