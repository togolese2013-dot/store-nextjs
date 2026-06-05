/**
 * WorkspacesPage — enable / disable workspace modules
 * Mount via AdminWsShell (page id: 'workspaces') or standalone.
 */
'use client';
import React, { useState, useEffect } from 'react';
import type { WorkspaceHealth } from './types';
import { SAMPLE_WORKSPACES } from './sample-data';
import { PlusIcon } from './icons';
import styles from './Admin.module.css';

export interface WorkspacesPageProps {
  workspaces?: WorkspaceHealth[];
  onToggle?: (id: string, active: boolean) => void;
}

export default function WorkspacesPage({ workspaces = SAMPLE_WORKSPACES, onToggle }: WorkspacesPageProps) {
  const [ws, setWs] = useState(workspaces);

  // Sync when parent updates (e.g. after fetch)
  useEffect(() => { setWs(workspaces); }, [workspaces]);

  const toggle = (id: string) => {
    const next = ws.map(w => w.id === id ? { ...w, active: !w.active } : w);
    setWs(next);
    onToggle?.(id, next.find(w => w.id === id)!.active);
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Admin · Espaces</div>
          <h1 className={styles.title}>Gestion des <span className={styles.serif}>workspaces</span></h1>
          <p className={styles.subtitle}>4 espaces de travail · 3 actifs · activez ou désactivez l&apos;accès</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> Activer un module
          </button>
        </div>
      </div>

      <div className={`${styles.intGrid} ${styles.intGrid2}`} style={{ paddingTop: 16 }}>
        {ws.map(w => {
          const Icon = w.icon;
          return (
            <div key={w.id} className={styles.intCard} style={{ opacity: w.active ? 1 : 0.7 }}>
              <div className={styles.intTop}>
                <div className={styles.intLogo} style={{ background: w.bg, color: w.tint }}><Icon size={20} /></div>
                <button
                  type="button"
                  className={styles.toggle}
                  style={{ background: w.active ? 'var(--accent)' : 'var(--border)' }}
                  onClick={() => toggle(w.id)}
                  aria-checked={w.active}
                  role="switch"
                >
                  <span className={styles.toggleKnob} style={{ left: w.active ? 19 : 3 }} />
                </button>
              </div>
              <div>
                <div className={styles.intName}>{w.name}</div>
                <div className={styles.intCat}>{w.tag}</div>
              </div>
              <div className={styles.intFootRow}>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--ink)' }}>{w.count}</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>Activité : {w.activity}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
