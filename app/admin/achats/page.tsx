import { listAchats, countAchats, getAchatStats, listFournisseurs } from "@/lib/admin-db";
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

  const [achats, total, stats, fournisseurs] = await Promise.all([
    listAchats(limit, offset),
    countAchats(),
    getAchatStats(),
    listFournisseurs(),
  ]);

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
