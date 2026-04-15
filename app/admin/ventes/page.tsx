import { listFactures, listLivraisons, getVentesStats } from "@/lib/admin-db";
import VentesManager from "@/components/admin/VentesManager";

export const metadata = { title: "Ventes" };

export default async function VentesPage() {
  let factures:   Awaited<ReturnType<typeof listFactures>>["items"]   = [];
  let livraisons: Awaited<ReturnType<typeof listLivraisons>>["items"] = [];
  let stats      = { factures: 0, livraisons: 0 };
  let totals     = { factures: 0, livraisons: 0 };
  let migrationNeeded = false;

  try {
    const [f, l, s] = await Promise.all([
      listFactures({ limit: 50 }),
      listLivraisons({ limit: 50 }),
      getVentesStats(),
    ]);
    factures   = f.items;
    livraisons = l.items;
    stats      = s;
    totals     = { factures: f.total, livraisons: l.total };
  } catch {
    migrationNeeded = true;
  }

  if (migrationNeeded) {
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

  return (
    <VentesManager
      initialFactures={factures}
      initialLivraisons={livraisons}
      initialStats={stats}
      totalFactures={totals.factures}
      totalLivraisons={totals.livraisons}
    />
  );
}
