"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, Eye, Wifi, Smartphone, Monitor, Tablet,
  Globe, TrendingUp, RotateCcw, Clock, UserCheck, UserPlus, MapPin,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Kpi {
  sessions_today: number; sessions_7j: number; sessions_30j: number;
  vues_today: number;     vues_7j: number;     vues_30j: number;
  actifs_maintenant: number;
}
interface AnalyticsData {
  kpi:       Kpi;
  evolution: { date: string; vues: number; sessions: number }[];
  topPages:  { page: string; vues: number; sessions_uniques: number }[];
  sources:   { source: string; vues: number; sessions: number }[];
  devices:   { device: string; vues: number; sessions: number }[];
  recent:    { page: string; referrer: string | null; device: string; pays: string | null; ville: string | null; created_at: string }[];
  heures:    { heure: string; vues: number }[];
  jours:     { jour: string; vues: number }[];
  visiteurs: { nouveaux: number; recurrents: number };
  topPays:   { pays: string; vues: number; sessions: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEVICE_COLORS: Record<string, string> = {
  mobile: "#3b82f6", tablet: "#8b5cf6", desktop: "#10b981",
};
const SOURCE_COLORS  = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
const PAYS_COLORS    = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316","#84cc16","#a78bfa"];

function DeviceIcon({ d }: { d: string }) {
  if (d === "mobile")  return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
  if (d === "tablet")  return <Tablet      className="w-3.5 h-3.5 text-violet-500" />;
  return <Monitor className="w-3.5 h-3.5 text-emerald-500" />;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtPage(p: string) {
  return p.length > 40 ? p.slice(0, 40) + "…" : p;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsManager() {
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const res  = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as AnalyticsData);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !data) return (
    <div className="text-center py-20 text-slate-400 text-sm">Chargement…</div>
  );
  if (errMsg) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
      <p className="font-semibold mb-1">Erreur</p>
      <p className="text-xs opacity-80">{errMsg}</p>
    </div>
  );
  if (!data) return null;

  const { kpi, evolution, topPages, sources, devices, recent, heures, jours, visiteurs, topPays } = data;

  const totalVisiteurs = visiteurs.nouveaux + visiteurs.recurrents;
  const pvData = [
    { name: "Nouveaux",    value: visiteurs.nouveaux,   color: "#3b82f6" },
    { name: "Récurrents",  value: visiteurs.recurrents, color: "#10b981" },
  ];

  const kpiCards = [
    { label: "ACTIFS MAINTENANT",    value: kpi.actifs_maintenant, icon: Wifi,       color: "text-emerald-400", pulse: kpi.actifs_maintenant > 0 },
    { label: "SESSIONS AUJOURD'HUI", value: kpi.sessions_today,    icon: Users,      color: "text-blue-400" },
    { label: "VUES AUJOURD'HUI",     value: kpi.vues_today,        icon: Eye,        color: "text-violet-400" },
    { label: "SESSIONS 7 JOURS",     value: kpi.sessions_7j,       icon: TrendingUp, color: "text-amber-400" },
    { label: "VUES 7 JOURS",         value: kpi.vues_7j,           icon: Eye,        color: "text-sky-400" },
    { label: "SESSIONS 30 JOURS",    value: kpi.sessions_30j,      icon: Users,      color: "text-pink-400" },
    { label: "VUES 30 JOURS",        value: kpi.vues_30j,          icon: Globe,      color: "text-teal-400" },
  ];

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{card.label}</p>
                <div className="relative">
                  <Icon className={`w-7 h-7 opacity-20 ${card.color}`} />
                  {card.pulse && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Évolution 30j */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800">Évolution sur 30 jours</h2>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </div>
        {evolution.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">Aucune donnée pour le moment</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={evolution} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gVues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} labelFormatter={(label) => fmtDate(String(label))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="vues"     name="Pages vues" stroke="#8b5cf6" fill="url(#gVues)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="sessions" name="Sessions"   stroke="#3b82f6" fill="url(#gSess)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Heures de pointe + Jours de semaine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-1">Heures de pointe</h2>
          <p className="text-xs text-slate-400 mb-4">Pages vues par heure — 30 derniers jours</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={heures} margin={{ left: -20, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="heure" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false}
                interval={2} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="vues" name="Vues" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-1">Jours de la semaine</h2>
          <p className="text-xs text-slate-400 mb-4">Pages vues par jour — 30 derniers jours</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={jours} margin={{ left: -20, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="jour" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="vues" name="Vues" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nouveau vs Récurrent + Top Pays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Nouveau vs Récurrent */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-1">Nouveaux vs Récurrents</h2>
          <p className="text-xs text-slate-400 mb-4">Visiteurs uniques — 30 derniers jours</p>
          {totalVisiteurs === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pvData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={70} paddingAngle={4}>
                    {pvData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    formatter={(v) => [`${v} visiteurs`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Nouveaux</p>
                    <p className="text-xl font-bold text-slate-900">{visiteurs.nouveaux}</p>
                    <p className="text-xs text-slate-400">
                      {totalVisiteurs > 0 ? Math.round((visiteurs.nouveaux / totalVisiteurs) * 100) : 0}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Récurrents</p>
                    <p className="text-xl font-bold text-slate-900">{visiteurs.recurrents}</p>
                    <p className="text-xs text-slate-400">
                      {totalVisiteurs > 0 ? Math.round((visiteurs.recurrents / totalVisiteurs) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Pays */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-1">Top pays</h2>
          <p className="text-xs text-slate-400 mb-4">Pages vues par pays — 30 derniers jours</p>
          {topPays.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">Aucune donnée (géolocalisation en cours)</p>
          ) : (
            <div className="space-y-2.5">
              {topPays.map((p, i) => {
                const pct = topPays[0].vues > 0 ? Math.round((p.vues / topPays[0].vues) * 100) : 0;
                return (
                  <div key={p.pays} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono w-5 text-right">{i + 1}</span>
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: PAYS_COLORS[i % PAYS_COLORS.length] }} />
                    <span className="flex-1 text-sm text-slate-700 truncate">{p.pays}</span>
                    <div className="w-20 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, background: PAYS_COLORS[i % PAYS_COLORS.length] }} />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums w-10 text-right">{p.vues}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sources + Appareils */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-5">Sources de trafic</h2>
          {sources.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>
          ) : (
            <div className="flex gap-6 items-center">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={sources} dataKey="vues" nameKey="source" cx="50%" cy="50%"
                    outerRadius={70} paddingAngle={3}>
                    {sources.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sources.map((s, i) => (
                  <div key={s.source} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                    <span className="flex-1 text-slate-700 truncate">{s.source}</span>
                    <span className="text-slate-400 text-xs tabular-nums">{s.vues} vues</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-5">Appareils</h2>
          {devices.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={devices} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
                <YAxis type="category" dataKey="device" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="vues" name="Pages vues" radius={[0, 6, 6, 0]}>
                  {devices.map((d) => (
                    <Cell key={d.device} fill={DEVICE_COLORS[d.device] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top pages */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h2 className="font-bold text-slate-800 mb-4">Top 10 pages (30 jours)</h2>
        {topPages.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Page</th>
                  <th className="text-right pb-3 pr-4">Vues</th>
                  <th className="text-right pb-3">Sessions uniques</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p, i) => (
                  <tr key={p.page} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="py-3 pr-4 text-slate-700 font-medium">{fmtPage(p.page)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-900 font-semibold">{p.vues}</td>
                    <td className="py-3 text-right tabular-nums text-slate-500">{p.sessions_uniques}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live feed */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="font-bold text-slate-800">20 dernières visites</h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">Aucune visite enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left pb-3 pr-4">Page</th>
                  <th className="text-left pb-3 pr-4">Source</th>
                  <th className="text-left pb-3 pr-4">Pays / Ville</th>
                  <th className="text-left pb-3 pr-4">Appareil</th>
                  <th className="text-right pb-3">Heure</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-4 text-slate-700">{fmtPage(r.page)}</td>
                    <td className="py-2.5 pr-4 text-slate-400 text-xs">{r.referrer ?? "Direct"}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">
                      {r.pays ? (
                        <span>{r.pays}{r.ville ? ` · ${r.ville}` : ""}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon d={r.device} />
                        <span className="text-xs text-slate-500 capitalize">{r.device}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-xs text-slate-400 tabular-nums">{fmtTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
