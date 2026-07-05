/**
 * MouvementDrawer — create a stock movement (Sortie → Boutique / Transfert).
 * Entrée supprimée — les réceptions passent par la page Achats.
 * Steps: form → loading → success
 * Products fetched from real API (/api/admin/stock/produits).
 */
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { ChevDownIcon } from './icons';
import {
  injectKeyframes, fmt,
  drawerCss, eyebrowCss, labelCss, inputCss, btnCss, btnPrimaryCss,
  XIcon, TransferRail,
} from './drawerUtils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DrawerProd {
  produit_id: number;
  name:       string;
  sku:        string;
  stock:      number;
  swatch:     string;
  initial:    string;
  variant_id?: number;
}

const MV_TYPES = [
  { id: 'entree',    label: 'Entrée stock',       short: 'Entrée stock'       },
  { id: 'sortie',    label: 'Sortie → Boutique',  short: 'Sortie boutique'    },
] as const;
type MvTypeId = typeof MV_TYPES[number]['id'];

const RAISONS: Record<MvTypeId, string[]> = {
  entree:    ['Réception fournisseur', 'Retour client', 'Correction inventaire', 'Autre'],
  sortie:    ['Transfert boutique', 'Commande en ligne', 'Retour client', 'Autre'],
};

const SWATCHES = ['#1F3D6E','#3A2F25','#E8C988','#7A2C3A','#D4A437','#2D6A4F','#5C4A88','#3B6A8F','#C9601E','#B8501A','#9C3A14','#6B9E3A'];

// ── SVG inline icons ───────────────────────────────────────────────────────────

const IcBox = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
  </svg>
);
const IcStore = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 1.5-4h17L22 7"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/>
    <path d="M2 7h20"/><path d="M12 11v6"/>
  </svg>
);
const IcTruck = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
    <rect x="9" y="11" width="14" height="10" rx="2"/>
    <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
  </svg>
);
const IcWH = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
    <path d="M6 18h12M6 14h12"/>
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────────

function Sel({ value, onChange, children, disabled }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)}
        style={{ ...inputCss, appearance: 'none', WebkitAppearance: 'none', paddingRight: 28, cursor: 'pointer' }}>
        {children}
      </select>
      <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
        <ChevDownIcon size={11} />
      </span>
    </div>
  );
}

