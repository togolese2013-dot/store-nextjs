/**
 * BonsAchatPage — purchase order management
 * Route: page id 'bons-achat' in MagasinShell
 */
'use client';
import React from 'react';
import type { PurchaseOrder, PurchaseOrderStatus } from './types';
import { SAMPLE_PURCHASE_ORDERS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

type LocalKpi = { label: string; value: string; unit?: string; delta?: string; deltaColor?: string; sub: string; spark?: number[]; color?: string; serif?: boolean };

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
  const ui = useUI();
  const enCours    = orders.filter(o => o.status !== 'Reçu' && o.status !== 'Annulé').length;
  const enAttente  = orders.filter(o => o.status === 'En attente').length;
  const recus      = orders.filter(o => o.status === 'Reçu').length;
  const totalVal   = orders.filter(o => o.status !== 'Annulé').reduce((s, o) => s + o.amount, 0);

  const KPIS: LocalKpi[] = [
    { label: 'Bons en cours',         value: String(enCours),  unit: undefined, sub: 'à traiter',            color: '#C9601E' },
    { label: 'Valeur totale en cours', value: totalVal > 0 ? totalVal.toLocaleString('fr-FR') : '—', unit: totalVal > 0 ? 'F' : undefined, sub: 'bons non annulés', color: '#3B6A8F' },
    { label: 'Reçus ce mois',          value: String(recus),   unit: undefined, sub: `sur ${orders.length} bons émis`, color: '#2D6A4F' },
  ];

  const subtitle = orders.length === 0
    ? 'Aucun bon d\'achat'
    : `${enCours} bon${enCours > 1 ? 's' : ''} en cours · ${enAttente} en attente${totalVal > 0 ? ` · ${totalVal.toLocaleString('fr-FR')} F engagés` : ''}`;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement</div>
          <h1 className={styles.title}>
            Bons d&apos;<span className={styles.serif}>achat</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Bons d\'achat')}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('po')}>
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
                    <button type="button" className={styles.rowMenu} onClick={(e) => { e.stopPropagation(); ui.menu(e, [{ label: 'Modifier', icon: 'edit', onClick: () => ui.openForm('po', 'edit', o) }, { sep: true }, { label: 'Supprimer', icon: 'trash', danger: true, onClick: () => ui.confirmDelete('le bon d\'achat', o.ref, { onConfirm: () => ui.config.onDeleteRow?.('po', o) }) }], 'right'); }}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{orders.length} bon{orders.length !== 1 ? 's' : ''} d&apos;achat</span>
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
