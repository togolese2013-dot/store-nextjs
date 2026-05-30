/**
 * EntrepotsPage — warehouse management
 * Route: page id 'entrepots' in MagasinShell
 */
import React from 'react';
import type { Warehouse } from './types';
import { SAMPLE_WAREHOUSES } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon, MapPinIcon } from './icons';
import styles from './Magasin.module.css';

type LocalKpi = { label: string; value: string; unit?: string; delta?: string; deltaColor?: string; sub: string; spark?: number[]; color?: string; serif?: boolean };

function occupancyColor(pct: number): string {
  if (pct > 0.9)  return '#9C3A14';
  if (pct > 0.75) return '#C9601E';
  return '#2D6A4F';
}

export interface EntrepotsPageProps {
  warehouses?: Warehouse[];
}

export default function EntrepotsPage({ warehouses = SAMPLE_WAREHOUSES }: EntrepotsPageProps) {
  const totalCap      = warehouses.reduce((s, w) => s + w.capacity, 0);
  const totalOccupied = warehouses.reduce((s, w) => s + w.occupied, 0);
  const totalProducts = warehouses.reduce((s, w) => s + w.products, 0);
  const avgPct        = totalCap > 0 ? Math.round((totalOccupied / totalCap) * 100) : 0;

  const KPIS: LocalKpi[] = [
    { label: 'Entrepôts actifs',   value: String(warehouses.length),  sub: warehouses.map(w => w.location).join(' · ') || 'Aucun entrepôt' },
    { label: 'Occupation moyenne', value: String(avgPct), unit: '%',  sub: `${totalOccupied.toLocaleString('fr-FR')} / ${totalCap.toLocaleString('fr-FR')} unités`, color: '#C9601E' },
    { label: 'Produits stockés',   value: String(totalProducts),       sub: `répartis sur ${warehouses.length} site${warehouses.length > 1 ? 's' : ''}`, color: '#2D6A4F' },
  ];

  const subtitle = warehouses.length === 0
    ? 'Aucun entrepôt configuré'
    : `${warehouses.length} entrepôt${warehouses.length > 1 ? 's' : ''} · capacité totale ${totalCap.toLocaleString('fr-FR')} unités · ${totalOccupied.toLocaleString('fr-FR')} occupées (${avgPct}%)`;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>entrepôts</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Rapport capacité</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouvel entrepôt
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && (
                <div className={styles.kpiDelta} style={{ color: k.deltaColor }}>
                  <TrendIcon size={10} />{k.delta}
                </div>
              )}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.color && <Sparkline data={k.spark} color={k.color} />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.catCardGrid}>
        {warehouses.map(w => {
          const pct = Math.min(1, w.occupied / w.capacity);
          const barColor = occupancyColor(pct);
          return (
            <div key={w.id} className={styles.catCard}>
              <div className={styles.catCardAccent} style={{ background: w.color }} />
              <div className={styles.catCardBody}>
                <div className={styles.catCardTop}>
                  <div className={styles.catCardName}>{w.name}</div>
                  <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted)' }}>
                  <MapPinIcon size={12} />{w.location}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>Occupation</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: barColor, fontWeight: 500 }}>
                      {Math.round(pct * 100)}%
                    </span>
                  </div>
                  <div className={styles.stockBar} style={{ height: 6 }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor, borderRadius: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--muted-2)', fontFamily: 'Geist Mono, monospace' }}>
                    <span>{w.occupied.toLocaleString('fr-FR')} occupés</span>
                    <span>{w.capacity.toLocaleString('fr-FR')} total</span>
                  </div>
                </div>
                <div className={styles.catCardStats}>
                  <div className={styles.catStat}>
                    <div className={styles.catStatValue}>{w.products}</div>
                    <div className={styles.catStatLabel}>Références</div>
                  </div>
                  <div className={styles.catStat}>
                    <div className={styles.catStatValue}>{(w.capacity - w.occupied).toLocaleString('fr-FR')}</div>
                    <div className={styles.catStatLabel}>Disponible</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