function TrNode({ label, sub, icon, dest = false }: { label: string; sub: string; icon: React.ReactNode; dest?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '13px 18px', background: dest ? 'var(--accent-bg)' : 'var(--surface)', border: `1.5px solid ${dest ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 13, minWidth: 108, flex: '0 0 auto' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: dest ? 'var(--accent)' : 'var(--bg-2)', display: 'grid', placeItems: 'center', color: dest ? '#fff' : 'var(--accent)' }}>{icon}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, textAlign: 'center', maxWidth: 96, lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 10.5, color: dest ? 'var(--accent)' : 'var(--muted)' }}>{sub}</div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

export type DrawerProdRaw = { produit_id: number; nom: string; reference: string; stock: number; variant_id?: number; variant_nom?: string };

export interface MouvementDrawerProps {
  onClose:        () => void;
  onSuccess?:     () => void;
  defaultType?:   MvTypeId;
  defaultDstWh?:  string | null; // pré-sélectionne le libellé destination (Entrée)
  produits?:      DrawerProdRaw[];
}

// ── Drawer ─────────────────────────────────────────────────────────────────────

export default function MouvementDrawer({
  onClose,
  onSuccess,
  defaultType = 'sortie',
  defaultDstWh = null,
  produits: produitsProp = [],
}: MouvementDrawerProps) {
  injectKeyframes();

  // Map produits prop → DrawerProd[]
  const produits = useMemo<DrawerProd[]>(() =>
    produitsProp.map((p, i) => ({
      produit_id: p.produit_id,
      name:       p.variant_nom ? `${p.nom} — ${p.variant_nom}` : p.nom,
      sku:        p.reference,
      stock:      p.stock,
      swatch:     SWATCHES[i % SWATCHES.length],
      initial:    (p.nom[0] ?? '?').toUpperCase(),
      variant_id: p.variant_id,
    })),
  [produitsProp]);

  const loadingProds = false;

  // Form state
  const [type,     setType]     = useState<MvTypeId>(defaultType);
  const [product,  setProduct]  = useState('');
  const [search,   setSearch]   = useState('');
  const [showSugg, setShowSugg] = useState(false);
  const [qty,      setQty]      = useState(1);
  const [supplier, setSupplier] = useState('');
  const [raison,   setRaison]   = useState(RAISONS[defaultType][0]);
  const [step,     setStep]     = useState<'form' | 'loading' | 'success'>('form');
  const [apiError, setApiError] = useState('');
  const isLoading = step === 'loading';

  useEffect(() => {
    setProduct(''); setSearch(''); setQty(1); setStep('form'); setApiError('');
    setRaison(RAISONS[type][0]);
  }, [type]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as Element).closest('.mv-sugg')) setShowSugg(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const suggestions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return produits
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, produits]);

  const sel      = produits.find(p => p.name === product);
  const maxQty   = sel?.stock ?? 0;
  const isEntree = type === 'entree';
  const valid    = isEntree
    ? qty >= 1 && !!product
    : qty >= 1 && qty <= maxQty && !!product;

  // ── Confirm → real API ─────────────────────────────────────────────────────

  async function confirm() {
    if (!valid || isLoading) return;
    setApiError('');
    setStep('loading');

    try {
      const endpoint = type === 'entree' ? '/api/admin/stock/entree' : '/api/admin/stock/sortie';
      const noteStr  = type === 'entree' && supplier
        ? `${raison} — ${supplier}`
        : raison;
      const res = await fetch(endpoint, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: sel!.produit_id,
          quantite:   qty,
          note:       noteStr,
          ...(sel?.variant_id ? { variant_id: sel.variant_id } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? 'Erreur serveur'); setStep('form'); return; }

      setStep('success');
      onSuccess?.();
    } catch {
      setApiError('Erreur réseau.');
      setStep('form');
    }
  }

  const reset = () => { setProduct(''); setSearch(''); setQty(1); setStep('form'); setApiError(''); };

  // ── Close button ───────────────────────────────────────────────────────────

  const CloseBtn = () => (
    <button type="button" onClick={onClose}
      style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--muted)', border: 0, background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
      <XIcon />
    </button>
  );

  // ── Flux nodes ─────────────────────────────────────────────────────────────

  const FluxNodes = () => {
    if (type === 'entree') return (
      <>
        <TrNode label={supplier || 'Fournisseur'}               sub="Source"      icon={<IcTruck />} />
        <TransferRail fast={isLoading} />
        <TrNode label={defaultDstWh ?? 'Stock Magasin'} sub="Destination" icon={<IcBox />}   dest />
      </>
    );
    return (
      <>
        <TrNode label="Stock Magasin" sub="Source"      icon={<IcBox />}   />
        <TransferRail fast={isLoading} />
        <TrNode label="Boutique"      sub="Destination" icon={<IcStore />} dest />
      </>
    );
  };

  const successTitle = { entree: 'Entrée enregistrée !', sortie: 'Sortie enregistrée !' };
  const successMsg   = {
    entree: `${qty} × ${product} ajouté${qty > 1 ? 's' : ''} au Stock Magasin`,
    sortie: `${qty} × ${product} transféré${qty > 1 ? 's' : ''} vers la Boutique`,
  };

  // ── SUCCESS screen ─────────────────────────────────────────────────────────

  if (step === 'success') return (
    <div style={{ ...drawerCss, animation: 'mgPop .32s cubic-bezier(.32,.72,0,1)' }} onMouseDown={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 22px 18px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={eyebrowCss}>Magasin · Mouvements</div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.025em' }}>
            {MV_TYPES.find(t => t.id === type)?.short}
          </div>
        </div>
        <CloseBtn />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: 99, background: 'var(--ok-bg)', display: 'grid', placeItems: 'center', color: 'var(--ok)' }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.02em' }}>{successTitle[type]}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>{successMsg[type]}</div>
        </div>
        <div style={{ padding: '11px 18px', background: 'var(--ok-bg)', border: '1px solid var(--ok)', borderRadius: 10, fontSize: 12.5, color: 'var(--ok)', fontFamily: 'Geist Mono,monospace', fontWeight: 500 }}>
          Mouvement enregistré · {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--bg-2)' }}>
        <button type="button" onClick={onClose} style={btnCss}>Fermer</button>
        <button type="button" onClick={reset}   style={btnPrimaryCss}>Nouveau mouvement</button>
      </div>
    </div>
  );

  // ── FORM ───────────────────────────────────────────────────────────────────

  const confirmLabel = type === 'entree' ? "Confirmer l'entrée" : 'Confirmer la sortie';

  return (
    <div style={drawerCss} onMouseDown={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 22px 18px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={eyebrowCss}>Magasin · Mouvements</div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.025em' }}>
            Nouveau <em style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontWeight: 400 }}>mouvement</em>
          </div>
        </div>
        <CloseBtn />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Type selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {MV_TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => setType(t.id)} disabled={isLoading}
              style={{ padding: '8px 6px', borderRadius: 9, border: `1.5px solid ${type === t.id ? 'var(--accent)' : 'var(--border)'}`, textAlign: 'center', fontSize: 12, fontWeight: 600, lineHeight: 1.35, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit', background: type === t.id ? 'var(--accent-bg)' : 'var(--surface)', color: type === t.id ? 'var(--accent)' : 'var(--muted)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Flux */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FluxNodes /></div>

        {/* Fournisseur (entrée only) */}
        {type === 'entree' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={labelCss}>Fournisseur (optionnel)</label>
            <input style={inputCss} placeholder="Ex: Wax Distributions…" value={supplier} disabled={isLoading}
              onChange={e => setSupplier(e.target.value)} />
          </div>
        )}


        {/* Product autocomplete */}
        <div className="mv-sugg" style={{ display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
          <label style={labelCss}>
            {type === 'entree' ? 'Produit à recevoir' : 'Produit à transférer'}
          </label>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              style={{ ...inputCss, paddingLeft: 32, paddingRight: search ? 28 : 12 }}
              placeholder={loadingProds ? 'Chargement…' : 'Rechercher un produit…'}
              value={search} autoComplete="off" disabled={isLoading || loadingProds}
              onChange={e => { setSearch(e.target.value); setProduct(''); setShowSugg(true); }}
              onFocus={() => setShowSugg(true)}
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); setProduct(''); }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'grid', placeItems: 'center', border: 0, background: 'transparent', cursor: 'pointer' }}>
                <XIcon />
              </button>
            )}
          </div>
          {showSugg && !product && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(20,17,14,.12)', zIndex: 20, maxHeight: 210, overflowY: 'auto', marginTop: 2 }}>
              {suggestions.map(p => (
                <button key={`${p.produit_id}_${p.variant_id ?? 0}`} type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { setProduct(p.name); setSearch(p.name); setShowSugg(false); }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: p.swatch, fontSize: 10, fontWeight: 600, color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {p.initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'Geist Mono,monospace', marginTop: 1 }}>{p.sku}</div>
                  </div>
                  <div style={{ fontSize: 11.5, fontFamily: 'Geist Mono,monospace', color: p.stock < 10 ? 'var(--danger)' : 'var(--ok)', fontWeight: 500, flexShrink: 0 }}>
                    {p.stock} dispo
                  </div>
                </button>
              ))}
            </div>
          )}
          {showSugg && search && suggestions.length === 0 && !loadingProds && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--muted)', textAlign: 'center', zIndex: 20, marginTop: 2 }}>
              Aucun produit trouvé pour «&nbsp;{search}&nbsp;»
            </div>
          )}
        </div>

        {/* Quantité */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={labelCss}>
            Quantité
            {!isEntree && sel && (
              <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11 }}> / {maxQty} disponibles en magasin</span>
            )}
          </label>
          <input style={{ ...inputCss, textAlign: 'center', fontFamily: 'Geist Mono,monospace' }}
            type="number" min={1} max={isEntree ? undefined : (maxQty || undefined)}
            value={qty} disabled={isLoading}
            onChange={e => setQty(Math.max(1, Number(e.target.value)))} />
          {!isEntree && qty > maxQty && maxQty > 0 && (
            <span style={{ fontSize: 11, color: 'var(--danger)' }}>Stock insuffisant ({maxQty} dispo)</span>
          )}
        </div>

        {/* Raison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={labelCss}>Raison</label>
          <Sel value={raison} onChange={setRaison} disabled={isLoading}>
            {RAISONS[type].map(r => <option key={r} value={r}>{r}</option>)}
          </Sel>
        </div>

        {/* Résumé sélection */}
        {valid && sel && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: sel.swatch, fontSize: 10, fontWeight: 600, color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {sel.initial}
              </div>
              <span style={{ color: 'var(--muted)' }}>{qty} × {sel.name}</span>
            </div>
            <span style={{ fontFamily: 'Geist Mono,monospace', fontWeight: 600, color: isEntree ? 'var(--ok)' : 'var(--danger)' }}>
              {isEntree ? '+' : '−'}{qty}
            </span>
          </div>
        )}

        {/* API error */}
        {apiError && (
          <div style={{ padding: '9px 13px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 9, fontSize: 13, color: 'var(--danger)' }}>
            {apiError}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--bg-2)' }}>
        <button type="button" onClick={onClose} disabled={isLoading} style={btnCss}>Annuler</button>
        <button type="button" onClick={confirm} disabled={!valid || isLoading}
          style={{ ...btnPrimaryCss, minWidth: 172, justifyContent: 'center', opacity: !valid && !isLoading ? 0.55 : 1 }}>
          {isLoading ? (
            <>
              <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: 99, display: 'inline-block', animation: 'mgSpin .7s linear infinite', flexShrink: 0 }} />
              En cours…
            </>
          ) : (
            <>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="m17 2 4 4-4 4"/><path d="M3 6h18"/>
                <path d="m7 22-4-4 4-4"/><path d="M21 18H3"/>
              </svg>
              {confirmLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
