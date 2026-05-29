/**
 * VentesPage — sales register content
 * Mount via BoutiqueShell (page id: 'ventes') or standalone.
 */
'use client';
import React, { useState } from 'react';
import type { Sale } from './types';
import { SAMPLE_SALES, VENTES_KPIS, PAYMENT_STYLE } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, FilterIcon, ChevDownIcon, PrinterIcon, TrendIcon } from './icons';
import styles from './Boutique.module.css';

const PERIOD_TABS = [
  { id: 'today', label: "Aujourd'hui",   count:   7 },
  { id: 'week',  label: 'Cette semaine', count:  32 },
  { id: 'month', label: 'Ce mois',       count: 124 },
];

export interface VentesPageProps {
  sales?: Sale[];
  onNewSale?: () => void;
}

export default function VentesPage({ sales = SAMPLE_SALES, onNewSale }: VentesPageProps) {
  const [period, setPeriod] = useState('today');

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Ventes</div>
          <h1 className={styles.title}>Registre des <span className={styles.serif}>ventes</span></h1>
          <p className={styles.subtitle}>7 ventes aujourd&apos;hui · 112 000 F encaissés · caisse ouverte</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onNewSale}>
            <PlusIcon size={14} /> Nouvelle vente
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
        {VENTES_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.sparkColor && <Sparkline data={k.spark} color={k.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      {/* Period tabs */}
      <div className={styles.tabsRow}>
        {PERIOD_TABS.map(t => (
          <button
            key={t.id} type="button"
            className={`${styles.tab} ${period === t.id ? styles.active : ''}`}
            onClick={() => setPeriod(t.id)}
          >
            {t.label}<span className={styles.pill}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.chip}><FilterIcon size={12} /> Filtres</button>
        <button type="button" className={styles.chip}>Paiement <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Client <ChevDownIcon size={10} /></button>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Heure</th>
                <th>Client</th>
                <th>Articles</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Paiement</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td><span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12.5, fontWeight: 500 }}>{s.id}</span></td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>{s.time}</td>
                  <td>
                    {s.client === '—'
                      ? <span style={{ color: 'var(--muted)', fontSize: 13 }}>Anonyme</span>
                      : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 99, background: s.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{s.init}</div>
                          <span style={{ fontWeight: 500 }}>{s.client}</span>
                        </div>
                      )}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.items}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>{s.amount.toLocaleString('fr-FR')} F</td>
                  <td><span className={styles.tag} style={PAYMENT_STYLE[s.payment]}>{s.payment}</span></td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu} title="Imprimer le reçu"><PrinterIcon size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>7 ventes ce jour</span>
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
