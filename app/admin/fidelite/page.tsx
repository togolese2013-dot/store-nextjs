import { getLoyaltyStats, listLoyaltyClients } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";
import FideliteManager from "@/components/admin/FideliteManager";
import { Gift, Users, TrendingUp, TrendingDown } from "lucide-react";

export const metadata = { title: "Fidélité clients" };

export default async function FidelitePage() {
  const [stats, clients] = await Promise.all([
    getLoyaltyStats(),
    listLoyaltyClients(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fidélité clients"
        subtitle="Points, historique et ajustements manuels."
        accent="indigo"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Clients fidélité</p>
            <Users className="w-8 h-8 text-indigo-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.nb_clients}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Points distribués</p>
            <TrendingUp className="w-8 h-8 text-emerald-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total_distribues.toLocaleString("fr-FR")}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Points échangés</p>
            <TrendingDown className="w-8 h-8 text-amber-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total_echanges.toLocaleString("fr-FR")}</p>
        </div>
      </div>

      {/* Interactive table */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <Gift className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucun client dans le programme fidélité</p>
        </div>
      ) : (
        <FideliteManager clients={clients} />
      )}
    </div>
  );
}
