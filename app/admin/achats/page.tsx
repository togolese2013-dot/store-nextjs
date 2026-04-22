import { listAchats, countAchats, getAchatStats } from "@/lib/admin-db";
import { apiGet } from "@/lib/api";
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

  const [achats, total, stats, fournisseursRes] = await Promise.all([
    listAchats(limit, offset).catch(() => []),
    countAchats().catch(() => 0),
    getAchatStats().catch(() => ({ total: 0, en_attente: 0, recu: 0, montant_total: 0 })),
    apiGet<{ fournisseurs: Fournisseur[] }>("/api/admin/fournisseurs").catch(() => ({ fournisseurs: [] })),
  ]);
  const fournisseurs = fournisseursRes.fournisseurs;

  return (
    <AchatsManager
      initialAchats={achats}
      total={total}
      stats={stats}
      fournisseurs={fournisseurs}
      page={page}
      limit={limit}
    />
  );
}
