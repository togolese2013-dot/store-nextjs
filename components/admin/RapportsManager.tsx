"use client";

import { useState } from "react";
import PageHeader from "./PageHeader";
import { FileText, FileSpreadsheet, Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RapportRow = {
  id:              number;
  reference:       string;
  created_at:      string;
  client_nom:      string;
  vendeur:         string;
  total:           number;
  montant_paye:    number;
  reste:           number;
  statut_paiement: string | null;
  statut:          string;
};

type User = { id: number; nom: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES_RAPPORT = [
  { value: "ventes", label: "Rapport des Ventes" },
];

const PERIODES = [
  { value: "aujourd_hui",   label: "Aujourd'hui" },
  { value: "cette_semaine", label: "Cette semaine" },
  { value: "ce_mois",       label: "Ce Mois" },
  { value: "ce_trimestre",  label: "Ce trimestre" },
  { value: "cette_annee",   label: "Cette année" },
  { value: "tout",          label: "Tout" },
];

const STATUTS = [
  { value: "all",      label: "Tous les statuts" },
  { value: "valide",   label: "Validé" },
  { value: "paye",     label: "Payé" },
  { value: "brouillon",label: "Brouillon" },
  { value: "annule",   label: "Annulé" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(s: string) {
  const d = new Date(s);
  return (
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

function StatutBadge({ statut, statut_paiement }: { statut: string; statut_paiement: string | null }) {
  const key = statut_paiement === "paye" || statut === "paye" ? "paye"
    : statut_paiement === "acompte" ? "acompte"
    : statut;

  const map: Record<string, string> = {
    paye:      "bg-emerald-100 text-emerald-700",
    valide:    "bg-blue-100 text-blue-700",
    acompte:   "bg-amber-100 text-amber-700",
    annule:    "bg-red-100 text-red-700",
    brouillon: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = {
    paye: "Payé", valide: "Validé", acompte: "Acompte", annule: "Annulé", brouillon: "Brouillon",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${map[key] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[key] ?? statut}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RapportsManager() {
  const [type,        setType]        = useState("ventes");
  const [periode,     setPeriode]     = useState("ce_mois");
  const [utilisateur, setUtilisateur] = useState("all");
  const [statut,      setStatut]      = useState("all");
  const [rows,        setRows]        = useState<RapportRow[]>([]);
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [generated,   setGenerated]   = useState(false);

  async function generate() {
    setLoading(true);
    const params = new URLSearchParams({ type, periode, utilisateur, statut });
    const res  = await fetch(`/api/admin/rapports?${params}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setUsers(data.utilisateurs ?? []);
    setGenerated(true);
    setLoading(false);
  }

  function exportCSV() {
    const header  = ["Référence", "Date", "Client", "Vendeur", "Montant Total", "Montant Payé", "Reste", "Statut"];
    const csvRows = rows.map(r =>
      [r.reference, formatDate(r.created_at), r.client_nom, r.vendeur, r.total, r.montant_paye, r.reste, r.statut].join(";")
    );
    const csv  = "\uFEFF" + [header.join(";"), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `rapport-ventes-${periode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const SELECT_CLS = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 bg-white";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Rapports"
        subtitle="Aperçu sur les différents données de la plateforme"
        accent="indigo"
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type de Rapport</label>
            <select value={type} onChange={e => setType(e.target.value)} className={SELECT_CLS}>
              {TYPES_RAPPORT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Période</label>
            <select value={periode} onChange={e => setPeriode(e.target.value)} className={SELECT_CLS}>
              {PERIODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Utilisateur</label>
            <select value={utilisateur} onChange={e => setUtilisateur(e.target.value)} className={SELECT_CLS}>
              <option value="all">Tous les utilisateurs</option>
              {users.map(u => <option key={u.id} value={String(u.id)}>{u.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Statut</label>
            <select value={statut} onChange={e => setStatut(e.target.value)} className={SELECT_CLS}>
              {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <FileText className="w-4 h-4" />
            {loading ? "Génération…" : "Générer le Rapport"}
          </button>
          {generated && rows.length > 0 && (
            <>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exporter en Excel
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                Exporter en PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results table */}
      {generated && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">
                {TYPES_RAPPORT.find(t => t.value === type)?.label}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{rows.length} résultat(s)</p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-14 text-slate-400 text-sm">
              Aucune donnée pour cette période
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Référence</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Vendeur</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Montant Total</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Montant Payé</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Reste</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">{r.reference}</td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{formatDate(r.created_at)}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{r.client_nom}</td>
                      <td className="px-5 py-4 text-slate-600">{r.vendeur}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-800">{formatPrice(r.total)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-emerald-700">{formatPrice(r.montant_paye)}</td>
                      <td className="px-5 py-4 text-right text-slate-500">{formatPrice(r.reste)}</td>
                      <td className="px-5 py-4 text-center">
                        <StatutBadge statut={r.statut} statut_paiement={r.statut_paiement} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
