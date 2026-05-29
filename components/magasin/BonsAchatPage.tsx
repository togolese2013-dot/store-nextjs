/**
 * BonsAchatPage — purchase order management
 * Route: page id 'bons-achat' in MagasinShell
 */
import React from 'react';
import type { PurchaseOrder, PurchaseOrderStatus } from './types';
import { SAMPLE_PURCHASE_ORDERS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';

const KPIS = [
  { label: 'Bons en cours',         value: '6',       delta: '2 en attente', deltaColor: '#C9601E', sub: 'à traiter',            spark: [3,4,4,5,5,6,5,6,6,6,6],               color: '#C9601E' },
  { label: 'Valeur totale en cours', value: '845 000', unit: 'F', delta: '+18%', deltaColor: '#2D6A4F', sub: 'vs mois dernier', spark: [520,580,610,640,700,720,760,800,820,830,845], color: '#3B6A8F' },
  { label: 'Reçus ce mois',          value: '4',       delta: '+1',            deltaColor: '#2D6A4F', sub: 'sur 6 bons émis',    spark: [1,2,2,2,3,3,3,4,4,4,4],               color: '#2D6A4F' },
];

const STATUS_STYLE: Record<PurchaseOrderStatus, React.CSSProperties> = {
  'En attente': { background: 'var(--warn-bg)',      color: 'var(--warn)' },
  'Confirmé':   { background: 'var(--accent-bg)',    color: 'var(--accent)' },
  'Expédié':    { background: '#E6E0F0',             color: '#5C4A88' },
  'Reçu':       { background: 'var(--ok-bg)',        color: 'var(--ok)' },
  'Annulé':     { background: 'rgba(20,17,14,.06)',  color: 'var(--muted)' },
};

export interface BonsAchatPageProps {
  orders?: PurchaseOrder[];
}

export default function BonsAchatPage({ orders = SAMPLE_PURCHASE_ORDERS }: BonsAchatPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement</div>
          <h1 className={styles.title}>
            Bons d&apos;<span className={styles.serif}>achat</span>
          </h1>
          <p className={styles.subtitle}>
            6 bons en cours · 2 en attente de confirmation · 845 000 F engagés
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Nouveau bon d&apos;achat
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

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Fournisseur</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Produits</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.ref}>
                  <td>
                    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12.5, fontWeight: 500 }}>
                      {o.ref}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{o.supplier}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{o.date}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{o.products}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                    {o.amount.toLocaleString('fr-FR')} F
                  </td>
                  <td>
                    <span className={styles.tag} style={STATUS_STYLE[o.status]}>{o.status}</span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>6 bons d&apos;achat</span>
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
