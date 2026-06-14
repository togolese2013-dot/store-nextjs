/**
 * FournisseursPage — supplier management
 * Route: page id 'fournisseurs' in MagasinShell
 */
'use client';
import React from 'react';
import type { Supplier } from './types';
import { SAMPLE_SUPPLIERS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

type LocalKpi = { label: string; value: string; unit?: string; delta?: string; deltaColor?: string; sub: string; spark?: number[]; color?: string; serif?: boolean };

export interface FournisseursPageProps {
  suppliers?: Supplier[];
}

export default function FournisseursPage({ suppliers = SAMPLE_SUPPLIERS }: FournisseursPageProps) {
  const ui = useUI();
  const actifs      = suppliers.filter(s => s.status === 'Actif').length;
  const totalCA     = suppliers.reduce((s, sup) => s + sup.total, 0);
  const countries   = new Set(suppliers.map(s => s.country)).size;
  const main        = [...suppliers].sort((a, b) => b.products - a.products)[0];
  const avgDelay    = suppliers.length > 0
    ? Math.round(suppliers.reduce((s, sup) => s + sup.delay, 0) / suppliers.length)
    : 0;

  const KPIS: LocalKpi[] = [
    { label: 'Fournisseurs actifs',   value: String(actifs),          sub: `sur ${suppliers.length} référencés`,    color: '#3B6A8F' },
    { label: 'Fournisseur principal', value: main?.name ?? '—', serif: true, sub: main ? `${main.products} produits · ${main.total.toLocaleString('fr-FR')} F` : '—' },
    { label: 'Délai moyen livraison', value: String(avgDelay || '—'), unit: avgDelay > 0 ? 'j' : undefined, sub: 'moyenne fournisseurs actifs', color: '#5C4A88' },
  ];

  const subtitle = suppliers.length === 0
    ? 'Aucun fournisseur enregistré'
    : `${actifs} fournisseur${actifs > 1 ? 's' : ''} actif${actifs > 1 ? 's' : ''}${totalCA > 0 ? ` · ${totalCA.toLocaleString('fr-FR')} F CA total` : ''} · ${countries} pays partenaire${countries > 1 ? 's' : ''}`;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>fournisseurs</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Fournisseurs')}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('supplier')}>
            <PlusIcon size={14} /> Nouveau fournisseur
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
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
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
                <th>Fournisseur</th>
                <th>Pays</th>
                <th style={{ textAlign: 'right' }}>Produits</th>
                <th style={{ textAlign: 'right' }}>Total achats</th>
                <th style={{ textAlign: 'right' }}>Délai moy.</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => {
                const delayColor = s.delay <= 7 ? 'var(--ok)' : s.delay > 20 ? 'var(--warn)' : 'var(--ink)';
                const statusClass = s.status === 'Actif' ? styles.actif : styles.brouillon;
                return (
                  <tr key={s.name}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className={styles.thumb} style={{ background: s.color, fontSize: 11 }}>{s.init}</div>
                        <div className={styles.productName}>{s.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{s.country}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{s.products}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                      {s.total.toLocaleString('fr-FR')} F
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, color: delayColor, fontWeight: 500 }}>
                      {s.delay}j
                    </td>
                    <td>
                      <span className={`${styles.status} ${statusClass}`}>
                        <span className={styles.d} />{s.status}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <button type="button" className={styles.rowMenu} onClick={(e) => { e.stopPropagation(); ui.menu(e, [{ label: 'Modifier', icon: 'edit', onClick: () => ui.openForm('supplier', 'edit', s) }, { sep: true }, { label: 'Supprimer', icon: 'trash', danger: true, onClick: () => ui.confirmDelete('le fournisseur', s.name, { onConfirm: () => ui.config.onDeleteRow?.('supplier', s) }) }], 'right'); }}><MoreIcon size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{actifs} fournisseur{actifs !== 1 ? 's' : ''} actif{actifs !== 1 ? 's' : ''}</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
