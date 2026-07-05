/**
 * MouvementsPage — stock movement log.
 * Design: implementation 8 (pulsing button, MouvementDrawer, sparklines).
 * Data: real API fetch (/api/admin/stock/mouvements).
 */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { MovementType } from './types';
import Sparkline from './Sparkline';
import { DownloadIcon, FilterIcon, ArrowRightIcon, TrendIcon } from './icons';
import MouvementDrawer from './MouvementDrawer';
import { injectKeyframes } from './drawerUtils';
import styles from './Magasin.module.css';

function SparklesIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.7L19 10l-5.1 1.3L12 17l-1.9-5.7L5 10l5.1-1.3z"/>
      <path d="M5 3l.9 2.6L8 7l-2.1.4L5 10l-.9-2.6L2 7l2.1-.4z" strokeWidth="1.5"/>
      <path d="M19 17l.9 2.6L22 21l-2.1.4L19 24l-.9-2.6L16 21l2.1-.4z" strokeWidth="1.5"/>
    </svg>
  );
}

interface Forecast {
  produit_id:     number;
  nom:            string;
  stock:          number;
  ventes_30j:     number;
  jours_restants: number | null;
  urgence:        'critique' | 'attention' | 'ok';
  recommandation: string;
  qte_a_commander: number;
}

const URGENCE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critique: { bg: 'var(--danger-bg)', color: 'var(--danger)',  label: 'Critique' },
  attention:{ bg: 'var(--warn-bg)',   color: 'var(--warn)',    label: 'Attention' },
  ok:       { bg: 'var(--ok-bg)',     color: 'var(--ok)',      label: 'OK' },
};

// ── API types ─────────────────────────────────────────────────────────────────

interface ApiMouvement {
  id:          number;
  produit_id:  number;
  nom_produit: string;
  type:        'entree' | 'retrait' | 'vente' | 'ajustement';
  quantite:    number;
  stock_apres: number;
  reference:   string | null;
  note:        string | null;
  created_at:  string;
}

interface ApiCounts { total: number; entrees: number; sorties: number; ajustements: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<MovementType, React.CSSProperties> = {
  'Entrée':     { background: 'var(--ok-bg)',     color: 'var(--ok)'     },
  'Sortie':     { background: 'var(--danger-bg)', color: 'var(--danger)' },
  'Transfert':  { background: 'var(--accent-bg)', color: 'var(--accent)' },
  'Ajustement': { background: 'var(--warn-bg)',   color: 'var(--warn)'   },
};

function mapType(t: ApiMouvement['type']): MovementType {
  if (t === 'entree')     return 'Entrée';
  if (t === 'ajustement') return 'Ajustement';
  return 'Sortie';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// Pulsing "Nouveau mouvement" button (impl 8 design)
const xferBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500,
  border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff',
  cursor: 'pointer', fontFamily: 'inherit',
  animation: 'mgPulse 2.6s ease infinite',
};

// Backdrop
const Backdrop = ({ onClose }: { onClose: () => void }) => (
  <div
    onMouseDown={onClose}
    style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,14,.34)', backdropFilter: 'blur(2px)', zIndex: 50, animation: 'mgFade .18s ease' }}
  />
);

