import { getCRMStats } from "@/lib/admin-db";
import ClientsTable from "@/components/admin/ClientsTable";
import PageHeader from "@/components/admin/PageHeader";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Users, TrendingUp, Crown } from "lucide-react";

export const metadata = { title: "CRM — Clients" };

export default async function CRMPage() {
  let stats = { newClients30d: 0, topClients: [] as Record<string, unknown>[] };
  try { stats = await getCRMStats(); } catch { /* migration not run yet */ }

  return (
    <div className="space-y-6">

      <PageHeader
        title="CRM — Clients"
        subtitle="Historique, fiches et statistiques clients."
        accent="indigo"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight">Nouveaux (30j)</p>
            <Users className="w-8 h-8 text-indigo-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.newClients30d}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight">Top client</p>
            <Crown className="w-8 h-8 text-amber-500 opacity-20" />
          </div>
          <p className="text-lg font-bold text-slate-900 truncate">
            {String(stats.topClients[0]?.nom || stats.topClients[0]?.telephone || "—")}
          </p>
          {stats.topClients[0] && (
            <div className="mt-3">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                {formatPrice(Number(stats.topClients[0].total_spent))} FCFA
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 clients */}
      {stats.topClients.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-slate-900 text-sm">Top 10 clients (CA total)</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Commandes</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">CA total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.topClients.map((c: Record<string, unknown>, i: number) => (
                <tr key={String(c.id)} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4 text-slate-400 font-semibold text-xs">{i + 1}</td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/crm/${c.id}`} className="hover:text-indigo-700 transition-colors">
                      <p className="font-semibold text-slate-900">{String(c.nom || "Sans nom")}</p>
                      <p className="text-xs text-slate-400">{String(c.telephone)}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600 hidden sm:table-cell">{String(c.total_orders)}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-900">{formatPrice(Number(c.total_spent))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
