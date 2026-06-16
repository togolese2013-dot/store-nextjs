'use client';
/**
 * VariantesPage — variant group management
 * Route: page id 'variantes' in MagasinShell
 * Self-fetching from /api/admin/variant-groups
 */
import React, { useCallback, useEffect, useState } from 'react';
import type { Variant } from './types';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

export interface VariantesPageProps {
  variants?: Variant[]; // kept for type compat, ignored — page self-fetches
}

function mapGroup(g: any): Variant {
  const valeurs: string[] = Array.isArray(g.valeurs) ? g.valeurs : [];
  return {
    id:       String(g.id),
    name:     g.nom ?? '—',
    type:     g.type ?? 'Texte',
    values:   valeurs,
    products: 0, // no join for now
  };
}

export default function VariantesPage(_props: VariantesPageProps) {
  const ui = useUI();
  const [list,    setList]    = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/variant-groups').then(r => r.json());
      if (r.groups) setList(r.groups.map(mapGroup));
    } catch { /* keep current */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    const handler = () => fetchList();
    window.addEventListener('variant-group-saved', handler);
    return () => window.removeEventListener('variant-group-saved', handler);
  }, [fetchList]);

  const totalCombinations = list.reduce((s, v) => s + v.values.length, 0);
  const mainGroup         = [...list].sort((a, b) => b.values.length - a.values.length)[0];

  const KPIS = [
    { label: 'Total valeurs',         value: String(totalCombinations || '—'), sub: 'combinaisons actives',  color: '#3B6A8F', spark: [2,3,4,4,5,6,6,7,7,8,totalCombinations%12||8] },
    { label: 'Groupe le plus riche',  value: mainGroup?.name ?? '—',           sub: mainGroup ? `${mainGroup.values.length} valeurs` : '—', serif: true },
    { label: 'Groupes configurés',    value: String(list.length),              sub: 'groupes de variantes',  color: '#5C4A88', spark: [1,1,2,2,2,3,3,3,4,4,list.length%8||4] },
  ];

  const subtitle = loading
    ? 'Chargement…'
    : list.length === 0
    ? 'Aucune variante configurée'
    : `${totalCombinations} valeur${totalCombinations > 1 ? 's' : ''} · ${list.length} groupe${list.length > 1 ? 's' : ''}`;

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
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Variantes')}>
            <DownloadIcon size={14} /> Exporter
          </button>
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
            </div>
            <div className={styles.kpiValueRow}>
              {(k as any).serif
                ? <div className={styles.kpiSerif}>{k.value}</div>
                : <div className={styles.kpiValue}>{k.value}</div>
              }
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {(k as any).spark && k.color && <Sparkline data={(k as any).spark} color={k.color} />}
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
                <th style={{ textAlign: 'right' }}>Nb valeurs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-2)', fontSize: 13 }}>
                    Chargement…
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--muted-2)', fontSize: 13 }}>
                    Aucun groupe de variantes · créez votre premier groupe
                  </td>
                </tr>
              ) : list.map(v => (
                <tr key={v.id}>
                  <td><div className={styles.productName}>{v.name}</div></td>
                  <td><span className={styles.tag}>{v.type}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {v.values.map(val => (
                        <span key={val} style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 99,
                          background: 'var(--bg-2)', border: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                        }}>
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                    {v.values.length}
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button" className={styles.rowMenu}
                      onClick={e => { e.stopPropagation(); ui.menu(e, [
                        { label: 'Modifier',  icon: 'edit',  onClick: () => ui.openForm('variant', 'edit', {
                            ...v, _raw: { id: v.id },
                            // pre-fill values as comma-separated string for the textarea
                            values: v.values.join(', '),
                          }) },
                        { sep: true },
                        { label: 'Supprimer', icon: 'trash', danger: true, onClick: () =>
                            ui.confirmDelete('le groupe', v.name, { onConfirm: () => ui.config.onDeleteRow?.('variant', { ...v, id: v.id }) })
                        },
                      ], 'right'); }}
                    >
                      <MoreIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{list.length} groupe{list.length !== 1 ? 's' : ''} · {totalCombinations} valeur{totalCombinations !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </>
  );
}
