import React from 'react';
import type { Kpi } from '../types';
import { CAMPAIGNS, CAMPAIGN_STYLE } from '../data';
import { DownloadIcon, SendIcon } from '../icons';
import { PageHead, KpiRow, Tag, fmt } from '../primitives';
import styles from '../Crm.module.css';

const KPIS: Kpi[] = [
  { l: 'Campagnes actives',        v: '2',     sub: '+ 2 brouillons',     spark: [1,1,1,2,2,2,2,2,2,2,2], c: '#5C4A88' },
  { l: "Taux d'ouverture moyen",   v: '76', u: '%', d: '+6 pts', dc: '#2D6A4F', sub: 'Email + WhatsApp', spark: [64,66,68,70,71,72,73,74,75,76,76], c: '#2D6A4F' },
  { l: 'Messages envoyés · mois',  v: '2 924', d: '+18%', dc: '#2D6A4F', sub: 'tous canaux', spark: [1800,2000,2200,2400,2500,2600,2700,2800,2870,2900,2924], c: '#3B6A8F' },
];

export default function CampaignsPage() {
  return (
    <>
      <PageHead
        eyebrow="CRM · Campagnes" title="Newsletter &" serif="WhatsApp"
        sub="Email et WhatsApp Business · 76% d'ouverture moyenne ce mois"
      >
        <button type="button" className={styles.btn}><DownloadIcon /> Statistiques</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><SendIcon size={14} /> Nouvelle campagne</button>
      </PageHead>

      <KpiRow kpis={KPIS} cols={3} />

      <div className={styles.campGrid}>
        {CAMPAIGNS.map((c, i) => {
          const Icon = c.icon;
          const draft = c.status === 'Brouillon';
          return (
            <div key={i} className={styles.campCard}>
              <div className={styles.campTop}>
                <div className={styles.campHeadL}>
                  <div className={styles.campCh} style={{ background: c.chBg, color: c.chColor }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className={styles.campName}>{c.name}</div>
                    <div className={styles.campSub}>{c.channel} · {c.date}</div>
                  </div>
                </div>
                <Tag label={c.status} style={CAMPAIGN_STYLE[c.status]} />
              </div>

              {draft ? (
                <div className={styles.campDraft}>
                  <span className={styles.campDraftLabel}>Pas encore envoyée</span>
                  <button type="button" className={`${styles.btn} ${styles.sm}`}><SendIcon size={12} /> Finaliser</button>
                </div>
              ) : (
                <div className={styles.campStats}>
                  <div className={styles.campStat}>
                    <div className={styles.campStatV}>{fmt(c.sent)}</div>
                    <div className={styles.campStatL}>Destinataires</div>
                  </div>
                  <div className={styles.campStat}>
                    <div className={styles.campStatV} style={{ color: 'var(--ok)' }}>{c.open}%</div>
                    <div className={styles.campStatL}>Ouverture</div>
                  </div>
                  <div className={styles.campStat}>
                    <div className={styles.campStatV} style={{ color: 'var(--accent)' }}>{c.click}%</div>
                    <div className={styles.campStatL}>Clics</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
