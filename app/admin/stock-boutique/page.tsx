import {
  getStockBoutiqueStats,
  getStockBoutiqueList,
  getRecentBoutiqueMovements,
} from "@/lib/admin-db";
import StockBoutiqueManager from "@/components/admin/StockBoutiqueManager";

export const metadata = { title: "Stock Boutique" };

export default async function StockBoutiquePage() {
  let stats        = { total_produits: 0, valeur_boutique: 0, stock_faible: 0, epuises: 0 };
  let items:       Awaited<ReturnType<typeof getStockBoutiqueList>>["items"] = [];
  let total        = 0;
  let movements:   Awaited<ReturnType<typeof getRecentBoutiqueMovements>> = [];
  let migrationNeeded = false;

  try {
    [{ items, total }, stats, movements] = await Promise.all([
      getStockBoutiqueList({ limit: 50, offset: 0 }),
      getStockBoutiqueStats(),
      getRecentBoutiqueMovements(20),
    ]);
  } catch {
    migrationNeeded = true;
  }

  if (migrationNeeded) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Stock Boutique</h1>
          <p className="text-slate-400 text-sm mt-1">Suivi des quantités disponibles à la vente</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700">
          <p className="font-bold mb-2">Migration requise</p>
          <p className="text-sm mb-3">
            Exécutez le script suivant sur votre base MySQL pour activer le Stock Boutique :
          </p>
          <code className="block bg-amber-100 text-amber-900 px-4 py-2 rounded-xl font-mono text-xs">
            scripts/stock-boutique-migration.sql
          </code>
        </div>
      </div>
    );
  }

  return (
    <StockBoutiqueManager
      initialStats={stats}
      initialItems={items}
      initialTotal={total}
      initialMovements={movements}
    />
  );
}
