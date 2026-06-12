/**
 * PaiementsPage — payment history content
 * Mount via StoreShell (page id: 'paiements') or standalone.
 */
import React from 'react';
import type { ComponentType } from 'react';
import { useUI } from '@/components/interaction-layer';
import type { Payment } from './types';
import {
  SAMPLE_PAYMENTS, PAIEMENTS_KPIS,
  PAYMENT_METHOD_STYLE, PAYMENT_STATUS_STYLE,
} from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, FilterIcon, MoreIcon, TrendIcon, ZapIcon, CardIcon } from './icons';
import styles from './Store.module.css';

const METHOD_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  Wave:           ZapIcon,
  'Orange Money': ZapIcon,
  Carte:          CardIcon,
};

const METHOD_META: Record<string, { color: string; bg: string }> = {
  Wave:           { color: '#1A73E8', bg: '#E8F0F7' },
  'Orange Money': { color: '#E07A2C', bg: 'var(--warn-bg)' },
  Carte:          { color: 'var(--ink)', bg: 'var(--bg-2)' },
};

export interface PaiementsPageProps {
  payments?: Payment[];
}

export default function PaiementsPage({ payments = SAMPLE_PAYMENTS }: PaiementsPageProps) {
  const ui = useUI();
  const totalCA = payments.reduce((s, p) => s + p.amount, 0);

  const methodTotals = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.method] = (acc[p.method] ?? 0) + p.amount;
    return acc;
  }, {});

  const METHOD_SUMMARY = Object.entries(methodTotals).map(([name, amount]) => ({
    name,
    amount,
    pct: totalCA > 0 ? Math.round((amount / totalCA) * 100) : 0,
    ...(METHOD_META[name] ?? { color: 'var(--ink)', bg: 'var(--bg-2)' }),
  }));

  const subtitle = payments.length === 0
    ? 'Aucun paiement ce mois'
    : `${totalCA.toLocaleString('fr-FR')} F ce mois · ${METHOD_SUMMARY.map(m => `${m.name} ${m.pct}%`).join(' · ')}`;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Paiements</div>
          <h1 className={styles.title}>Historique des <span className={styles.serif}>paiements</span></h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Paiements')}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={styles.btn}><FilterIcon size={14} /> Filtres</button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {PAIEMENTS_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
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
              {k.spark && k.sparkColor && <Sparkline data={k.spark} color={k.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      {/* Method summary cards */}
      <div className={styles.methodCards}>
        {METHOD_SUMMARY.map(m => {
          const Icon = METHOD_ICONS[m.name] ?? ZapIcon;
          return (
            <div key={m.name} className={styles.methodCard}>
              <div className={styles.methodIcon} style={{ background: m.bg, color: m.color }}>
                <Icon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 16, fontWeight: 600, letterSpacing: '-.01em' }}>
                  {m.pct}%
                </div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
                  {m.amount.toLocaleString('fr-FR')} F
                </div>
              </div>
              <div />
            </div>
          );
        })}
      </div>

      {/* Transactions table */}
      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Méthode</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Référence</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{p.date}</td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{p.client}</td>
                  <td>
                    <span className={styles.tag} style={PAYMENT_METHOD_STYLE[p.method] ?? {}}>
                      {p.method}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>
                    {p.amount.toLocaleString('fr-FR')} F
                  </td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11.5, color: 'var(--muted-2)' }}>{p.ref}</td>
                  <td>
                    <span className={styles.tag} style={PAYMENT_STATUS_STYLE[p.status] ?? {}}>{p.status}</span>
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
          <span>{payments.length} transaction{payments.length !== 1 ? 's' : ''} ce mois</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
