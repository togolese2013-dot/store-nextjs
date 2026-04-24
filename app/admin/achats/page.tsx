import { listAchats, countAchats, getAchatStats } from "@/lib/admin-db";
import { apiGet } from "@/lib/api";
import { getProducts } from "@/lib/db";
import type { Fournisseur } from "@/lib/admin-db";
import AchatsManager from "@/components/admin/AchatsManager";

export const metadata = { title: "Achats fournisseurs" };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AchatsPage({ searchParams }: PageProps) {
  const sp     = await searchParams;
  const page   = Math.max(1, Number(sp.page) || 1);
  const limit  = 20;
  const offset = (page - 1) * limit;

  const [achats, total, stats, fournisseursRes, allProducts] = await Promise.all([
    listAchats(limit, offset).catch(() => []),
    countAchats().catch(() => 0),
    getAchatStats().catch(() => ({ total: 0, en_attente: 0, recu: 0, montant_total: 0 })),
    apiGet<{ fournisseurs: Fournisseur[] }>("/api/admin/fournisseurs").catch(() => ({ fournisseurs: [] })),
    getProducts({ limit: 200, includeInactive: true }).catch(() => []),
  ]);
  const fournisseurs = fournisseursRes.fournisseurs;
  // Sort alphabetically so the search dropdown shows products by name
  const products = allProducts
    .map(p => ({ id: p.id, nom: p.nom, reference: p.reference, prix_unitaire: p.prix_unitaire, stock_magasin: p.stock_magasin, stock_boutique: p.stock_boutique }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <AchatsManager
      initialAchats={achats}
      total={total}
      stats={stats}
      fournisseurs={fournisseurs}
      products={products}
      page={page}
      limit={limit}
    />
  );
}
