import { apiGet } from "@/lib/api";
import type { LivraisonAdmin, Livreur } from "@/lib/admin-db";
import LivraisonsManager from "@/components/admin/LivraisonsManagerClient";

export const dynamic = "force-dynamic";

export default async function LivraisonsPage() {
  let items:    LivraisonAdmin[] = [];
  let total     = 0;
  let livreurs: Livreur[]        = [];
  let livStats  = { total: 0, en_attente: 0, en_cours: 0, livre: 0 };

  await Promise.allSettled([
    apiGet<{ items: LivraisonAdmin[]; total: number; stats: typeof livStats }>("/api/admin/livraisons?limit=50")
      .then(r => { items = r.items; total = r.total; livStats = r.stats; }),
    apiGet<{ items: Livreur[] }>("/api/admin/livreurs")
      .then(r => { livreurs = r.items; }),
  ]);

  return (
    <LivraisonsManager
      initialLivraisons={items}
      initialTotal={total}
      initialLivreurs={livreurs}
      initialStats={livStats}
    />
  );
}
