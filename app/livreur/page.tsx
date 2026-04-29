"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin, Phone, Package, CheckCircle2, XCircle, Clock,
  TrendingUp, RefreshCw, ChevronRight, AlertCircle,
} from "lucide-react";

interface DeliveryOrder {
  id:               number;
  reference:        string;
  nom:              string;
  telephone:        string;
  adresse:          string;
  zone_livraison:   string;
  delivery_fee:     number;
  total:            number;
  created_at:       string;
  lien_localisation?: string;
  livraison_statut?: string;
  livraison_note?:   string;
}

interface Stats {
  today:        number;
  week:         number;
  total:        number;
  enCours:      number;
  tauxReussite: number;
}

type Tab = "available" | "mine" | "history";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h    = Math.floor(diff / 3_600_000);
  if (h < 1)  return "Il y a moins d'1h";
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

function isUrgent(created_at: string) {
  return Date.now() - new Date(created_at).getTime() > 24 * 3_600_000;
}

// ── Carte livraison disponible ────────────────────────────────────────────────
function AvailableCard({ order, onAccept }: { order: DeliveryOrder; onAccept: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/livreur/orders/${order.id}/accept`, { method: "PATCH" });
      if (res.ok) { setDone(true); setTimeout(onAccept, 600); }
    } finally { setLoading(false); }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${done ? "opacity-50 scale-95" : ""} ${isUrgent(order.created_at) ? "border-orange-300" : "border-slate-200"}`}>
      {isUrgent(order.created_at) && (
        <div className="bg-orange-50 px-4 py-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-semibold text-orange-600">En attente depuis plus de 24h</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-slate-900 text-sm">{order.nom || "Client"}</p>
            <p className="text-xs text-slate-400">{order.reference} · {timeAgo(order.created_at)}</p>
          </div>
          <span className="text-sm font-bold text-green-600">{order.delivery_fee?.toLocaleString()} FCFA</span>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">{order.adresse || "—"}<span className="text-slate-400"> · {order.zone_livraison}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <a href={`tel:${order.telephone}`} className="text-sm text-blue-600 font-medium">{order.telephone}</a>
          </div>
        </div>

        <div className="flex gap-2">
          {order.lien_localisation && (
            <a
              href={order.lien_localisation}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 text-center hover:bg-slate-50 transition-colors"
            >
              📍 Maps
            </a>
          )}
          <button
            onClick={accept}
            disabled={loading || done}
            className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Carte livraison en cours ──────────────────────────────────────────────────
function ActiveCard({ order, onAction }: { order: DeliveryOrder; onAction: () => void }) {
  const [loadingDeliver, setLoadingDeliver] = useState(false);
  const [showFail,       setShowFail]       = useState(false);
  const [failNote,       setFailNote]       = useState("");
  const [loadingFail,    setLoadingFail]    = useState(false);

  async function deliver() {
    setLoadingDeliver(true);
    try {
      const res = await fetch(`/api/livreur/orders/${order.id}/deliver`, { method: "PATCH" });
      if (res.ok) setTimeout(onAction, 400);
    } finally { setLoadingDeliver(false); }
  }

  async function fail() {
    if (!failNote.trim()) return;
    setLoadingFail(true);
    try {
      const res = await fetch(`/api/livreur/orders/${order.id}/fail`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ note: failNote }),
      });
      if (res.ok) setTimeout(onAction, 400);
    } finally { setLoadingFail(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-4 py-1.5 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-semibold text-blue-600">En cours de livraison</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-slate-900 text-sm">{order.nom || "Client"}</p>
            <p className="text-xs text-slate-400">{order.reference}</p>
          </div>
          <span className="text-sm font-bold text-slate-600">{order.total?.toLocaleString()} FCFA</span>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">{order.adresse || "—"}<span className="text-slate-400"> · {order.zone_livraison}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <a href={`tel:${order.telephone}`} className="text-sm text-blue-600 font-medium">{order.telephone}</a>
          </div>
        </div>

        {showFail ? (
          <div className="space-y-2">
            <textarea
              value={failNote}
              onChange={e => setFailNote(e.target.value)}
              placeholder="Raison de non-livraison (ex: client absent, adresse introuvable…)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-red-400"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowFail(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                Annuler
              </button>
              <button
                onClick={fail}
                disabled={!failNote.trim() || loadingFail}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {loadingFail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirmer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {order.lien_localisation && (
              <a
                href={order.lien_localisation}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                📍
              </a>
            )}
            <button
              onClick={() => setShowFail(true)}
              className="flex-1 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Non livré
            </button>
            <button
              onClick={deliver}
              disabled={loadingDeliver}
              className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
            >
              {loadingDeliver ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Livré
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Carte historique ──────────────────────────────────────────────────────────
function HistoryCard({ order }: { order: DeliveryOrder }) {
  const isOk = order.livraison_statut === "livre";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOk ? "bg-green-100" : "bg-red-100"}`}>
        {isOk
          ? <CheckCircle2 className="w-5 h-5 text-green-600" />
          : <XCircle      className="w-5 h-5 text-red-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-900 text-sm truncate">{order.nom || "Client"}</p>
          <span className="text-xs text-slate-400 shrink-0">{formatDate(order.created_at)}</span>
        </div>
        <p className="text-xs text-slate-400 truncate">{order.reference} · {order.zone_livraison}</p>
        {!isOk && order.livraison_note && (
          <p className="text-xs text-red-500 mt-1 truncate">{order.livraison_note}</p>
        )}
      </div>
      <span className={`text-xs font-bold shrink-0 ${isOk ? "text-green-600" : "text-red-500"}`}>
        {isOk ? "+"+order.delivery_fee?.toLocaleString() : "Échec"}
      </span>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function LivreurPage() {
  const [tab,       setTab]       = useState<Tab>("available");
  const [available, setAvailable] = useState<DeliveryOrder[]>([]);
  const [mine,      setMine]      = useState<DeliveryOrder[]>([]);
  const [history,   setHistory]   = useState<DeliveryOrder[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [lastSync,  setLastSync]  = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [avRes, myRes, hiRes, stRes] = await Promise.allSettled([
        fetch("/api/livreur/orders/available").then(r => r.json()),
        fetch("/api/livreur/orders/mine").then(r => r.json()),
        fetch("/api/livreur/orders/history").then(r => r.json()),
        fetch("/api/livreur/stats").then(r => r.json()),
      ]);
      if (avRes.status === "fulfilled") setAvailable(avRes.value.data ?? []);
      if (myRes.status === "fulfilled") setMine(myRes.value.data ?? []);
      if (hiRes.status === "fulfilled") setHistory(hiRes.value.data ?? []);
      if (stRes.status === "fulfilled") setStats(stRes.value);
      setLastSync(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const t = setInterval(fetchAll, 60_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "available", label: "Disponibles", count: available.length },
    { key: "mine",      label: "En cours",    count: mine.length },
    { key: "history",   label: "Historique",  count: history.length },
  ];

  return (
    <div className="space-y-4">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Aujourd&apos;hui</p>
            <p className="text-3xl font-bold text-slate-900">{stats.today}</p>
            <p className="text-xs text-slate-400 mt-0.5">livraison{stats.today > 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Cette semaine</p>
            <p className="text-3xl font-bold text-slate-900">{stats.week}</p>
            <p className="text-xs text-slate-400 mt-0.5">livraison{stats.week > 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total livré</p>
            <p className="text-3xl font-bold text-green-600">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">toutes périodes</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Taux réussite</p>
            <p className="text-3xl font-bold text-slate-900">{stats.tauxReussite}%</p>
            <p className="text-xs text-slate-400 mt-0.5">sur {stats.total + (stats.tauxReussite < 100 ? 1 : 0)} missions</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                tab === t.key
                  ? t.key === "available" ? "bg-green-500 text-white"
                  : t.key === "mine"      ? "bg-blue-500 text-white"
                  : "bg-slate-200 text-slate-600"
                  : "bg-slate-200 text-slate-600"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {lastSync ? `Mis à jour ${timeAgo(lastSync.toISOString())}` : "Chargement…"}
        </p>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Content */}
      {tab === "available" && (
        <div className="space-y-3">
          {available.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
              <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-sm">Aucune livraison disponible</p>
              <p className="text-xs text-slate-400 mt-1">Revenez dans quelques minutes</p>
            </div>
          )}
          {available.map(o => (
            <AvailableCard key={o.id} order={o} onAccept={fetchAll} />
          ))}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {mine.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
              <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-sm">Aucune livraison en cours</p>
              <p className="text-xs text-slate-400 mt-1">Acceptez une livraison dans l&apos;onglet Disponibles</p>
            </div>
          )}
          {mine.map(o => (
            <ActiveCard key={o.id} order={o} onAction={fetchAll} />
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
              <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-sm">Pas encore d&apos;historique</p>
              <p className="text-xs text-slate-400 mt-1">Vos livraisons terminées apparaîtront ici</p>
            </div>
          )}
          {history.map(o => (
            <HistoryCard key={o.id} order={o} />
          ))}
        </div>
      )}

      {/* Bottom padding for mobile */}
      <div className="h-4" />
    </div>
  );
}
