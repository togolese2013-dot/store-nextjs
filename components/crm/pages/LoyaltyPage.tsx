import React from 'react';
import type { Kpi } from '../types';
import { TIERS, TIER_STYLE } from '../data';
import { CogIcon, PlusIcon, StarIcon } from '../icons';
import { PageHead, KpiRow, Tag, fmt } from '../primitives';
import styles from '../Crm.module.css';

const KPIS: Kpi[] = [
  { l: 'Membres fidélité',      v: '1 040',   d: '+8%',  dc: '#2D6A4F', sub: 'sur 1 421 clients',   spark: [850,880,910,940,960,985,1000,1015,1025,1035,1040], c: '#5C4A88' },
  { l: 'Points distribués · mois', v: '284 500', d: '+12%', dc: '#2D6A4F', sub: '1 pt = 1 F dépensé', spark: [200,215,228,240,250,260,268,274,279,282,284], c: '#C8962A' },
  { l: 'Points échangés',       v: '68%',    sub: "taux d'utilisation",  spark: [55,58,60,62,63,65,66,67,67,68,68], c: '#2D6A4F' },
];

const TOP_MEMBERS = [
  { n: 'Akua Boateng', i: 'AB', c: '#5C4A88', tier: 'Or',     pts: 24800, next: '−15 000 F à 25 000 pts' },
  { n: 'Ama Koffi',    i: 'AK', c: '#C9601E', tier: 'Or',     pts: 18200, next: 'Cadeau à 20 000 pts' },
  { n: 'Adjoa Mensah', i: 'AM', c: '#1F3D6E', tier: 'Argent', pts: 13700, next: 'Niveau Or à 15 000 pts' },
  { n: 'Kofi Asante',  i: 'KA', c: '#2D6A4F', tier: 'Argent', pts: 10240, next: '−5 000 F à 12 000 pts' },
  { n: 'Fatou Diallo', i: 'FD', c: '#B8501A', tier: 'Bronze', pts: 3960,  next: 'Niveau Argent à 5 000 pts' },
] as const;

export default function LoyaltyPage() {
  return (
    <>
      <PageHead
        eyebrow="CRM · Fidélité" title="Programme de" serif="fidélité"
        sub="1 040 membres · 4 niveaux · 1 point gagné par franc dépensé"
      >
        <button type="button" className={styles.btn}><CogIcon size={14} /> Configurer les règles</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><PlusIcon /> Récompense</button>
      </PageHead>

      <KpiRow kpis={KPIS} cols={3} />

      <div className={styles.tierGrid}>
        {TIERS.map((t) => (
          <div key={t.name} className={styles.tierCard}>
            <div className={styles.tierAccent} style={{ background: t.color }} />
            <div className={styles.tierBody}>
              <div className={styles.tierName}><StarIcon size={14} />{t.name}</div>
              <div className={styles.tierCount}>
                {fmt(t.count)} <span className={styles.tierCountUnit}>membres</span>
              </div>
              <div className={styles.tierMeta}>{t.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.ovBot} style={{ paddingTop: 24 }}>
        <div className={styles.ovCard}>
          <div className={styles.ovCardH}>Top membres · solde de points</div>
          <table className={styles.miniT}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Niveau</th>
                <th style={{ textAlign: 'right' }}>Points</th>
                <th style={{ textAlign: 'right' }}>Prochaine récompense</th>
              </tr>
            </thead>
            <tbody>
              {TOP_MEMBERS.map((m) => (
                <tr key={m.n}>
                  <td>
                    <div className={styles.miniName}>
                      <div className={styles.miniAvatar} style={{ background: m.c }}>{m.i}</div>
                      {m.n}
                    </div>
                  </td>
                  <td><Tag label={m.tier} style={TIER_STYLE[m.tier]} /></td>
                  <td style={{ textAlign: 'right', fontFamily: '"Geist Mono", monospace', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{fmt(m.pts)}</td>
                  <td style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--muted)' }}>{m.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
