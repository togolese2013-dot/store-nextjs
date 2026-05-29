/**
 * StockPage — boutique physical stock content
 * Stock here is distinct from the Magasin warehouse inventory.
 * Mount via BoutiqueShell (page id: 'stock') or standalone.
 */
import React from 'react';
import type { BoutiqueStock } from './types';
import { SAMPLE_STOCK, STOCK_KPIS } from './sample-data';
import Sparkline from './Sparkline';
import { PlusIcon, MoreIcon, TrendIcon, ArrowRightIcon, AlertTriangleIcon } from './icons';
import styles from './Boutique.module.css';

export interface StockPageProps {
  stock?: BoutiqueStock[];
  onRequestTransfer?: (sku: string) => void;
}

export default function StockPage({ stock = SAMPLE_STOCK, onRequestTransfer }: StockPageProps) {
  const low = stock.filter(p => p.boutique < p.seuil);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Stock</div>
          <h1 className={styles.title}>Stock <span className={styles.serif}>boutique</span></h1>
          <p className={styles.subtitle}>Stock physique de la boutique · distinct de l&apos;entrepôt Magasin</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><ArrowRightIcon size={14} /> Demander transfert</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Ajustement manuel
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
        {STOCK_KPIS.map(k => (
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

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Stock boutique</th>
                <th>Seuil</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stock.map(p => {
                const isLow = p.boutique < p.seuil;
                const ratio = Math.min(1, p.boutique / p.seuil);
                const barColor = isLow ? 'var(--danger)' : ratio < 0.8 ? 'var(--warn)' : 'var(--ok)';
                return (
                  <tr key={p.sku}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: p.swatch, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{p.init}</div>
                        <div>
                          <div className={styles.productName}>{p.name}</div>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted-2)' }}>{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.tag}>{p.cat}</span></td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500, color: isLow ? 'var(--danger)' : 'var(--ink)' }}>
                        {p.boutique} <span style={{ color: 'var(--muted-2)', fontSize: 11, fontWeight: 400 }}>/ seuil {p.seuil}</span>
                      </div>
                      <div className={styles.stockBar}>
                        <div style={{ width: `${ratio * 100}%`, background: barColor }} />
                      </div>
                    </td>
                    <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: 'var(--muted)' }}>{p.seuil}</td>
                    <td>
                      {isLow
                        ? <span className={styles.tag} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangleIcon size={11} />Stock bas</span>
                        : <span className={styles.tag} style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}>OK</span>
                      }
                    </td>
                    <td className={styles.actionsCell}>
                      {isLow
                        ? <button type="button" className={`${styles.btn} ${styles.sm}`} style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onRequestTransfer?.(p.sku)}>Transférer</button>
                        : <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{low.length} alerte{low.length > 1 ? 's' : ''} · 8 références</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
