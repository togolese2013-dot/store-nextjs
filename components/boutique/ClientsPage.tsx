/**
 * ClientsPage — boutique customers content
 * Mount via BoutiqueShell (page id: 'clients') or standalone.
 */
import React from 'react';
import type { BoutiqueClient } from './types';
import { SAMPLE_CLIENTS, CLIENTS_KPIS, CLIENT_STATUS_CLASS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon, StarIcon } from './icons';
import styles from './Boutique.module.css';

export interface ClientsPageProps {
  clients?: BoutiqueClient[];
}

export default function ClientsPage({ clients = SAMPLE_CLIENTS }: ClientsPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Clients</div>
          <h1 className={styles.title}>Clients <span className={styles.serif}>physiques</span></h1>
          <p className={styles.subtitle}>{clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouveau client
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
        {CLIENTS_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              {k.serif
                ? <div className={styles.kpiSerif}>{k.value}</div>
                : <div className={styles.kpiValue}>{k.value}</div>
              }
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
                <th>Client</th>
                <th style={{ textAlign: 'right' }}>Visites</th>
                <th>Dernière visite</th>
                <th style={{ textAlign: 'right' }}>CA total</th>
                <th>Fidélité</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 99, background: c.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.init}</div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{c.visits}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{c.last}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>{c.total.toLocaleString('fr-FR')} F</td>
                  <td>
                    <span className={`${styles.tag} ${styles[CLIENT_STATUS_CLASS[c.status] as keyof typeof styles]}`}>
                      {c.status === 'VIP' && <StarIcon size={10} />}
                      {c.status}
                    </span>
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
          <span>8 clients · 2 VIP · 3 réguliers</span>
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
