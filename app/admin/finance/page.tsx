import { apiGet } from "@/lib/api";
import FinanceManager from "@/components/admin/FinanceManager";

export const metadata = { title: "Finance" };
export const dynamic  = "force-dynamic";

export default async function FinancePage() {
  try {
    const { items, total, stats } = await apiGet<{
      items: Parameters<typeof FinanceManager>[0]["initialItems"];
      total: number;
      stats: Parameters<typeof FinanceManager>[0]["initialStats"];
    }>("/api/admin/finance?limit=200");

    return (
      <FinanceManager
        initialItems={items}
        initialStats={stats}
        initialTotal={total}
      />
    );
  } catch (err) {
    return (
      <div className="space-y-4 max-w-xl">
        <h1 className="font-display font-800 text-2xl text-slate-900">Finances</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          <p className="font-bold mb-2">Erreur de chargement</p>
          <code className="block bg-red-100 text-red-900 px-4 py-2 rounded-xl font-mono text-xs whitespace-pre-wrap">
            {err instanceof Error ? err.message : String(err)}
          </code>
        </div>
      </div>
    );
  }
}
