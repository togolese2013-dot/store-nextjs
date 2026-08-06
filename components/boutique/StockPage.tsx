/**
 * StockPage — boutique physical stock content
 * Stock here is distinct from the Magasin warehouse inventory.
 * Mount via BoutiqueShell (page id: 'stock') or standalone.
 * Self-fetching (own pagination) — /api/admin/stock-boutique.
 */
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { BoutiqueStock } from './types';
import type { TransferRequest } from '@/lib/transferStore';
import { type ApiStockItem, mapStockItem } from './sale-mapping';
import Sparkline from './Sparkline';
import { PlusIcon, TrendIcon, ArrowRightIcon, AlertTriangleIcon, ReceiptIcon } from './icons';
import styles from './Boutique.module.css';
import { useBoutiqueConfig, fmtAmount } from './BoutiqueSettingsContext';
import { formatDateTime } from '@/lib/format-date';
import TransferRequestModal from '@/components/admin/TransferRequestModal';
import { TransferConfirmation } from './TransferConfirmation';
import { useAdminSSE } from '@/components/admin/useAdminSSE';

export interface StockMouvement {
  id: number;
  produit_id: number;
  nom_produit: string;
  type: 'entree' | 'retrait' | 'ajustement';
  quantite: number;
  motif: string | null;
  ref_commande: string | null;
  admin_nom: string | null;
  created_at: string;
}

interface StockStatsData {
  total_produits:  number;
  disponible:      number;
  valeur_boutique: number;
  stock_faible:    number;
  epuises:         number;
}

const LIMIT = 50;
const FULL_LIMIT = 500; // hors pagination — alimente les sélecteurs produit (ajustement, transfert)

export interface StockPageProps {
  onRequestTransfer?: (sku: string) => void;
}

/* ── Modal state types ── */
type ModalType = null | 'ajustement' | 'mouvements';

const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 999,
  background: 'rgba(0,0,0,.45)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 16,
};
const PANEL: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  padding: 28, width: '100%', maxWidth: 420,
  boxShadow: '0 20px 48px rgba(20,17,14,.18)',
  display: 'flex', flexDirection: 'column', gap: 16,
};
const PANEL_WIDE: React.CSSProperties = {
  ...PANEL, maxWidth: 720, maxHeight: '80vh', overflow: 'hidden',
};
const FIELD: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' };
const ROW: React.CSSProperties = { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 };

