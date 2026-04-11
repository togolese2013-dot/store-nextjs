import { listEntrepots } from "@/lib/admin-db";
import EntrepotsManager from "@/components/admin/EntrepotsManager";

export const metadata = { title: "Entrepôts & Stocks" };

export default async function EntrepotsPage() {
  let entrepots: Awaited<ReturnType<typeof listEntrepots>> = [];
  let migrationNeeded = false;
  try {
    entrepots = await listEntrepots();
  } catch {
    migrationNeeded = true;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Entrepôts & Points de vente</h1>
        <p className="text-slate-400 text-sm mt-1">
          Gérez vos entrepôts. Chaque produit peut avoir un stock distinct par entrepôt.
        </p>
      </div>
      {migrationNeeded ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700">
          <p className="font-bold mb-1">Migration requise</p>
          <p className="text-sm">Exécutez <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">scripts/features-migration.sql</code> sur votre base de données pour activer les entrepôts.</p>
        </div>
      ) : (
        <EntrepotsManager initialEntrepots={entrepots} />
      )}
    </div>
  );
}
