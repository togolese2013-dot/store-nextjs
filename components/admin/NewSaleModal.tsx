"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoutiqueStockItem } from '@/lib/admin-db';
import { formatPrice } from '@/lib/utils';

interface VenteItem {
  produit_id:    number;
  nom:           string;
  reference:     string;
  prix_unitaire: number;
  stock_dispo:   number;
  qty:           number;
  item_key:      string;
  variant_id?:   number;
  variant_nom?:  string;
}

interface FormState {
  clientNom:        string;
  clientTel:        string;
  avecLivraison:    boolean;
  adresseLivraison: string;
  contactLivraison: string;
  lienLocalisation: string;
  modePaiement:     string;
  statutPaiement:   string;
  montantAcompte:   string;
  remiseGlobale:    string;
  note:             string;
  saving:           boolean;
  error:            string;
}

const MODES_PAIEMENT = [
  { value: 'especes',           label: 'Espèces' },
  { value: 'mix_by_yas',        label: 'Mix by Yas' },
  { value: 'moov_money',        label: 'Moov Money' },
  { value: 'virement_bancaire', label: 'Virement bancaire' },
];

const STATUTS_PAIEMENT = [
  { value: 'paye_total', label: 'Payé en totalité' },
  { value: 'acompte',    label: 'Acompte' },
  { value: 'non_paye',   label: 'Non payé' },
];

const emptyForm = (): FormState => ({
  clientNom: '', clientTel: '',
  avecLivraison: false,
  adresseLivraison: '', contactLivraison: '', lienLocalisation: '',
  modePaiement: 'especes', statutPaiement: 'paye_total',
  montantAcompte: '', remiseGlobale: '', note: '',
  saving: false, error: '',
});

/* ── Inline SVG icons ── */
const sk = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChevronIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}><path d="m6 9 6 6 6-6" /></svg>
);
const SearchIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const CartIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...{ ...sk, strokeWidth: 1 }}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const CheckIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}><polyline points="20 6 9 17 4 12" /></svg>
);
const UserCheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);
const TruckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const AlertIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <path d="m10.29 3.86-8.2 14.19A1 1 0 0 0 2.95 20h16.1a1 1 0 0 0 .86-1.5L12.71 4.36a1 1 0 0 0-1.72-.5Z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const LoaderIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk} style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);

export interface NewSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function NewSaleModal({ open, onClose, onSubmitted }: NewSaleModalProps) {
  const [form,          setForm]          = useState<FormState>(emptyForm);
  const [items,         setItems]         = useState<VenteItem[]>([]);
  const [stock,         setStock]         = useState<BoutiqueStockItem[]>([]);
  const [loadingStock,  setLoadingStock]  = useState(false);
  const [prodSearch,    setProdSearch]    = useState('');
  const [showDrop,      setShowDrop]      = useState(false);
  const [clientSugg,    setClientSugg]    = useState<{ id: number; nom: string; telephone: string | null }[]>([]);
  const [showSugg,      setShowSugg]      = useState(false);
  const [isNewClient,   setIsNewClient]   = useState(false);
  const searchRef    = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  /* ── Totaux ── */
  const sousTotal   = items.reduce((s, i) => s + i.prix_unitaire * i.qty, 0);
  const remise      = Number(form.remiseGlobale) || 0;
  const totalVente  = Math.max(0, sousTotal - remise);
  const acompte     = Number(form.montantAcompte) || 0;
  const resteAPayer = Math.max(0, totalVente - acompte);

