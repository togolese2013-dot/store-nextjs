/**
 * OverviewPage — Boutique daily cash dashboard
 * Mount via BoutiqueShell (page id: 'overview') or standalone.
 */
import React from 'react';
import type { Sale, OverviewStats, KpiItem } from './types';
import { SAMPLE_SALES, PAYMENT_STYLE } from './sample-data';
import Sparkline from './Sparkline';
import { PrinterIcon, PlusIcon, TrendIcon } from './icons';
import styles from './Boutique.module.css';
import { useBoutiqueConfig, fmtNum, fmtAmount } from './BoutiqueSettingsContext';
import { formatDate } from '@/lib/format-date';

const TOP_PRODUCT_SWATCHES = ['#3B6A8F', '#2D6A4F', '#C9601E', '#5C4A88', '#7A2C3A'];

function isToday(iso: string): boolean {
  try { return new Date(iso).toDateString() === new Date().toDateString(); }
  catch { return false; }
}

interface OverviewPageProps {
  sales?: Sale[];
  overviewStats?: OverviewStats;
  onNewSale?: () => void;
  onViewAllSales?: () => void;
}

export default function OverviewPage({ sales = SAMPLE_SALES, overviewStats, onNewSale, onViewAllSales }: OverviewPageProps) {
  const cfg = useBoutiqueConfig();
  const todaySales = sales.filter(s => isToday(s.isoDate));
  const paiementsJour   = overviewStats?.paiements_jour   ?? [];
  const topProduitsJour = overviewStats?.top_produits_jour ?? [];
  const stockAlertes    = overviewStats?.stock_alertes     ?? [];
  const today = formatDate(new Date());

  const jourCount   = overviewStats?.ventes_jour_count   ?? 0;
  const jourMontant = overviewStats?.ventes_jour_montant ?? 0;
  const panierMoyen = jourCount > 0 ? Math.round(jourMontant / jourCount) : 0;
  const clientsServis = overviewStats?.clients_servis_jour ?? 0;

  const KPIS: KpiItem[] = [
    {
      label: 'CA du jour', unit: cfg.symbol, sub: 'vs hier même heure', sparkColor: '#C9601E',
      value: fmtNum(jourMontant, cfg),
    },
    {
      label: 'Ventes du jour', sub: 'vs hier', sparkColor: '#3B6A8F',
      value: String(jourCount),
    },
    {
      label: 'Clients servis', sub: "aujourd'hui", sparkColor: '#5C4A88',
      value: String(clientsServis),
    },
    {
      label: 'Panier moyen', unit: cfg.symbol, sub: 'ce jour', sparkColor: '#2D6A4F',
      value: panierMoyen > 0 ? fmtNum(panierMoyen, cfg) : '—',
    },
  ];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Aperçu</div>
          <h1 className={styles.title}>Caisse du <span className={styles.serif}>jour</span></h1>
          <p className={styles.subtitle}>{today} · {jourCount} vente{jourCount !== 1 ? 's' : ''} · {fmtAmount(jourMontant, cfg)} encaissés</p>
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
        {KPIS.map(k => (
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
            <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={onViewAllSales}>Voir tout</button>
          </div>
          <table className={styles.miniTable}>
            <thead><tr><th>Heure</th><th>Client</th><th>Articles</th><th>Montant</th><th>Paiement</th></tr></thead>
            <tbody>
              {todaySales.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>Aucune vente aujourd&apos;hui</td></tr>
              )}
              {todaySales.slice(0, 5).map(s => (
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
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 500 }}>{fmtAmount(s.amount, cfg)}</td>
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
            {paiementsJour.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>Aucun paiement aujourd&apos;hui</div>
            )}
            {paiementsJour.map(m => {
              const color = PAYMENT_STYLE[m.mode]?.color ?? 'var(--ink)';
              return (
                <div key={m.mode} className={styles.payRow}>
                  <div className={styles.payName}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                    {m.mode}
                  </div>
                  <div className={styles.payBar}>
                    <div className={styles.payFill} style={{ width: `${m.pct}%`, background: color }} />
                  </div>
                  <div className={styles.payPct}>{m.pct}%</div>
                  <div className={styles.payAmt}>{m.montant.toLocaleString('fr-FR')} FCFA</div>
                </div>
              );
            })}
          </div>

          {/* Stock alerts */}
          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>Alertes</div>
            {stockAlertes.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>Aucune alerte stock</div>
            )}
            {stockAlertes.map(p => (
              <div key={p.nom} className={styles.eventItem}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
                    Stock : <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--danger)', fontWeight: 600 }}>{p.quantite}</span> / seuil {p.seuil}
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
              {topProduitsJour.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>Aucune vente aujourd&apos;hui</td></tr>
              )}
              {topProduitsJour.map((p, i) => (
                <tr key={p.nom}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: TOP_PRODUCT_SWATCHES[i % TOP_PRODUCT_SWATCHES.length], color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{p.nom[0]?.toUpperCase() ?? '?'}</div>
                      <div style={{ fontWeight: 500 }}>{p.nom}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{p.qty}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 500 }}>{p.ca.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
