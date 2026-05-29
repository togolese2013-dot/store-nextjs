/**
 * CouponsPage — promotional code management content
 * Mount via StoreShell (page id: 'coupons') or standalone.
 */
import React from 'react';
import type { CSSProperties } from 'react';
import type { Coupon } from './types';
import { SAMPLE_COUPONS, COUPONS_KPIS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, CopyIcon, TrendIcon } from './icons';
import styles from './Store.module.css';

const COUPON_STATUS_STYLE: Record<string, CSSProperties> = {
  Actif:   { background: 'var(--ok-bg)',        color: 'var(--ok)' },
  Expiré:  { background: 'rgba(20,17,14,.06)', color: 'var(--muted)' },
  Inactif: { background: 'var(--bg-2)',         color: 'var(--muted-2)' },
};

export interface CouponsPageProps {
  coupons?: Coupon[];
}

export default function CouponsPage({ coupons = SAMPLE_COUPONS }: CouponsPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Coupons</div>
          <h1 className={styles.title}>Codes <span className={styles.serif}>promotionnels</span></h1>
          <p className={styles.subtitle}>8 codes configurés · 5 actifs · 145 utilisations ce mois</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouveau coupon
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {COUPONS_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.sparkColor && <Sparkline data={k.spark} color={k.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Réduction</th>
                <th style={{ textAlign: 'right' }}>Utilisations</th>
                <th>Limite</th>
                <th>Validité</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.code}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600, letterSpacing: '.02em' }}>
                        {c.code}
                      </span>
                      <button type="button" className={styles.rowMenu} style={{ width: 22, height: 22, color: 'var(--muted-2)' }} title="Copier">
                        <CopyIcon size={12} />
                      </button>
                    </div>
                  </td>
                  <td><span className={styles.tag}>{c.type === '%' ? 'Pourcentage' : 'Montant fixe'}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    {c.type === '%' ? `−${c.value}%` : `−${c.value.toLocaleString('fr-FR')} F`}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{c.used}</td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>
                    {c.limit ? `/ ${c.limit}` : 'Illimitée'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{c.expiry}</td>
                  <td><span className={styles.tag} style={COUPON_STATUS_STYLE[c.status]}>{c.status}</span></td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>8 codes promo</span>
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
