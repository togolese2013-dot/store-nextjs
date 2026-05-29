/**
 * AlertesPage — stock alert rules management
 * Route: page id 'alertes' in MagasinShell
 *
 * Toggle is locally controlled. In production wire onToggle to:
 *   PATCH /api/alerts/:id { active: boolean }
 */
'use client';
import React, { useState } from 'react';
import type { StockAlert, AlertChannel } from './types';
import { SAMPLE_ALERTS } from './sample-data';
import Sparkline from './Sparkline';
import { PlusIcon, CogIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';

const KPIS = [
  { label: 'Alertes actives',     value: '7', delta: '+1',        deltaColor: '#2D6A4F', sub: 'sur 8 règles configurées', spark: [4,4,5,5,6,6,6,7,7,7,7], color: '#3B6A8F' },
  { label: 'Déclenchées ce mois', value: '3', delta: 'urgentes',  deltaColor: '#9C3A14', sub: 'requièrent une action',    spark: [1,1,2,2,2,2,2,3,3,3,3], color: '#C9601E' },
  { label: 'Canaux configurés',   value: '4',                                             sub: 'Email · SMS · WhatsApp' },
];

const CHANNEL_STYLE: Record<AlertChannel, React.CSSProperties> = {
  Email:    { background: 'var(--accent-bg)', color: 'var(--accent)' },
  SMS:      { background: 'var(--warn-bg)',   color: 'var(--warn)' },
  WhatsApp: { background: 'var(--ok-bg)',     color: 'var(--ok)' },
};

export interface AlertesPageProps {
  alerts?: StockAlert[];
  onToggle?: (index: number, active: boolean) => void;
}

export default function AlertesPage({
  alerts: initialAlerts = SAMPLE_ALERTS,
  onToggle,
}: AlertesPageProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>(initialAlerts);

  const handleToggle = (i: number) => {
    const next = alerts.map((a, j) => j === i ? { ...a, active: !a.active } : a);
    setAlerts(next);
    onToggle?.(i, next[i].active);
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Stock</div>
          <h1 className={styles.title}>
            Alertes <span className={styles.serif}>stock</span>
          </h1>
          <p className={styles.subtitle}>
            7 règles actives · 3 déclenchées ce mois · Email, SMS, WhatsApp
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><CogIcon size={14} /> Paramètres</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouvelle alerte
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
                <th>Règle</th>
                <th>Cible</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Seuil</th>
                <th>Canaux</th>
                <th>Déclenchée</th>
                <th>Actif</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} style={{ opacity: a.active ? 1 : 0.55, transition: 'opacity .2s' }}>
                  <td><div className={styles.productName}>{a.name}</div></td>
                  <td style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 180 }}>{a.target}</td>
                  <td><span className={styles.tag} style={{ fontSize: 11 }}>{a.targetType}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                    {a.threshold}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.channels.map(ch => (
                        <span
                          key={ch}
                          style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, fontWeight: 500, ...CHANNEL_STYLE[ch] }}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {a.triggered
                      ? <span className={`${styles.status} ${styles.rupture}`}><span className={styles.d} />Oui</span>
                      : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>
                    <div
                      role="switch"
                      aria-checked={a.active}
                      tabIndex={0}
                      onClick={() => handleToggle(i)}
                      onKeyDown={e => e.key === 'Enter' && handleToggle(i)}
                      style={{
                        cursor: 'pointer', width: 34, height: 20, borderRadius: 99,
                        background: a.active ? 'var(--accent)' : 'var(--border)',
                        position: 'relative', transition: 'background .2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3, left: a.active ? 15 : 3,
                        width: 14, height: 14, borderRadius: 99,
                        background: 'white', transition: 'left .2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                      }} />
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>7 alertes · 3 déclenchées</span>
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
