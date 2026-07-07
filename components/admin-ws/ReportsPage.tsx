/**
 * ReportsPage — advanced consolidated reports
 * Mount via AdminWsShell (page id: 'reports') or standalone.
 */
import React from 'react';
import type { Report } from './types';
import { SAMPLE_REPORTS } from './sample-data';
import { CogIcon, PlusIcon, DownloadIcon } from './icons';
import styles from './Admin.module.css';
import { useT } from '@/lib/i18n/use-admin-ws-lang';

export interface ReportsPageProps {
  reports?: Report[];
  onGenerate?: (name: string) => void;
}

export default function ReportsPage({ reports = SAMPLE_REPORTS, onGenerate }: ReportsPageProps) {
  const t = useT();
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>{t('reports.eyebrow')}</div>
          <h1 className={styles.title}>{t('reports.title.main')} <span className={styles.serif}>{t('reports.title.serif')}</span></h1>
          <p className={styles.subtitle}>{t('reports.subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><CogIcon size={14} /> {t('reports.scheduled_btn')}</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <PlusIcon size={14} /> {t('reports.custom_btn')}
          </button>
        </div>
      </div>

      <div className={styles.repGrid}>
        {reports.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.name} className={styles.repCard}>
              <div className={styles.repIc} style={{ background: r.bg, color: r.tint }}><Icon size={20} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.repName}>{r.name}</div>
                <div className={styles.repDesc}>{r.desc}</div>
              </div>
              <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={() => onGenerate?.(r.name)}>
                <DownloadIcon size={12} /> {t('common.generate')}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
