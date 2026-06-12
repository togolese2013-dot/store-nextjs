/**
 * VariantesPage — variant group management
 * Route: page id 'variantes' in MagasinShell
 */
'use client';
import React from 'react';
import type { Variant } from './types';
import { SAMPLE_VARIANTS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

type LocalKpi = { label: string; value: string; unit?: string; delta?: string; deltaColor?: string; sub: string; spark?: number[]; color?: string; serif?: boolean };

export interface VariantesPageProps {
  variants?: Variant[];
}

export default function VariantesPage({ variants = SAMPLE_VARIANTS }: VariantesPageProps) {
  const ui = useUI();
  const totalCombinations = variants.reduce((s, v) => s + v.values.length, 0);
  const totalProducts     = variants.reduce((s, v) => s + v.products, 0);
  const mainGroup         = [...variants].sort((a, b) => b.products - a.products)[0];

  const KPIS: LocalKpi[] = [
    { label: 'Total variantes',        value: String(totalCombinations || '—'),     sub: 'combinaisons actives',    color: '#3B6A8F' },
    { label: 'Groupe le plus utilisé', value: mainGroup?.name ?? '—', serif: true,  sub: mainGroup ? `${mainGroup.products} produits associés` : '—' },
    { label: 'Groupes configurés',     value: String(variants.length),               sub: 'groupes de variantes',    color: '#5C4A88' },
  ];

  const subtitle = variants.length === 0
    ? 'Aucune variante configurée'
    : `${totalCombinations} combinaison${totalCombinations > 1 ? 's' : ''} · ${variants.length} groupe${variants.length > 1 ? 's' : ''} · ${totalProducts} produit${totalProducts > 1 ? 's' : ''} concerné${totalProducts > 1 ? 's' : ''}`;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Variantes</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>variantes</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Variantes')}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('variant')}>
            <PlusIcon size={14} /> Nouveau groupe
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
              {k.serif
                ? <div className={styles.kpiSerif}>{k.value}</div>
                : <div className={styles.kpiValue}>{k.value}</div>
              }
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.color && <Sparkline data={k.spark} color={k.color} />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Groupe</th>
                <th>Type</th>
                <th>Valeurs</th>
                <th style={{ textAlign: 'right' }}>Produits liés</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map(v => (
                <tr key={v.id}>
                  <td><div className={styles.productName}>{v.name}</div></td>
                  <td><span className={styles.tag}>{v.type}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {v.values.map(val => (
                        <span
                          key={val}
                          style={{
                            fontSize: 11, padding: '2px 7px', borderRadius: 99,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                    {v.products}
                  </td>
                  <td>
                    <span className={`${styles.status} ${styles.actif}`}>
                      <span className={styles.d} />Actif
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu} onClick={(e) => { e.stopPropagation(); ui.menu(e, [{ label: 'Modifier', icon: 'edit', onClick: () => ui.openForm('variant', 'edit', v) }, { sep: true }, { label: 'Supprimer', icon: 'trash', danger: true, onClick: () => ui.confirmDelete('le groupe', v.name) }], 'right'); }}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{variants.length} groupe{variants.length !== 1 ? 's' : ''} · {totalCombinations} variante{totalCombinations !== 1 ? 's' : ''}</span>
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
