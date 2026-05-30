'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Store, Users, Package, TrendingUp,
  RefreshCw, Shield, CreditCard, Clock, Search,
} from 'lucide-react';
import s from './SuperAdmin.module.css';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

// ── Types ──────────────────────────────────────────────────────────────────
interface ShopRow {
  id:            number;
  nom:           string;
  slug:          string;
  email:         string;
  plan:          'free' | 'basic' | 'pro';
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

interface PendingPayment {
  id:              number;
  shop_id:         number;
  shop_nom:        string;
  shop_slug:       string;
  shop_email:      string;
  plan:            'basic' | 'pro';
  amount:          number;
  duration_months: number;
  operator:        'moov' | 'yas' | null;
  mm_reference:    string | null;
  created_at:      string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function fmtDatetime(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function initials(nom: string) {
  return nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const cls = plan === 'pro' ? s.planPro : plan === 'basic' ? s.planBasic : s.planFree;
  return <span className={`${s.planBadge} ${cls}`}>{plan}</span>;
}

function StatusBadge({ actif }: { actif: boolean }) {
  return (
    <span className={`${s.statusBadge} ${actif ? s.statusOk : s.statusOff}`}>
      <span className={s.statusDot} />
      {actif ? 'Actif' : 'Suspendu'}
    </span>
  );
}

function KpiCard({
  label, value, sub, dotColor, icon: Icon,
}: {
  label: string; value: number | string; sub?: string;
  dotColor: string; icon: React.ElementType;
}) {
  return (
    <div className={s.kpi}>
      <div className={s.kpiHead}>
        <span className={s.kpiLabel}>{label}</span>
        <span className={s.kpiDot} style={{ background: dotColor }} />
      </div>
      <div className={s.kpiValue}>{value}</div>
      <div className={s.kpiFoot}>
        <span className={s.kpiSub}>{sub}</span>
        <Icon size={14} style={{ color: dotColor, opacity: .6 }} />
      </div>
    </div>
  );
}

function PlanDistribution({ stats }: { stats: Stats }) {
  const total = Math.max(stats.total_shops, 1);
  const freePct  = Math.round((stats.plan_free  / total) * 100);
  const basicPct = Math.round((stats.plan_basic / total) * 100);
  const proPct   = Math.round((stats.plan_pro   / total) * 100);
  return (
    <div className={s.planCard}>
      <span className={s.planCardLabel}>Distribution des plans</span>
      <div className={s.planItems}>
        <div className={s.planItem}>
          <div className={s.planBar}>
            <div className={s.planBarTrack}>
              <div className={`${s.planBarFill} ${s.planBarFree}`} style={{ width: `${freePct}%` }} />
            </div>
          </div>
          <span className={s.planItemCount} style={{ color: 'var(--muted)' }}>{stats.plan_free}</span>
          <span className={s.planItemLabel}>Gratuit</span>
        </div>
        <div className={s.planItem}>
          <div className={s.planBar}>
            <div className={s.planBarTrack}>
              <div className={`${s.planBarFill} ${s.planBarBasic}`} style={{ width: `${basicPct}%` }} />
            </div>
          </div>
          <span className={s.planItemCount} style={{ color: 'var(--blue)' }}>{stats.plan_basic}</span>
          <span className={s.planItemLabel}>Basic</span>
        </div>
        <div className={s.planItem}>
          <div className={s.planBar}>
            <div className={s.planBarTrack}>
              <div className={`${s.planBarFill} ${s.planBarPro}`} style={{ width: `${proPct}%` }} />
            </div>
          </div>
          <span className={s.planItemCount} style={{ color: 'var(--purple)' }}>{stats.plan_pro}</span>
          <span className={s.planItemLabel}>Pro</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface DashboardProps {
  view:             'overview' | 'shops' | 'payments';
  onPendingCount?:  (n: number) => void;
}

export default function SuperAdminDashboard({ view, onPendingCount }: DashboardProps) {
  const [shops,     setShops]     = useState<ShopRow[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [pending,   setPending]   = useState<PendingPayment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [saving,    setSaving]    = useState<number | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);
  const [search,    setSearch]    = useState('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [editPlan,  setEditPlan]  = useState<Record<number, string>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [shopsRes, statsRes, paymentsRes] = await Promise.all([
        fetch(`${API}/api/admin/saas/shops`,    { credentials: 'include' }),
        fetch(`${API}/api/admin/saas/stats`,    { credentials: 'include' }),
        fetch(`${API}/api/admin/saas/payments`, { credentials: 'include' }),
      ]);
      if (shopsRes.status === 403) { setError('Accès réservé au super-admin.'); return; }
      const [shopsData, statsData, paymentsData] = await Promise.all([
        shopsRes.json(), statsRes.json(), paymentsRes.json(),
      ]);
      const shopList = shopsData.shops ?? [];
      setShops(shopList);
      setStats(statsData);
      const payments = paymentsData.payments ?? [];
      setPending(payments);
      onPendingCount?.(payments.length);
      const planMap: Record<number, string> = {};
      shopList.forEach((sh: ShopRow) => { planMap[sh.id] = sh.plan; });
      setEditPlan(planMap);
    } catch {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, [onPendingCount]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function patchShop(id: number, data: Record<string, unknown>) {
    setSaving(id);
    try {
      const res  = await fetch(`${API}/api/admin/saas/shops/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erreur');
      setShops(prev => prev.map(sh => sh.id === id ? { ...sh, ...data } : sh));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.');
    } finally { setSaving(null); }
  }

  async function savePlan(id: number) {
    const newPlan = editPlan[id];
    await patchShop(id, { plan: newPlan });
    setShops(prev => prev.map(sh => sh.id === id ? { ...sh, plan: newPlan as ShopRow['plan'] } : sh));
  }

  function toggleActif(shop: ShopRow) {
    if (!confirm(`${shop.actif ? 'Suspendre' : 'Réactiver'} la boutique "${shop.nom}" ?`)) return;
    patchShop(shop.id, { actif: !shop.actif });
  }

  async function approvePayment(id: number) {
    setActioning(id);
    try {
      const res  = await fetch(`${API}/api/admin/saas/payments/${id}/approve`, {
        method: 'PATCH', credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erreur');
      await fetchAll();
    } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
    finally { setActioning(null); }
  }

  async function rejectPayment(id: number) {
    if (!confirm('Rejeter ce paiement ? Cette action est irréversible.')) return;
    setActioning(id);
    try {
      await fetch(`${API}/api/admin/saas/payments/${id}/reject`, {
        method: 'PATCH', credentials: 'include',
      });
      await fetchAll();
    } catch { /* ignore */ }
    finally { setActioning(null); }
  }

  // Filtered shops
  const filteredShops = shops.filter(sh => {
    const matchSearch = !search ||
      sh.nom.toLowerCase().includes(search.toLowerCase()) ||
      sh.email.toLowerCase().includes(search.toLowerCase()) ||
      sh.slug.toLowerCase().includes(search.toLowerCase());
    const matchPlan = !planFilter || sh.plan === planFilter;
    return matchSearch && matchPlan;
  });

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={s.wrap}>
        <div className={s.errorWrap}>
          <div className={s.errorCard}>
            <Shield size={40} style={{ color: 'var(--danger)', opacity: .5 }} />
            <p className={s.errorTitle}>{error}</p>
            <button className={s.btn} onClick={fetchAll}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={s.wrap}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.eyebrow}>Plateforme SaaS</span>
          <h1 className={s.title}>
            {view === 'overview' ? 'Tableau de bord'
              : view === 'shops' ? 'Boutiques'
              : 'Paiements en attente'}
          </h1>
          <p className={s.subtitle}>
            {view === 'overview' ? 'KPIs globaux et distribution des plans'
              : view === 'shops' ? 'Gestion des boutiques, plans et suspension'
              : 'Validation manuelle des paiements Mobile Money'}
          </p>
        </div>
        <div className={s.headerActions}>
          <button className={s.btn} onClick={fetchAll} disabled={loading}>
            <RefreshCw size={14} className={loading ? s.spin : undefined} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      {stats && (
        <div className={s.kpis}>
          <KpiCard
            label="Boutiques actives"
            value={stats.active_shops}
            sub={`${stats.total_shops} total`}
            dotColor="var(--ok)"
            icon={Store}
          />
          <KpiCard
            label="Produits enregistrés"
            value={stats.total_products}
            sub="tous espaces confondus"
            dotColor="var(--blue)"
            icon={Package}
          />
          <KpiCard
            label="Administrateurs"
            value={stats.total_admins}
            sub="tous rôles"
            dotColor="var(--purple)"
            icon={Users}
          />
          <KpiCard
            label="Plans payants"
            value={stats.plan_basic + stats.plan_pro}
            sub={`${stats.plan_free} gratuits`}
            dotColor="var(--warn)"
            icon={TrendingUp}
          />
        </div>
      )}

      {/* ── Overview: plan distribution ─────────────────────────────── */}
      {view === 'overview' && stats && (
        <div className={s.planSection}>
          <PlanDistribution stats={stats} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VIEW: BOUTIQUES
         ══════════════════════════════════════════════════════════════ */}
      {view === 'shops' && (
        <>
          {/* Sub-toolbar */}
          <div className={s.subToolbar}>
            <div className={s.searchBox}>
              <Search size={13} style={{ color: 'var(--muted-2)', flexShrink: 0 }} />
              <input
                placeholder="Rechercher une boutique…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {['', 'free', 'basic', 'pro'].map(p => (
              <button
                key={p}
                className={`${s.chip} ${planFilter === p ? s.chipActive : ''}`}
                onClick={() => setPlanFilter(p)}
              >
                {p === '' ? 'Tous les plans' : p === 'free' ? 'Gratuit' : p === 'basic' ? 'Basic' : 'Pro'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className={s.tableWrap}>
            {loading ? (
              <div className={s.loadingWrap}>
                <RefreshCw size={18} className={s.spin} style={{ color: 'var(--muted-2)' }} />
                Chargement…
              </div>
            ) : filteredShops.length === 0 ? (
              <div className={s.empty}>
                <Store size={40} className={s.emptyIcon} />
                <p className={s.emptyTitle}>Aucune boutique trouvée</p>
                <p className={s.emptyText}>Modifiez vos filtres ou créez une première boutique.</p>
              </div>
            ) : (
              <>
                <div className={s.tableScroll}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Boutique</th>
                        <th>Slug</th>
                        <th>Plan</th>
                        <th className={s.center}>Produits</th>
                        <th className={s.center}>Admins</th>
                        <th>Statut</th>
                        <th>Créée le</th>
                        <th className={s.right}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShops.map(shop => {
                        const planChanged = editPlan[shop.id] !== shop.plan;
                        return (
                          <tr key={shop.id}>
                            {/* Boutique */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 9,
                                  background: 'var(--accent-bg)', color: 'var(--accent)',
                                  display: 'grid', placeItems: 'center',
                                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                                }}>
                                  {initials(shop.nom)}
                                </div>
                                <div>
                                  <div className={s.cellName}>{shop.nom}</div>
                                  <div className={s.cellSub}>{shop.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Slug */}
                            <td>
                              <span className={s.code}>{shop.slug}</span>
                            </td>

                            {/* Plan */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <select
                                  className={s.planSelect}
                                  value={editPlan[shop.id] ?? shop.plan}
                                  onChange={e => setEditPlan(prev => ({ ...prev, [shop.id]: e.target.value }))}
                                  disabled={saving === shop.id}
                                >
                                  <option value="free">Gratuit</option>
                                  <option value="basic">Basic</option>
                                  <option value="pro">Pro</option>
                                </select>
                                {planChanged && (
                                  <button
                                    className={s.planSaveLink}
                                    onClick={() => savePlan(shop.id)}
                                    disabled={saving === shop.id}
                                  >
                                    {saving === shop.id ? '…' : 'Sauver'}
                                  </button>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 3 }}>
                                max {shop.plan_limit}
                              </div>
                            </td>

                            {/* Produits */}
                            <td className={s.center}>
                              <span className={s.mono} style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                                {shop.product_count}
                              </span>
                            </td>

                            {/* Admins */}
                            <td className={s.center}>
                              <span className={s.mono} style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                                {shop.admin_count}
                              </span>
                            </td>

                            {/* Statut */}
                            <td><StatusBadge actif={shop.actif} /></td>

                            {/* Créée le */}
                            <td>
                              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                                {fmtDate(shop.created_at)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className={s.right}>
                              {shop.id === 1 ? (
                                <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Système</span>
                              ) : (
                                <button
                                  className={`${s.btn} ${s.btnSm} ${shop.actif ? s.btnDanger : s.btnOk}`}
                                  onClick={() => toggleActif(shop)}
                                  disabled={saving === shop.id}
                                >
                                  {saving === shop.id ? '…' : shop.actif ? 'Suspendre' : 'Réactiver'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className={s.tableFoot}>
                  <span>{filteredShops.length} boutique{filteredShops.length > 1 ? 's' : ''}</span>
                  <span style={{ color: 'var(--ok)' }}>{shops.filter(sh => sh.actif).length} actives</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VIEW: PAIEMENTS EN ATTENTE
         ══════════════════════════════════════════════════════════════ */}
      {view === 'payments' && (
        <div className={s.tableWrap} style={{ marginTop: 20 }}>
          {pending.length === 0 ? (
            <div className={s.empty}>
              <Clock size={40} className={s.emptyIcon} />
              <p className={s.emptyTitle}>Aucun paiement en attente</p>
              <p className={s.emptyText}>Tous les paiements ont été traités.</p>
            </div>
          ) : (
            <>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Boutique</th>
                      <th>Plan demandé</th>
                      <th className={s.center}>Durée</th>
                      <th className={s.right}>Montant</th>
                      <th>Opérateur</th>
                      <th>Référence SMS</th>
                      <th>Soumis le</th>
                      <th className={s.right}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(p => (
                      <tr key={p.id}>
                        {/* Boutique */}
                        <td>
                          <div className={s.cellName}>{p.shop_nom}</div>
                          <div className={s.cellSub}>{p.shop_email}</div>
                        </td>

                        {/* Plan */}
                        <td><PlanBadge plan={p.plan} /></td>

                        {/* Durée */}
                        <td className={s.center}>
                          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                            {p.duration_months} mois
                          </span>
                        </td>

                        {/* Montant */}
                        <td className={s.right}>
                          <span className={s.amount}>{formatPrice(p.amount)}</span>
                        </td>

                        {/* Opérateur */}
                        <td>
                          {p.operator ? (
                            <span className={s.amberBadge} style={{ textTransform: 'capitalize' }}>
                              {p.operator}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted-2)' }}>—</span>
                          )}
                        </td>

                        {/* Référence */}
                        <td>
                          {p.mm_reference
                            ? <span className={s.ref}>{p.mm_reference}</span>
                            : <span style={{ color: 'var(--muted-2)' }}>—</span>
                          }
                        </td>

                        {/* Date */}
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {fmtDatetime(p.created_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className={s.right}>
                          <div className={s.actionGroup}>
                            <button
                              className={`${s.btn} ${s.btnSm} ${s.btnOk}`}
                              onClick={() => approvePayment(p.id)}
                              disabled={actioning === p.id}
                            >
                              {actioning === p.id ? '…' : '✓ Valider'}
                            </button>
                            <button
                              className={`${s.btn} ${s.btnSm} ${s.btnDanger}`}
                              onClick={() => rejectPayment(p.id)}
                              disabled={actioning === p.id}
                            >
                              Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={s.tableFoot}>
                <span>{pending.length} paiement{pending.length > 1 ? 's' : ''} en attente de validation</span>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
