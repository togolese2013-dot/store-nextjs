/**
 * KPI strip — 4 cards at the top of the Magasin page.
 */
import React from 'react';
import type { KpiCard } from './types';
import { TrendIcon } from './icons';
import Sparkline from './Sparkline';
import styles from './Magasin.module.css';

interface KpiStripProps {
  kpis: KpiCard[];
}

export default function KpiStrip({ kpis }: KpiStripProps) {
  return (
    <div className={styles.kpis}>
      {kpis.map((k) => (
        <div key={k.label} className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiDelta} style={{ color: k.deltaColor }}>
              <TrendIcon size={10} />
              {k.delta}
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{k.value}</div>
            {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
          </div>
          <div className={styles.kpiFoot}>
            <div className={styles.kpiSub}>{k.sub}</div>
            <Sparkline data={k.spark} color={k.color} />
          </div>
        </div>
      ))}
    </div>
  );
}
