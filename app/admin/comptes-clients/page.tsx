import { listSiteClients } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";
import { UserCheck, Chrome, Lock, ShieldCheck } from "lucide-react";

export const metadata = { title: "Comptes clients" };

export default async function ComptesClientsPage() {
  let clients: Awaited<ReturnType<typeof listSiteClients>> = [];
  try { clients = await listSiteClients(); } catch { /* columns may not exist */ }

  const viaGoogle   = clients.filter(c => c.via_google).length;
  const viaPassword = clients.filter(c => c.via_password && !c.via_google).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes clients"
        subtitle="Clients inscrits sur le store (email/téléphone ou Google)."
        accent="indigo"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total comptes</p>
            <UserCheck className="w-8 h-8 text-indigo-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{clients.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Via Google</p>
            <Chrome className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{viaGoogle}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Via mot de passe</p>
            <Lock className="w-8 h-8 text-emerald-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{viaPassword}</p>
        </div>
      </div>

      {/* Table */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <UserCheck className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucun compte client enregistré</p>
          <p className="text-sm mt-1">Les comptes créés via le store apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-slate-900 text-sm">Comptes inscrits</h2>
            <span className="ml-auto text-xs text-slate-400">{clients.length} compte{clients.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Méthode</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Statut</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{c.nom || "Sans nom"}</p>
                      <p className="text-xs text-slate-400">#{c.id}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      {c.email && <p className="text-slate-700 text-xs">{c.email}</p>}
                      {c.telephone && <p className="text-slate-400 text-xs">{c.telephone}</p>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {c.via_google ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                            <Chrome className="w-3 h-3" /> Google
                          </span>
                        ) : null}
                        {c.via_password ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            <Lock className="w-3 h-3" /> Mot de passe
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        c.statut === "vip"
                          ? "bg-amber-50 text-amber-700"
                          : c.statut === "blacklist"
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400 text-xs hidden lg:table-cell">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
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
