/**
 * FinancePage — cash register & finance content
 * Mount via BoutiqueShell (page id: 'finance') or standalone.
 */
import React from 'react';
import type { CashMovement } from './types';
import {
  SAMPLE_CASH, CASH_CURRENT_BALANCE, WEEK_REVENUE, FINANCE_KPIS,
} from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, TrendIcon } from './icons';
import styles from './Boutique.module.css';

const MOVEMENT_STYLE: Record<string, React.CSSProperties> = {
  Vente:     { background: 'var(--ok-bg)',     color: 'var(--ok)' },
  Sortie:    { background: 'var(--danger-bg)', color: 'var(--danger)' },
  Ouverture: { background: 'var(--blue-bg)',   color: 'var(--blue)' },
};

export interface FinancePageProps {
  movements?: CashMovement[];
  balance?: number;
}

export default function FinancePage({ movements = SAMPLE_CASH, balance = CASH_CURRENT_BALANCE }: FinancePageProps) {
  const maxCa = Math.max(...WEEK_REVENUE.map(w => w.ca));
  const weekTotal = WEEK_REVENUE.reduce((s, w) => s + w.ca, 0);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Finance</div>
          <h1 className={styles.title}>Caisse &amp; <span className={styles.serif}>finance</span></h1>
          <p className={styles.subtitle}>Solde actuel · mouvements du jour · CA semaine en cours</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Rapport</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Mouvement manuel
          </button>
        </div>
      </div>

      {/* Cash hero */}
      <div className={styles.caisseHero}>
        <div>
          <div className={styles.caisseLabel}>Solde caisse actuel</div>
          <div className={styles.caisseValue}>{balance.toLocaleString('fr-FR')} F</div>
          <div className={styles.caisseSub}>Ouverture 08h30 · fonds initiaux 30 000 F</div>
        </div>
        <div>
          <div className={styles.weekHead}>CA semaine en cours</div>
          <div className={styles.weekBars}>
            {WEEK_REVENUE.map(w => (
              <div key={w.day} className={styles.weekBarWrap}>
                <div
                  className={`${styles.weekBar} ${w.today ? styles.today : ''}`}
                  style={{ height: `${maxCa > 0 ? (w.ca / maxCa) * 80 : 4}px` }}
                />
                <div className={styles.weekLabel}>{w.day}</div>
              </div>
            ))}
          </div>
          <div className={styles.weekTotal}>CA sem. : {weekTotal.toLocaleString('fr-FR')} F</div>
        </div>
      </div>

      <div className={styles.kpis3}>
        {FINANCE_KPIS.map(k => (
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

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; heure</th>
                <th>Type</th>
                <th>Libellé</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th style={{ textAlign: 'right' }}>Solde caisse</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{m.date}</td>
                  <td><span className={styles.tag} style={MOVEMENT_STYLE[m.type]}>{m.type}</span></td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{m.label}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600, color: m.montant > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                    {m.montant > 0 ? '+' : ''}{m.montant.toLocaleString('fr-FR')} F
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{m.solde.toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>7 mouvements aujourd&apos;hui</span>
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
