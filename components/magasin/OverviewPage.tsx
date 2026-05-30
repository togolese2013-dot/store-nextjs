'use client';
import React from 'react';
import type { Product, Category, KpiCard } from './types';
import { SAMPLE_PRODUCTS, SAMPLE_KPIS, SAMPLE_CATEGORIES } from './sample-data';
import KpiStrip from './KpiStrip';
import { DownloadIcon, SparklesIcon, FolderIcon, MoreIcon } from './icons';
import styles from './Magasin.module.css';

function stockColor(pct: number): string {
  if (pct < 0.15) return '#9C3A14';
  if (pct < 0.40) return '#C9601E';
  if (pct < 0.70) return '#5C4A88';
  return '#2D6A4F';
}

const ACTIVITY: { label: string; time: string; color: string }[] = [];

export interface OverviewPageProps {
  products?: Product[];
  categories?: Category[];
  kpis?: KpiCard[];
  onCreateProduct?: () => void;
}

export default function OverviewPage({
  products = SAMPLE_PRODUCTS,
  categories = SAMPLE_CATEGORIES,
  kpis = SAMPLE_KPIS,
}: OverviewPageProps) {
  const maxProds = Math.max(...categories.map(c => c.products), 1);
  const lowStock = products.filter(p => p.target > 0 && p.stock / p.target < 0.4);
  const topProds = [...products]
    .sort((a, b) => b.price * b.stock - a.price * a.stock)
    .slice(0, 5);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Aperçu</div>
          <h1 className={styles.title}>
            Vue d&apos;<span className={styles.serif}>ensemble</span>
          </h1>
          <p className={styles.subtitle}>
            Performance globale · {products.length} produits actifs · {categories.length} catégories
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}>
            <DownloadIcon size={14} /> Rapport
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`}>
            <SparklesIcon size={14} /> Suggestions IA
          </button>
        </div>
      </div>

      <KpiStrip kpis={kpis} />

      <div className={styles.ovGrid}>
        {/* Left — category distribution */}
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>
            Répartition par catégorie
            <button type="button" className={`${styles.btn} ${styles.btnSm}`}>
              Voir tout
            </button>
          </div>
          {categories.map(cat => (
            <div key={cat.id} className={styles.catBarRow}>
              <div className={styles.catBarName}>
                <span className={styles.catBarDot} style={{ background: cat.color }} />
                {cat.name}
              </div>
              <div className={styles.catBarTrack}>
                <div
                  className={styles.catBarFill}
                  style={{ width: `${(cat.products / maxProds) * 100}%`, background: cat.color }}
                />
              </div>
              <div className={styles.catBarCount}>{cat.products} prod.</div>
              <div className={styles.catBarRevenue}>{(cat.revenue / 1000).toFixed(0)}k F</div>
            </div>
          ))}
        </div>

        {/* Right — alerts + activity */}
        <div className={styles.ovSide}>
          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>
              <span style={{ color: 'var(--danger)' }}>Alertes stock</span>
              <span
                className={styles.tag}
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 11 }}
              >
                {lowStock.length} urgentes
              </span>
            </div>
            {lowStock.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--muted-2)', padding: '8px 0' }}>Aucune alerte</div>
            )}
            {lowStock.map(p => {
              const pct = p.target > 0 ? Math.min(1, p.stock / p.target) : 0;
              return (
                <div key={p.sku} className={styles.alertItem}>
                  <div
                    className={styles.thumb}
                    style={{ background: p.swatch, width: 30, height: 30, borderRadius: 7, fontSize: 11 }}
                  >
                    {p.initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div className={styles.alertStockBar}>
                        <div
                          className={styles.alertStockFill}
                          style={{ width: `${pct * 100}%`, background: stockColor(pct) }}
                        />
                      </div>
                      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--danger)', flexShrink: 0 }}>
                        {p.stock}/{p.target}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.ovCard}>
            <div className={styles.ovCardHead}>Activité récente</div>
            {ACTIVITY.map((a, i) => (
              <div key={i} className={styles.alertItem}>
                <div className={styles.alertDot} style={{ background: a.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.3 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className={styles.ovBot}>
        <div className={styles.ovCard}>
          <div className={styles.ovCardHead}>Top produits · valeur en stock</div>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Marque</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Valeur stock</th>
                <th style={{ textAlign: 'right' }}>Marge</th>
              </tr>
            </thead>
            <tbody>
              {topProds.map(p => {
                const val = p.price * p.stock;
                const mColor = p.margin > 55 ? 'var(--ok)' : p.margin > 40 ? 'var(--accent)' : 'var(--muted)';
                return (
                  <tr key={p.sku}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className={styles.thumb}
                          style={{ background: p.swatch, width: 30, height: 30, borderRadius: 7, fontSize: 11 }}
                        >
                          {p.initial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted-2)' }}>
                            {p.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.tag}>{p.cat}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{p.brand}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{p.stock}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                      {val.toLocaleString('fr-FR')} F
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: mColor }}>
                      {p.margin > 0 ? `${p.margin}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
