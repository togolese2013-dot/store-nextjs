import React from 'react';
import type { Kpi } from './types';
import { TrendUpIcon } from './icons';
import styles from './Crm.module.css';

/* Format a number with French thousands separators ("1 421"). */
export function fmt(n: number): string {
  return n.toLocaleString('fr-FR');
}

/* ─── Sparkline ───────────────────────────────────────────────────── */
export function Spark({
  data, color, w = 90, h = 28,
}: { data: number[]; color: string; w?: number; h?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');
  return (
    <svg className={styles.spark} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Page header ─────────────────────────────────────────────────── */
export function PageHead({
  eyebrow, title, serif, sub, children,
}: {
  eyebrow: string;
  title: string;
  serif?: string;
  sub?: string;
  /** Action buttons rendered on the right */
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.head}>
      <div className={styles.headL}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h1 className={styles.t1}>
          {title} {serif && <span className={styles.serif}>{serif}</span>}
        </h1>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}

/* ─── KPI row ─────────────────────────────────────────────────────── */
export function KpiRow({ kpis, cols = 4 }: { kpis: Kpi[]; cols?: 3 | 4 }) {
  return (
    <div className={cols === 3 ? styles.kpis3 : styles.kpis}>
      {kpis.map((k) => (
        <div key={k.l} className={styles.kpi}>
          <div className={styles.kpiH}>
            <div className={styles.kpiL}>{k.l}</div>
            {k.d && (
              <div
                className={styles.kpiD}
                style={{ color: k.dc, background: k.dc ? `${k.dc}1F` : undefined }}
              >
                <TrendUpIcon size={10} />
                {k.d}
              </div>
            )}
          </div>
          <div className={styles.kpiV}>
            {k.serif
              ? <div className={styles.kpiVs}>{k.v}</div>
              : <div className={styles.kpiVn}>{k.v}</div>}
            {k.u && <div className={styles.kpiU}>{k.u}</div>}
          </div>
          <div className={styles.kpiF}>
            <div className={styles.kpiS}>{k.sub}</div>
            {k.spark && <Spark data={k.spark} color={k.c ?? 'var(--accent)'} />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Status tag ──────────────────────────────────────────────────── */
export function Tag({
  label, style,
}: { label: string; style?: React.CSSProperties }) {
  return <span className={styles.tag} style={style}>{label}</span>;
}
