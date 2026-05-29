'use client';
import React from 'react';
import type { Category } from './types';
import { SAMPLE_CATEGORIES } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, FolderIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';

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

const CAT_KPIS: KpiDef[] = [
  {
    label: 'Total catégories', value: '18', delta: '+2', deltaColor: '#2D6A4F',
    sub: 'dont 6 principales',
    spark: [10, 11, 12, 12, 13, 14, 15, 16, 16, 17, 18], sparkColor: '#3B6A8F',
  },
  {
    label: 'Catégorie principale', value: 'Textile', serif: true,
    sub: '89 produits · 1 845 000 F',
  },
  {
    label: 'Produits non classés', value: '5', delta: 'à assigner', deltaColor: '#C9601E',
    sub: 'à affecter à une catégorie',
  },
];

export interface CategoriesPageProps {
  categories?: Category[];
}

export default function CategoriesPage({ categories = SAMPLE_CATEGORIES }: CategoriesPageProps) {
  const totalProducts = categories.reduce((s, c) => s + c.products, 0);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Catégories</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>catégories</span>
          </h1>
          <p className={styles.subtitle}>
            {categories.length} catégories · {totalProducts} produits répartis
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}>
            <DownloadIcon size={14} /> Exporter
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* 3-col KPIs */}
      <div className={styles.kpis3}>
        {CAT_KPIS.map(k => (
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

      {/* Category cards */}
      <div className={styles.catCardGrid}>
        {categories.map(cat => (
          <div key={cat.id} className={styles.catCard}>
            <div className={styles.catCardAccent} style={{ background: cat.color }} />
            <div className={styles.catCardBody}>
              <div className={styles.catCardTop}>
                <div className={styles.catCardName}>{cat.name}</div>
                <span className={`${styles.status} ${styles.actif}`}>
                  <span className={styles.d} />Actif
                </span>
              </div>
              <div className={styles.catCardStats}>
                <div className={styles.catStat}>
                  <div className={styles.catStatValue}>{cat.products}</div>
                  <div className={styles.catStatLabel}>Produits</div>
                </div>
                <div className={styles.catStat}>
                  <div className={styles.catStatValue}>{(cat.revenue / 1000).toFixed(0)}k F</div>
                  <div className={styles.catStatLabel}>Valeur stock</div>
                </div>
              </div>
              <div className={styles.catCardFoot}>
                <div className={styles.catCardMeta}>
                  <FolderIcon size={12} />
                  {cat.subcats} sous-catégorie{cat.subcats > 1 ? 's' : ''}
                </div>
                <button type="button" className={styles.rowMenu}>
                  <MoreIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
