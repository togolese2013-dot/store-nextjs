import React from 'react';
import type { Kpi } from '../types';
import { CLIENTS, TIER_STYLE } from '../data';
import { DownloadIcon, SendIcon } from '../icons';
import { PageHead, KpiRow, Tag, fmt } from '../primitives';
import styles from '../Crm.module.css';

const KPIS: Kpi[] = [
  { l: 'Clients totaux',     v: '1 421',   d: '+86',  dc: '#2D6A4F', sub: 'ce mois',               spark: [1180,1220,1255,1290,1310,1340,1360,1385,1400,1412,1421], c: '#5C4A88' },
  { l: 'Clients actifs · 30j', v: '847',   d: '+12%', dc: '#2D6A4F', sub: 'au moins 1 commande',   spark: [680,710,730,755,770,790,805,820,830,840,847], c: '#3B6A8F' },
  { l: 'Taux de rétention',  v: '68', u: '%', d: '+3 pts', dc: '#2D6A4F', sub: 'sur 90 jours',     spark: [60,61,62,63,64,65,66,66,67,68,68], c: '#2D6A4F' },
  { l: 'Valeur vie client',  v: '124 000', u: 'F', d: '+8%', dc: '#2D6A4F', sub: 'panier × fréquence', spark: [98,102,106,110,113,116,118,120,122,123,124], c: '#C9601E' },
];

const SEGMENTS = [
  { name: 'Or',      color: '#C8962A', count: 142, pct: 10 },
  { name: 'Argent',  color: '#9A9A9A', count: 386, pct: 27 },
  { name: 'Bronze',  color: '#B07B47', count: 512, pct: 36 },
  { name: 'Nouveau', color: '#8A8278', count: 381, pct: 27 },
];

const ACTIVITY = [
  { l: 'Akua Boateng → niveau Or atteint', t: 'il y a 1h', c: '#C8962A' },
  { l: 'Campagne WhatsApp · 88% ouverture', t: 'il y a 3h', c: '#2D6A4F' },
  { l: 'Esi Mensah parrainée par Akua', t: 'il y a 5h', c: '#5C4A88' },
  { l: '86 nouveaux clients ce mois', t: 'hier', c: '#3B6A8F' },
];

export default function OverviewPage() {
  return (
    <>
      <PageHead
        eyebrow="CRM · Aperçu" title="Relation" serif="client"
        sub="1 421 clients · 847 actifs ce mois · 68% de rétention"
      >
        <button type="button" className={styles.btn}><DownloadIcon /> Rapport</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><SendIcon size={14} /> Nouvelle campagne</button>
      </PageHead>

      <KpiRow kpis={KPIS} />

      <div className={styles.ovGrid}>
        <div className={styles.ovCard}>
          <div className={styles.ovCardH}>
            Top clients · valeur cumulée
            <button type="button" className={`${styles.btn} ${styles.sm}`}>Voir tout</button>
          </div>
          <table className={styles.miniT}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Niveau</th>
                <th style={{ textAlign: 'right' }}>Commandes</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.slice(0, 5).map((c) => (
                <tr key={c.email}>
                  <td>
                    <div className={styles.miniName}>
                      <div className={styles.miniAvatar} style={{ background: c.color }}>{c.init}</div>
                      {c.name}
                    </div>
                  </td>
                  <td><Tag label={c.tier} style={TIER_STYLE[c.tier]} /></td>
                  <td style={{ textAlign: 'right', fontFamily: '"Geist Mono", monospace', fontSize: 12 }}>{c.orders}</td>
                  <td style={{ textAlign: 'right', fontFamily: '"Geist Mono", monospace', fontSize: 12, fontWeight: 500 }}>{fmt(c.total)} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.ovSide}>
          <div className={styles.ovCard}>
            <div className={styles.ovCardH}>Segments de fidélité</div>
            {SEGMENTS.map((s) => (
              <div key={s.name} className={styles.segRow}>
                <div className={styles.segName}>
                  <span className={styles.segDot} style={{ background: s.color }} />
                  {s.name}
                </div>
                <div className={styles.segBar}>
                  <div className={styles.segFill} style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <div className={styles.segN}>{fmt(s.count)}</div>
              </div>
            ))}
          </div>

          <div className={styles.ovCard}>
            <div className={styles.ovCardH}>Activité récente</div>
            {ACTIVITY.map((a, i) => (
              <div key={i} className={styles.evtItem}>
                <div className={styles.evtDot} style={{ background: a.c }} />
                <div style={{ flex: 1 }}>
                  <div className={styles.evtLabel}>{a.l}</div>
                  <div className={styles.evtTime}>{a.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
