/**
 * MouvementsPage — stock movement log
 * Route: page id 'mouvements' in MagasinShell
 */
import React from 'react';
import type { StockMovement, MovementType } from './types';
import { SAMPLE_MOVEMENTS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, FilterIcon, MoreIcon, TrendIcon, ArrowRightIcon } from './icons';
import styles from './Magasin.module.css';

const KPIS = [
  { label: 'Mouvements ce mois', value: '127', delta: '+18',  deltaColor: '#2D6A4F', sub: 'vs 109 mois dernier',    spark: [90,95,98,100,104,108,110,114,118,122,127],  color: '#3B6A8F' },
  { label: 'Unités entrées',     value: '892', delta: '+12%', deltaColor: '#2D6A4F', sub: 'réceptions fournisseurs', spark: [700,720,740,760,780,800,820,840,860,875,892], color: '#2D6A4F' },
  { label: 'Unités sorties',     value: '340', delta: '−5%',  deltaColor: '#5C4A88', sub: 'ventes et transferts',    spark: [280,290,300,310,315,320,325,330,335,338,340], color: '#C9601E' },
  { label: 'Transferts',         value: '48',  delta: '+4',   deltaColor: '#2D6A4F', sub: 'entre entrepôts',         spark: [30,32,34,36,38,40,42,44,45,47,48],            color: '#5C4A88' },
];

const TYPE_STYLE: Record<MovementType, React.CSSProperties> = {
  'Entrée':     { background: 'var(--ok-bg)',     color: 'var(--ok)' },
  'Sortie':     { background: 'var(--danger-bg)', color: 'var(--danger)' },
  'Transfert':  { background: 'var(--accent-bg)', color: 'var(--accent)' },
  'Ajustement': { background: 'var(--warn-bg)',   color: 'var(--warn)' },
};

export interface MouvementsPageProps {
  movements?: StockMovement[];
}

export default function MouvementsPage({ movements = SAMPLE_MOVEMENTS }: MouvementsPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Stock</div>
          <h1 className={styles.title}>
            Mouvements <span className={styles.serif}>de stock</span>
          </h1>
          <p className={styles.subtitle}>
            127 mouvements ce mois · 892 unités entrées · 340 sorties · 48 transferts
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={styles.btn}><FilterIcon size={14} /> Filtres</button>
        </div>
      </div>

      <div className={styles.kpis}>
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
              <div className={styles.kpiValue}>{k.value}</div>
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
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Qté</th>
                <th>De</th>
                <th />
                <th>Vers</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{m.date}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{m.product}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted-2)' }}>{m.sku}</div>
                  </td>
                  <td>
                    <span className={styles.tag} style={TYPE_STYLE[m.type]}>{m.type}</span>
                  </td>
                  <td style={{
                    textAlign: 'right',
                    fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600,
                    color: m.qty > 0 ? 'var(--ok)' : 'var(--danger)',
                  }}>
                    {m.qty > 0 ? '+' : ''}{m.qty}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{m.from}</td>
                  <td style={{ color: 'var(--muted-2)' }}><ArrowRightIcon size={12} /></td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{m.to}</td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>127 mouvements ce mois</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">…</button>
            <button type="button">11</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
