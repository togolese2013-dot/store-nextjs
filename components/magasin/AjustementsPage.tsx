/**
 * AjustementsPage — stock adjustment log
 * Route: page id 'ajustements' in MagasinShell
 */
import React from 'react';
import type { StockAdjustment } from './types';
import { SAMPLE_ADJUSTMENTS } from './sample-data';
import Sparkline from './Sparkline';
import { PlusIcon, MoreIcon, TrendIcon, HistoryIcon } from './icons';
import styles from './Magasin.module.css';

const KPIS = [
  { label: 'Ajustements ce mois', value: '14',   delta: '+3',      deltaColor: '#2D6A4F', sub: 'vs 11 mois dernier',      spark: [8,9,9,10,11,11,12,12,13,13,14], color: '#3B6A8F' },
  { label: 'Unités ajoutées',     value: '+154',                    deltaColor: '#2D6A4F', sub: 'réceptions et corrections' },
  { label: 'Unités retirées',     value: '−15',  delta: 'casses',  deltaColor: '#9C3A14', sub: 'casses et corrections',    spark: [2,3,3,4,4,5,5,6,6,5,5],        color: '#C9601E' },
];

export interface AjustementsPageProps {
  adjustments?: StockAdjustment[];
}

export default function AjustementsPage({ adjustments = SAMPLE_ADJUSTMENTS }: AjustementsPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Stock</div>
          <h1 className={styles.title}>
            Ajustements <span className={styles.serif}>de stock</span>
          </h1>
          <p className={styles.subtitle}>
            14 ajustements ce mois · +154 unités nettes · 2 raisons fréquentes
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}>
            <HistoryIcon size={14} /> Historique complet
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouvel ajustement
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && (
                <div className={styles.kpiDelta} style={{ color: k.deltaColor }}>
                  <TrendIcon size={10} />{k.delta}
                </div>
              )}
            </div>
            <div className={styles.kpiValueRow}>
              <div
                className={styles.kpiValue}
                style={{
                  color: k.value.startsWith('+') ? 'var(--ok)'
                    : k.value.startsWith('−') ? 'var(--danger)'
                    : undefined,
                }}
              >
                {k.value}
              </div>
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.color && <Sparkline data={k.spark} color={k.color} />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th style={{ textAlign: 'right' }}>Ajustement</th>
                <th>Raison</th>
                <th>Auteur</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{a.date}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{a.product}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted-2)' }}>{a.sku}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'Geist Mono, monospace',
                      fontSize: 14, fontWeight: 600,
                      color: a.delta > 0 ? 'var(--ok)' : 'var(--danger)',
                    }}>
                      {a.delta > 0 ? '+' : ''}{a.delta}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{a.reason}</td>
                  <td style={{ fontSize: 13 }}>{a.author}</td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>14 ajustements ce mois</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
