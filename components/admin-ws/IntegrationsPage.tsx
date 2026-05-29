/**
 * IntegrationsPage — connected apps marketplace
 * Mount via AdminWsShell (page id: 'integrations') or standalone.
 */
'use client';
import React, { useState } from 'react';
import type { Integration } from './types';
import { SAMPLE_INTEGRATIONS, INTEGRATIONS_KPIS } from './sample-data';
import Sparkline from './Sparkline';
import { SearchIcon, TrendIcon } from './icons';
import styles from './Admin.module.css';

export interface IntegrationsPageProps {
  integrations?: Integration[];
  onToggle?: (name: string, connected: boolean) => void;
}

export default function IntegrationsPage({ integrations = SAMPLE_INTEGRATIONS, onToggle }: IntegrationsPageProps) {
  const [ints, setInts] = useState(integrations);
  const connected = ints.filter(i => i.connected).length;

  const toggle = (name: string) => {
    const next = ints.map(it => it.name === name ? { ...it, connected: !it.connected } : it);
    setInts(next);
    onToggle?.(name, next.find(i => i.name === name)!.connected);
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Admin · Intégrations</div>
          <h1 className={styles.title}>Applications <span className={styles.serif}>connectées</span></h1>
          <p className={styles.subtitle}>{connected} intégrations actives · paiement, messagerie, livraison, marketing</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><SearchIcon size={14} /> Explorer le marketplace</button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {INTEGRATIONS_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              {k.serif ? <div className={styles.kpiSerif}>{k.value}</div> : <div className={styles.kpiValue}>{k.value}</div>}
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.sparkColor && <Sparkline data={k.spark} color={k.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      {/* Integration cards */}
      <div className={styles.intGrid}>
        {ints.map(it => (
          <div key={it.name} className={styles.intCard}>
            <div className={styles.intTop}>
              <div className={styles.intLogo} style={{ background: it.logoBg, color: it.logoColor }}>{it.init}</div>
              <button
                type="button"
                className={styles.toggle}
                style={{ background: it.connected ? 'var(--accent)' : 'var(--border)' }}
                onClick={() => toggle(it.name)}
                aria-checked={it.connected}
                role="switch"
              >
                <span className={styles.toggleKnob} style={{ left: it.connected ? 19 : 3 }} />
              </button>
            </div>
            <div>
              <div className={styles.intName}>{it.name}</div>
              <div className={styles.intCat}>{it.cat}</div>
            </div>
            <div className={styles.intDesc}>{it.desc}</div>
            <div className={styles.intFoot}>
              <span className={styles.status} style={{ color: it.connected ? 'var(--ok)' : 'var(--muted)' }}>
                <span className={styles.d} style={{ background: it.connected ? 'var(--ok)' : 'var(--muted-2)' }} />
                {it.connected ? 'Connecté' : 'Non connecté'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
