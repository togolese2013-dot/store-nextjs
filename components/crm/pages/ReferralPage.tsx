import React from 'react';
import type { Kpi } from '../types';
import { REFERRALS, REFERRAL_STYLE } from '../data';
import { CopyIcon, CogIcon, MoreIcon } from '../icons';
import { PageHead, KpiRow, Tag } from '../primitives';
import styles from '../Crm.module.css';

const KPIS: Kpi[] = [
  { l: 'Parrainages · mois',       v: '6',    d: '+2',     dc: '#2D6A4F', sub: 'vs 4 mois dernier',   spark: [2,2,3,3,4,4,5,5,5,6,6], c: '#5C4A88' },
  { l: 'Taux de conversion',       v: '67', u: '%', d: '+8 pts', dc: '#2D6A4F', sub: 'filleuls → clients', spark: [50,54,57,60,62,63,64,65,66,67,67], c: '#2D6A4F' },
  { l: 'Points récompense versés', v: '48 000', d: 'pts',  dc: '#8A8278', sub: '2 000 pts / conversion', spark: [20,24,28,32,36,40,42,44,46,47,48], c: '#C8962A' },
];

export default function ReferralPage() {
  return (
    <>
      <PageHead
        eyebrow="CRM · Parrainage" title="Programme de" serif="parrainage"
        sub="Chaque client peut parrainer · 2 000 pts au parrain + 1 000 pts au filleul"
      >
        <button type="button" className={styles.btn}><CopyIcon size={14} /> Lien d'invitation</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><CogIcon size={14} /> Configurer</button>
      </PageHead>

      <KpiRow kpis={KPIS} cols={3} />

      <div className={styles.twrap} style={{ marginTop: 16 }}>
        <div className={styles.tscroll}>
          <table>
            <thead>
              <tr>
                <th>Parrain</th>
                <th>Filleul</th>
                <th>Date</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Récompense</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {REFERRALS.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.cellName}>
                      <div className={styles.rowAvatar} style={{ background: r.color, width: 30, height: 30, fontSize: 10 }}>{r.init}</div>
                      {r.parrain}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{r.filleul}</td>
                  <td className={styles.dimCell}>{r.date}</td>
                  <td><Tag label={r.status} style={REFERRAL_STYLE[r.status]} /></td>
                  <td style={{ textAlign: 'right', fontFamily: '"Geist Mono", monospace', fontSize: 13, fontWeight: 500, color: r.reward === '—' ? 'var(--muted-2)' : 'var(--accent)' }}>{r.reward}</td>
                  <td className={styles.actCol}>
                    <button type="button" className={styles.rm}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tfoot}>
          <span>6 parrainages ce mois · 4 convertis</span>
          <div className={styles.pgr}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
