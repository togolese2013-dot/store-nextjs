/**
 * MouvementsPage — historique mouvements + transfert magasin → boutique
 */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { MovementType } from './types';
import Sparkline from './Sparkline';
import { DownloadIcon, ArrowRightIcon, TrendIcon, PlusIcon } from './icons';
import styles from './Magasin.module.css';

// ── Types API ─────────────────────────────────────────────────────────────────

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

interface ProduitStock {
  produit_id:  number;
  nom:         string;
  reference:   string;
  stock:       number;
  variant_id?: number;
  variant_nom?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<MovementType, React.CSSProperties> = {
  'Entrée':     { background: 'var(--ok-bg)',     color: 'var(--ok)'     },
  'Sortie':     { background: 'var(--danger-bg)', color: 'var(--danger)' },
  'Transfert':  { background: 'var(--accent-bg)', color: 'var(--accent)' },
  'Ajustement': { background: 'var(--warn-bg)',   color: 'var(--warn)'   },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function mapType(type: ApiMouvement['type']): MovementType {
  if (type === 'entree')    return 'Entrée';
  if (type === 'ajustement') return 'Ajustement';
  return 'Sortie';
}

function TransferIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4 4 4"/>
      <path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
    </svg>
  );
}

// ── Transfer Modal ─────────────────────────────────────────────────────────────

interface TransferModalProps {
  onClose:  () => void;
  onSuccess: () => void;
}

