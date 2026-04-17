"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import PageHeader from "./PageHeader";
import StatCard from "./StatCard";
import { ShoppingCart, TrendingUp, BarChart2, Calendar, Package } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = { nb_ventes: number; ca: number; panier_moyen: number; annee: number };

type EvoPoint = {
  label:        string;
  mois:         number;
  nb_ventes:    number;
  ca:           number;
  panier_moyen: number;
  montant_paye: number;
};

type DetailRow = {
  periode:      string;
  nb_ventes:    number;
  ca:           number;
  panier_moyen: number;
  montant_paye: number;
};

type TopProduit = { nom: string; quantite: number; ca: number; pourcentage: number };
type Methode    = { methode: string; montant: number; pourcentage: number };

type TendancesData = {
  stats:              Stats;
  evolution:          EvoPoint[];
  details:            DetailRow[];
  top_produits:       TopProduit[];
  methodes_paiement:  Methode[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function fmtAxis(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TendancesManager() {
  const [periode,  setPeriode]  = useState("mensuelle");
  const [annee,    setAnnee]    = useState(CURRENT_YEAR);
  const [data,     setData]     = useState<TendancesData | null>(null);
  const [loading,  setLoading]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/tendances?periode=${periode}&annee=${annee}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [periode, annee]);

  useEffect(() => { load(); }, [load]);

  const SELECT_CLS = "border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 bg-white";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiques de Ventes"
        subtitle="Analyse des tendances et performances de vente"
        accent="indigo"
        extra={
          <button className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
            <BarChart2 className="w-4 h-4" />
            Performance produits
          </button>
        }
      />

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
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Chargement…" : "Appliquer"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="text-center py-14 text-slate-400 text-sm">Chargement…</div>
      )}

      {data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Nombre de ventes"
              value={data.stats.nb_ventes}
              icon={ShoppingCart}
              iconColor="text-slate-400"
            />
            <StatCard
              title="Chiffre d'affaires"
              value={fmtPrice(data.stats.ca)}
              icon={TrendingUp}
              iconColor="text-emerald-400"
            />
            <StatCard
              title="Panier moyen"
              value={fmtPrice(data.stats.panier_moyen)}
              icon={BarChart2}
              iconColor="text-violet-400"
            />
            <StatCard
              title="Période analysée"
              value={String(data.stats.annee)}
              icon={Calendar}
              iconColor="text-slate-400"
            />
          </div>

          {/* Evolution line chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-5">
              Évolution des ventes en {data.stats.annee}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.evolution} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={fmtAxis}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [fmtPrice(Number(value) || 0), String(name)]}
                  labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                <Line
                  type="monotone"
                  dataKey="ca"
                  name="Chiffre d'affaires (FCFA)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="panier_moyen"
                  name="Panier moyen (FCFA)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="montant_paye"
                  name="Montant payé (FCFA)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Details by period */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Détails par période</h2>
            {data.details.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune donnée pour cette période</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Période</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Nb ventes</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Chiffre d&apos;affaires</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Panier moyen</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Montant payé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.details.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-medium text-slate-800">{d.periode}</td>
                        <td className="px-4 py-4 text-right text-slate-700">{d.nb_ventes}</td>
                        <td className="px-4 py-4 text-right text-slate-700">{fmtPrice(d.ca)}</td>
                        <td className="px-4 py-4 text-right text-slate-700">{fmtPrice(d.panier_moyen)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-emerald-700">{fmtPrice(d.montant_paye)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom row: Top products + Payment methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 products */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">
                Top 5 des produits en {data.stats.annee}
              </h2>
              {data.top_produits.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune donnée</p>
              ) : (
                <div className="space-y-4">
                  {data.top_produits.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{p.nom}</p>
                        <p className="text-xs text-slate-400">{p.quantite} unités vendues</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-800 text-sm">{fmtPrice(p.ca)}</p>
                        <p className="text-xs text-slate-400">{p.pourcentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment methods donut */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">
                Méthodes de paiement en {data.stats.annee}
              </h2>
              {data.methodes_paiement.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune donnée</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="w-[180px] h-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.methodes_paiement}
                          dataKey="montant"
                          nameKey="methode"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                        >
                          {data.methodes_paiement.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [fmtPrice(Number(value) || 0), "Montant"]}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {data.methodes_paiement.map((m, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate">{m.methode}</p>
                          <p className="text-xs text-slate-400">{m.pourcentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
