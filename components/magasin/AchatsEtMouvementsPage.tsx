/**
 * AchatsEtMouvementsPage — unified purchase orders + stock movements
 * Tabs: Achats fournisseurs | Mouvements de stock
 */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PurchaseOrder, PurchaseOrderStatus, MovementType } from './types';
import { SAMPLE_PURCHASE_ORDERS } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, TrendIcon, ArrowRightIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

type Tab = 'achats' | 'mouvements';

// ── Status / type styles ───────────────────────────────────────────────────────

const STATUS_STYLE: Record<PurchaseOrderStatus, React.CSSProperties> = {
  'En attente': { background: 'var(--warn-bg)',     color: 'var(--warn)'   },
  'Confirmé':   { background: 'var(--accent-bg)',   color: 'var(--accent)' },
  'Expédié':    { background: '#E6E0F0',            color: '#5C4A88'       },
  'Reçu':       { background: 'var(--ok-bg)',       color: 'var(--ok)'     },
  'Annulé':     { background: 'rgba(20,17,14,.06)', color: 'var(--muted)'  },
};

const TYPE_STYLE: Record<MovementType, React.CSSProperties> = {
  'Entrée':     { background: 'var(--ok-bg)',     color: 'var(--ok)'     },
  'Sortie':     { background: 'var(--danger-bg)', color: 'var(--danger)' },
  'Transfert':  { background: 'var(--accent-bg)', color: 'var(--accent)' },
  'Ajustement': { background: 'var(--warn-bg)',   color: 'var(--warn)'   },
};

// ── API types (mouvements) ─────────────────────────────────────────────────────

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
  produit_id:   number;
  nom:          string;
  reference:    string;
  stock:        number;
  variant_id?:  number;
  variant_nom?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function mapType(t: ApiMouvement['type']): MovementType {
  if (t === 'entree')     return 'Entrée';
  if (t === 'ajustement') return 'Ajustement';
  return 'Sortie';
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function TransferIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4 4 4"/>
      <path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
    </svg>
  );
}

function AchatsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M8 8h8M8 12h6M8 16h4"/>
    </svg>
  );
}

function MvtIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  );
}

// ── TransferModal ──────────────────────────────────────────────────────────────

function TransferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [produits, setProduits] = useState<ProduitStock[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<ProduitStock | null>(null);
  const [quantite, setQuantite] = useState('');
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
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
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/stock/sortie', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: selected.produit_id, quantite: qty,
          note: note || 'Transfert → boutique',
          ...(selected.variant_id ? { variant_id: selected.variant_id } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur serveur'); return; }
      onSuccess(); onClose();
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,17,14,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 500, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 64px -12px rgba(20,17,14,.35)' }}>
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
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, letterSpacing: '.03em' }}>Produit *</label>
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
                  <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit…"
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }} />
                  {loading ? (
                    <div style={{ padding: '10px 13px', fontSize: 13, color: 'var(--muted-2)' }}>Chargement…</div>
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderTop: 0, borderRadius: '0 0 10px 10px', background: 'var(--surface)' }}>
                      {filtered.length === 0 ? (
                        <div style={{ padding: '12px 13px', fontSize: 13, color: 'var(--muted-2)', textAlign: 'center' }}>Aucun produit trouvé</div>
                      ) : filtered.map(p => (
                        <button key={`${p.produit_id}_${p.variant_id ?? 0}`} type="button" onClick={() => { setSelected(p); setSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 13px', border: 'none', borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .1s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
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

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, letterSpacing: '.03em' }}>
                Quantité *{selected ? ` (max ${selected.stock})` : ''}
              </label>
              <input type="number" min={1} max={selected?.stock} value={quantite} onChange={e => setQuantite(e.target.value)}
                placeholder="0" required disabled={!selected}
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-geist-mono, monospace)', color: 'var(--ink)', background: selected ? 'var(--bg)' : 'var(--bg-2)', outline: 'none', boxSizing: 'border-box', opacity: selected ? 1 : 0.5 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, letterSpacing: '.03em' }}>Note (optionnel)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex : réassort comptoir matin"
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {error && (
              <div style={{ padding: '9px 13px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 9, fontSize: 13, color: 'var(--danger)' }}>{error}</div>
            )}

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
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
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

// ── Props ──────────────────────────────────────────────────────────────────────

export interface AchatsEtMouvementsPageProps {
  orders?:     PurchaseOrder[];
  defaultTab?: Tab;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AchatsEtMouvementsPage({
  orders = SAMPLE_PURCHASE_ORDERS,
  defaultTab = 'achats',
}: AchatsEtMouvementsPageProps) {
  const ui = useUI();
  const [tab,           setTab]           = useState<Tab>(defaultTab);
  const [showTransfer,  setShowTransfer]  = useState(false);
  const [toast,         setToast]         = useState('');

  // mouvements state
  const [mvItems,   setMvItems]   = useState<ApiMouvement[]>([]);
  const [mvCounts,  setMvCounts]  = useState<ApiCounts>({ total: 0, entrees: 0, sorties: 0, ajustements: 0 });
  const [mvLoading, setMvLoading] = useState(false);
  const mvFetched = useRef(false);

  const fetchMouvements = useCallback(async () => {
    setMvLoading(true);
    try {
      const res  = await fetch('/api/admin/stock/mouvements?limit=50', { credentials: 'include' });
      const data = await res.json();
      if (data.items)  setMvItems(data.items);
      if (data.counts) setMvCounts(data.counts);
    } catch { /* keep existing */ }
    finally { setMvLoading(false); }
  }, []);

  // fetch mouvements when tab first becomes active
  useEffect(() => {
    if (tab === 'mouvements' && !mvFetched.current) {
      mvFetched.current = true;
      fetchMouvements();
    }
  }, [tab, fetchMouvements]);

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // ── computed (achats) ──────────────────────────────────────────────────────
  const enCours  = orders.filter(o => o.status !== 'Reçu' && o.status !== 'Annulé').length;
  const enAttente = orders.filter(o => o.status === 'En attente').length;
  const recus    = orders.filter(o => o.status === 'Reçu').length;
  const totalVal = orders.filter(o => o.status !== 'Annulé').reduce((s, o) => s + o.amount, 0);

  const KPIS_ACHATS = [
    { label: 'Bons en cours',          value: String(enCours),  sub: 'à traiter',                   color: '#C9601E' },
    { label: 'Valeur totale engagée',  value: totalVal > 0 ? totalVal.toLocaleString('fr-FR') : '—', unit: totalVal > 0 ? 'F' : undefined, sub: 'bons non annulés', color: '#3B6A8F' },
    { label: 'Reçus ce mois',          value: String(recus),    sub: `sur ${orders.length} émis`,    color: '#2D6A4F' },
  ];

  const KPIS_MOUVEMENTS = [
    { label: 'Mouvements total',   value: String(mvCounts.total),       sub: 'tous types confondus',    color: '#3B6A8F' },
    { label: 'Entrées stock',      value: String(mvCounts.entrees),     sub: 'réceptions fournisseurs', color: '#2D6A4F' },
    { label: 'Sorties → boutique', value: String(mvCounts.sorties),     sub: 'transferts et ventes',    color: '#C9601E' },
    { label: 'Ajustements',        value: String(mvCounts.ajustements), sub: 'corrections de stock',    color: '#5C4A88' },
  ];

  const subtitleAchats = orders.length === 0
    ? 'Aucun bon d\'achat'
    : `${enCours} en cours · ${enAttente} en attente${totalVal > 0 ? ` · ${totalVal.toLocaleString('fr-FR')} F engagés` : ''}`;

  const subtitleMvt = mvLoading ? 'Chargement…'
    : `${mvCounts.total} mouvements · ${mvCounts.entrees} entrées · ${mvCounts.sorties} sorties`;

  return (
    <>
      {showTransfer && (
        <TransferModal
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            showToastMsg('✓ Transfert effectué — stock boutique mis à jour');
            fetchMouvements();
          }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9998, padding: '11px 20px', background: 'var(--ok)', color: 'white', borderRadius: 12, fontSize: 13.5, fontWeight: 500, boxShadow: '0 8px 24px -4px rgba(45,106,79,.4)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement &amp; Stock</div>
          <h1 className={styles.title}>
            Achats &amp; <span className={styles.serif}>Mouvements</span>
          </h1>
          <p className={styles.subtitle}>
            {tab === 'achats' ? subtitleAchats : subtitleMvt}
          </p>
        </div>
        <div className={styles.headerActions}>
          {tab === 'achats' ? (
            <>
              <button type="button" className={styles.btn} onClick={() => ui.openExport('Achats')}>
                <DownloadIcon size={14} /> Exporter
              </button>
              <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('po')}>
                <PlusIcon size={14} /> Nouvel achat
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
              <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setShowTransfer(true)}>
                <TransferIcon size={14} /> Transférer → Boutique
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'achats' ? styles.active : ''}`}
          onClick={() => setTab('achats')}
        >
          <AchatsIcon size={13} /> Achats fournisseurs
          <span className={styles.pill}>{orders.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'mouvements' ? styles.active : ''}`}
          onClick={() => setTab('mouvements')}
        >
          <MvtIcon size={13} /> Mouvements de stock
          {mvCounts.total > 0 && <span className={styles.pill}>{mvCounts.total}</span>}
        </button>
      </div>

      {/* ── Achats content ── */}
      {tab === 'achats' && (
        <>
          <div className={styles.kpis3}>
            {KPIS_ACHATS.map(k => (
              <div key={k.label} className={styles.kpi}>
                <div className={styles.kpiHead}><div className={styles.kpiLabel}>{k.label}</div></div>
                <div className={styles.kpiValueRow}>
                  <div className={styles.kpiValue}>{k.value}</div>
                  {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
                </div>
                <div className={styles.kpiFoot}><div className={styles.kpiSub}>{k.sub}</div></div>
              </div>
            ))}
          </div>

          <div className={styles.tableWrap} style={{ marginTop: 16 }}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Fournisseur</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Produits</th>
                    <th style={{ textAlign: 'right' }}>Montant</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-2)', fontSize: 13 }}>Aucun bon d&apos;achat</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.ref}>
                      <td>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12.5, fontWeight: 500 }}>{o.ref}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.supplier}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{o.date}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{o.products}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                        {o.amount.toLocaleString('fr-FR')} F
                      </td>
                      <td>
                        <span className={styles.tag} style={STATUS_STYLE[o.status]}>{o.status}</span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          type="button" className={styles.rowMenu}
                          onClick={e => { e.stopPropagation(); ui.menu(e, [
                            { label: 'Modifier',   icon: 'edit',  onClick: () => ui.openForm('po', 'edit', o) },
                            { sep: true },
                            { label: 'Supprimer',  icon: 'trash', danger: true, onClick: () => ui.confirmDelete('le bon d\'achat', o.ref, { onConfirm: () => ui.config.onDeleteRow?.('po', o) }) },
                          ], 'right'); }}
                        >
                          <MoreIcon size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFoot}>
              <span>{orders.length} bon{orders.length !== 1 ? 's' : ''} d&apos;achat</span>
              <div className={styles.pager}>
                <button type="button">‹</button>
                <button type="button" className={styles.on}>1</button>
                <button type="button">›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Mouvements content ── */}
      {tab === 'mouvements' && (
        <>
          <div className={styles.kpis}>
            {KPIS_MOUVEMENTS.map(k => (
              <div key={k.label} className={styles.kpi}>
                <div className={styles.kpiHead}><div className={styles.kpiLabel}>{k.label}</div></div>
                <div className={styles.kpiValueRow}><div className={styles.kpiValue}>{k.value}</div></div>
                <div className={styles.kpiFoot}><div className={styles.kpiSub}>{k.sub}</div></div>
              </div>
            ))}
          </div>

          <div className={styles.tableWrap} style={{ marginTop: 16 }}>
            {mvLoading ? (
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
                    {mvItems.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-2)', fontSize: 13 }}>Aucun mouvement enregistré</td></tr>
                    ) : mvItems.map(m => {
                      const displayType = mapType(m.type);
                      const qty  = m.type === 'entree' ? m.quantite : -m.quantite;
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
              <span>{mvCounts.total} mouvement{mvCounts.total !== 1 ? 's' : ''}</span>
              <div className={styles.pager}>
                <button type="button">‹</button>
                <button type="button" className={styles.on}>1</button>
                <button type="button">›</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
