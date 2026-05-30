/**
 * LivraisonsPage — delivery zone management content
 * Mount via StoreShell (page id: 'livraisons') or standalone.
 */
import React from 'react';
import type { DeliveryZone } from './types';
import { SAMPLE_ZONES, LIVRAISONS_KPIS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon, MapPinIcon, CartIcon } from './icons';
import styles from './Store.module.css';

export interface LivraisonsPageProps {
  zones?: DeliveryZone[];
}

export default function LivraisonsPage({ zones = SAMPLE_ZONES }: LivraisonsPageProps) {
  const zonesActives = zones.filter(z => z.active).length;
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Livraisons</div>
          <h1 className={styles.title}>Zones de <span className={styles.serif}>livraison</span></h1>
          <p className={styles.subtitle}>{zones.length} zone{zones.length !== 1 ? 's' : ''} configurée{zones.length !== 1 ? 's' : ''} · {zonesActives} active{zonesActives !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouvelle zone
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {LIVRAISONS_KPIS.map(k => (
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

      {/* Zone cards */}
      <div className={styles.zoneGrid}>
        {zones.map(z => (
          <div key={z.id} className={styles.zoneCard}>
            <div className={styles.zoneAccent} style={{ background: z.color }} />
            <div className={styles.zoneBody}>
              <div className={styles.zoneTop}>
                <div className={styles.zoneName}>{z.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className={styles.tag}
                    style={z.active
                      ? { background: 'var(--ok-bg)', color: 'var(--ok)' }
                      : { background: 'rgba(20,17,14,.06)', color: 'var(--muted)' }
                    }
                  >
                    {z.active ? 'Active' : 'Inactive'}
                  </span>
                  <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                </div>
              </div>
              <div className={styles.zoneCoverage}>
                <MapPinIcon size={12} />{z.coverage}
              </div>
              <div className={styles.zoneStats}>
                <div className={styles.zStat}>
                  <div className={styles.zStatValue}>{z.price.toLocaleString('fr-FR')} F</div>
                  <div className={styles.zStatLabel}>Tarif livraison</div>
                </div>
                <div className={styles.zStat}>
                  <div className={styles.zStatValue}>{z.delay}</div>
                  <div className={styles.zStatLabel}>Délai estimé</div>
                </div>
              </div>
              <div className={styles.zoneFoot}>
                <CartIcon size={12} />{z.orders} commandes ce mois
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
