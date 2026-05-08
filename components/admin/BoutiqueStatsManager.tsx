"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Area,
} from "recharts";
import {
  FileText, FileSpreadsheet, Printer,
  TrendingUp, Package, Clock,
  ShoppingCart, BarChart2, Calendar,
  RotateCcw, Filter,
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

type PerfProduit = {
  nom: string; reference: string; prix: number; prix_achat: number | null;
  quantite: number; ca: number; marge_brute: number; taux_marge: number; nb_ventes: number;
};
type PerfData = {
  stats:    { nb_produits: number; ca: number; marge_brute: number; quantite_vendue: number };
  produits: PerfProduit[];
  evolution: { date: string; quantite: number; ca: number }[];
};

type TendancesData = {
  stats:              { nb_ventes: number; ca: number; panier_moyen: number; annee: number };
  evolution:          { label: string; mois: number; nb_ventes: number; ca: number; panier_moyen: number; montant_paye: number }[];
  details:            { periode: string; nb_ventes: number; ca: number; panier_moyen: number; montant_paye: number }[];
  top_produits:       { nom: string; quantite: number; ca: number; pourcentage: number }[];
  methodes_paiement:  { methode: string; nb_ventes: number; montant: number; pourcentage: number }[];
  comparaison:        { labels: string[]; annee_courante: number[]; annee_precedente: number[] };
};

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

const PERIODES_RAPPORT = [
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

const NO_RESTE_TYPES = new Set(["depenses", "rentrees", "combine", "financier", "clients", "produits", "stock", "activites", "achats"]);

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function fmtAxis(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

function formatPrice(n: number, type: string) {
  if (type === "stock") return String(n);
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
    paye: "bg-emerald-100 text-emerald-700", paye_total: "bg-emerald-100 text-emerald-700",
    valide: "bg-blue-100 text-blue-700", acompte: "bg-amber-100 text-amber-700",
    annule: "bg-red-100 text-red-700", brouillon: "bg-slate-100 text-slate-600",
    recu: "bg-emerald-100 text-emerald-700", en_attente: "bg-amber-100 text-amber-700",
    en_stock: "bg-emerald-100 text-emerald-700", rupture: "bg-red-100 text-red-700",
    depense: "bg-red-100 text-red-700", rentree: "bg-emerald-100 text-emerald-700",
    vente: "bg-blue-100 text-blue-700", caisse: "bg-violet-100 text-violet-700",
    transfert: "bg-slate-100 text-slate-600", entree: "bg-emerald-100 text-emerald-700",
    sortie: "bg-orange-100 text-orange-700",
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
    a.href = url; a.download = `rapport-${type}-${periode}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const totalMontant = rows.reduce((s, r) => s + Number(r.total), 0);
  const totalPaye    = rows.reduce((s, r) => s + Number(r.montant_paye), 0);
  const totalReste   = rows.reduce((s, r) => s + Number(r.reste), 0);

  const SELECT_CLS = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 bg-white";

  return (
    <div className="space-y-5">
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
              {PERIODES_RAPPORT.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
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
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <FileText className="w-4 h-4" />
            {loading ? "Génération…" : "Générer le Rapport"}
          </button>
          {generated && rows.length > 0 && (
            <>
              <button onClick={exportCSV}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
                Exporter en Excel
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </>
          )}
        </div>
      </div>

      {generated && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-slate-800">{TYPES_RAPPORT.find(t => t.value === type)?.label}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{rows.length} résultat(s)</p>
            </div>
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
            <div className="text-center py-14 text-slate-400 text-sm">Aucune donnée pour cette période</div>
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

// ─── Onglet Tendance des ventes ───────────────────────────────────────────────

function TendanceVentesTab() {
  const [periode,  setPeriode]  = useState("mensuelle");
  const [annee,    setAnnee]    = useState(CURRENT_YEAR);
  const [data,     setData]     = useState<TendancesData | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [errMsg,   setErrMsg]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const res  = await fetch(`/api/admin/tendances?periode=${periode}&annee=${annee}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as TendancesData);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [periode, annee]);

  useEffect(() => { load(); }, [load]);

  const SELECT_CLS = "border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white";

  // Build comparaison chart data — safe access
  const comparaisonData = (data?.comparaison?.labels ?? []).map((label, i) => ({
    label,
    [String(annee - 1)]: data?.comparaison?.annee_precedente?.[i] ?? 0,
    [String(annee)]:     data?.comparaison?.annee_courante?.[i]   ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Période</label>
            <select value={periode} onChange={e => setPeriode(e.target.value)} className={SELECT_CLS}>
              <option value="mensuelle">Mensuelle</option>
              <option value="trimestrielle">Trimestrielle</option>
              <option value="annuelle">Annuelle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Année</label>
            <select value={annee} onChange={e => setAnnee(Number(e.target.value))} className={SELECT_CLS}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <BarChart2 className="w-4 h-4" />
            {loading ? "Chargement…" : "Appliquer"}
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="text-center py-14 text-slate-400 text-sm">Chargement…</div>
      )}

      {errMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm">
          <p className="font-semibold mb-1">Erreur de chargement</p>
          <p className="text-xs opacity-80">{errMsg}</p>
        </div>
      )}

      {data && !errMsg && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "NOMBRE DE VENTES",   value: String(data.stats?.nb_ventes ?? 0),   icon: ShoppingCart, color: "text-slate-400" },
              { label: "CHIFFRE D'AFFAIRES",  value: fmtPrice(data.stats.ca),        icon: TrendingUp,   color: "text-emerald-400" },
              { label: "PANIER MOYEN",        value: fmtPrice(data.stats.panier_moyen), icon: BarChart2, color: "text-violet-400" },
              { label: "PÉRIODE ANALYSÉE",    value: String(data.stats.annee),       icon: Calendar,     color: "text-slate-400" },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{card.label}</p>
                    <Icon className={`w-8 h-8 opacity-30 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Line chart — évolution */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-5">Évolution des ventes en {data.stats.annee}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.evolution} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v, name) => [fmtPrice(Number(v) || 0), String(name)]}
                  labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                <Line type="monotone" dataKey="ca"           name="Chiffre d'affaires (FCFA)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="panier_moyen" name="Panier moyen (FCFA)"       stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="montant_paye" name="Montant payé (FCFA)"       stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Details table */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Détails par période</h2>
            {data.details.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune donnée pour cette période</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 font-semibold text-slate-700">Période</th>
                      <th className="text-left py-3 font-semibold text-slate-700">Nombre de ventes</th>
                      <th className="text-left py-3 font-semibold text-slate-700">Chiffre d&apos;affaires</th>
                      <th className="text-left py-3 font-semibold text-slate-700">Panier moyen</th>
                      <th className="text-left py-3 font-semibold text-slate-700">Montant payé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.details.map((d, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-medium text-slate-800">{d.periode}</td>
                        <td className="py-3.5 text-slate-600">{d.nb_ventes}</td>
                        <td className="py-3.5 text-slate-700">{fmtPrice(d.ca)}</td>
                        <td className="py-3.5 text-slate-700">{fmtPrice(d.panier_moyen)}</td>
                        <td className="py-3.5 font-semibold text-emerald-700">{fmtPrice(d.montant_paye)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top produits + Méthodes paiement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 produits */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">Top 5 des produits en {data.stats.annee}</h2>
              {data.top_produits.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune donnée</p>
              ) : (
                <div className="space-y-4">
                  {data.top_produits.slice(0, 5).map((p, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">{p.nom}</p>
                            <p className="text-xs text-slate-400">{p.quantite} unités vendues</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-800 text-sm">{fmtPrice(p.ca)}</p>
                          <p className="text-xs text-slate-400">{p.pourcentage}%</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden ml-11">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${Math.min(p.pourcentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Méthodes de paiement — liste + donut */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">Méthodes de paiement en {data.stats.annee}</h2>
              {data.methodes_paiement.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune donnée</p>
              ) : (
                <div className="flex items-center gap-6">
                  {/* Donut */}
                  <div className="w-[160px] h-[160px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.methodes_paiement} dataKey="montant" nameKey="methode"
                          cx="50%" cy="50%" innerRadius={45} outerRadius={72}>
                          {data.methodes_paiement.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, name) => [fmtPrice(Number(v) || 0), String(name)]}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Liste détaillée */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {data.methodes_paiement.map((m, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <p className="text-sm text-slate-700 truncate">{m.methode}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-slate-800">{fmtPrice(m.montant)}</p>
                          <p className="text-xs text-slate-400">({m.nb_ventes} ventes)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparaison année précédente */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-5">
              Comparaison Année Précédente ({annee - 1} vs {annee})
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparaisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v, name) => [fmtPrice(Number(v) || 0), String(name)]}
                  labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                <Bar dataKey={String(annee - 1)} name={String(annee - 1)} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey={String(annee)}     name={String(annee)}     fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Onglet Performance produit ───────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }
function firstOfMonthStr() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function PerformanceProduitTab() {
  const [dateDebut, setDateDebut] = useState(firstOfMonthStr());
  const [dateFin,   setDateFin]   = useState(todayStr());
  const [top,       setTop]       = useState("10");
  const [data,      setData]      = useState<PerfData | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [errMsg,    setErrMsg]    = useState<string | null>(null);

  const load = useCallback(async (dd = dateDebut, df = dateFin, t = top) => {
    setLoading(true);
    setErrMsg(null);
    try {
      const res  = await fetch(`/api/admin/performance-produits?date_debut=${dd}&date_fin=${df}&top=${t}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as PerfData);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, top]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    const dd = firstOfMonthStr(); const df = todayStr(); const t = "10";
    setDateDebut(dd); setDateFin(df); setTop(t);
    load(dd, df, t);
  }

  // Build comparative chart data
  const comparativeData = (data?.produits ?? []).map(p => ({
    nom:         p.nom.length > 14 ? p.nom.slice(0, 14) + "…" : p.nom,
    ca:          p.ca,
    marge_brute: p.marge_brute,
    taux_marge:  p.taux_marge,
  }));

  const evolutionData = (data?.evolution ?? []).map(e => ({
    ...e,
    label: fmtDateLabel(e.date),
  }));

  const INPUT_CLS = "border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white";

  return (
    <div className="space-y-6">
      {/* Subtitle */}
      <p className="text-xs text-slate-400 -mt-2">Analyse détaillée des ventes par produit</p>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date de début</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date de fin</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre de produits</label>
            <select value={top} onChange={e => setTop(e.target.value)} className={INPUT_CLS}>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </div>
          <button onClick={() => load()} disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <Filter className="w-4 h-4" />
            {loading ? "Chargement…" : "Appliquer les filtres"}
          </button>
          <button onClick={reset} disabled={loading}
            className="flex items-center gap-2 bg-slate-500 hover:bg-slate-400 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="text-center py-14 text-slate-400 text-sm">Chargement…</div>
      )}

      {errMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm">
          <p className="font-semibold mb-1">Erreur de chargement</p>
          <p className="text-xs opacity-80">{errMsg}</p>
        </div>
      )}

      {data && !errMsg && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "PRODUITS ANALYSÉS",   value: String(data.stats?.nb_produits ?? 0),    icon: Package,     color: "text-slate-400" },
              { label: "CHIFFRE D'AFFAIRES",   value: fmtPrice(data.stats?.ca ?? 0),           icon: BarChart2,   color: "text-emerald-400" },
              { label: "MARGE BRUTE",          value: fmtPrice(data.stats?.marge_brute ?? 0),  icon: TrendingUp,  color: "text-violet-400" },
              { label: "QUANTITÉ VENDUE",      value: String(data.stats?.quantite_vendue ?? 0), icon: ShoppingCart, color: "text-blue-400" },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{card.label}</p>
                    <Icon className={`w-8 h-8 opacity-25 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des ventes par produit — dual-axis */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-5">Évolution des ventes par produit</h2>
              {evolutionData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={evolutionData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradQty" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="qty" orientation="left"  tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="ca"  orientation="right" tickFormatter={v => fmtAxis(v) + " FCFA"} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v, name) => name === "Quantité vendue" ? [v, name] : [fmtPrice(Number(v)), name]}
                      labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                    <Area yAxisId="qty" type="monotone" dataKey="quantite" name="Quantité vendue"
                      stroke="#3b82f6" strokeWidth={2} fill="url(#gradQty)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Area yAxisId="ca"  type="monotone" dataKey="ca" name="Chiffre d'affaires (FCFA)"
                      stroke="#10b981" strokeWidth={2} fill="url(#gradCA)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Performance comparative */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-5">Performance comparative des produits</h2>
              {comparativeData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={comparativeData} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="nom" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      angle={-45} textAnchor="end" interval={0} />
                    <YAxis yAxisId="montant" orientation="left" tickFormatter={v => fmtAxis(v) + " FCFA"}
                      tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="taux" orientation="right" tickFormatter={v => v + "%"}
                      tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 200]} />
                    <Tooltip
                      formatter={(v, name) => name === "Taux de marge (%)" ? [v + "%", name] : [fmtPrice(Number(v)), name]}
                      labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                    <Bar yAxisId="montant" dataKey="ca"          name="Chiffre d'affaires (FCFA)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="montant" dataKey="marge_brute" name="Marge brute (FCFA)"        fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="taux"  dataKey="taux_marge"  name="Taux de marge (%)"
                      stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tableau détail */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Détail des performances produits</h2>
            {data.produits.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun produit vendu sur cette période</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Produit</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Référence</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Prix</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Quantité vendue</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Chiffre d&apos;affaires</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Marge brute</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Taux de marge</th>
                      <th className="text-left py-3 font-semibold text-slate-700">Ventes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.produits.map((p, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 pr-4 font-semibold text-slate-800 uppercase text-xs">{p.nom}</td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-slate-500">{p.reference}</td>
                        <td className="py-3.5 pr-4 text-slate-700">{fmtPrice(p.prix)}</td>
                        <td className="py-3.5 pr-4 text-slate-700">{p.quantite}</td>
                        <td className="py-3.5 pr-4 font-semibold text-slate-800">{fmtPrice(p.ca)}</td>
                        <td className="py-3.5 pr-4 text-emerald-700 font-semibold">{fmtPrice(p.marge_brute)}</td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            p.taux_marge >= 50 ? "bg-emerald-100 text-emerald-700"
                            : p.taux_marge >= 20 ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                            {p.taux_marge}%
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-700">{p.nb_ventes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
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
                active ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "rapports"    && <RapportsTab />}
      {activeTab === "tendances"   && <TendanceVentesTab />}
      {activeTab === "performance" && <PerformanceProduitTab />}
    </div>
  );
}
