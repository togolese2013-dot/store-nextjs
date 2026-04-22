import { apiGet } from "@/lib/api";
import VentesManager from "@/components/admin/VentesManager";

export const metadata = { title: "Ventes" };
export const dynamic  = "force-dynamic";

export default async function VentesPage() {
  try {
    const [facturesRes, livraisonsRes, stats] = await Promise.all([
      apiGet<{ items: unknown[]; total: number }>("/api/admin/ventes/factures?limit=50"),
      apiGet<{ items: unknown[]; total: number }>("/api/admin/ventes/livraisons?limit=50"),
      apiGet<{ items: unknown[]; total: number; stats: { factures: number; livraisons: number; ca_total: number; factures_payees: number } }>(
        "/api/admin/ventes/factures?limit=1"
      ).then(r => r.stats),
    ]);

    return (
      <VentesManager
        initialFactures={facturesRes.items as Parameters<typeof VentesManager>[0]["initialFactures"]}
        initialLivraisons={livraisonsRes.items as Parameters<typeof VentesManager>[0]["initialLivraisons"]}
        initialStats={stats}
        totalFactures={facturesRes.total}
        totalLivraisons={livraisonsRes.total}
      />
    );
  } catch {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Gestion des ventes</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez factures, devis et livraisons</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700">
          <p className="font-bold mb-2">Migration requise</p>
          <p className="text-sm mb-3">Exécutez le script suivant sur votre base MySQL :</p>
          <code className="block bg-amber-100 text-amber-900 px-4 py-2 rounded-xl font-mono text-xs">
            scripts/ventes-migration.sql
          </code>
        </div>
      </div>
    );
  }
}