function TransferModal({ onClose, onSuccess }: TransferModalProps) {
  const [produits, setProduits]   = useState<ProduitStock[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [selected, setSelected]   = useState<ProduitStock | null>(null);
  const [quantite, setQuantite]   = useState('');
  const [note,     setNote]       = useState('');
  const [saving,   setSaving]     = useState(false);
  const [error,    setError]      = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    fetch('/api/admin/stock/produits', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setProduits(Array.isArray(d.produits) ? d.produits : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = produits.filter(p =>
    !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 40);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError('Sélectionnez un produit.'); return; }
    const qty = Number(quantite);
    if (!qty || qty <= 0) { setError('Quantité invalide.'); return; }
    if (qty > selected.stock) { setError(`Stock insuffisant — max ${selected.stock} unités.`); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stock/sortie', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: selected.produit_id,
          quantite:   qty,
          note:       note || `Transfert → boutique`,
          ...(selected.variant_id ? { variant_id: selected.variant_id } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur serveur'); return; }
      onSuccess();
      onClose();
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,17,14,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 500, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 64px -12px rgba(20,17,14,.35)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Magasin → Boutique</div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.01em', margin: 0 }}>Transférer au comptoir</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Recherche produit */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, letterSpacing: '.03em' }}>
                Produit *
              </label>
              {selected ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: 'var(--ok-bg)', border: '1.5px solid var(--ok)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>{selected.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--ok)', marginTop: 2 }}>
                      {selected.variant_nom ? `${selected.variant_nom} · ` : ''}Stock magasin : <strong>{selected.stock}</strong> unités
                    </div>
                  </div>
                  <button type="button" onClick={() => { setSelected(null); setSearch(''); setQuantite(''); setError(''); }}
                    style={{ fontSize: 11.5, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Changer
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un produit…"
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {loading ? (
                    <div style={{ padding: '10px 13px', fontSize: 13, color: 'var(--muted-2)' }}>Chargement…</div>
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderTop: 0, borderRadius: '0 0 10px 10px', background: 'var(--surface)' }}>
                      {filtered.length === 0 ? (
                        <div style={{ padding: '12px 13px', fontSize: 13, color: 'var(--muted-2)', textAlign: 'center' }}>Aucun produit trouvé</div>
                      ) : filtered.map(p => (
                        <button
                          key={`${p.produit_id}_${p.variant_id ?? 0}`}
                          type="button"
                          onClick={() => { setSelected(p); setSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 13px', border: 'none', borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .1s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.nom}{p.variant_nom ? ` — ${p.variant_nom}` : ''}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted-2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>{p.reference}</div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: p.stock <= 5 ? 'var(--danger)' : p.stock <= 15 ? 'var(--warn)' : 'var(--ok)', flexShrink: 0, marginLeft: 8 }}>
                            {p.stock} u.
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantité */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, letterSpacing: '.03em' }}>
                Quantité à transférer *{selected ? ` (max ${selected.stock})` : ''}
              </label>
              <input
                type="number" min={1} max={selected?.stock ?? undefined}
                value={quantite}
                onChange={e => setQuantite(e.target.value)}
                placeholder="0"
                required
                disabled={!selected}
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-geist-mono, monospace)', color: 'var(--ink)', background: selected ? 'var(--bg)' : 'var(--bg-2)', outline: 'none', boxSizing: 'border-box', opacity: selected ? 1 : 0.5 }}
              />
            </div>

            {/* Note */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, letterSpacing: '.03em' }}>
                Note (optionnel)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex : réassort comptoir matin"
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ padding: '9px 13px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 9, fontSize: 13, color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            {/* Résumé */}
            {selected && quantite && Number(quantite) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-geist-mono, monospace)' }}>{selected.stock}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Magasin</div>
                </div>
                <ArrowRightIcon size={16} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ok)', fontFamily: 'var(--font-geist-mono, monospace)' }}>+{Number(quantite)}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Boutique</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--warn)', fontFamily: 'var(--font-geist-mono, monospace)' }}>{selected.stock - Number(quantite)}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Reste magasin</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuler
            </button>
            <button type="submit" disabled={saving || !selected || !quantite}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: saving || !selected || !quantite ? 'var(--border)' : 'var(--ink)', color: 'white', fontSize: 13.5, fontWeight: 600, cursor: saving || !selected || !quantite ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
              <TransferIcon size={14} />
              {saving ? 'Transfert…' : 'Transférer vers boutique'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MouvementsPage ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MouvementsPageProps {
  movements?: any[]; // legacy prop, ignored — data fetched internally
}

export default function MouvementsPage(_props: MouvementsPageProps) {
  const [items,   setItems]   = useState<ApiMouvement[]>([]);
  const [counts,  setCounts]  = useState<ApiCounts>({ total: 0, entrees: 0, sorties: 0, ajustements: 0 });
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState('');

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/stock/mouvements?limit=50', { credentials: 'include' });
      const data = await res.json();
      if (data.items)  setItems(data.items);
      if (data.counts) setCounts(data.counts);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const KPIS = [
    { label: 'Mouvements total',  value: String(counts.total),       sub: 'tous types confondus',      color: '#3B6A8F' },
    { label: 'Entrées stock',     value: String(counts.entrees),     sub: 'réceptions fournisseurs',   color: '#2D6A4F' },
    { label: 'Sorties → boutique',value: String(counts.sorties),     sub: 'transferts et ventes',      color: '#C9601E' },
    { label: 'Ajustements',       value: String(counts.ajustements), sub: 'corrections de stock',      color: '#5C4A88' },
  ];

  return (
    <>
      {modal && (
        <TransferModal
          onClose={() => setModal(false)}
          onSuccess={() => { showToast('✓ Transfert effectué — stock boutique mis à jour'); fetchMovements(); }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9998, padding: '11px 20px', background: 'var(--ok)', color: 'white', borderRadius: 12, fontSize: 13.5, fontWeight: 500, boxShadow: '0 8px 24px -4px rgba(45,106,79,.4)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Stock</div>
          <h1 className={styles.title}>Mouvements <span className={styles.serif}>de stock</span></h1>
          <p className={styles.subtitle}>
            {loading ? 'Chargement…' : `${counts.total} mouvement${counts.total > 1 ? 's' : ''} · ${counts.entrees} entrées · ${counts.sorties} sorties`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={() => setModal(true)}
          >
            <TransferIcon size={14} /> Transférer → Boutique
          </button>
        </div>
      </div>

      <div className={styles.kpis}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
            </div>
            <div className={styles.kpiValueRow}><div className={styles.kpiValue}>{k.value}</div></div>
            <div className={styles.kpiFoot}><div className={styles.kpiSub}>{k.sub}</div></div>
          </div>
        ))}
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>Chargement…</div>
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
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-2)', fontSize: 13 }}>Aucun mouvement enregistré</td></tr>
                ) : items.map(m => {
                  const displayType = mapType(m.type);
                  const qty = m.type === 'entree' ? m.quantite : -m.quantite;
                  const from = m.type === 'entree' ? 'Fournisseur' : 'Magasin';
                  const to   = m.type === 'entree' ? 'Magasin' : m.type === 'ajustement' ? '—' : 'Boutique';
                  return (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(m.created_at)}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{m.nom_produit}</div>
                        {m.note && <div style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>{m.note}</div>}
                      </td>
                      <td>
                        <span className={styles.tag} style={TYPE_STYLE[displayType]}>{displayType}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13, fontWeight: 600, color: qty > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                        {qty > 0 ? '+' : ''}{qty}
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{from}</td>
                      <td style={{ color: 'var(--muted-2)' }}><ArrowRightIcon size={12} /></td>
                      <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{to}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12.5, color: 'var(--muted)' }}>
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
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
