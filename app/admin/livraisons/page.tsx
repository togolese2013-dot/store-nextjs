import { listLivraisonsAdmin, listLivreurs } from "@/lib/admin-db";
import type { LivraisonAdmin, Livreur } from "@/lib/admin-db";
import LivraisonsManager from "@/components/admin/LivraisonsManager";

export const dynamic = "force-dynamic";

export default async function LivraisonsPage() {
  let items:    LivraisonAdmin[] = [];
  let total     = 0;
  let livreurs: Livreur[]        = [];
  let errMsg    = "";

  try {
    const [res, liv] = await Promise.all([
      listLivraisonsAdmin({ limit: 50 }),
      listLivreurs(),
    ]);
    items    = res.items;
    total    = res.total;
    livreurs = liv;
  } catch (err) {
    errMsg = err instanceof Error ? err.message : String(err);
    console.error("[LivraisonsPage]", err);
  }

  if (errMsg) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          <p className="font-bold mb-2">Erreur lors du chargement</p>
          <code className="text-xs font-mono bg-red-100 px-2 py-1 rounded">{errMsg}</code>
        </div>
      </div>
    );
  }

  return (
    <LivraisonsManager
      initialLivraisons={items}
      initialTotal={total}
      initialLivreurs={livreurs}
    />
  );
}
