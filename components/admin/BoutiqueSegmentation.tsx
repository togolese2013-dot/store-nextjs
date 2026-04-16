"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Users, TrendingUp, TrendingDown, Minus, Loader2, MapPin, Phone } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { BoutiqueClientStats } from "@/lib/admin-db";

// ─── Donut Chart SVG ──────────────────────────────────────────────────────────

const SEGMENT_COLORS: Record<string, string> = {
  particulier:   "#3b82f6",
  professionnel: "#f59e0b",
};

function DonutChart({ segments, total }: { segments: { type_client: string; count: number }[]; total: number }) {
  const SIZE = 180;
  const R    = 70;
  const cx   = SIZE / 2;
  const cy   = SIZE / 2;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const slices = segments.map(s => {
    const pct   = total > 0 ? s.count / total : 0;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const slice = { ...s, dash, gap, offset, pct };
    offset += dash;
    return slice;
  });

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        <div className="text-center text-slate-300">
          <Users className="w-10 h-10 mx-auto mb-1" />
          <p className="text-xs">Aucune donnée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={28} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={SEGMENT_COLORS[s.type_client] ?? "#94a3b8"}
            strokeWidth={28}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-(s.offset - circumference / 4)}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs text-slate-400 font-medium">Total</p>
        <p className="text-2xl font-bold text-slate-900">{total}</p>
        <p className="text-xs text-slate-400">clients</p>
      </div>
    </div>
  );
}

// ─── Line Chart SVG ───────────────────────────────────────────────────────────

function LineChart({ data }: { data: { mois: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-300">
        <p className="text-xs">Aucune donnée</p>
      </div>
    );
  }

  const W = 380;
  const H = 140;
  const PADDING = { top: 12, right: 16, bottom: 28, left: 28 };
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const plotW  = W - PADDING.left - PADDING.right;
  const plotH  = H - PADDING.top - PADDING.bottom;

  const pts = data.map((d, i) => ({
    x: PADDING.left + (i / Math.max(data.length - 1, 1)) * plotW,
    y: PADDING.top + (1 - d.count / maxVal) * plotH,
    count: d.count,
    mois:  d.mois,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PADDING.top + plotH} L ${pts[0].x} ${PADDING.top + plotH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.5, 1].map((f, i) => (
        <line key={i}
          x1={PADDING.left} y1={PADDING.top + f * plotH}
          x2={W - PADDING.right} y2={PADDING.top + f * plotH}
          stroke="#f1f5f9" strokeWidth={1}
        />
      ))}
      {/* Area */}
      <path d={areaD} fill="#f59e0b" fillOpacity={0.08} />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#f59e0b" strokeWidth={2} />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fill="#6b7280" fontWeight={600}>{p.count}</text>
        </g>
      ))}
      {/* X labels */}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">{p.mois}</text>
      ))}
      {/* Y labels */}
      {[0, Math.round(maxVal / 2), maxVal].map((v, i) => (
        <text key={i}
          x={PADDING.left - 4}
          y={PADDING.top + (1 - v / maxVal) * plotH + 3}
          textAnchor="end" fontSize={8} fill="#94a3b8">
          {v}
        </text>
      ))}
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, sublabel, value, icon: Icon, color }: {
  label:    string;
  sublabel: string;
  value:    React.ReactNode;
  icon:     React.ElementType;
  color:    string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sublabel}</p>
    </div>
  );
}

// ─── Client Row (top lists) ───────────────────────────────────────────────────

