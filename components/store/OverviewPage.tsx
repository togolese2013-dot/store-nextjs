/**
 * OverviewPage — Store dashboard content
 * Mount via StoreShell (page id: 'overview').
 */
'use client';
import React, { useMemo, useState } from 'react';
import type { Order, DeliveryZone, Payment, StoreOrderStats } from './types';
import { ORDER_STATUS_STYLE, PAYMENT_METHOD_STYLE } from './sample-data';
import { SWATCHES, hashStr } from './api-mapping';
import OrderModal from './OrderModal';
import { DownloadIcon, PlusIcon } from './icons';
import { useUI } from '@/components/interaction-layer';
import styles from './Store.module.css';

interface OverviewPageProps {
  orders?: Order[];
  zones: DeliveryZone[];
  payments?: Payment[];
  stats?: StoreOrderStats;
  onOrderChanged: () => void;
  onViewAllOrders?: () => void;
}

function pct(current: number, previous: number): string | undefined {
  if (previous === 0) return current === 0 ? '0%' : undefined;
  const d = Math.round(((current - previous) / previous) * 100);
  return `${d >= 0 ? '+' : ''}${d}%`;
}

export default function OverviewPage({ orders = [], zones, payments = [], stats, onOrderChanged, onViewAllOrders }: OverviewPageProps) {
  const ui = useUI();
  const [createOpen, setCreateOpen] = useState(false);
  const totalCA = orders.reduce((s, o) => s + o.amount, 0);

  const panierMoyenMois = stats && stats.commandes_mois > 0 ? Math.round(stats.ca_mois / stats.commandes_mois) : 0;
  const tauxLivraison   = stats && stats.commandes_mois > 0 ? Math.round((stats.livrees_mois / stats.commandes_mois) * 100) : 0;

  const KPIS = [
    { label: 'CA du jour',         value: (stats?.ca_jour ?? 0).toLocaleString('fr-FR'), unit: 'F', delta: pct(stats?.ca_jour ?? 0, stats?.ca_hier ?? 0),    sub: 'vs hier' },
    { label: 'Commandes en cours', value: String(stats?.commandes_en_cours ?? 0),                                                                            sub: 'en attente / confirmées' },
    { label: 'Panier moyen',       value: panierMoyenMois.toLocaleString('fr-FR'), unit: 'F',                                                                sub: 'ce mois' },
    { label: 'Taux de livraison',  value: String(tauxLivraison), unit: '%',                                                                                  sub: 'commandes livrées ce mois' },
  ];

  /* Top produits — agrégés depuis les articles des commandes récentes */
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; ca: number }>();
    for (const o of orders) {
      if (o.status === 'Annulée') continue;
      for (const item of o.items ?? []) {
        const cur = map.get(item.nom) ?? { name: item.nom, qty: 0, ca: 0 };
        cur.qty += item.qty;
        cur.ca  += item.qty * item.prix;
        map.set(item.nom, cur);
      }
    }
    return [...map.values()]
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 5)
      .map(p => ({
        ...p,
        avg:   p.qty > 0 ? Math.round(p.ca / p.qty) : 0,
        color: SWATCHES[hashStr(p.name) % SWATCHES.length],
        init:  p.name.charAt(0).toUpperCase(),
      }));
  }, [orders]);

  /* Activité récente — dérivée des commandes les plus récentes */
  const activity = orders.slice(0, 6).map(o => ({
    label: `Commande ${o.ref} — ${o.status}`,
    time:  o.date,
    dot:   (ORDER_STATUS_STYLE[o.status]?.color as string) ?? 'var(--muted)',
  }));

  /* Modes de paiement — dérivés des paiements (méthode non détaillée, cf. Paiements) */
  const payMethods = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of payments) totals.set(p.method, (totals.get(p.method) ?? 0) + p.amount);
    const sum = [...totals.values()].reduce((s, v) => s + v, 0);
    return [...totals.entries()].map(([name, amount]) => ({
      name, amount,
      pct:   sum > 0 ? Math.round((amount / sum) * 100) : 0,
      color: (PAYMENT_METHOD_STYLE[name]?.color as string) ?? 'var(--muted)',
    }));
  }, [payments]);

  return (
    <>
      {createOpen && (
        <OrderModal
          mode="create"
          zones={zones}
          onClose={() => setCreateOpen(false)}
          onSaved={onOrderChanged}
        />
      )}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Aperçu</div>
          <h1 className={styles.title}>Vue d&apos;<span className={styles.serif}>ensemble</span></h1>
          <p className={styles.subtitle}>E-commerce · {orders.length} commande{orders.length !== 1 ? 's' : ''} · {totalCA.toLocaleString('fr-FR')} F de CA</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Commandes')}><DownloadIcon size={14} /> Rapport</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setCreateOpen(true)}>
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

      <div className={styles.ovGrid}>
        {/* Recent orders */}
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>
            Commandes récentes
            <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={onViewAllOrders}>Voir tout</button>
          </div>
          <table className={styles.miniTable}>
            <thead><tr><th>Réf.</th><th>Client</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.ref}>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 500 }}>{o.ref}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 99, background: o.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        {o.init}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{o.client}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{o.amount.toLocaleString('fr-FR')} F</td>
                  <td><span className={styles.tag} style={ORDER_STATUS_STYLE[o.status]}>{o.status}</span></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)', fontSize: 13 }}>Aucune commande</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className={styles.ovSide}>
          {/* Payment breakdown */}
          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>
              Modes de paiement
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>récent</span>
            </div>
            {payMethods.length === 0 && <div style={{ padding: '10px 0', color: 'var(--muted)', fontSize: 12.5 }}>Aucun paiement</div>}
            {payMethods.map(m => (
              <div key={m.name} className={styles.payRow}>
                <div className={styles.payName}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0, display: 'inline-block' }} />
                  {m.name}
                </div>
                <div className={styles.payBar}>
                  <div className={styles.payFill} style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
                <div className={styles.payPct}>{m.pct}%</div>
                <div className={styles.payAmt}>{m.amount.toLocaleString('fr-FR')} F</div>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>Activité récente</div>
            {activity.length === 0 && <div style={{ padding: '10px 0', color: 'var(--muted)', fontSize: 12.5 }}>Aucune activité</div>}
            {activity.map((a, i) => (
              <div key={i} className={styles.activityItem}>
                <div className={styles.activityDot} style={{ background: a.dot }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.3 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className={styles.ovBot}>
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>Top produits commandés</div>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>Produit</th>
                <th style={{ textAlign: 'right' }}>Qté vendue</th>
                <th style={{ textAlign: 'right' }}>CA généré</th>
                <th style={{ textAlign: 'right' }}>Panier moy.</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(p => (
                <tr key={p.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: p.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{p.init}</div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{p.qty}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 500 }}>{p.ca.toLocaleString('fr-FR')} F</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>{p.avg.toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)', fontSize: 13 }}>Aucun article vendu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
