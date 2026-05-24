"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Store, Users, Package, TrendingUp,
  CheckCircle, XCircle, RefreshCw, ChevronDown,
  Shield, BarChart2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// ── Types ──────────────────────────────────────────────────────────────────
interface ShopRow {
  id:            number;
  nom:           string;
  slug:          string;
  email:         string;
  plan:          "free" | "basic" | "pro";
  plan_limit:    string;
  actif:         boolean;
  product_count: number;
  admin_count:   number;
  created_at:    string;
}

interface Stats {
  total_shops:    number;
  active_shops:   number;
  plan_free:      number;
  plan_basic:     number;
  plan_pro:       number;
  total_products: number;
  total_admins:   number;
}

// ── Plan badge ─────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free:  "bg-gray-100 text-gray-600",
    basic: "bg-blue-100 text-blue-700",
    pro:   "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${styles[plan] ?? styles.free}`}>
      {plan}
    </span>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ actif }: { actif: boolean }) {
  return actif
    ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} />Actif</span>
    : <span className="inline-flex items-center gap-1 text-xs text-red-500"><XCircle size={12} />Suspendu</span>;
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function SaasDashboardPage() {
  const [shops,   setShops]   = useState<ShopRow[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState<number | null>(null); // shop id being saved

  // Plan dropdown state per row
  const [editPlan, setEditPlan] = useState<Record<number, string>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopsRes, statsRes] = await Promise.all([
        fetch(`${API}/api/admin/saas/shops`,  { credentials: "include" }),
        fetch(`${API}/api/admin/saas/stats`,  { credentials: "include" }),
      ]);
      if (shopsRes.status === 403) {
        setError("Accès réservé au super-admin.");
        return;
      }
      const shopsData = await shopsRes.json();
      const statsData = await statsRes.json();
      setShops(shopsData.shops ?? []);
      setStats(statsData);
      // Init plan edit state
      const planMap: Record<number, string> = {};
      (shopsData.shops ?? []).forEach((s: ShopRow) => { planMap[s.id] = s.plan; });
      setEditPlan(planMap);
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function patchShop(id: number, data: Record<string, unknown>) {
    setSaving(id);
    try {
      const res = await fetch(`${API}/api/admin/saas/shops/${id}`, {
        method:      "PATCH",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      // Optimistic update
      setShops(prev => prev.map(s =>
        s.id === id ? { ...s, ...data } : s
      ));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(null);
    }
  }

  function handlePlanChange(id: number, plan: string) {
    setEditPlan(prev => ({ ...prev, [id]: plan }));
  }

  async function savePlan(id: number) {
    await patchShop(id, { plan: editPlan[id] });
  }

  function toggleActif(shop: ShopRow) {
    if (!confirm(`${shop.actif ? "Suspendre" : "Réactiver"} la boutique "${shop.nom}" ?`)) return;
    patchShop(shop.id, { actif: !shop.actif });
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-md">
          <Shield size={40} className="mx-auto text-red-400 mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={24} className="text-indigo-600" />
            Super-admin — Toutes les boutiques
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les plans et le statut de chaque boutique.</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Boutiques actives"  value={stats.active_shops}   icon={Store}     color="bg-indigo-500" />
          <StatCard label="Produits total"     value={stats.total_products}  icon={Package}   color="bg-blue-500" />
          <StatCard label="Admins total"       value={stats.total_admins}    icon={Users}     color="bg-violet-500" />
          <StatCard
            label="Plans payants"
            value={stats.plan_basic + stats.plan_pro}
            icon={TrendingUp}
            color="bg-emerald-500"
          />
        </div>
      )}

      {/* Plan distribution */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 flex gap-6 flex-wrap">
          <div className="text-sm text-gray-500">Distribution des plans :</div>
          <span className="text-sm"><span className="font-semibold text-gray-700">{stats.plan_free}</span> Gratuit</span>
          <span className="text-sm"><span className="font-semibold text-blue-700">{stats.plan_basic}</span> Basic</span>
          <span className="text-sm"><span className="font-semibold text-indigo-700">{stats.plan_pro}</span> Pro</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Store size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune boutique</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Boutique</th>
                  <th className="text-left px-4 py-3">Slug</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-center px-4 py-3">Produits</th>
                  <th className="text-center px-4 py-3">Admins</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-left px-4 py-3">Créée le</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(shop => (
                  <tr key={shop.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{shop.nom}</div>
                      <div className="text-xs text-gray-400">{shop.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{shop.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Inline plan selector */}
                        <div className="relative">
                          <select
                            value={editPlan[shop.id] ?? shop.plan}
                            onChange={e => handlePlanChange(shop.id, e.target.value)}
                            disabled={saving === shop.id}
                            className="appearance-none text-xs font-semibold border border-gray-200 rounded-md pl-2 pr-6 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                          >
                            <option value="free">Gratuit</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        {editPlan[shop.id] !== shop.plan && (
                          <button
                            onClick={() => savePlan(shop.id)}
                            disabled={saving === shop.id}
                            className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                          >
                            Sauver
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">max {shop.plan_limit}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Package size={12} className="text-gray-400" />
                        {shop.product_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} className="text-gray-400" />
                        {shop.admin_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge actif={shop.actif} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(shop.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {shop.id !== 1 && (
                        <button
                          onClick={() => toggleActif(shop)}
                          disabled={saving === shop.id}
                          className={`text-xs px-3 py-1 rounded-md border transition disabled:opacity-50 ${
                            shop.actif
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {saving === shop.id ? "..." : shop.actif ? "Suspendre" : "Réactiver"}
                        </button>
                      )}
                      {shop.id === 1 && (
                        <span className="text-xs text-gray-300">Défaut</span>
                      )}
                    </td>
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
