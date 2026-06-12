'use client';
import React from 'react';
import type { Brand } from './types';
import { SAMPLE_BRANDS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon, GlobeIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

interface KpiDef {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaColor?: string;
  sub: string;
  spark?: number[];
  sparkColor?: string;
  serif?: boolean;
}


export interface BrandsPageProps {
  brands?: Brand[];
}

export default function BrandsPage({ brands = SAMPLE_BRANDS }: BrandsPageProps) {
  const ui = useUI();
  const actives  = brands.filter(b => b.status === 'Actif').length;
  const mainBrand = [...brands].sort((a, b) => b.products - a.products)[0];
  const avgMargin = brands.length > 0
    ? Math.round(brands.reduce((s, b) => s + b.margin, 0) / brands.length)
    : 0;

  const BRAND_KPIS: KpiDef[] = [
    { label: 'Marques actives',    value: String(actives),            sub: `sur ${brands.length} au total`, sparkColor: '#3B6A8F' },
    { label: 'Marque principale',  value: mainBrand?.name ?? '—', serif: true, sub: mainBrand ? `${mainBrand.products} produits · ${mainBrand.revenue.toLocaleString('fr-FR')} F` : '—' },
    { label: 'Marge moy. / marque', value: avgMargin > 0 ? String(avgMargin) : '—', unit: avgMargin > 0 ? '%' : undefined, sub: 'moyenne toutes marques', sparkColor: '#2D6A4F' },
  ];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Marques</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>marques</span>
          </h1>
          <p className={styles.subtitle}>
            {brands.length} marques · {new Set(brands.map(b => b.country)).size} pays d&apos;origine
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Marques')}>
            <DownloadIcon size={14} /> Exporter
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('brand')}>
            <PlusIcon size={14} /> Nouvelle marque
          </button>
        </div>
      </div>

      {/* 3-col KPIs */}
      <div className={styles.kpis3}>
        {BRAND_KPIS.map(k => (
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
              {k.serif
                ? <div className={styles.kpiSerif}>{k.value}</div>
                : <div className={styles.kpiValue}>{k.value}</div>
              }
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.sparkColor && (
                <Sparkline data={k.spark} color={k.sparkColor} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Brands table */}
      <div className={styles.tableWrap} style={{ marginTop: 16, marginLeft: 28, marginRight: 28, marginBottom: 28 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Marque</th>
                <th><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><GlobeIcon size={11} /> Pays d&apos;origine</span></th>
                <th style={{ textAlign: 'right' }}>Produits</th>
                <th style={{ textAlign: 'right' }}>CA en stock</th>
                <th style={{ textAlign: 'right' }}>Marge moy.</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {brands.map(b => {
                const mColor = b.margin > 55 ? 'var(--ok)' : b.margin > 40 ? 'var(--accent)' : 'var(--muted)';
                const statusClass = b.status === 'Actif' ? styles.actif : styles.brouillon;
                return (
                  <tr key={b.name}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className={styles.thumb} style={{ background: b.color, fontSize: 11 }}>
                          {b.init}
                        </div>
                        <div className={styles.productName}>{b.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{b.country}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{b.products}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                      {b.revenue.toLocaleString('fr-FR')} F
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: mColor, fontWeight: 500 }}>
                        {b.margin}%
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.status} ${statusClass}`}>
                        <span className={styles.d} />{b.status}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <button type="button" className={styles.rowMenu} onClick={(e) => { e.stopPropagation(); ui.menu(e, [{ label: 'Modifier', icon: 'edit', onClick: () => ui.openForm('brand', 'edit', b) }, { sep: true }, { label: 'Supprimer', icon: 'trash', danger: true, onClick: () => ui.confirmDelete('la marque', b.name) }], 'right'); }}>
                        <MoreIcon size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{brands.length} marques · {new Set(brands.map(b => b.country)).size} pays d&apos;origine</span>
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