  /* ── Load stock on open ── */
  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setItems([]);
    setProdSearch('');
    setShowDrop(false);
    setClientSugg([]);
    setShowSugg(false);
    setIsNewClient(false);
    submittingRef.current = false;
    setLoadingStock(true);
    fetch('/api/admin/stock-boutique?limit=500&filter=disponible')
      .then(r => r.json())
      .then(d => { if (d.items) setStock(d.items); })
      .finally(() => setLoadingStock(false));
  }, [open]);

  /* ── Esc to close ── */
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  if (!open) return null;

  /* ── Produits filtrés ── */
  const filtered = stock.filter(p => {
    if (!prodSearch.trim()) return true;
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q = norm(prodSearch);
    return norm(p.nom).includes(q) || norm(p.reference).includes(q);
  });

  /* ── Panier ── */
  function addProduct(p: BoutiqueStockItem) {
    const key = `${p.produit_id}_v${p.variant_id ?? 0}`;
    setItems(prev => {
      const ex = prev.find(i => i.item_key === key);
      if (ex) {
        if (ex.qty < p.quantite) return prev.map(i => i.item_key === key ? { ...i, qty: i.qty + 1 } : i);
        return prev;
      }
      if (p.quantite === 0) return prev;
      return [...prev, {
        produit_id: p.produit_id, nom: p.nom, reference: p.reference,
        prix_unitaire: p.prix_unitaire, stock_dispo: p.quantite,
        qty: 1, item_key: key,
        variant_id: p.variant_id, variant_nom: p.variant_nom,
      }];
    });
    setProdSearch('');
    setShowDrop(false);
  }

  function removeItem(key: string) { setItems(p => p.filter(i => i.item_key !== key)); }

  function changeQty(key: string, delta: number) {
    setItems(p => p.map(i => {
      if (i.item_key !== key) return i;
      return { ...i, qty: Math.max(1, Math.min(i.stock_dispo, i.qty + delta)) };
    }));
  }

  function setQtyDirect(key: string, val: string) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    setItems(p => p.map(i => i.item_key !== key ? i : { ...i, qty: Math.max(1, Math.min(i.stock_dispo, n)) }));
  }

  /* ── Client autocomplete ── */
  async function handleClientNomChange(val: string) {
    setForm(f => ({ ...f, clientNom: val, clientTel: '' }));
    setIsNewClient(false);
    if (val.trim().length < 2) { setClientSugg([]); setShowSugg(false); return; }
    try {
      const res  = await fetch(`/api/admin/boutique-clients?q=${encodeURIComponent(val)}&page=1`);
      const data = await res.json();
      const list = (data.data ?? []).slice(0, 6) as { id: number; nom: string; telephone: string | null }[];
      setClientSugg(list);
      setShowSugg(list.length > 0);
    } catch { setClientSugg([]); }
    setIsNewClient(true);
  }

  function selectClient(c: { id: number; nom: string; telephone: string | null }) {
    setForm(f => ({ ...f, clientNom: c.nom, clientTel: c.telephone ?? '' }));
    setClientSugg([]);
    setShowSugg(false);
    setIsNewClient(false);
  }

  /* ── Submit ── */
  async function submit() {
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (!form.clientNom.trim()) {
      setForm(f => ({ ...f, error: 'Le nom du client est requis.' }));
      submittingRef.current = false;
      return;
    }
    if (items.length === 0) {
      setForm(f => ({ ...f, error: 'Ajoutez au moins un article.' }));
      submittingRef.current = false;
      return;
    }
    if (form.statutPaiement === 'acompte' && (!form.montantAcompte || Number(form.montantAcompte) <= 0)) {
      setForm(f => ({ ...f, error: 'Saisissez le montant de l\'acompte.' }));
      submittingRef.current = false;
      return;
    }

    setForm(f => ({ ...f, saving: true, error: '' }));

    const payload = {
      client_nom:        form.clientNom,
      client_tel:        form.clientTel || undefined,
      avec_livraison:    form.avecLivraison,
      adresse_livraison: form.avecLivraison ? form.adresseLivraison || undefined : undefined,
      contact_livraison: form.avecLivraison ? form.contactLivraison || undefined : undefined,
      lien_localisation: form.avecLivraison ? form.lienLocalisation || undefined : undefined,
      mode_paiement:     form.modePaiement,
      statut_paiement:   form.statutPaiement,
      montant_acompte:   form.statutPaiement === 'acompte' ? Number(form.montantAcompte) : undefined,
      sous_total:        sousTotal,
      remise:            remise > 0 ? remise : undefined,
      total:             totalVente,
      note:              form.note || undefined,
      items: items.map(i => ({
        produit_id: i.produit_id, nom: i.nom, reference: i.reference,
        qty: i.qty, prix: i.prix_unitaire, total: i.prix_unitaire * i.qty,
        ...(i.variant_id ? { variant_id: i.variant_id } : {}),
      })),
    };

    const res  = await fetch('/api/admin/ventes/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    submittingRef.current = false;

    if (res.ok) {
      onClose();
      onSubmitted?.();
    } else {
      setForm(f => ({ ...f, saving: false, error: data.error ?? 'Erreur lors de l\'enregistrement.' }));
    }
  }

  const canSubmit = !!form.clientNom.trim() && items.length > 0 && !form.saving;

  /* ──────────────── RENDER ──────────────── */
  return (
    <>
      <div className="sm-backdrop" onMouseDown={onClose} />
      <div className="sm-drawer" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="sm-head">
          <div>
            <div className="sm-eyb">Boutique · Ventes</div>
            <div className="sm-title">Nouvelle <span className="sm-serif">vente</span></div>
          </div>
          <button className="sm-x" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
        </div>

        {/* ── Body ── */}
        <div className="sm-body">

          {/* ═══ ARTICLES ═══ */}
          <div>
            <p className="sm-section-title">Articles</p>

            {/* Recherche produit */}
            <div className="sm-search-wrap" ref={searchRef} style={{ marginBottom: 10 }}>
              <span className="sm-search-icon"><SearchIcon /></span>
              <input
                className="sm-in sm-search-in"
                type="text"
                placeholder={loadingStock ? 'Chargement du stock…' : 'Ajouter un produit…'}
                value={prodSearch}
                disabled={loadingStock}
                style={{ fontSize: 16 }}
                onChange={e => { setProdSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
              />
              {loadingStock && (
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <LoaderIcon />
                </span>
              )}
              {showDrop && filtered.length > 0 && (
                <div className="sm-drop">
                  {filtered.slice(0, 30).map(p => (
                    <div
                      key={`${p.produit_id}_v${p.variant_id ?? 0}`}
                      className={`sm-drop-item${p.quantite === 0 ? ' disabled' : ''}`}
                      onMouseDown={() => p.quantite > 0 && addProduct(p)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nom}
                        </div>
                        {p.variant_nom && (
                          <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 600 }}>{p.variant_nom}</div>
                        )}
                        <div style={{ fontSize: 10.5, color: '#8A8278', fontFamily: 'monospace' }}>{p.reference}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#C9601E' }}>{formatPrice(p.prix_unitaire)}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: p.quantite === 0 ? '#DC2626' : p.quantite <= 3 ? '#D97706' : '#16A34A' }}>
                          {p.quantite === 0 ? 'Épuisé' : `${p.quantite} en stock`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showDrop && prodSearch && filtered.length === 0 && !loadingStock && (
                <div className="sm-drop"><div className="sm-drop-empty">Aucun produit correspondant</div></div>
              )}
            </div>

            {/* Panier vide */}
            {items.length === 0 && (
              <div className="sm-empty">
                <CartIcon />
                <span>Aucun article ajouté</span>
              </div>
            )}

            {/* Liste articles */}
            {items.length > 0 && (
              <>
                <div className="sm-cart">
                  {items.map(item => (
                    <div key={item.item_key} className="sm-cart-item">
                      <div className="sm-cart-info">
                        <div className="sm-cart-name">{item.nom}</div>
                        {item.variant_nom && <div className="sm-cart-var">{item.variant_nom}</div>}
                        <div className="sm-cart-ref">{item.reference}</div>
                      </div>
                      <div className="sm-qty-ctrl">
                        <button className="sm-qty-btn" type="button" disabled={item.qty <= 1} onClick={() => changeQty(item.item_key, -1)}>−</button>
                        <input
                          className="sm-qty-input"
                          type="number" min={1} max={item.stock_dispo}
                          value={item.qty}
                          style={{ fontSize: 16 }}
                          onChange={e => setQtyDirect(item.item_key, e.target.value)}
                        />
                        <button className="sm-qty-btn" type="button" disabled={item.qty >= item.stock_dispo} onClick={() => changeQty(item.item_key, +1)}>+</button>
                      </div>
                      <div className="sm-cart-price">× {formatPrice(item.prix_unitaire)}</div>
                      <div className="sm-cart-total">{formatPrice(item.prix_unitaire * item.qty)}</div>
                      <button className="sm-cart-rm" type="button" aria-label="Retirer" onClick={() => removeItem(item.item_key)}>
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="sm-totals" style={{ marginTop: 10 }}>
                  <div className="sm-tot-row">
                    <span className="sm-tot-label">{items.reduce((s, i) => s + i.qty, 0)} article{items.reduce((s, i) => s + i.qty, 0) > 1 ? 's' : ''} — Sous-total</span>
                    <span className="sm-tot-val">{formatPrice(sousTotal)}</span>
                  </div>
                  {/* Remise */}
                  <div className="sm-tot-row">
                    <span className="sm-tot-label">Remise (FCFA)</span>
                    <input
                      className="sm-qty-input"
                      type="number" min={0} max={sousTotal}
                      value={form.remiseGlobale}
                      placeholder="0"
                      style={{ width: 80, fontSize: 16, textAlign: 'right' }}
                      onChange={e => setForm(f => ({ ...f, remiseGlobale: e.target.value }))}
                    />
                  </div>
                  {remise > 0 && (
                    <div className="sm-tot-row sm-tot-disc">
                      <span className="sm-tot-label">Économie</span>
                      <span className="sm-tot-val">− {formatPrice(remise)}</span>
                    </div>
                  )}
                  <div className="sm-tot-row sm-tot-main" style={{ borderTop: '1px solid #E8E1D4', paddingTop: 6, marginTop: 2 }}>
                    <span className="sm-tot-label" style={{ fontWeight: 600, color: '#14110E' }}>Total</span>
                    <span className="sm-tot-val">{formatPrice(totalVente)}</span>
                  </div>
                  {form.statutPaiement === 'acompte' && acompte > 0 && (
                    <>
                      <div className="sm-tot-row" style={{ color: '#D97706' }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Acompte</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatPrice(acompte)}</span>
                      </div>
                      <div className="sm-tot-row" style={{ color: '#DC2626', fontWeight: 700, borderTop: '1px solid #E8E1D4', paddingTop: 4 }}>
                        <span style={{ fontSize: 12 }}>Reste à payer</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatPrice(resteAPayer)}</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ═══ CLIENT ═══ */}
          <div>
            <p className="sm-section-title">Client</p>
            <div className="sm-grid2">
              {/* Nom + autocomplete */}
              <div className="sm-field sm-full" style={{ position: 'relative' }}>
                <label className="sm-label">Nom *</label>
                <input
                  className="sm-in"
                  type="text"
                  value={form.clientNom}
                  onChange={e => handleClientNomChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                  onFocus={() => clientSugg.length > 0 && setShowSugg(true)}
                  placeholder="Ex : WADADA"
                  autoComplete="off"
                  style={{ fontSize: 16 }}
                />
                {showSugg && (
                  <div className="sm-sugg-drop">
                    {clientSugg.map(c => (
                      <div key={c.id} className="sm-sugg-item" onMouseDown={() => selectClient(c)}>
                        <UserCheckIcon />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.nom}</div>
                          {c.telephone && <div style={{ fontSize: 11, color: '#8A8278' }}>{c.telephone}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isNewClient && form.clientNom && !showSugg && (
                  <div className="sm-client-ok"><UserCheckIcon size={12} /> Client enregistré</div>
                )}
              </div>

              {/* Téléphone — nouveau client seulement */}
              {isNewClient && form.clientNom.trim().length >= 2 && (
                <div className="sm-field sm-full">
                  <label className="sm-label">Téléphone <span style={{ fontWeight: 400, color: '#8A8278' }}>(nouveau client)</span></label>
                  <input
                    className="sm-in"
                    type="text"
                    value={form.clientTel}
                    onChange={e => setForm(f => ({ ...f, clientTel: e.target.value }))}
                    placeholder="+228 90 00 00 00"
                    style={{ fontSize: 16, borderColor: '#FCD34D' }}
                  />
                  <div className="sm-client-new">Ce client sera enregistré automatiquement.</div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ LIVRAISON ═══ */}
          <div>
            <p className="sm-section-title">Livraison</p>
            <label className="sm-check-row">
              <input
                type="checkbox"
                checked={form.avecLivraison}
                onChange={e => setForm(f => ({
                  ...f,
                  avecLivraison: e.target.checked,
                  ...(e.target.checked ? { statutPaiement: 'non_paye' } : {}),
                }))}
              />
              <span className="sm-check-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TruckIcon /> Livraison à domicile
              </span>
            </label>

            {form.avecLivraison && (
              <div className="sm-liv-block">
                <div>
                  <div className="sm-liv-label">Adresse de livraison</div>
                  <input className="sm-liv-in" type="text" value={form.adresseLivraison}
                    onChange={e => setForm(f => ({ ...f, adresseLivraison: e.target.value }))}
                    placeholder="Ex : Lomé, Tokoin, rue 123…" style={{ fontSize: 16 }} />
                </div>
                <div>
                  <div className="sm-liv-label">Contact à livrer</div>
                  <input className="sm-liv-in" type="text" value={form.contactLivraison}
                    onChange={e => setForm(f => ({ ...f, contactLivraison: e.target.value }))}
                    placeholder="+228 90 00 00 00" style={{ fontSize: 16 }} />
                </div>
                <div>
                  <div className="sm-liv-label">Lien de localisation</div>
                  <input className="sm-liv-in" type="text" value={form.lienLocalisation}
                    onChange={e => setForm(f => ({ ...f, lienLocalisation: e.target.value }))}
                    placeholder="https://maps.app.goo.gl/..." style={{ fontSize: 16 }} />
                </div>
              </div>
            )}
          </div>

          {/* ═══ PAIEMENT ═══ */}
          <div>
            <p className="sm-section-title">Paiement</p>
            <div className="sm-grid2">
              <div className="sm-field">
                <label className="sm-label">Mode</label>
                <div className="sm-select-wrap">
                  <select className="sm-in" value={form.modePaiement}
                    onChange={e => setForm(f => ({ ...f, modePaiement: e.target.value }))}
                    style={{ fontSize: 16 }}>
                    {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <span className="sm-caret"><ChevronIcon /></span>
                </div>
              </div>

              <div className="sm-field">
                <label className="sm-label">Statut</label>
                <div className="sm-select-wrap">
                  <select className="sm-in" value={form.statutPaiement}
                    onChange={e => setForm(f => ({ ...f, statutPaiement: e.target.value }))}
                    style={{ fontSize: 16 }}>
                    {STATUTS_PAIEMENT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <span className="sm-caret"><ChevronIcon /></span>
                </div>
              </div>
            </div>

            {form.statutPaiement === 'acompte' && (
              <div className="sm-acompte-box">
                <div className="sm-acompte-label">Montant acompte (FCFA) *</div>
                <input
                  className="sm-in mono"
                  type="number" min={0} max={totalVente}
                  value={form.montantAcompte}
                  onChange={e => setForm(f => ({ ...f, montantAcompte: e.target.value }))}
                  placeholder="0"
                  style={{ fontSize: 16 }}
                />
                {totalVente > 0 && acompte > 0 && (
                  <div className="sm-acompte-row">
                    <span>Reste à payer</span>
                    <span>{formatPrice(resteAPayer)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ NOTE ═══ */}
          <div className="sm-field">
            <label className="sm-label">Note <span style={{ fontWeight: 400, color: '#8A8278' }}>(optionnel)</span></label>
            <textarea
              className="sm-in"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Remarques, fidélité…"
              rows={2}
              style={{ fontSize: 16 }}
            />
          </div>

          {/* ═══ ERREUR ═══ */}
          {form.error && (
            <div className="sm-err">
              <AlertIcon size={15} />
              {form.error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sm-foot">
          <button className="sm-btn" onClick={onClose}>Annuler</button>
          <button className="sm-btn sm-pri" onClick={submit} disabled={!canSubmit}>
            {form.saving ? <LoaderIcon /> : <CheckIcon />}
            Créer la vente
          </button>
        </div>
      </div>
    </>
  );
}
