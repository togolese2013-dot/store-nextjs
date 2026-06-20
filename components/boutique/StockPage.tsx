/**
 * StockPage — boutique physical stock content
 * Stock here is distinct from the Magasin warehouse inventory.
 * Mount via BoutiqueShell (page id: 'stock') or standalone.
 */
'use client';
import React, { useState } from 'react';
import type { BoutiqueStock } from './types';
import { SAMPLE_STOCK } from './sample-data';
import Sparkline from './Sparkline';
import { PlusIcon, TrendIcon, ArrowRightIcon, AlertTriangleIcon } from './icons';
import styles from './Boutique.module.css';
import TransferRequestModal from '@/components/admin/TransferRequestModal';

export interface StockPageProps {
  stock?: BoutiqueStock[];
  onRequestTransfer?: (sku: string) => void;
  onRefresh?: () => void;
}

/* ── Modal state types ── */
type ModalType = null | 'ajustement';

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
const FIELD: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' };
const ROW: React.CSSProperties = { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 };

export default function StockPage({ stock = SAMPLE_STOCK, onRefresh }: StockPageProps) {
  const low      = stock.filter(p => p.boutique < p.seuil);
  const okCount  = stock.filter(p => p.boutique >= p.seuil).length;

  const STOCK_KPIS: import('./types').KpiItem[] = [
    { label: 'Références en boutique', value: String(stock.length), sub: 'du catalogue',                    sparkColor: '#3B6A8F' },
    { label: 'Alertes stock',          value: String(low.length),   sub: '< seuil de réapprovisionnement', sparkColor: '#C9601E' },
    { label: 'Références OK',          value: String(okCount),      sub: 'stock au-dessus du seuil',       sparkColor: '#2D6A4F' },
  ];

  /* ── Modal state ── */
  const [modal,        setModal]       = useState<ModalType>(null);
  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState('');

  /* ── Transfer drawer ── */
  const [xferOpen,     setXferOpen]    = useState(false);

  /* ajustement form */
  const [aProduitId,   setAProduitId]  = useState<number | ''>('');
  const [aType,        setAType]       = useState<'entree' | 'retrait'>('entree');
  const [aQty,         setAQty]        = useState('1');
  const [aMotif,       setAMotif]      = useState('');

  /* ── Open modals ── */
  function openAjustement() {
    setError(''); setAQty('1'); setAType('entree'); setAMotif('');
    setAProduitId(stock.length > 0 ? stock[0].produit_id : '');
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
      onRefresh?.();
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
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={openAjustement}>
            <PlusIcon size={14} /> Ajustement manuel
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
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
                <th>Stock boutique</th>
                <th style={{ textAlign: 'right' }}>Prix unit.</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stock.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
                    Aucun produit en stock boutique. Utilisez &quot;Demander transfert&quot; pour en ajouter.
                  </td>
                </tr>
              ) : stock.map(p => {
                const isLow = p.boutique < p.seuil;
                const ratio = p.seuil > 0 ? Math.min(1, p.boutique / p.seuil) : 1;
                const barColor = isLow ? 'var(--danger)' : ratio < 0.8 ? 'var(--warn)' : 'var(--ok)';
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
                    <td><span className={styles.tag}>{p.cat}</span></td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500, color: isLow ? 'var(--danger)' : 'var(--ink)' }}>
                        {p.boutique} <span style={{ color: 'var(--muted-2)', fontSize: 11, fontWeight: 400 }}>/ seuil {p.seuil}</span>
                      </div>
                      <div className={styles.stockBar}>
                        <div style={{ width: `${ratio * 100}%`, background: barColor }} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.prix.toLocaleString('fr-FR')} F</td>
                    <td>
                      {isLow
                        ? <span className={styles.tag} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangleIcon size={11} />Stock bas</span>
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
          <span>{low.length} alerte{low.length > 1 ? 's' : ''} · {stock.length} référence{stock.length > 1 ? 's' : ''}</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>

      {/* ── Drawer demande de transfert ── */}
      <TransferRequestModal
        open={xferOpen}
        products={stock.map(p => ({ name: p.name, sku: p.sku }))}
        onClose={() => setXferOpen(false)}
        onSubmitted={() => { setXferOpen(false); onRefresh?.(); }}
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
              {stock.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '8px 0' }}>Aucun produit en stock boutique.</div>
              ) : (
                <select
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg-2,#f9f9f7)' }}
                  value={aProduitId}
                  onChange={e => setAProduitId(Number(e.target.value))}
                >
                  {stock.map(p => (
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
                disabled={saving || !aProduitId || Number(aQty) <= 0 || stock.length === 0}
              >
                {saving ? 'En cours…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
