/**
 * LivraisonsPage — delivery zone management content
 * Mount via StoreShell (page id: 'livraisons') or standalone.
 */
'use client';
import React from 'react';
import { useUI } from '@/components/interaction-layer';
import type { DeliveryZone } from './types';
import { DownloadIcon, PlusIcon, MoreIcon, MapPinIcon, CartIcon } from './icons';
import styles from './Store.module.css';

function avgDelayDays(zones: DeliveryZone[]): string {
  const days = zones
    .map(z => /J\+?\s*(\d+)/i.exec(z.delay)?.[1])
    .filter((d): d is string => Boolean(d))
    .map(Number);
  if (days.length === 0) return '—';
  return (days.reduce((s, d) => s + d, 0) / days.length).toFixed(1);
}

export interface LivraisonsPageProps {
  zones?: DeliveryZone[];
}

export default function LivraisonsPage({ zones = [] }: LivraisonsPageProps) {
  const ui = useUI();
  const zonesActives     = zones.filter(z => z.active).length;
  const livraisonsMois   = zones.reduce((s, z) => s + z.orders, 0);
  const delaiMoyen       = avgDelayDays(zones);

  const KPIS = [
    { label: 'Zones actives',      value: `${zonesActives} / ${zones.length}`, sub: 'configurées' },
    { label: 'Livraisons ce mois', value: String(livraisonsMois),              sub: 'commandes livrées par zone' },
    { label: 'Délai moyen',        value: delaiMoyen, unit: delaiMoyen !== '—' ? 'j' : undefined, sub: 'zones avec délai renseigné' },
  ];
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Livraisons</div>
          <h1 className={styles.title}>Zones de <span className={styles.serif}>livraison</span></h1>
          <p className={styles.subtitle}>{zones.length} zone{zones.length !== 1 ? 's' : ''} configurée{zones.length !== 1 ? 's' : ''} · {zonesActives} active{zonesActives !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Livraisons')}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('zone')}>
            <PlusIcon size={14} /> Nouvelle zone
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
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
                  <button type="button" className={styles.rowMenu} onClick={(e) => { e.stopPropagation(); ui.menu(e, [
                      { label: 'Supprimer', icon: 'trash', danger: true, onClick: () => ui.confirmDelete('la zone', z.name) },
                    ], 'right'); }}><MoreIcon size={16} /></button>
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
