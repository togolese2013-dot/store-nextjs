import { listReferrals } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";
import { Link2, Users } from "lucide-react";

export const metadata = { title: "Parrainage" };

export default async function ParrainagePage() {
  let referrals: Awaited<ReturnType<typeof listReferrals>> = [];
  try { referrals = await listReferrals(); } catch { /* table may not exist */ }

  const totalUses   = referrals.reduce((s, r) => s + r.uses_count, 0);
  const activeCount = referrals.filter(r => r.uses_count > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parrainage"
        subtitle="Codes de parrainage générés par vos clients."
        accent="indigo"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Codes créés</p>
            <Link2 className="w-8 h-8 text-indigo-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{referrals.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Codes utilisés</p>
            <Users className="w-8 h-8 text-emerald-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total filleuls</p>
            <Users className="w-8 h-8 text-amber-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalUses}</p>
        </div>
      </div>

      {/* Table */}
      {referrals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <Link2 className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucun code de parrainage</p>
          <p className="text-sm mt-1">Les codes sont générés automatiquement lors de l'inscription.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-slate-900 text-sm">Tous les codes</h2>
            <span className="ml-auto text-xs text-slate-400">{referrals.length} codes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Parrain</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Code</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Filleuls</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{r.nom || "—"}</p>
                      <p className="text-xs text-slate-400">{r.telephone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <code className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wider">
                        {r.code}
                      </code>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.uses_count > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          {r.uses_count} filleul{r.uses_count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400 text-xs hidden sm:table-cell">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
