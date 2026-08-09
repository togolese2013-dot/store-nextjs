/**
 * CommandesPage — order management content (self-fetching, pagination réelle)
 * Mount via StoreShell (page id: 'commandes').
 */
'use client';
import React, { useCallback, useEffect, useState } from 'react';
import type { Order, DeliveryZone, StoreOrderStats } from './types';
import { ORDER_STATUS_STYLE } from './sample-data';
import { mapApiOrder } from './api-mapping';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon } from './icons';
import OrderModal from './OrderModal';
import { useUI } from '@/components/interaction-layer';
import styles from './Store.module.css';

const LIMIT = 25;

type TabId = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
const TAB_STATUS: Record<TabId, string | undefined> = {
  all: undefined, pending: 'pending', confirmed: 'confirmed',
  shipped: 'shipped', delivered: 'delivered', cancelled: 'cancelled',
};

function pct(current: number, previous: number): string | undefined {
  if (previous === 0) return current === 0 ? '0%' : undefined;
  const d = Math.round(((current - previous) / previous) * 100);
  return `${d >= 0 ? '+' : ''}${d}%`;
}

type ModalState = { mode: 'create' } | { mode: 'edit'; order: Order } | null;

export interface CommandesPageProps {
  zones: DeliveryZone[];
  stats?: StoreOrderStats;
  onOrderChanged: () => void;
}

export default function CommandesPage({ zones, stats, onOrderChanged }: CommandesPageProps) {
  const ui = useUI();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [modal, setModal]       = useState<ModalState>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const status = TAB_STATUS[activeTab];
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (status) qs.set('status', status);
      const res = await fetch(`/api/admin/orders?${qs.toString()}`).then(r => r.json());
      setOrders((res.data ?? []).map(mapApiOrder));
      setTotal(res.total ?? 0);
    } catch { /* keep current data */ }
  }, [page, activeTab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [activeTab]);

  function handleSaved() {
    fetchOrders();
    onOrderChanged();
  }

  const TABS: { id: TabId; label: string; count: number; warn?: boolean }[] = [
    { id: 'all',       label: 'Toutes',     count: stats?.total_toutes    ?? 0 },
    { id: 'pending',   label: 'En attente', count: stats?.total_pending   ?? 0, warn: true },
    { id: 'confirmed', label: 'Confirmées', count: stats?.total_confirmed ?? 0 },
    { id: 'shipped',   label: 'Expédiées',  count: stats?.total_shipped   ?? 0 },
    { id: 'delivered', label: 'Livrées',    count: stats?.total_delivered ?? 0 },
    { id: 'cancelled', label: 'Annulées',   count: stats?.total_cancelled ?? 0, warn: true },
  ];

  const panierMoyenMois     = stats && stats.commandes_mois > 0 ? Math.round(stats.ca_mois / stats.commandes_mois) : 0;
  const panierMoyenMoisPrec = stats && stats.commandes_mois_prec > 0 ? Math.round(stats.ca_mois_prec / stats.commandes_mois_prec) : 0;

  const KPIS = [
    { label: 'Commandes ce mois',  value: String(stats?.commandes_mois ?? 0),                       delta: pct(stats?.commandes_mois ?? 0, stats?.commandes_mois_prec ?? 0), sub: 'vs mois dernier' },
    { label: "Chiffre d'affaires", value: (stats?.ca_mois ?? 0).toLocaleString('fr-FR'), unit: 'F',  delta: pct(stats?.ca_mois ?? 0, stats?.ca_mois_prec ?? 0),               sub: 'vs mois dernier' },
    { label: 'En attente',         value: String(stats?.commandes_en_attente ?? 0),                                                                                            sub: "à traiter aujourd'hui" },
    { label: 'Panier moyen',       value: panierMoyenMois.toLocaleString('fr-FR'), unit: 'F',        delta: pct(panierMoyenMois, panierMoyenMoisPrec),                         sub: 'ce mois' },
  ];

  return (
    <>
      {modal && (
        <OrderModal
          mode={modal.mode}
          order={modal.mode === 'edit' ? modal.order : undefined}
          zones={zones}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Commandes</div>
          <h1 className={styles.title}>Gestion des <span className={styles.serif}>commandes</span></h1>
          <p className={styles.subtitle}>{total} commande{total !== 1 ? 's' : ''} · {stats?.commandes_en_attente ?? 0} en attente</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Commandes')}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setModal({ mode: 'create' })}>
            <PlusIcon size={14} /> Nouvelle commande
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        {TABS.map(t => (
          <button
            key={t.id} type="button"
            className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className={`${styles.pill} ${t.warn ? styles.warn : ''}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Date</th>
                <th>Zone</th>
                <th style={{ textAlign: 'right' }}>Produits</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.ref}>
                  <td>
                    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12.5, fontWeight: 500 }}>{o.ref}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 99, background: o.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                        {o.init}
                      </div>
                      <div className={styles.productName}>{o.client}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13, whiteSpace: 'nowrap' }}>{o.date}</td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{o.zone}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{o.products}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>
                    {o.amount.toLocaleString('fr-FR')} F
                  </td>
                  <td><span className={styles.tag} style={ORDER_STATUS_STYLE[o.status]}>{o.status}</span></td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu} onClick={() => setModal({ mode: 'edit', order: o })}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>Aucune commande</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>Affichage {orders.length} sur {total}</span>
          {total > LIMIT && (
            <div className={styles.pager}>
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
              <span className={styles.on}>{page}</span>
              <button type="button" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
