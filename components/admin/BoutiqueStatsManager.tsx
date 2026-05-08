"use client";

import { useState } from "react";
import {
  FileText, FileSpreadsheet, Printer,
  TrendingUp, Package, Clock,
} from "lucide-react";
import PageHeader from "./PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "rapports" | "tendances" | "performance";

type RapportRow = {
  id:              number;
  reference:       string;
  created_at:      string;
  client_nom:      string;
  vendeur:         string | null;
  total:           number;
  montant_paye:    number;
  reste:           number;
  statut_paiement: string | null;
  statut:          string;
};

type User = { id: number; nom: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES_RAPPORT = [
  { value: "ventes",       label: "Rapport des Ventes" },
  { value: "achats",       label: "Rapport des Achats" },
  { value: "depenses",     label: "Rapport des Dépenses" },
  { value: "rentrees",     label: "Rapport des Rentrées" },
  { value: "combine",      label: "Dépenses et Rentrées (Combiné)" },
  { value: "financier",    label: "Rapport Financier" },
  { value: "mobile_money", label: "Transactions Mobile Money" },
  { value: "clients",      label: "Rapport Clients" },
  { value: "produits",     label: "Rapport Produits" },
  { value: "stock",        label: "Rapport de Stock" },
  { value: "activites",    label: "Rapport des Activités" },
];

const PERIODES = [
  { value: "aujourd_hui",   label: "Aujourd'hui" },
  { value: "cette_semaine", label: "Cette semaine" },
  { value: "ce_mois",       label: "Ce Mois" },
  { value: "ce_trimestre",  label: "Ce trimestre" },
  { value: "cette_annee",   label: "Cette année" },
  { value: "tout",          label: "Tout" },
];

const STATUTS_VENTES = [
  { value: "all",       label: "Tous les statuts" },
  { value: "paye",      label: "Payé" },
  { value: "valide",    label: "Validé" },
  { value: "brouillon", label: "Brouillon" },
  { value: "annule",    label: "Annulé" },
];

const COLUMN_LABELS: Record<string, { col3: string; col4: string; col5: string }> = {
  ventes:       { col3: "Client",       col4: "Vendeur",      col5: "Montant Total" },
  achats:       { col3: "Fournisseur",  col4: "Type",         col5: "Montant Total" },
  depenses:     { col3: "Description",  col4: "Opérateur",    col5: "Montant" },
  rentrees:     { col3: "Description",  col4: "Opérateur",    col5: "Montant" },
  combine:      { col3: "Description",  col4: "Opérateur",    col5: "Montant" },
  financier:    { col3: "Description",  col4: "Opérateur",    col5: "Montant" },
  mobile_money: { col3: "Client",       col4: "Vendeur",      col5: "Montant Total" },
  clients:      { col3: "Nom client",   col4: "Téléphone",    col5: "Solde" },
  produits:     { col3: "Produit",      col4: "Catégorie",    col5: "Prix unitaire" },
  stock:        { col3: "Produit",      col4: "Mouvement",    col5: "Quantité" },
  activites:    { col3: "Description",  col4: "Acteur",       col5: "Montant" },
};

// Types that don't show "Reste" and "Montant Payé" columns
const NO_RESTE_TYPES = new Set(["depenses", "rentrees", "combine", "financier", "clients", "produits", "stock", "activites", "achats"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number, type: string) {
  if (["stock"].includes(type)) return String(n);
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
  const key = statut_paiement === "paye_total" || statut === "paye_total" ? "paye"
    : statut_paiement === "acompte" ? "acompte"
    : statut;

  const map: Record<string, string> = {
    paye:        "bg-emerald-100 text-emerald-700",
    paye_total:  "bg-emerald-100 text-emerald-700",
    valide:      "bg-blue-100 text-blue-700",
    acompte:     "bg-amber-100 text-amber-700",
    annule:      "bg-red-100 text-red-700",
    brouillon:   "bg-slate-100 text-slate-600",
    recu:        "bg-emerald-100 text-emerald-700",
    en_attente:  "bg-amber-100 text-amber-700",
    en_stock:    "bg-emerald-100 text-emerald-700",
    rupture:     "bg-red-100 text-red-700",
    depense:     "bg-red-100 text-red-700",
    rentree:     "bg-emerald-100 text-emerald-700",
    vente:       "bg-blue-100 text-blue-700",
    caisse:      "bg-violet-100 text-violet-700",
    transfert:   "bg-slate-100 text-slate-600",
    entree:      "bg-emerald-100 text-emerald-700",
    sortie:      "bg-orange-100 text-orange-700",
  };
  const labels: Record<string, string> = {
    paye: "Payé", paye_total: "Payé", valide: "Validé", acompte: "Acompte",
    annule: "Annulé", brouillon: "Brouillon", recu: "Reçu", en_attente: "En attente",
    en_stock: "En stock", rupture: "Rupture", depense: "Dépense", rentree: "Rentrée",
    vente: "Vente", caisse: "Caisse", transfert: "Transfert",
    entree: "Entrée", sortie: "Sortie",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${map[key] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[key] ?? key}
    </span>
  );
}

// ─── Onglet Rapports ──────────────────────────────────────────────────────────

function RapportsTab() {
  const [type,         setType]         = useState("ventes");
  const [periode,      setPeriode]      = useState("ce_mois");
  const [utilisateur,  setUtilisateur]  = useState("all");
  const [statut,       setStatut]       = useState("all");
  const [rows,         setRows]         = useState<RapportRow[]>([]);
  const [users,        setUsers]        = useState<User[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [generated,    setGenerated]    = useState(false);

  const cols = COLUMN_LABELS[type] ?? COLUMN_LABELS["ventes"];
  const hideReste = NO_RESTE_TYPES.has(type);

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
    const header = ["Référence", "Date", cols.col3, cols.col4, cols.col5, "Statut"];
    const csvRows = rows.map(r =>
      [r.reference, formatDate(r.created_at), r.client_nom, r.vendeur ?? "", r.total, r.statut].join(";")
    );
    const csv  = "﻿" + [header.join(";"), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `rapport-${type}-${periode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Summary totals
  const totalMontant = rows.reduce((s, r) => s + Number(r.total), 0);
  const totalPaye    = rows.reduce((s, r) => s + Number(r.montant_paye), 0);
  const totalReste   = rows.reduce((s, r) => s + Number(r.reste), 0);

  const SELECT_CLS = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 bg-white";

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type de Rapport</label>
            <select value={type} onChange={e => { setType(e.target.value); setGenerated(false); }} className={SELECT_CLS}>
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
              {STATUTS_VENTES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-1">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
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
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {generated && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-slate-800">
                {TYPES_RAPPORT.find(t => t.value === type)?.label}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{rows.length} résultat(s)</p>
            </div>
            {/* Summary totals */}
            {rows.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="font-bold text-slate-800">{formatPrice(totalMontant, type)}</p>
                </div>
                {!hideReste && (
                  <>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Payé</p>
                      <p className="font-bold text-emerald-700">{formatPrice(totalPaye, type)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Reste</p>
                      <p className="font-bold text-red-600">{formatPrice(totalReste, type)}</p>
                    </div>
                  </>
                )}
              </div>
            )}
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
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">{cols.col3}</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">{cols.col4}</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">{cols.col5}</th>
                    {!hideReste && (
                      <>
                        <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Montant Payé</th>
                        <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Reste</th>
                      </>
                    )}
                    <th className="text-center px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((r, i) => (
                    <tr key={r.id ?? i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">{r.reference}</td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{formatDate(r.created_at)}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{r.client_nom}</td>
                      <td className="px-5 py-4 text-slate-600">{r.vendeur ?? "—"}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-800">{formatPrice(Number(r.total), type)}</td>
                      {!hideReste && (
                        <>
                          <td className="px-5 py-4 text-right font-semibold text-emerald-700">{formatPrice(Number(r.montant_paye), type)}</td>
                          <td className="px-5 py-4 text-right text-slate-500">{formatPrice(Number(r.reste), type)}</td>
                        </>
                      )}
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

// ─── Placeholder Tab ──────────────────────────────────────────────────────────

function PlaceholderTab({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-amber-400" />
      </div>
      <div>
        <h3 className="font-bold text-slate-700 text-lg">{title}</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
        <Clock className="w-3 h-3" />
        Bientôt disponible
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "rapports",    label: "Rapports",             icon: FileText },
  { key: "tendances",   label: "Tendance des ventes",  icon: TrendingUp },
  { key: "performance", label: "Performance produit",  icon: Package },
];

export default function BoutiqueStatsManager() {
  const [activeTab, setActiveTab] = useState<Tab>("rapports");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiques"
        subtitle="Rapports, tendances et performances de la boutique"
        accent="amber"
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1.5 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                active
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "rapports" && <RapportsTab />}

      {activeTab === "tendances" && (
        <PlaceholderTab
          icon={TrendingUp}
          title="Tendance des ventes"
          description="Visualisez l'évolution de vos ventes sur plusieurs périodes avec des graphiques interactifs."
        />
      )}

      {activeTab === "performance" && (
        <PlaceholderTab
          icon={Package}
          title="Performance produit"
          description="Analysez les performances de chaque produit : meilleures ventes, taux de rotation, marges."
        />
      )}
    </div>
  );
}