export default function StockPage({ onRequestTransfer }: StockPageProps) {
  const cfg = useBoutiqueConfig();

  /* ── Table (paginée) ── */
  const [page,       setPage]       = useState(1);
  const [items,       setItems]       = useState<BoutiqueStock[]>([]);
  const [total,       setTotal]       = useState(0);
  const [stats,       setStats]       = useState<StockStatsData>({ total_produits: 0, disponible: 0, valeur_boutique: 0, stock_faible: 0, epuises: 0 });
  const [movements,   setMovements]   = useState<StockMouvement[]>([]);

  /* ── Liste complète (sélecteurs ajustement / transfert, hors pagination) ── */
  const [allStock, setAllStock] = useState<BoutiqueStock[]>([]);

  const fetchAbortRef = useRef<AbortController | null>(null);
  const fetchStock = useCallback(() => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    const params = new URLSearchParams();
    params.set('limit', String(LIMIT));
    params.set('offset', String((page - 1) * LIMIT));

    fetch(`/api/admin/stock-boutique?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        setItems(Array.isArray(d.items) ? (d.items as ApiStockItem[]).map(mapStockItem) : []);
        setTotal(Number(d.total ?? 0));
        if (Array.isArray(d.movements)) setMovements(d.movements as StockMouvement[]);
        if (d.stats) setStats({
          total_produits:  Number(d.stats.total_produits  ?? 0),
          disponible:      Number(d.stats.disponible      ?? 0),
          valeur_boutique: Number(d.stats.valeur_boutique  ?? 0),
          stock_faible:    Number(d.stats.stock_faible     ?? 0),
          epuises:         Number(d.stats.epuises          ?? 0),
        });
      })
      .catch(e => { if (e?.name !== 'AbortError') setItems([]); });
  }, [page]);

  const fetchAllStock = useCallback(() => {
    fetch(`/api/admin/stock-boutique?limit=${FULL_LIMIT}&offset=0`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.items)) setAllStock((d.items as ApiStockItem[]).map(mapStockItem)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStock();
    return () => fetchAbortRef.current?.abort();
  }, [fetchStock]);

  useEffect(() => { fetchAllStock(); }, [fetchAllStock]);

  const { subscribe } = useAdminSSE();
  useEffect(() => subscribe((e) => {
    if (e.type === 'stock_transfer') { fetchStock(); fetchAllStock(); }
  }), [subscribe, fetchStock, fetchAllStock]);

  function refreshAll() { fetchStock(); fetchAllStock(); }

  const stockBas = stats.stock_faible + stats.epuises;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const STOCK_KPIS: import('./types').KpiItem[] = [
    {
      label: 'Total produits', value: String(stats.total_produits),
      delta: `${stats.disponible} actifs`, deltaColor: '#2D6A4F',
      sub: 'en catalogue',
      spark: [18, 20, 19, 22, 21, 25, 24, 26, 25, 28, stats.total_produits % 32 || 30], sparkColor: '#3B6A8F',
    },
    {
      label: 'Valeur stock', value: stats.valeur_boutique.toLocaleString('fr-FR'), unit: 'FCFA',
      delta: 'stock boutique', deltaColor: '#2D6A4F',
      sub: 'prix × quantité',
      spark: [120, 128, 132, 140, 136, 148, 156, 168, 172, 180, 194], sparkColor: '#2D6A4F',
    },
    {
      label: 'Stock bas', value: String(stockBas),
      delta: stockBas > 0 ? 'urgent' : 'OK', deltaColor: stockBas > 0 ? '#9C3A14' : '#2D6A4F',
      sub: '≤ 5 unités ou rupture',
      spark: [3, 2, 4, 5, 4, 6, 5, 6, 7, 6, stockBas % 10], sparkColor: '#C9601E',
    },
    {
      label: 'Ruptures', value: String(stats.epuises),
      delta: stats.epuises > 0 ? 'urgent' : 'OK', deltaColor: stats.epuises > 0 ? '#9C3A14' : '#2D6A4F',
      sub: 'stock = 0',
      spark: [1, 0, 2, 1, 2, 3, 2, 3, 2, 3, stats.epuises % 8], sparkColor: '#9C3A14',
    },
  ];

  /* ── Modal state ── */
  const [modal,        setModal]       = useState<ModalType>(null);
  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState('');

  /* ── Transfer drawer ── */
  const [xferOpen,     setXferOpen]    = useState(false);
  const [lastTransfer, setLastTransfer] = useState<TransferRequest | null>(null);

  /* ajustement form */
  const [aProduitId,   setAProduitId]  = useState<number | ''>('');
  const [aType,        setAType]       = useState<'entree' | 'retrait'>('entree');
  const [aQty,         setAQty]        = useState('1');
  const [aMotif,       setAMotif]      = useState('');

  /* ── Open modals ── */
  function openAjustement() {
    setError(''); setAQty('1'); setAType('entree'); setAMotif('');
    setAProduitId(allStock.length > 0 ? allStock[0].produit_id : '');
    setModal('ajustement');
  }

  function closeModal() { setModal(null); setError(''); }

  /* ── Submit ajustement ── */
  async function submitAjustement() {
    if (!aProduitId || !aQty || Number(aQty) <= 0) { setError('Produit et quantité requis.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/stock-boutique/mouvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produit_id: aProduitId, type: aType, quantite: Number(aQty), motif: aMotif || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Erreur serveur.'); return; }
      closeModal();
      refreshAll();
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Stock</div>
          <h1 className={styles.title}>Stock <span className={styles.serif}>boutique</span></h1>
          <p className={styles.subtitle}>Stock physique de la boutique · distinct de l&apos;entrepôt Magasin</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => setXferOpen(true)}>
            <ArrowRightIcon size={14} /> Demander transfert
          </button>
          <button type="button" className={styles.btn} onClick={() => setModal('mouvements')}>
            <ReceiptIcon size={14} /> Mouvements récents
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={openAjustement}>
            <PlusIcon size={14} /> Ajustement manuel
          </button>
        </div>
      </div>

      <div className={styles.kpis}>
        {STOCK_KPIS.map(k => (
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
                <th>Produit</th>
                <th>Catégorie</th>
                <th style={{ width: 64 }}>Stock boutique</th>
                <th style={{ width: 150, textAlign: 'right' }}>Prix unit.</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
                    Aucun produit en stock boutique. Utilisez &quot;Demander transfert&quot; pour en ajouter.
                  </td>
                </tr>
              ) : items.map(p => {
                const seuil = Math.max(p.seuil, cfg.seuilGlobal);
                const isRupture = p.boutique === 0;
                const isLow = !isRupture && p.boutique < seuil;
                const statusColor = isRupture ? 'var(--danger)' : isLow ? 'var(--warn)' : 'var(--ink)';
                return (
                  <tr key={p.produit_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: p.swatch, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{p.init}</div>
                        <div>
                          <div className={styles.productName}>{p.name}</div>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted-2)' }}>{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.tag} style={{ textTransform: 'uppercase' }}>{p.cat}</span></td>
                    <td style={{ textAlign: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500, color: statusColor }}>{p.boutique}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{fmtAmount(p.prix, cfg)}</td>
                    <td>
                      {isRupture
                        ? <span className={styles.tag} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangleIcon size={11} />Rupture</span>
                        : isLow
                        ? <span className={styles.tag} style={{ background: 'var(--warn-bg)', color: 'var(--warn)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangleIcon size={11} />Faible</span>
                        : <span className={styles.tag} style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}>OK</span>
                      }
                    </td>
                    <td />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{stockBas} alerte{stockBas > 1 ? 's' : ''} · {total} référence{total > 1 ? 's' : ''}</span>
          <div className={styles.pager}>
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
            <button type="button" className={styles.on}>{page}/{totalPages}</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
          </div>
        </div>
      </div>

      {/* ── Drawer demande de transfert ── */}
      <TransferRequestModal
        open={xferOpen}
        products={allStock.map(p => ({ name: p.name, sku: p.sku }))}
        onClose={() => setXferOpen(false)}
        onSubmitted={(rec) => { setXferOpen(false); setLastTransfer(rec); refreshAll(); }}
      />

      <TransferConfirmation
        record={lastTransfer}
        onDismiss={() => setLastTransfer(null)}
      />

      {/* ── Modal Ajustement Manuel ── */}
      {modal === 'ajustement' && (
        <div style={OVERLAY} onClick={closeModal}>
          <div style={PANEL} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className={styles.eyebrow}>Stock boutique</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Ajustement <span className={styles.serif}>manuel</span>
                </h3>
              </div>
              <button type="button" onClick={closeModal} style={{ border: 0, background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Produit</label>
              {allStock.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '8px 0' }}>Aucun produit en stock boutique.</div>
              ) : (
                <select
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg-2,#f9f9f7)' }}
                  value={aProduitId}
                  onChange={e => setAProduitId(Number(e.target.value))}
                >
                  {allStock.map(p => (
                    <option key={p.produit_id} value={p.produit_id}>
                      {p.name} · Stock actuel : {p.boutique}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['entree', 'retrait'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAType(t)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 9, border: `1.5px solid ${aType === t ? 'var(--accent)' : 'var(--border)'}`,
                      background: aType === t ? 'var(--accent-bg)' : 'var(--bg-2,#f9f9f7)',
                      color: aType === t ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    {t === 'entree' ? '+ Entrée' : '− Retrait'}
                  </button>
                ))}
              </div>
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Quantité</label>
              <input
                type="number" min={1} value={aQty}
                onChange={e => setAQty(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'Geist Mono, monospace', background: 'var(--bg-2,#f9f9f7)', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Motif (optionnel)</label>
              <input
                type="text" value={aMotif} placeholder="Casse, correction inventaire…"
                onChange={e => setAMotif(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg-2,#f9f9f7)', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {error && <div style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

            <div style={ROW}>
              <button type="button" className={styles.btn} onClick={closeModal} disabled={saving}>Annuler</button>
              <button
                type="button"
                className={`${styles.btn} ${styles.primary}`}
                onClick={submitAjustement}
                disabled={saving || !aProduitId || Number(aQty) <= 0 || allStock.length === 0}
              >
                {saving ? 'En cours…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Mouvements récents ── */}
      {modal === 'mouvements' && (
        <div style={OVERLAY} onClick={closeModal}>
          <div style={PANEL_WIDE} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className={styles.eyebrow}>Stock boutique</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Mouvements <span className={styles.serif}>récents</span>
                </h3>
              </div>
              <button type="button" onClick={closeModal} style={{ border: 0, background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
            </div>

            {movements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
                Aucun mouvement récent.
              </div>
            ) : (
              <div className={styles.tableScroll} style={{ overflowY: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Produit</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Quantité</th>
                      <th>Motif</th>
                      <th>Par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(mv => {
                      const isEntree = mv.type === 'entree';
                      const isRetrait = mv.type === 'retrait';
                      const date = (() => {
                        try {
                          return formatDateTime(mv.created_at);
                        } catch { return mv.created_at; }
                      })();
                      return (
                        <tr key={mv.id}>
                          <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>{date}</td>
                          <td style={{ fontWeight: 500 }}>{mv.nom_produit}</td>
                          <td>
                            <span className={styles.tag} style={{
                              background: isEntree ? 'var(--ok-bg)' : isRetrait ? 'var(--danger-bg)' : 'var(--bg-2,#f5f5f3)',
                              color: isEntree ? 'var(--ok)' : isRetrait ? 'var(--danger)' : 'var(--muted)',
                            }}>
                              {isEntree ? '↑ Entrée' : isRetrait ? '↓ Retrait' : 'Ajust.'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600, color: isEntree ? 'var(--ok)' : 'var(--danger)' }}>
                            {isEntree ? '+' : '−'}{mv.quantite}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{mv.motif ?? '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{mv.admin_nom ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