function ClientRow({ nom, telephone, type_client, amount, amountClass }: {
  nom: string; telephone: string | null; type_client: string; amount: number; amountClass: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{nom}</p>
        {telephone && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Phone className="w-2.5 h-2.5" /> {telephone}
          </p>
        )}
        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
          {type_client}
        </span>
      </div>
      <span className={`text-sm font-bold ml-3 shrink-0 ${amountClass}`}>
        {formatPrice(Math.abs(amount))}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BoutiqueSegmentation() {
  const [stats,   setStats]   = useState<BoutiqueClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [migNeeded, setMigNeeded] = useState(false);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/boutique-clients?stats=1");
    const data = await res.json();
    if (data._migrationNeeded) { setMigNeeded(true); setLoading(false); return; }
    if (data.success && data.data) setStats(data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (migNeeded) {
    return (
      <div className="py-24 text-center text-amber-600">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-bold text-lg mb-1">Migration requise</p>
        <p className="text-sm text-slate-500">Exécutez <code className="bg-slate-100 px-2 py-1 rounded font-mono text-xs">scripts/boutique-clients-migration.sql</code> pour activer le module.</p>
      </div>
    );
  }

  const s = stats ?? {
    total: 0, en_avance: 0, debiteurs: 0, solde_moyen: 0,
    segments: [], acquisitions: [], top_debiteurs: [],
    top_depensiers: [], derniers: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Segmentation des clients</h1>
          <p className="text-sm text-slate-500">Analyse des segments de clientèle et de leur valeur commerciale.</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Clients totaux"
          sublabel={`${s.segments.length} segment${s.segments.length > 1 ? "s" : ""}`}
          value={s.total}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Clients en avance"
          sublabel={formatPrice(s.top_depensiers.reduce((a, x) => a + Number(x.total_achats), 0))}
          value={s.en_avance}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Clients débiteurs"
          sublabel={formatPrice(Math.abs(s.top_debiteurs.reduce((a, x) => a + Number(x.solde), 0)))}
          value={s.debiteurs}
          icon={TrendingDown}
          color="bg-red-50 text-red-500"
        />
        <KpiCard
          label="Solde moyen"
          sublabel={`${s.total - s.en_avance - s.debiteurs} neutres`}
          value={formatPrice(s.solde_moyen)}
          icon={Minus}
          color="bg-slate-50 text-slate-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Répartition par segment</h2>
              <p className="text-xs text-slate-400">Part de chaque segment dans le portefeuille clients.</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <DonutChart segments={s.segments} total={s.total} />
            <div className="space-y-2">
              {s.segments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: SEGMENT_COLORS[seg.type_client] ?? "#94a3b8" }} />
                  <span className="text-xs text-slate-600 capitalize">{seg.type_client}</span>
                  <span className="text-xs font-bold text-slate-900 ml-auto">{seg.count}</span>
                </div>
              ))}
              {s.segments.length === 0 && <p className="text-xs text-slate-400">Aucun client</p>}
            </div>
          </div>
        </div>

        {/* Line chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Nouvelle acquisition</h2>
              <p className="text-xs text-slate-400">Nombre de nouveaux clients ajoutés par mois (6 derniers mois).</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <LineChart data={s.acquisitions} />
        </div>
      </div>

      {/* Bottom 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top débiteurs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Top débiteurs</h2>
              <p className="text-xs text-slate-400">Clients qui vous doivent le plus.</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </div>
          {s.top_debiteurs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun débiteur</p>
          ) : s.top_debiteurs.map(c => (
            <ClientRow key={c.id} nom={c.nom} telephone={c.telephone} type_client={c.type_client}
              amount={c.solde} amountClass="text-red-600" />
          ))}
        </div>

        {/* Top dépensiers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Top dépensiers</h2>
              <p className="text-xs text-slate-400">Clients ayant le plus acheté chez vous.</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          {s.top_depensiers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucune donnée</p>
          ) : s.top_depensiers.map(c => (
            <ClientRow key={c.id} nom={String(c.nom)} telephone={c.telephone} type_client={c.type_client}
              amount={c.total_achats} amountClass="text-emerald-600" />
          ))}
        </div>

        {/* Derniers ajoutés */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Derniers clients ajoutés</h2>
              <p className="text-xs text-slate-400">Derniers enregistrements dans votre base.</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          {s.derniers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun client</p>
          ) : s.derniers.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{c.nom}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="text-right ml-3 shrink-0">
                <span className="block text-xs font-bold uppercase text-slate-400">{c.type_client}</span>
                <span className={`text-xs font-bold ${c.solde === 0 ? "text-slate-400" : c.solde > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatPrice(c.solde)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
