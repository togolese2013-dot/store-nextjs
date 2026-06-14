'use client';
import React, { useState, useCallback } from 'react';
import type { Category } from './types';
import { SAMPLE_CATEGORIES } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, FolderIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

function SparklesIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.7L19 10l-5.1 1.3L12 17l-1.9-5.7L5 10l5.1-1.3z"/>
      <path d="M5 3l.9 2.6L8 7l-2.1.4L5 10l-.9-2.6L2 7l2.1-.4z" strokeWidth="1.5"/>
      <path d="M19 17l.9 2.6L22 21l-2.1.4L19 24l-.9-2.6L16 21l2.1-.4z" strokeWidth="1.5"/>
    </svg>
  );
}

interface KpiDef {
  label: string; value: string; unit?: string; delta?: string; deltaColor?: string;
  sub: string; spark?: number[]; sparkColor?: string; serif?: boolean;
}

export interface CategoriesPageProps { categories?: Category[]; }

export default function CategoriesPage({ categories = SAMPLE_CATEGORIES }: CategoriesPageProps) {
  const ui = useUI();
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<string | null>(null);

  const totalProducts = categories.reduce((s, c) => s + c.products, 0);
  const mainCat       = [...categories].sort((a, b) => b.products - a.products)[0];

  const CAT_KPIS: KpiDef[] = [
    { label: 'Total catégories',     value: String(categories.length), sub: `${totalProducts} produits répartis`, sparkColor: '#3B6A8F' },
    { label: 'Catégorie principale', value: mainCat?.name ?? '—', serif: true, sub: mainCat ? `${mainCat.products} produits · ${(mainCat.revenue / 1000).toFixed(0)}k F` : '—' },
    { label: 'Sans produits',        value: String(categories.filter(c => c.products === 0).length), sub: 'catégories vides' },
  ];

  const classifyProducts = useCallback(async () => {
    setClassifying(true);
    setClassifyResult(null);
    try {
      const res  = await fetch('/api/admin/ai/classify-products', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setClassifyResult(`Erreur : ${data.error}`);
        return;
      }
      if (data.message) {
        setClassifyResult(data.message);
      } else {
        setClassifyResult(`✓ ${data.classified} produit${data.classified > 1 ? 's' : ''} classé${data.classified > 1 ? 's' : ''} sur ${data.total}`);
      }
      setTimeout(() => setClassifyResult(null), 5000);
    } catch {
      setClassifyResult('Erreur réseau');
    } finally { setClassifying(false); }
  }, []);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Catégories</div>
          <h1 className={styles.title}>Gestion des <span className={styles.serif}>catégories</span></h1>
          <p className={styles.subtitle}>{categories.length} catégories · {totalProducts} produits répartis</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Catégories')}>
            <DownloadIcon size={14} /> Exporter
          </button>
          <button
            type="button" className={styles.btn}
            onClick={classifyProducts}
            disabled={classifying}
            title="Classer automatiquement les produits sans catégorie avec l'IA"
          >
            <SparklesIcon size={14} />
            {classifying ? 'Analyse…' : 'Classer avec IA'}
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('category')}>
            <PlusIcon size={14} /> Nouvelle catégorie
          </button>
        </div>
      </div>

      {classifyResult && (
        <div style={{
          margin: '0 0 4px', padding: '10px 20px',
          background: classifyResult.startsWith('Erreur') ? 'var(--danger-bg)' : 'var(--ok-bg)',
          color: classifyResult.startsWith('Erreur') ? 'var(--danger)' : 'var(--ok)',
          fontSize: 13, fontWeight: 500,
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <SparklesIcon size={13} /> {classifyResult}
        </div>
      )}

      <div className={styles.kpis3}>
        {CAT_KPIS.map(k => (
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

      <div className={styles.catCardGrid}>
        {categories.map(cat => (
          <div key={cat.id} className={styles.catCard}>
            <div className={styles.catCardAccent} style={{ background: cat.color }} />
            <div className={styles.catCardBody}>
              <div className={styles.catCardTop}>
                <div className={styles.catCardName}>{cat.name}</div>
                <span className={`${styles.status} ${styles.actif}`}><span className={styles.d} />Actif</span>
              </div>
              <div className={styles.catCardStats}>
                <div className={styles.catStat}>
                  <div className={styles.catStatValue}>{cat.products}</div>
                  <div className={styles.catStatLabel}>Produits</div>
                </div>
                <div className={styles.catStat}>
                  <div className={styles.catStatValue}>{(cat.revenue / 1000).toFixed(0)}k F</div>
                  <div className={styles.catStatLabel}>Valeur stock</div>
                </div>
              </div>
              <div className={styles.catCardFoot}>
                <div className={styles.catCardMeta}><FolderIcon size={12} />{cat.subcats} sous-catégorie{cat.subcats > 1 ? 's' : ''}</div>
                <button type="button" className={styles.rowMenu} onClick={(e) => {
                  e.stopPropagation();
                  ui.menu(e, [
                    { label: 'Modifier', icon: 'edit', onClick: () => ui.openForm('category', 'edit', cat) },
                    { sep: true },
                    { label: 'Supprimer', icon: 'trash', danger: true, onClick: () => ui.confirmDelete('la catégorie', cat.name, { onConfirm: () => ui.config.onDeleteRow?.('category', cat) }) },
                  ], 'right');
                }}><MoreIcon size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
