/**
 * FournisseursPage — supplier management
 * Route: page id 'fournisseurs' in MagasinShell
 */
import React from 'react';
import type { Supplier } from './types';
import { SAMPLE_SUPPLIERS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';

const KPIS = [
  { label: 'Fournisseurs actifs',   value: '24',           delta: '+2',  deltaColor: '#2D6A4F', sub: 'sur 26 référencés',       spark: [18,19,20,20,21,22,22,23,23,24,24], color: '#3B6A8F' },
  { label: 'Fournisseur principal', value: 'Wax Distrib.', serif: true,                         sub: '58 produits · 2 450 000 F' },
  { label: 'Délai moyen livraison', value: '14', unit: 'j', delta: '−2j', deltaColor: '#2D6A4F', sub: 'vs 16j mois dernier',     spark: [20,18,19,17,16,15,16,14,15,14,14], color: '#5C4A88' },
];

export interface FournisseursPageProps {
  suppliers?: Supplier[];
}

export default function FournisseursPage({ suppliers = SAMPLE_SUPPLIERS }: FournisseursPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>fournisseurs</span>
          </h1>
          <p className={styles.subtitle}>
            24 fournisseurs actifs · 4 455 000 F CA total · 5 pays partenaires
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
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
                      <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>24 fournisseurs actifs</span>
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
