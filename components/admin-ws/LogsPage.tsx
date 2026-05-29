/**
 * LogsPage — audit / activity log
 * Mount via AdminWsShell (page id: 'logs') or standalone.
 */
import React from 'react';
import type { ActivityLog } from './types';
import { SAMPLE_LOG } from './sample-data';
import { FilterIcon, DownloadIcon, ChevDownIcon } from './icons';
import styles from './Admin.module.css';

export interface LogsPageProps {
  log?: ActivityLog[];
}

export default function LogsPage({ log = SAMPLE_LOG }: LogsPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Admin · Audit</div>
          <h1 className={styles.title}>Journal d&apos;<span className={styles.serif}>activité</span></h1>
          <p className={styles.subtitle}>Traçabilité complète des actions · qui a fait quoi, quand, où</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><FilterIcon size={14} /> Filtrer</button>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.chip}>Membre <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Workspace <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Type d&apos;action <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Période : 28 mai 2026 <ChevDownIcon size={10} /></button>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; heure</th>
                <th>Membre</th>
                <th>Action</th>
                <th>Workspace</th>
              </tr>
            </thead>
            <tbody>
              {log.map((l, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{l.date}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 99, background: l.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{l.init}</div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{l.who}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{l.action}</td>
                  <td><span className={styles.tag} style={{ background: `${l.wsColor}1A`, color: l.wsColor }}>{l.ws}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>247 événements ce mois · 8 affichés</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">…</button>
            <button type="button">31</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
