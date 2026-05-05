"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Plus, Pencil, Eye } from "lucide-react";
import type { BoutiqueClient, Facture } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";

const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-slate-100 text-slate-600",
  valide:    "bg-blue-100 text-blue-700",
  paye:      "bg-emerald-100 text-emerald-700",
  annule:    "bg-red-100 text-red-700",
};

function derivedStatut(f: Facture): { label: string; color: string } {
  if (f.statut === "annule")               return { label: "Annulé",   color: STATUT_COLORS.annule };
  if (f.statut_paiement === "paye_total")  return { label: "Payé",     color: STATUT_COLORS.paye   };
  if (f.statut === "paye")                 return { label: "Payé",     color: STATUT_COLORS.paye   };
  if (f.statut === "valide")               return { label: "Validé",   color: STATUT_COLORS.valide };
  return { label: "Brouillon", color: STATUT_COLORS.brouillon };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function avatarColor(nom: string) {
  const colors = [
    "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-teal-500",
  ];
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = nom.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

interface Props {
  client:   BoutiqueClient;
  factures: Facture[];
}

export default function ClientDetailPage({ client, factures }: Props) {
  const router  = useRouter();
  const initial = client.nom.trim().charAt(0).toUpperCase();
  const totalDu = factures.reduce((acc, f) => {
    if (f.statut === "annule") return acc;
    const paye = f.statut_paiement === "paye_total" ? f.total : (f.montant_acompte ?? 0);
    return acc + Math.max(0, f.total - paye);
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Breadcrumb + actions ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-brand-700 font-semibold mb-2">
            <button onClick={() => router.push("/admin")} className="hover:underline">Tableau de bord</button>
            <span className="text-slate-300">/</span>
            <button onClick={() => router.push("/admin/boutique-clients")} className="hover:underline">Clients</button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Détails</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Fiche Client</h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-200 inline-flex items-center justify-center text-[9px] font-bold text-slate-500">i</span>
            {client.nom}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button
            onClick={() => router.push(`/admin/boutique-clients?edit=${client.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Modifier
          </button>
          <button
            onClick={() => router.push("/admin/ventes?new=1")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle Vente
          </button>
        </div>
      </div>

      {/* ── 2 colonnes ── */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">

        {/* ── Colonne gauche : infos client ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Informations Client</h2>
          </div>

          <div className="px-5 py-6 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ${avatarColor(client.nom)}`}>
                {initial}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{client.nom}</p>
                <span className={`inline-block mt-1 px-3 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                  client.type_client === "professionnel" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {client.type_client}
                </span>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coordonnées</p>
              <div className="h-px bg-slate-100" />
              <div className="space-y-2 pt-1">
                {client.telephone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client.telephone}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client.email}
                  </div>
                )}
                {client.localisation && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client.localisation}
                  </div>
                )}
                {!client.telephone && !client.email && !client.localisation && (
                  <p className="text-xs text-slate-300">Aucune coordonnée</p>
                )}
              </div>
            </div>

            {/* Solde */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Solde Client</p>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-slate-600">Total dû :</span>
                <span className={`text-lg font-bold ${totalDu > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatPrice(totalDu)}
                </span>
              </div>
              {client.solde !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Solde compte :</span>
                  <span className={`text-sm font-semibold ${client.solde > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatPrice(client.solde)}
                  </span>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="bg-amber-50 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Note</p>
                <p className="text-sm text-amber-900">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : historique ventes ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Historique des Ventes</h2>
            {factures.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                {factures.length} vente{factures.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {factures.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="font-semibold text-sm">Aucune vente enregistrée</p>
              <p className="text-xs mt-1">Les factures de ce client apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Référence</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Montant</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Vendeur</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {factures.map(f => {
                    const s = derivedStatut(f);
                    return (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                            {f.reference.replace(/-\d{4}$/, "")}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden md:table-cell whitespace-nowrap">
                          {formatDate(f.created_at)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold tabular-nums text-slate-900">
                          {formatPrice(f.total)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden lg:table-cell">
                          {f.vendeur ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => router.push(`/admin/ventes/${f.id}`)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Voir la vente"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
