"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import type { BoutiqueStockItem } from '@/lib/admin-db';

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
const CheckIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}><polyline points="20 6 9 17 4 12" /></svg>
);
const LoaderIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk} style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);
const CartIcon = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...{ ...sk, strokeWidth: 1 }}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const UserCheckIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);
const UserPlusIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
  </svg>
);

const MODES_PAIEMENT = [
  { value: 'especes',           label: 'Espèces' },
  { value: 'mixx_by_yas',       label: 'Mixx by Yas' },
  { value: 'moov_money',        label: 'Moov Money' },
  { value: 'virement_bancaire', label: 'Virement bancaire' },
];

const INDICATIFS = [
  { code: '+228', pays: 'Togo' },
  { code: '+225', pays: "Côte d'Ivoire" },
  { code: '+221', pays: 'Sénégal' },
  { code: '+233', pays: 'Ghana' },
  { code: '+237', pays: 'Cameroun' },
  { code: '+229', pays: 'Bénin' },
  { code: '+226', pays: 'Burkina Faso' },
  { code: '+223', pays: 'Mali' },
  { code: '+227', pays: 'Niger' },
  { code: '+234', pays: 'Nigeria' },
  { code: '+241', pays: 'Gabon' },
  { code: '+33',  pays: 'France' },
];

const fmt = (n: number) => n.toLocaleString('fr-FR');

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const SWATCH_PALETTE = [
  '#1F3D6E','#C8962A','#1F1612','#B8501A','#5A3520',
  '#D4A437','#2D6A4F','#8B4513','#4A5568','#C9601E',
];
const swatchFor = (id: number) => SWATCH_PALETTE[id % SWATCH_PALETTE.length];
const initFor   = (nom: string) => nom.trim().charAt(0).toUpperCase();

type ClientMode = 'anon' | 'existing' | 'new';

interface Suggestion {
  id: number;
  nom: string;
  telephone: string | null;
}

interface CartItem {
  item_key:      string;
  produit_id:    number;
  nom:           string;
  reference:     string;
  variant_id?:   number;
  variant_nom?:  string;
  prix_unitaire: number;
  stock_dispo:   number;
  qty:           number;
}

export interface SaleConfirmPayload {
  client:   string;
  payment:  string;
  discount: number;
  note:     string;
  lines:    { product: string; qty: number | string }[];
  total:    number;
  net:      number;
}

export interface NewSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: (payload?: SaleConfirmPayload) => void;
}

