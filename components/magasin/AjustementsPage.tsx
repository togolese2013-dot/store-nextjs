/**
 * AjustementsPage — stock adjustment log
 * Route: page id 'ajustements' in MagasinShell
 */
'use client';
import React from 'react';
import type { StockAdjustment } from './types';
import { SAMPLE_ADJUSTMENTS } from './sample-data';
import Sparkline from './Sparkline';
import { PlusIcon, MoreIcon, TrendIcon, HistoryIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

type LocalKpi = { label: string; value: string; unit?: string; delta?: string; deltaColor?: string; sub: string; spark?: number[]; color?: string; serif?: boolean };

export interface AjustementsPageProps {
  adjustments?: StockAdjustment[];
}

export default function AjustementsPage({ adjustments = SAMPLE_ADJUSTMENTS }: AjustementsPageProps) {
  const ui = useUI();
  const added   = adjustments.filter(a => a.delta > 0).reduce((s, a) => s + a.delta, 0);
  const removed = Math.abs(adjustments.filter(a => a.delta < 0).reduce((s, a) => s + a.delta, 0));
  const reasons = new Set(adjustments.map(a => a.reason)).size;

  const KPIS: LocalKpi[] = [
    { label: 'Ajustements ce mois', value: String(adjustments.length), sub: 'total',                    color: '#3B6A8F' },
    { label: 'Unités ajoutées',     value: added   > 0 ? `+${added}`   : '—', sub: 'réceptions et corrections' },
    { label: 'Unités retirées',     value: removed > 0 ? `−${removed}` : '—', sub: 'casses et corrections',    color: '#C9601E' },
  ];

  const subtitle = adjustments.length === 0
    ? 'Aucun ajustement ce mois'
    : `${adjustments.length} ajustement${adjustments.length > 1 ? 's' : ''} · ${added > 0 ? `+${added}` : '0'} unités nettes · ${reasons} raison${reasons > 1 ? 's' : ''}`;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Stock</div>
          <h1 className={styles.title}>
            Ajustements <span className={styles.serif}>de stock</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openHistory('Ajustements')}>
            <HistoryIcon size={14} /> Historique complet
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('adjustment')}>
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
                    <button type="button" className={styles.rowMenu} onClick={(e) => { e.stopPropagation(); ui.menu(e, [{ label: 'Détails', icon: 'eye', onClick: () => ui.openDetail('adjustment', a) }], 'right'); }}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{adjustments.length} ajustement{adjustments.length !== 1 ? 's' : ''} ce mois</span>
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
