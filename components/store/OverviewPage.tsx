/**
 * OverviewPage — Store dashboard content
 * Mount via StoreShell (page id: 'overview') or standalone.
 */
import React from 'react';
import type { Order } from './types';
import {
  SAMPLE_ORDERS,
  OVERVIEW_KPIS, ORDER_STATUS_STYLE,
} from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, TrendIcon } from './icons';
import styles from './Store.module.css';

interface OverviewPageProps {
  orders?: Order[];
  onCreateOrder?: () => void;
}

const TOP_PRODUCTS: { name: string; sku: string; qty: number; ca: number; avg: number; color: string; init: string }[] = [];
const ACTIVITY: { label: string; time: string; dot: string }[] = [];
const PAY_METHODS: { name: string; color: string; pct: number; amount: number }[] = [];

export default function OverviewPage({ orders = SAMPLE_ORDERS, onCreateOrder }: OverviewPageProps) {
  const totalCA = orders.reduce((s, o) => s + o.amount, 0);
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Aperçu</div>
          <h1 className={styles.title}>Vue d&apos;<span className={styles.serif}>ensemble</span></h1>
          <p className={styles.subtitle}>E-commerce · {orders.length} commande{orders.length !== 1 ? 's' : ''} · {totalCA.toLocaleString('fr-FR')} F de CA</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Rapport</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onCreateOrder}>
            <PlusIcon size={14} /> Nouvelle commande
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {OVERVIEW_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.sparkColor && <Sparkline data={k.spark} color={k.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.ovGrid}>
        {/* Recent orders */}
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>
            Commandes récentes
            <button type="button" className={`${styles.btn} ${styles.sm}`}>Voir tout</button>
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
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className={styles.ovSide}>
          {/* Payment breakdown */}
          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>
              Modes de paiement
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>ce mois</span>
            </div>
            {PAY_METHODS.map(m => (
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
            {ACTIVITY.map((a, i) => (
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
          <div className={styles.ovCardHead}>Top produits commandés ce mois</div>
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
              {TOP_PRODUCTS.map(p => (
                <tr key={p.sku}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: p.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{p.init}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted-2)' }}>{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{p.qty}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 500 }}>{p.ca.toLocaleString('fr-FR')} F</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>{p.avg.toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