export default function NewSaleModal({ open, onClose, onSubmitted }: NewSaleModalProps) {
  /* ── Stock ── */
  const [stock,        setStock]        = useState<BoutiqueStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  /* ── Panier ── */
  const [items,      setItems]      = useState<CartItem[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [showDrop,   setShowDrop]   = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const skipNextFocusRef = useRef(false);

  /* ── Client ── */
  const [clientNom,        setClientNom]        = useState('');
  const [clientMode,       setClientMode]        = useState<ClientMode>('anon');
  const [selectedClientId, setSelectedClientId]  = useState<number | null>(null);
  const [clientIndicatif,  setClientIndicatif]   = useState('+228');
  const [clientNumero,     setClientNumero]      = useState('');
  const [suggestions,      setSuggestions]       = useState<Suggestion[]>([]);
  const [showSugg,         setShowSugg]          = useState(false);
  const [loadingSugg,      setLoadingSugg]       = useState(false);
  const clientWrapRef = useRef<HTMLDivElement>(null);

  /* ── Paiement / autres ── */
  const [payment,        setPayment]        = useState('especes');
  const [statutPaiement, setStatutPaiement] = useState<'paye_total'|'acompte'|'non_paye'>('paye_total');
  const [montantAcompte, setMontantAcompte] = useState('');
  const [discount,       setDiscount]       = useState('');
  const [note,           setNote]           = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  /* ── Reset on open ── */
  useEffect(() => {
    if (!open) return;
    setItems([]); setProdSearch(''); setShowDrop(false); setActiveIdx(-1);
    setClientNom(''); setClientMode('anon'); setSelectedClientId(null);
    setClientIndicatif('+228'); setClientNumero('');
    setSuggestions([]); setShowSugg(false);
    setPayment('especes'); setStatutPaiement('paye_total'); setMontantAcompte('');
    setDiscount(''); setNote('');
    setSaving(false); setError('');
    setLoadingStock(true);
    fetch('/api/admin/stock-boutique?limit=500&filter=disponible')
      .then(r => r.json())
      .then(d => { if (d.items) setStock(d.items); })
      .finally(() => setLoadingStock(false));
  }, [open]);

  /* ── Esc ── */
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDrop(false);
      if (clientWrapRef.current && !clientWrapRef.current.contains(e.target as Node))
        setShowSugg(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* ── Produits filtrés ── */
  const filtered = useMemo(() => {
    if (!prodSearch.trim()) return stock.slice(0, 40);
    const q = norm(prodSearch);
    return stock.filter(p =>
      norm(p.nom).includes(q) || norm(p.reference).includes(q)
    ).slice(0, 30);
  }, [stock, prodSearch]);

  /* ── Totaux ── */
  const sousTotal = items.reduce((s, i) => s + i.prix_unitaire * i.qty, 0);
  const remise    = parseInt(discount, 10) || 0;
  const total     = Math.max(0, sousTotal - remise);

  if (!open) return null;

  /* ── Panier helpers ── */
  function addProduct(p: BoutiqueStockItem) {
    const key = `${p.produit_id}_v${p.variant_id ?? 0}`;
    setItems(prev => {
      const ex = prev.find(i => i.item_key === key);
      if (ex) {
        if (ex.qty >= p.quantite) return prev;
        return prev.map(i => i.item_key === key ? { ...i, qty: i.qty + 1 } : i);
      }
      if (p.quantite === 0) return prev;
      return [...prev, {
        item_key: key, produit_id: p.produit_id,
        nom: p.nom, reference: p.reference,
        variant_id: p.variant_id, variant_nom: p.variant_nom,
        prix_unitaire: p.prix_unitaire, stock_dispo: p.quantite, qty: 1,
      }];
    });
    setProdSearch(''); setShowDrop(false); setActiveIdx(-1);
    skipNextFocusRef.current = true;
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  function removeItem(key: string) { setItems(p => p.filter(i => i.item_key !== key)); }

  function changeQty(key: string, delta: number) {
    setItems(p => p.map(i => {
      if (i.item_key !== key) return i;
      const next = Math.max(1, Math.min(i.stock_dispo, i.qty + delta));
      return { ...i, qty: next };
    }));
  }

  function setQtyDirect(key: string, val: string) {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) return;
    setItems(p => p.map(i =>
      i.item_key !== key ? i : { ...i, qty: Math.min(i.stock_dispo, n) }
    ));
  }

  /* ── Client autocomplete ── */
  async function handleNomChange(val: string) {
    setClientNom(val);
    setClientMode('anon');
    setSelectedClientId(null);
    setClientNumero('');
    if (val.trim().length < 2) { setSuggestions([]); setShowSugg(false); return; }
    setLoadingSugg(true);
    try {
      const res  = await fetch(`/api/admin/boutique-clients?q=${encodeURIComponent(val)}&page=1`);
      const data = await res.json();
      const list = ((data.data ?? []) as Suggestion[]).slice(0, 5);
      setSuggestions(list);
      setShowSugg(true);
      if (list.length === 0) setClientMode('new');
    } catch { setSuggestions([]); setClientMode('new'); }
    finally { setLoadingSugg(false); }
  }

  function selectExisting(c: Suggestion) {
    setClientNom(c.nom);
    setClientMode('existing');
    setSelectedClientId(c.id);
    if (c.telephone) {
      const match = c.telephone.match(/^(\+\d{1,4})\s*(.+)$/);
      if (match) { setClientIndicatif(match[1]); setClientNumero(match[2].trim()); }
      else setClientNumero(c.telephone);
    }
    setSuggestions([]); setShowSugg(false);
  }

  function selectNew() {
    setClientMode('new');
    setSelectedClientId(null);
    setSuggestions([]); setShowSugg(false);
  }

  /* ── Submit ── */
  async function submit() {
    if (saving) return;
    if (items.length === 0) { setError('Ajoutez au moins un article.'); return; }
    if (clientMode === 'new' && !clientNumero.trim()) {
      setError('Le numéro de téléphone est requis pour enregistrer un nouveau client.');
      return;
    }
    if (statutPaiement === 'acompte' && (!montantAcompte || Number(montantAcompte) <= 0)) {
      setError("Saisissez le montant de l'acompte.");
      return;
    }
    setSaving(true); setError('');

    let clientNomFinal = clientNom.trim() || 'Client anonyme';
    let clientTelFinal: string | undefined;

    if (clientMode === 'new' && clientNom.trim()) {
      const tel  = `${clientIndicatif} ${clientNumero.trim()}`;
      const cRes = await fetch('/api/admin/boutique-clients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nom: clientNom.trim(), telephone: tel }),
      });
      const cData = await cRes.json();
      if (!cRes.ok) { setError(cData.error ?? 'Erreur création client.'); setSaving(false); return; }
      clientTelFinal = tel;
    } else if (clientMode === 'existing' && clientNumero.trim()) {
      clientTelFinal = `${clientIndicatif} ${clientNumero.trim()}`;
    }

    const payload = {
      client_nom:      clientNomFinal,
      ...(clientTelFinal ? { client_tel: clientTelFinal } : {}),
      ...(clientMode === 'existing' && selectedClientId ? { client_id: selectedClientId } : {}),
      avec_livraison:  false,
      mode_paiement:   payment,
      statut_paiement: statutPaiement,
      ...(statutPaiement === 'acompte' ? { montant_acompte: Number(montantAcompte) } : {}),
      sous_total:      sousTotal,
      ...(remise > 0 ? { remise } : {}),
      total:           total || sousTotal,
      ...(note.trim() ? { note: note.trim() } : {}),
      items: items.map(i => ({
        produit_id: i.produit_id,
        nom:        i.nom,
        reference:  i.reference,
        qty:        i.qty,
        prix:       i.prix_unitaire,
        total:      i.prix_unitaire * i.qty,
        ...(i.variant_id ? { variant_id: i.variant_id } : {}),
      })),
    };

    const res  = await fetch('/api/admin/ventes/factures', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      onClose();
      onSubmitted?.({
        client:   clientNomFinal || 'Client anonyme',
        payment:  payment,
        discount: remise,
        note:     note.trim(),
        lines:    items.map(i => ({ product: i.nom, qty: i.qty })),
        total:    total || sousTotal,
        net:      (total || sousTotal) - remise,
      });
    }
    else setError(data.error ?? "Erreur lors de l'enregistrement.");
  }

  const canSubmit = items.length > 0 && !saving;

  const dropResults = filtered.slice(0, 7);

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDrop || dropResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, dropResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = dropResults[activeIdx] ?? dropResults[0];
      if (target && target.quantite > 0) addProduct(target);
    } else if (e.key === 'Escape') {
      setShowDrop(false); setActiveIdx(-1);
    }
  }

  /* ─────────── RENDER ─────────── */
  return (
    <>
      <div className="sm-backdrop" onMouseDown={onClose} />
      <div className="sm-drawer" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>

        <div className="sm-head">
          <div>
            <div className="sm-eyb">Boutique · Ventes</div>
            <div className="sm-title">Nouvelle <span className="sm-serif">vente</span></div>
          </div>
          <button className="sm-x" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
        </div>

        <div className="sm-body">

          {/* ═══ CLIENT ═══ */}
          <div className="sm-field sm-full" style={{ position: 'relative' }} ref={clientWrapRef}>
            <label className="sm-label">Client</label>
            <div style={{ position: 'relative' }}>
              <input
                className="sm-in"
                type="text"
                value={clientNom}
                onChange={e => handleNomChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                placeholder="Nom du client (vide = anonyme)"
                autoComplete="off"
              />
              {loadingSugg && (
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <LoaderIcon size={13} />
                </span>
              )}
              {showSugg && (
                <div className="sm-sugg-drop">
                  {suggestions.map(c => (
                    <div key={c.id} className="sm-sugg-item" onMouseDown={() => selectExisting(c)}>
                      <UserCheckIcon />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.nom}</div>
                        {c.telephone && <div style={{ fontSize: 11, color: '#8A8278' }}>{c.telephone}</div>}
                      </div>
                    </div>
                  ))}
                  {clientNom.trim().length >= 2 && (
                    <div className="sm-sugg-item sm-sugg-create" onMouseDown={selectNew}>
                      <UserPlusIcon />
                      <div>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Créer &ldquo;{clientNom.trim()}&rdquo;</span>
                        <span style={{ fontSize: 11, color: '#8A8278', marginLeft: 6 }}>nouveau client</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {clientMode === 'existing' && (
              <div className="sm-badge sm-badge-ok"><UserCheckIcon /> Client enregistré</div>
            )}
            {clientMode === 'new' && clientNom.trim() && (
              <div className="sm-badge sm-badge-new"><UserPlusIcon /> Nouveau client — sera enregistré</div>
            )}

            {(clientMode === 'existing' || clientMode === 'new') && (
              <div className="sm-tel-wrap">
                <div className="sm-select-wrap sm-indicatif-wrap">
                  <select
                    className="sm-in sm-indicatif"
                    value={clientIndicatif}
                    onChange={e => setClientIndicatif(e.target.value)}
                    disabled={clientMode === 'existing'}
                  >
                    {INDICATIFS.map(i => (
                      <option key={i.code} value={i.code}>{i.code} {i.pays}</option>
                    ))}
                  </select>
                  <span className="sm-caret"><ChevronIcon /></span>
                </div>
                <input
                  className="sm-in sm-numero"
                  type="tel"
                  value={clientNumero}
                  onChange={e => setClientNumero(e.target.value)}
                  placeholder="90 00 00 00"
                  disabled={clientMode === 'existing'}
                  required={clientMode === 'new'}
                />
              </div>
            )}
          </div>

          {/* ═══ PAIEMENT ═══ */}
          <div className="sm-grid2">
            {/* Ligne 1 : mode + statut */}
            <div className="sm-field">
              <label className="sm-label">Mode de paiement</label>
              <div className="sm-select-wrap">
                <select className="sm-in" value={payment} onChange={e => setPayment(e.target.value)}>
                  {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <span className="sm-caret"><ChevronIcon /></span>
              </div>
            </div>

            <div className="sm-field">
              <label className="sm-label">Statut de paiement</label>
              <div className="sm-select-wrap">
                <select className="sm-in" value={statutPaiement}
                  onChange={e => { setStatutPaiement(e.target.value as typeof statutPaiement); setMontantAcompte(''); }}>
                  <option value="paye_total">Payé en totalité</option>
                  <option value="acompte">Acompte</option>
                  <option value="non_paye">Non payé</option>
                </select>
                <span className="sm-caret"><ChevronIcon /></span>
              </div>
            </div>

            {/* Ligne 2 : remise + montant acompte (conditionnel) */}
            <div className="sm-field">
              <label className="sm-label">Remise</label>
              <div className="sm-price-wrap">
                <input
                  className="sm-in mono"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="0"
                />
                <span className="sm-suffix">FCFA</span>
              </div>
            </div>

            {statutPaiement === 'acompte' && (
              <div className="sm-field">
                <label className="sm-label">Montant acompte <span style={{ color: '#C9601E' }}>*</span></label>
                <div className="sm-price-wrap">
                  <input
                    className="sm-in mono"
                    type="number"
                    min={1}
                    value={montantAcompte}
                    onChange={e => setMontantAcompte(e.target.value)}
                    placeholder="0"
                    style={{ borderColor: '#FCD34D' }}
                  />
                  <span className="sm-suffix">FCFA</span>
                </div>
              </div>
            )}
          </div>

          {/* ═══ ARTICLES ═══ */}
          <div className="sm-field sm-full">
            <label className="sm-label">Articles vendus</label>

            {/* Recherche produit */}
            <div className="sm-search-wrap" ref={searchRef}>
              <span className="sm-search-icon"><SearchIcon /></span>
              <input
                ref={searchInputRef}
                className="sm-in sm-search-in"
                type="text"
                placeholder={loadingStock ? 'Chargement du stock…' : 'Rechercher un produit…'}
                value={prodSearch}
                disabled={loadingStock}
                onChange={e => { setProdSearch(e.target.value); setShowDrop(true); setActiveIdx(-1); }}
                onFocus={() => {
                  if (skipNextFocusRef.current) { skipNextFocusRef.current = false; return; }
                  setShowDrop(true);
                }}
                onKeyDown={handleSearchKey}
                autoComplete="off"
              />
              {prodSearch && (
                <button
                  type="button"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#8A8278', display: 'flex' }}
                  onMouseDown={e => { e.preventDefault(); setProdSearch(''); setShowDrop(false); setActiveIdx(-1); searchInputRef.current?.focus(); }}
                >
                  <CloseIcon size={13} />
                </button>
              )}
              {loadingStock && !prodSearch && (
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <LoaderIcon />
                </span>
              )}

              {showDrop && dropResults.length > 0 && (
                <div className="sm-drop" style={{ borderRadius: 13, boxShadow: '0 8px 28px rgba(20,17,14,.12)' }}>
                  {dropResults.map((p, idx) => {
                    const key    = `${p.produit_id}_v${p.variant_id ?? 0}`;
                    const inCart = items.find(i => i.item_key === key);
                    const full   = !!(inCart && inCart.qty >= p.quantite);
                    const disabled = p.quantite === 0 || full;
                    const lowStock = p.quantite > 0 && p.quantite <= (p.seuil_alerte || 5);
                    const stockText = p.quantite === 0
                      ? 'Épuisé'
                      : full
                        ? 'Déjà max'
                        : lowStock
                          ? `⚠ ${p.quantite} en stock`
                          : `${p.quantite} en stock`;
                    const stockColor = p.quantite === 0 || full ? '#8A8278' : lowStock ? '#C9601E' : '#8A8278';
                    const label = [p.nom, p.variant_nom].filter(Boolean).join(' · ');
                    const isActive = idx === activeIdx;
                    return (
                      <div
                        key={key}
                        className={`sm-drop-item${disabled ? ' disabled' : ''}`}
                        onMouseDown={() => !disabled && addProduct(p)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 11,
                          padding: '10px 16px',
                          borderBottom: idx < dropResults.length - 1 ? '1px solid #E8E1D4' : 'none',
                          background: isActive ? '#F4EFE6' : 'transparent',
                          cursor: disabled ? 'default' : 'pointer',
                          opacity: disabled ? 0.55 : 1,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#14110E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 2, display: 'flex', gap: 8 }}>
                            {p.categorie_nom && <span style={{ color: '#8A8278' }}>{p.categorie_nom}</span>}
                            <span style={{ color: stockColor, fontWeight: lowStock && p.quantite > 0 ? 500 : 400 }}>{stockText}</span>
                          </div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: '#2A2522', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {fmt(p.prix_unitaire)}<span style={{ fontSize: 10, fontWeight: 400, color: '#6B635B', marginLeft: 2 }}>FCFA</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {showDrop && prodSearch && dropResults.length === 0 && !loadingStock && (
                <div className="sm-drop" style={{ borderRadius: 13 }}>
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 12.5, color: '#8A8278' }}>
                    Aucun produit pour &laquo;&nbsp;{prodSearch}&nbsp;&raquo;
                  </div>
                </div>
              )}
            </div>

            {/* Panier vide */}
            {items.length === 0 && (
              <div style={{ border: '1.5px dashed #E8E1D4', borderRadius: 11, padding: '20px 16px', textAlign: 'center', fontSize: 12.5, color: '#8A8278', marginTop: 8 }}>
                Tapez le nom d&rsquo;un produit pour l&rsquo;ajouter
              </div>
            )}

            {/* Liste panier */}
            {items.length > 0 && (
              <>
                <div className="sm-cart" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => {
                    const swColor  = swatchFor(item.produit_id);
                    const initial  = initFor(item.nom);
                    const lowStock = item.stock_dispo > 0 && item.stock_dispo <= 5;
                    const metaColor = item.stock_dispo === 0 ? '#9C3A14' : lowStock ? '#C9601E' : '#2D6A4F';
                    const metaText  = item.stock_dispo === 0
                      ? `Rupture · ${fmt(item.prix_unitaire)} FCFA / u.`
                      : `${item.stock_dispo} en stock · ${fmt(item.prix_unitaire)} FCFA / u.`;
                    return (
                      <div
                        key={item.item_key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px',
                          border: '1px solid #E8E1D4',
                          borderRadius: 11,
                          minHeight: 58,
                          background: '#fff',
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                          background: swColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff',
                        }}>
                          {initial}
                        </div>

                        {/* Nom + meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#14110E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.nom}{item.variant_nom ? ` · ${item.variant_nom}` : ''}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 2, color: metaColor, fontWeight: lowStock ? 600 : 400 }}>
                            {metaText}
                          </div>
                        </div>

                        {/* Stepper */}
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          background: '#F4EFE6', border: '1px solid #E8E1D4',
                          borderRadius: 9, overflow: 'hidden', flexShrink: 0,
                        }}>
                          <button
                            type="button"
                            disabled={item.qty <= 1}
                            onClick={() => changeQty(item.item_key, -1)}
                            style={{ width: 30, height: 32, fontSize: 18, lineHeight: 1, color: '#6B635B', background: 'none', border: 'none', cursor: item.qty <= 1 ? 'default' : 'pointer', opacity: item.qty <= 1 ? 0.4 : 1 }}
                          >−</button>
                          <input
                            type="number"
                            min={1}
                            max={item.stock_dispo}
                            value={item.qty}
                            onChange={e => setQtyDirect(item.item_key, e.target.value)}
                            style={{ width: 38, height: 32, textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, fontSize: 13, border: 'none', background: 'none', color: '#14110E' }}
                          />
                          <button
                            type="button"
                            disabled={item.qty >= item.stock_dispo}
                            onClick={() => changeQty(item.item_key, +1)}
                            style={{ width: 30, height: 32, fontSize: 18, lineHeight: 1, color: '#6B635B', background: 'none', border: 'none', cursor: item.qty >= item.stock_dispo ? 'default' : 'pointer', opacity: item.qty >= item.stock_dispo ? 0.4 : 1 }}
                          >+</button>
                        </div>

                        {/* Total ligne */}
                        <div style={{ minWidth: 88, textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#14110E', flexShrink: 0 }}>
                          {fmt(item.prix_unitaire * item.qty)}&nbsp;F
                        </div>

                        {/* Supprimer */}
                        <button
                          type="button"
                          aria-label="Retirer"
                          onClick={() => removeItem(item.item_key)}
                          style={{
                            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: '#6B635B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F7DCCB'; (e.currentTarget as HTMLButtonElement).style.color = '#9C3A14'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6B635B'; }}
                        >
                          <CloseIcon size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer articles */}
                <div style={{ borderTop: '1px solid #E8E1D4', padding: '12px 4px 2px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 12.5, color: '#6B635B' }}>
                    <span style={{ color: '#C9601E', fontWeight: 600 }}>{items.reduce((s, i) => s + i.qty, 0)}</span>
                    {' '}article{items.reduce((s, i) => s + i.qty, 0) > 1 ? 's' : ''}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {fmt(sousTotal)} FCFA
                  </span>
                </div>

                {/* Remise / acompte */}
                {(remise > 0 || statutPaiement === 'acompte') && (
                  <div className="sm-totals">
                    {remise > 0 && (
                      <div className="sm-tot-row sm-tot-disc">
                        <span className="sm-tot-label">Remise</span>
                        <span className="sm-tot-val">− {fmt(remise)} FCFA</span>
                      </div>
                    )}
                    {remise > 0 && (
                      <div className="sm-tot-row sm-tot-main">
                        <span className="sm-tot-label" style={{ fontWeight: 600, color: '#14110E' }}>Total</span>
                        <span className="sm-tot-val">{fmt(total)} FCFA</span>
                      </div>
                    )}
                    {statutPaiement === 'acompte' && Number(montantAcompte) > 0 && (
                      <>
                        <div className="sm-tot-row" style={{ color: '#D97706' }}>
                          <span className="sm-tot-label" style={{ color: '#D97706', fontWeight: 600 }}>Acompte versé</span>
                          <span className="sm-tot-val" style={{ color: '#D97706' }}>{fmt(Number(montantAcompte))} FCFA</span>
                        </div>
                        <div className="sm-tot-row" style={{ borderTop: '1px solid #E8E1D4', paddingTop: 6, marginTop: 2 }}>
                          <span className="sm-tot-label" style={{ color: '#DC2626', fontWeight: 600 }}>Reste à payer</span>
                          <span className="sm-tot-val" style={{ color: '#DC2626' }}>
                            {fmt(Math.max(0, (total || sousTotal) - Number(montantAcompte)))} FCFA
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ═══ NOTE ═══ */}
          <div className="sm-field sm-full">
            <label className="sm-label">Note</label>
            <textarea
              className="sm-in"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Remarque, livraison, fidélité…"
            />
          </div>

          {error && <div className="sm-err">{error}</div>}
        </div>

        <div className="sm-foot">
          <button className="sm-btn" onClick={onClose}>Annuler</button>
          <button className="sm-btn sm-pri" onClick={submit} disabled={!canSubmit}>
            {saving ? <LoaderIcon /> : <CheckIcon />}
            Créer la vente
          </button>
        </div>
      </div>
    </>
  );
}
