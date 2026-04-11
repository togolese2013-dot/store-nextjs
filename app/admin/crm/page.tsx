import { getCRMStats } from "@/lib/admin-db";
import ClientsTable from "@/components/admin/ClientsTable";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Users, TrendingUp, Crown } from "lucide-react";

export const metadata = { title: "CRM — Clients" };

export default async function CRMPage() {
  let stats = { newClients30d: 0, topClients: [] as Record<string, unknown>[] };
  try { stats = await getCRMStats(); } catch { /* migration not run yet */ }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">CRM — Clients</h1>
          <p className="text-slate-400 text-sm mt-1">Historique, fiches et statistiques clients.</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Nouveaux (30j)</p>
            <p className="text-2xl font-display font-800 text-slate-900">{stats.newClients30d}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Top client</p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {stats.topClients[0]?.nom || stats.topClients[0]?.telephone || "—"}
            </p>
            {stats.topClients[0] && (
              <p className="text-xs text-slate-400">{formatPrice(Number(stats.topClients[0].total_spent))}</p>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 clients */}
      {stats.topClients.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-500" />
            <h2 className="font-bold text-slate-900 text-sm">Top 10 clients (CA total)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-5 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Commandes</th>
                <th className="px-5 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">CA total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.topClients.map((c: Record<string, unknown>, i: number) => (
                <tr key={String(c.id)} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 text-slate-400 font-semibold text-xs">{i + 1}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/crm/${c.id}`} className="hover:text-brand-800 transition-colors">
                      <p className="font-semibold text-slate-900">{String(c.nom || "Sans nom")}</p>
                      <p className="text-xs text-slate-400">{String(c.telephone)}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 hidden sm:table-cell">{String(c.total_orders)}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">{formatPrice(Number(c.total_spent))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full client list */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3">Tous les clients</h2>
        <ClientsTable />
      </div>
    </div>
  );
}
