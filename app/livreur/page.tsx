"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin, Phone, Package, CheckCircle2, XCircle, Clock,
  TrendingUp, RefreshCw, AlertCircle, Truck,
  User, Hash, ChevronDown, ChevronUp, Star,
  Banknote, BarChart3, LogOut,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliveryOrder {
  id:               number;
  source:           "order" | "livraison";
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
  gainToday:    number;
  gainWeek:     number;
  gainTotal:    number;
}

interface Profile {
  nom:           string;
  telephone:     string | null;
  numero_plaque: string | null;
  poste:         string;
}

type Tab = "available" | "mine" | "history" | "profile";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(Math.round(n)); }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

function isUrgent(created_at: string) {
  return Date.now() - new Date(created_at).getTime() > 3 * 3_600_000; // > 3h
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onDone }: { msg: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

// ── Carte disponible ──────────────────────────────────────────────────────────

function AvailableCard({ order, onAccept, onToast }: {
  order:   DeliveryOrder;
  onAccept: () => void;
  onToast:  (msg: string, type: "success"|"error") => void;
}) {
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const urgent = isUrgent(order.created_at);

  async function accept() {
    setLoading(true);
    const src = order.source === "livraison" ? "?src=livraison" : "";
    try {
      const res = await fetch(`/api/livreur/orders/${order.id}/accept${src}`, { method: "PATCH" });
      if (res.ok) { onToast("Livraison acceptée !", "success"); setTimeout(onAccept, 500); }
      else { const d = await res.json(); onToast(d.error ?? "Erreur", "error"); }
    } catch { onToast("Erreur réseau", "error"); }
    finally { setLoading(false); }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${urgent ? "border-orange-300" : "border-slate-200"}`}>
      {urgent && (
        <div className="bg-orange-50 px-4 py-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="text-xs font-semibold text-orange-600">En attente depuis plus de 3h</span>
        </div>
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-slate-900">{order.nom || "Client"}</p>
              {order.source === "livraison" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-600">Boutique</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{order.reference} · {timeAgo(order.created_at)}</p>
          </div>
          {order.delivery_fee > 0 && (
            <span className="text-sm font-bold text-green-600 shrink-0 ml-2">{fmt(order.delivery_fee)} FCFA</span>
          )}
        </div>

        {/* Adresse */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">
              {order.adresse || "—"}
              {order.zone_livraison && <span className="text-slate-400"> · {order.zone_livraison}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <a href={`tel:${order.telephone}`} className="text-sm text-blue-600 font-medium">{order.telephone || "—"}</a>
          </div>
        </div>

        {/* Détails expandables */}
        {order.total > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Montant commande : <span className="font-semibold text-slate-700">{fmt(order.total)} FCFA</span>
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {order.lien_localisation && (
            <a href={order.lien_localisation} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <MapPin className="w-4 h-4" /> Maps
            </a>
          )}
          <a href={`tel:${order.telephone}`}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Phone className="w-4 h-4" />
          </a>
          <button onClick={accept} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            Prendre en charge
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Carte en cours ────────────────────────────────────────────────────────────

function ActiveCard({ order, onAction, onToast }: {
  order:   DeliveryOrder;
  onAction: () => void;
  onToast:  (msg: string, type: "success"|"error") => void;
}) {
  const [showFail,    setShowFail]    = useState(false);
  const [failNote,    setFailNote]    = useState("");
  const [ldDeliver,   setLdDeliver]   = useState(false);
  const [ldFail,      setLdFail]      = useState(false);
  const src = order.source === "livraison" ? "?src=livraison" : "";

  async function deliver() {
    setLdDeliver(true);
    try {
      const res = await fetch(`/api/livreur/orders/${order.id}/deliver${src}`, { method: "PATCH" });
      if (res.ok) { onToast("Livraison confirmée !", "success"); setTimeout(onAction, 400); }
      else { const d = await res.json(); onToast(d.error ?? "Erreur", "error"); }
    } catch { onToast("Erreur réseau", "error"); }
    finally { setLdDeliver(false); }
  }

  async function fail() {
    if (!failNote.trim()) return;
    setLdFail(true);
    try {
      const res = await fetch(`/api/livreur/orders/${order.id}/fail${src}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: failNote }),
      });
      if (res.ok) { onToast("Signalé comme non livré", "error"); setTimeout(onAction, 400); }
      else { const d = await res.json(); onToast(d.error ?? "Erreur", "error"); }
    } catch { onToast("Erreur réseau", "error"); }
    finally { setLdFail(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-blue-600">En cours · {timeAgo(order.created_at)}</span>
        </div>
        {order.source === "livraison" && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-600">Boutique</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-slate-900">{order.nom || "Client"}</p>
            <p className="text-xs text-slate-400">{order.reference}</p>
          </div>
          <span className="text-sm font-bold text-slate-700">{fmt(order.total)} FCFA</span>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">
              {order.adresse || "—"}
              {order.zone_livraison && <span className="text-slate-400"> · {order.zone_livraison}</span>}
            </p>
          </div>
          <a href={`tel:${order.telephone}`} className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-blue-600 font-medium">{order.telephone || "—"}</span>
          </a>
        </div>

        {showFail ? (
          <div className="space-y-2">
            <textarea value={failNote} onChange={e => setFailNote(e.target.value)} rows={3} autoFocus
              placeholder="Raison : client absent, adresse incorrecte, client injoignable…"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-red-400" />
            <div className="flex gap-2">
              <button onClick={() => { setShowFail(false); setFailNote(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">
                Annuler
              </button>
              <button onClick={fail} disabled={!failNote.trim() || ldFail}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5">
                {ldFail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirmer l&apos;échec
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {order.lien_localisation && (
              <a href={order.lien_localisation} target="_blank" rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                📍
              </a>
            )}
            <a href={`tel:${order.telephone}`}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <Phone className="w-4 h-4" />
            </a>
            <button onClick={() => setShowFail(true)}
              className="flex-1 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
              <XCircle className="w-4 h-4" /> Non livré
            </button>
            <button onClick={deliver} disabled={ldDeliver}
              className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
              {ldDeliver ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
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
  const ok = order.livraison_statut === "livre";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ok ? "bg-green-100" : "bg-red-100"}`}>
        {ok ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-900 text-sm truncate">{order.nom || "Client"}</p>
              {order.source === "livraison" && (
                <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-600 shrink-0">Boutique</span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{order.reference}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-xs font-bold ${ok ? "text-green-600" : "text-red-500"}`}>
              {ok ? (order.delivery_fee > 0 ? `+${fmt(order.delivery_fee)} FCFA` : "Livré") : "Échec"}
            </p>
            <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
          </div>
        </div>
        {order.adresse && <p className="text-xs text-slate-500 mt-1 truncate">📍 {order.adresse}</p>}
        {!ok && order.livraison_note && (
          <p className="text-xs text-red-500 mt-1 line-clamp-2">{order.livraison_note}</p>
        )}
      </div>
    </div>
  );
}

// ── Profil ────────────────────────────────────────────────────────────────────

function ProfileTab({ profile, stats }: { profile: Profile | null; stats: Stats | null }) {
  if (!profile) return (
    <div className="py-16 text-center text-slate-400 text-sm">Chargement…</div>
  );

  const successRate = stats?.tauxReussite ?? 0;
  const stars = Math.round(successRate / 20); // 0-5 stars

  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
            <Truck className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{profile.nom}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
              {profile.poste}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {profile.telephone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Téléphone</p>
                <a href={`tel:${profile.telephone}`} className="text-sm font-semibold text-blue-600">{profile.telephone}</a>
              </div>
            </div>
          )}
          {profile.numero_plaque && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Immatriculation</p>
                <p className="text-sm font-bold text-slate-900 font-mono tracking-widest">{profile.numero_plaque}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Performance</p>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-6 h-6 ${i <= stars ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
            ))}
            <span className="ml-2 text-sm font-bold text-slate-700">{stats.tauxReussite}% réussite</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
              <p className="text-xs text-slate-500 mt-0.5">Aujourd&apos;hui</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.week}</p>
              <p className="text-xs text-slate-500 mt-0.5">Cette semaine</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.total}</p>
              <p className="text-xs text-green-600 mt-0.5">Total livré</p>
            </div>
          </div>
        </div>
      )}

      {/* Gains */}
      {stats && (stats.gainToday > 0 || stats.gainWeek > 0 || stats.gainTotal > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Gains (frais de livraison)</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Aujourd&apos;hui</span>
              <span className="text-sm font-bold text-green-700">+{fmt(stats.gainToday)} FCFA</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Cette semaine</span>
              <span className="text-sm font-bold text-green-700">+{fmt(stats.gainWeek)} FCFA</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total cumulé</span>
              <span className="text-base font-bold text-green-700">+{fmt(stats.gainTotal)} FCFA</span>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <a href="/api/admin/auth/logout"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors">
        <LogOut className="w-4 h-4" /> Déconnexion
      </a>
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
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [lastSync,  setLastSync]  = useState<Date | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string, type: "success"|"error") => setToast({ msg, type }), []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [avRes, myRes, hiRes, stRes, prRes] = await Promise.allSettled([
        fetch("/api/livreur/orders/available").then(r => r.json()),
        fetch("/api/livreur/orders/mine").then(r => r.json()),
        fetch("/api/livreur/orders/history?limit=30").then(r => r.json()),
        fetch("/api/livreur/stats").then(r => r.json()),
        fetch("/api/livreur/profile").then(r => r.json()),
      ]);
      if (avRes.status === "fulfilled") setAvailable(avRes.value.data ?? []);
      if (myRes.status === "fulfilled") setMine(myRes.value.data ?? []);
      if (hiRes.status === "fulfilled") setHistory(hiRes.value.data ?? []);
      if (stRes.status === "fulfilled") setStats(stRes.value);
      if (prRes.status === "fulfilled") setProfile(prRes.value);
      setLastSync(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 45 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchAll(true), 45_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  // Switch to En cours tab if I just accepted a delivery
  const handleAccepted = useCallback(() => {
    fetchAll(true);
    setTab("mine");
  }, [fetchAll]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "available", label: "Dispo",      icon: Package,     count: available.length },
    { key: "mine",      label: "En cours",   icon: Truck,       count: mine.length },
    { key: "history",   label: "Historique", icon: BarChart3 },
    { key: "profile",   label: "Profil",     icon: User },
  ];

  return (
    <div className="space-y-4 pb-6">

      {/* ── Stats du jour ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Livraisons</p>
              <Truck className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.today}</p>
            <p className="text-xs text-slate-400 mt-0.5">aujourd&apos;hui · {stats.week} cette sem.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Réussite</p>
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.tauxReussite}%</p>
            <p className="text-xs text-slate-400 mt-0.5">{stats.total} livrée{stats.total > 1 ? "s" : ""} au total</p>
          </div>
          {stats.gainToday > 0 && (
            <div className="bg-green-50 rounded-2xl border border-green-100 p-4 col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Gains aujourd&apos;hui</p>
                  <p className="text-2xl font-bold text-green-700 mt-0.5">+{fmt(stats.gainToday)} FCFA</p>
                </div>
                <Banknote className="w-8 h-8 text-green-300" />
              </div>
            </div>
          )}
          {stats.enCours > 0 && (
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-sm font-semibold text-blue-700">{stats.enCours} livraison{stats.enCours > 1 ? "s" : ""} en cours</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-0.5 relative ${
              tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                t.key === "available" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Refresh bar ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {lastSync ? `Actualisé ${timeAgo(lastSync.toISOString())}` : "Chargement…"}
        </p>
        <button onClick={() => fetchAll()} disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* ── Contenu ── */}

      {tab === "available" && (
        <div className="space-y-3">
          {available.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center">
              <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-sm">Aucune livraison disponible</p>
              <p className="text-xs text-slate-400 mt-1">L&apos;actualisation est automatique toutes les 45 secondes</p>
            </div>
          ) : available.map(o => (
            <AvailableCard key={`${o.source}-${o.id}`} order={o} onAccept={handleAccepted} onToast={showToast} />
          ))}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {mine.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center">
              <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-sm">Aucune livraison en cours</p>
              <p className="text-xs text-slate-400 mt-1">Prenez une livraison dans l&apos;onglet Disponibles</p>
            </div>
          ) : mine.map(o => (
            <ActiveCard key={`${o.source}-${o.id}`} order={o} onAction={() => fetchAll(true)} onToast={showToast} />
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center">
              <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-sm">Pas encore d&apos;historique</p>
              <p className="text-xs text-slate-400 mt-1">Vos livraisons terminées apparaîtront ici</p>
            </div>
          ) : history.map(o => (
            <HistoryCard key={`${o.source}-${o.id}`} order={o} />
          ))}
        </div>
      )}

      {tab === "profile" && (
        <ProfileTab profile={profile} stats={stats} />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
