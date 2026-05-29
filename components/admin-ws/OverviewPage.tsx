/**
 * OverviewPage — Admin consolidated dashboard
 * Mount via AdminWsShell (page id: 'overview') or standalone.
 */
import React from 'react';
import { SAMPLE_WORKSPACES, SAMPLE_LOG, CA_BREAKDOWN, OVERVIEW_KPIS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, TrendIcon } from './icons';
import styles from './Admin.module.css';

interface OverviewPageProps {
  onInvite?: () => void;
}

export default function OverviewPage({ onInvite }: OverviewPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Admin · Aperçu</div>
          <h1 className={styles.title}>Tableau de bord <span className={styles.serif}>administrateur</span></h1>
          <p className={styles.subtitle}>Maison Diallo · vue consolidée de tous les espaces de travail</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Rapport global</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onInvite}>
            <PlusIcon size={14} /> Inviter un membre
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
              {k.serif ? <div className={styles.kpiSerif}>{k.value}</div> : <div className={styles.kpiValue}>{k.value}</div>}
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
        {/* Workspace health */}
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>
            Santé des workspaces
            <button type="button" className={`${styles.btn} ${styles.sm}`}>Gérer</button>
          </div>
          <div className={styles.wsGrid}>
            {SAMPLE_WORKSPACES.map(w => {
              const Icon = w.icon;
              return (
                <div key={w.id} className={styles.wsCard} style={{ opacity: w.active ? 1 : 0.6 }}>
                  <div className={styles.wsCardTop}>
                    <div className={styles.wsCardIc} style={{ background: w.bg, color: w.tint }}><Icon size={16} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.wsCardName}>{w.name}</div>
                      <div className={styles.wsCardTag}>{w.tag}</div>
                    </div>
                    <span className={`${styles.status} ${w.active ? styles.actif : styles.inactif}`}>
                      <span className={styles.d} />{w.active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className={styles.wsCardStat}>
                    <span>{w.count}</span>
                    <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>{w.activity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity */}
        <div className={styles.ovSide}>
          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>Activité récente</div>
            {SAMPLE_LOG.slice(0, 5).map((l, i) => (
              <div key={i} className={styles.eventItem}>
                <div style={{ width: 24, height: 24, borderRadius: 99, background: l.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{l.init}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.3 }}><b style={{ fontWeight: 600 }}>{l.who}</b> {l.action}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{l.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CA breakdown */}
      <div className={styles.ovBot}>
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>Répartition du CA par workspace · ce mois</div>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>Workspace</th>
                <th style={{ textAlign: 'right' }}>CA</th>
                <th style={{ textAlign: 'right' }}>Part</th>
                <th style={{ width: '40%' }} />
              </tr>
            </thead>
            <tbody>
              {CA_BREAKDOWN.map(r => (
                <tr key={r.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.tint, display: 'inline-block' }} />
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>{r.ca.toLocaleString('fr-FR')} F</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>{r.pct}%</td>
                  <td>
                    <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${r.pct}%`, background: r.tint }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
