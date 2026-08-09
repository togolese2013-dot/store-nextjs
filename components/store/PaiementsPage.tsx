/**
 * PaiementsPage — payment history content (dérivé des commandes)
 * Mount via StoreShell (page id: 'paiements').
 */
'use client';
import React from 'react';
import type { ComponentType } from 'react';
import { useUI } from '@/components/interaction-layer';
import type { Payment, StoreOrderStats } from './types';
import { PAYMENT_METHOD_STYLE, PAYMENT_STATUS_STYLE } from './sample-data';
import { DownloadIcon, ZapIcon, CardIcon } from './icons';
import styles from './Store.module.css';

const METHOD_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  'Moov Money':  ZapIcon,
  'Mixx by Yas': ZapIcon,
  'Échelonné':   CardIcon,
  'Comptant':    CardIcon,
};

function pct(current: number, previous: number): string | undefined {
  if (previous === 0) return current === 0 ? '0%' : undefined;
  const d = Math.round(((current - previous) / previous) * 100);
  return `${d >= 0 ? '+' : ''}${d}%`;
}

export interface PaiementsPageProps {
  payments?: Payment[];
  stats?: StoreOrderStats;
}

export default function PaiementsPage({ payments = [], stats }: PaiementsPageProps) {
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
    color: (PAYMENT_METHOD_STYLE[name]?.color as string) ?? 'var(--ink)',
    bg:    (PAYMENT_METHOD_STYLE[name]?.background as string) ?? 'var(--bg-2)',
  })).sort((a, b) => b.amount - a.amount);

  const methodePrincipale = METHOD_SUMMARY[0]?.name ?? '—';
  const tauxSucces = stats && stats.commandes_mois > 0 ? Math.round((stats.paye_mois / stats.commandes_mois) * 100) : 0;

  const KPIS = [
    { label: 'CA total ce mois', value: (stats?.ca_paye_mois ?? 0).toLocaleString('fr-FR'), unit: 'F', delta: pct(stats?.ca_paye_mois ?? 0, stats?.ca_paye_mois_prec ?? 0), sub: 'paiements confirmés' },
    { label: 'Méthode principale', value: methodePrincipale, serif: true, sub: 'des transactions récentes' },
    { label: 'Taux de succès', value: String(tauxSucces), unit: '%', sub: 'commandes payées ce mois' },
  ];

  const subtitle = payments.length === 0
    ? 'Aucun paiement récent'
    : `${totalCA.toLocaleString('fr-FR')} F récent · ${METHOD_SUMMARY.map(m => `${m.name} ${m.pct}%`).join(' · ')}`;

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
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta}>{k.delta}</div>}
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
            </div>
          </div>
        ))}
      </div>

      {/* Method summary cards */}
      {METHOD_SUMMARY.length > 0 && (
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
      )}

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
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>Aucun paiement</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{payments.length} transaction{payments.length !== 1 ? 's' : ''} récente{payments.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </>
  );
}
