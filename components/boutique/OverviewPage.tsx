/**
 * OverviewPage — Boutique daily cash dashboard
 * Mount via BoutiqueShell (page id: 'overview') or standalone.
 */
import React from 'react';
import type { Sale } from './types';
import {
  SAMPLE_SALES, SAMPLE_STOCK, OVERVIEW_KPIS,
  PAYMENT_STYLE, PAY_BREAKDOWN, TOP_PRODUCTS_TODAY,
} from './sample-data';
import Sparkline from './Sparkline';
import { PrinterIcon, PlusIcon, TrendIcon } from './icons';
import styles from './Boutique.module.css';

interface OverviewPageProps {
  sales?: Sale[];
  onNewSale?: () => void;
}

export default function OverviewPage({ sales = SAMPLE_SALES, onNewSale }: OverviewPageProps) {
  const lowStock = SAMPLE_STOCK.filter(p => p.boutique < p.seuil);
  const totalCA = sales.reduce((s, i) => s + i.amount, 0);
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Aperçu</div>
          <h1 className={styles.title}>Caisse du <span className={styles.serif}>jour</span></h1>
          <p className={styles.subtitle}>{today} · {sales.length} vente{sales.length !== 1 ? 's' : ''} · {totalCA.toLocaleString('fr-FR')} F encaissés</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><PrinterIcon size={14} /> Rapport journée</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onNewSale}>
            <PlusIcon size={14} /> Nouvelle vente
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
        {/* Sales today */}
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>
            Ventes du jour
            <button type="button" className={`${styles.btn} ${styles.sm}`}>Voir tout</button>
          </div>
          <table className={styles.miniTable}>
            <thead><tr><th>Heure</th><th>Client</th><th>Articles</th><th>Montant</th><th>Paiement</th></tr></thead>
            <tbody>
              {sales.slice(0, 5).map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>{s.time}</td>
                  <td>
                    {s.client === '—'
                      ? <span style={{ color: 'var(--muted)', fontSize: 13 }}>Anonyme</span>
                      : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 99, background: s.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{s.init}</div>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{s.client}</span>
                        </div>
                      )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.items}</td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 500 }}>{s.amount.toLocaleString('fr-FR')} F</td>
                  <td><span className={styles.tag} style={PAYMENT_STYLE[s.payment]}>{s.payment}</span></td>
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
              Paiements
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>aujourd&apos;hui</span>
            </div>
            {PAY_BREAKDOWN.map(m => (
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

          {/* Stock alerts */}
          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>Alertes</div>
            {lowStock.map(p => (
              <div key={p.sku} className={styles.eventItem}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
                    Stock : <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--danger)', fontWeight: 600 }}>{p.boutique}</span> / seuil {p.seuil}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products today */}
      <div className={styles.ovBot}>
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>Produits les plus vendus aujourd&apos;hui</div>
          <table className={styles.miniTable}>
            <thead><tr><th>Produit</th><th style={{ textAlign: 'right' }}>Qté vendue</th><th style={{ textAlign: 'right' }}>CA</th></tr></thead>
            <tbody>
              {TOP_PRODUCTS_TODAY.map(p => (
                <tr key={p.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: p.swatch, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{p.init}</div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{p.qty}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 500 }}>{p.ca.toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