// ── Props ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MouvementsPageProps {
  movements?: any[]; // legacy prop, ignored — data fetched internally
  onStockChange?: () => void; // refresh product list/stock elsewhere in the workspace
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MouvementsPage({ onStockChange }: MouvementsPageProps) {
  injectKeyframes();

  const [items,        setItems]        = useState<ApiMouvement[]>([]);
  const [counts,       setCounts]       = useState<ApiCounts>({ total: 0, entrees: 0, sorties: 0, ajustements: 0 });
  const [loading,      setLoading]      = useState(true);
  const [showDrawer,   setShowDrawer]   = useState(false);
  const [drawerProds,  setDrawerProds]  = useState<Array<{ produit_id: number; nom: string; reference: string; stock: number; variant_id?: number; variant_nom?: string }>>([]);
  const [toast,        setToast]        = useState('');
  const [forecasts,       setForecasts]       = useState<Forecast[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError,   setForecastError]   = useState('');
  const [forecastMsg,     setForecastMsg]     = useState('');
  const [showForecast,    setShowForecast]    = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/stock/mouvements?limit=50', { credentials: 'include' });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (data.items)  setItems(data.items);
      if (data.counts) setCounts(data.counts);
    } catch { /* keep existing */ }
    finally { if (mountedRef.current) setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMovements();
    // Fetch produits au montage — même contexte que mouvements
    fetch('/api/admin/stock/produits', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.produits) && d.produits.length > 0) {
          setDrawerProds(d.produits);
        } else {
          return fetch('/api/admin/products?limit=500', { credentials: 'include' })
            .then(r2 => r2.json())
            .then(d2 => {
              const arr = Array.isArray(d2.products) ? d2.products : Array.isArray(d2.data) ? d2.data : [];
              setDrawerProds(arr.map((p: { id?: number; nom?: string; reference?: string; stock_magasin?: number }) => ({
                produit_id: p.id ?? 0,
                nom:        p.nom ?? '',
                reference:  p.reference ?? '',
                stock:      p.stock_magasin ?? 0,
              })));
            });
        }
      })
      .catch(() => {});
  }, [fetchMovements]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const loadForecast = useCallback(async () => {
    setForecastLoading(true);
    setForecastError('');
    setForecastMsg('');
    setShowForecast(true);
    try {
      const res  = await fetch('/api/admin/ai/stock-forecast', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setForecastError(data.error ?? 'Erreur serveur'); return; }
      if (data.message) { setForecastMsg(data.message); setForecasts([]); return; }
      setForecasts(Array.isArray(data.forecasts) ? data.forecasts : []);
    } catch { setForecastError('Erreur réseau'); }
    finally { setForecastLoading(false); }
  }, []);

  // KPIs avec sparklines (valeurs réelles, sparklines décoratives)
  const KPIS = [
    {
      label: 'Mouvements total',   value: String(counts.total),
      delta: '', deltaColor: '#2D6A4F',
      sub: 'tous types confondus',
      spark: [40,45,48,50,52,55,58,60,62,65,counts.total || 70],
      color: '#3B6A8F',
    },
    {
      label: 'Entrées stock',      value: String(counts.entrees),
      delta: '', deltaColor: '#2D6A4F',
      sub: 'réceptions fournisseurs',
      spark: [20,22,24,25,26,28,29,30,31,32,counts.entrees || 35],
      color: '#2D6A4F',
    },
    {
      label: 'Sorties → boutique', value: String(counts.sorties),
      delta: '', deltaColor: '#C9601E',
      sub: 'transferts et ventes',
      spark: [10,12,13,14,15,16,17,18,19,20,counts.sorties || 22],
      color: '#C9601E',
    },
    {
      label: 'Ajustements',        value: String(counts.ajustements),
      delta: '', deltaColor: '#5C4A88',
      sub: 'corrections de stock',
      spark: [2,3,3,4,4,5,5,5,6,6,counts.ajustements || 7],
      color: '#5C4A88',
    },
  ];

  return (
    <>
      {showDrawer && (
        <>
          <Backdrop onClose={() => setShowDrawer(false)} />
          <MouvementDrawer
            produits={drawerProds}
            onClose={() => setShowDrawer(false)}
            onSuccess={() => {
              showToast('✓ Mouvement enregistré — stock mis à jour');
              fetchMovements();
              onStockChange?.();
            }}
          />
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9998, padding: '11px 20px', background: 'var(--ok)', color: 'white', borderRadius: 12, fontSize: 13.5, fontWeight: 500, boxShadow: '0 8px 24px -4px rgba(45,106,79,.4)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Stock</div>
          <h1 className={styles.title}>
            Mouvements <span className={styles.serif}>de stock</span>
          </h1>
          <p className={styles.subtitle}>
            {loading
              ? 'Chargement…'
              : `${counts.total} mouvement${counts.total !== 1 ? 's' : ''} · ${counts.entrees} entrées · ${counts.sorties} sorties · ${counts.ajustements} ajustements`
            }
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}
            onClick={loadForecast} disabled={forecastLoading}
            title="Analyse IA des prévisions de rupture de stock">
            <SparklesIcon size={14} />
            {forecastLoading ? 'Analyse…' : 'Prévisions IA'}
          </button>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={styles.btn}><FilterIcon size={14} /> Filtres</button>
          <button
            type="button"
            style={xferBtnStyle}
            onClick={() => setShowDrawer(true)}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.animation = 'none';
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.animation = 'mgPulse 2.6s ease infinite';
              (e.currentTarget as HTMLButtonElement).style.filter = '';
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="m17 2 4 4-4 4"/><path d="M3 6h18"/>
              <path d="m7 22-4-4 4-4"/><path d="M21 18H3"/>
            </svg>
            Nouveau mouvement
          </button>
        </div>
      </div>

      {/* Prévisions IA */}
      {showForecast && (
        <div style={{ margin: '16px 0 0', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SparklesIcon size={15} />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Prévisions IA — Risques de rupture</span>
            </div>
            <button className={styles.btn} style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setShowForecast(false)}>Fermer</button>
          </div>

          {forecastLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--bg-2)', opacity: 0.6 + i * 0.1,
                  backgroundImage: 'linear-gradient(90deg, var(--bg-2) 0%, var(--border) 50%, var(--bg-2) 100%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          )}

          {forecastError && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 9, fontSize: 13 }}>
              {forecastError}
            </div>
          )}

          {forecastMsg && (
            <div style={{ padding: '10px 14px', background: 'var(--ok-bg)', color: 'var(--ok)', borderRadius: 9, fontSize: 13, fontWeight: 500 }}>
              ✓ {forecastMsg}
            </div>
          )}

          {!forecastLoading && forecasts.length > 0 && (
            <div className={styles.tableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th style={{ textAlign: 'right' }}>Stock</th>
                      <th style={{ textAlign: 'right' }}>Ventes 30j</th>
                      <th style={{ textAlign: 'right' }}>Jours restants</th>
                      <th>Urgence</th>
                      <th>Recommandation</th>
                      <th style={{ textAlign: 'right' }}>Qté à commander</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((f, i) => {
                      const urg = URGENCE_STYLE[f.urgence] ?? URGENCE_STYLE.ok;
                      return (
                        <tr key={i}>
                          <td><div className={styles.productName}>{f.nom}</div></td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 600 }}>{f.stock}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13 }}>{f.ventes_30j}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 600, color: f.jours_restants !== null && f.jours_restants < 7 ? 'var(--danger)' : f.jours_restants !== null && f.jours_restants < 20 ? 'var(--warn)' : 'var(--ink)' }}>
                            {f.jours_restants !== null ? `${f.jours_restants}j` : '—'}
                          </td>
                          <td>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: urg.bg, color: urg.color }}>
                              {urg.label}
                            </span>
                          </td>
                          <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 200 }}>{f.recommandation}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                            {f.qte_a_commander > 0 ? `+${f.qte_a_commander}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className={styles.kpis}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && (
                <div className={styles.kpiDelta} style={{ color: k.deltaColor }}>
                  <TrendIcon size={10} />{k.delta}
                </div>
              )}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              <Sparkline data={k.spark} color={k.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>
            Chargement…
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Qté</th>
                  <th>De</th>
                  <th />
                  <th>Vers</th>
                  <th style={{ textAlign: 'right' }}>Stock après</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-2)', fontSize: 13 }}>
                      Aucun mouvement enregistré
                    </td>
                  </tr>
                ) : items.map(m => {
                  const displayType = mapType(m.type);
                  const qty  = m.type === 'entree' || m.type === 'ajustement' ? m.quantite : -m.quantite;
                  const from = m.type === 'entree' ? 'Fournisseur' : 'Magasin';
                  const to   = m.type === 'entree' ? 'Magasin' : m.type === 'ajustement' ? '—' : 'Boutique';
                  return (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(m.created_at)}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{m.nom_produit}</div>
                        {m.note && <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 11, color: 'var(--muted-2)' }}>{m.note}</div>}
                      </td>
                      <td>
                        <span className={styles.tag} style={TYPE_STYLE[displayType]}>{displayType}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 600, color: qty > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                        {qty > 0 ? '+' : ''}{qty}
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{from}</td>
                      <td style={{ color: 'var(--muted-2)' }}><ArrowRightIcon size={12} /></td>
                      <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{to}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 12.5, color: 'var(--muted)' }}>
                        {m.stock_apres ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className={styles.tableFoot}>
          <span>{counts.total} mouvement{counts.total !== 1 ? 's' : ''}</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">…</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
