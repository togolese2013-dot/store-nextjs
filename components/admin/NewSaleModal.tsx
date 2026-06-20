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

export interface NewSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function NewSaleModal({ open, onClose, onSubmitted }: NewSaleModalProps) {
  /* ── Stock ── */
  const [stock,        setStock]        = useState<BoutiqueStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  /* ── Panier ── */
  const [items,      setItems]      = useState<CartItem[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [showDrop,   setShowDrop]   = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ── Client ── */
  const [clientNom,        setClientNom]        = useState('');
  const [clientMode,       setClientMode]        = useState<ClientMode>('anon');
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
    setItems([]); setProdSearch(''); setShowDrop(false);
    setClientNom(''); setClientMode('anon');
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
    setProdSearch(''); setShowDrop(false);
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
    if (c.telephone) {
      const match = c.telephone.match(/^(\+\d{1,4})\s*(.+)$/);
      if (match) { setClientIndicatif(match[1]); setClientNumero(match[2].trim()); }
      else setClientNumero(c.telephone);
    }
    setSuggestions([]); setShowSugg(false);
  }

  function selectNew() {
    setClientMode('new');
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
    if (res.ok) { onClose(); onSubmitted?.(); }
    else setError(data.error ?? "Erreur lors de l'enregistrement.");
  }

  const canSubmit = items.length > 0 && !saving;

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
                className="sm-in sm-search-in"
                type="text"
                placeholder={loadingStock ? 'Chargement du stock…' : 'Rechercher un produit…'}
                value={prodSearch}
                disabled={loadingStock}
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
                  {filtered.map(p => {
                    const key    = `${p.produit_id}_v${p.variant_id ?? 0}`;
                    const inCart = items.find(i => i.item_key === key);
                    const full   = inCart && inCart.qty >= p.quantite;
                    const stockColor = p.quantite === 0 ? '#DC2626' : p.quantite <= 3 ? '#D97706' : '#16A34A';
                    const stockLabel = p.quantite === 0 ? 'Épuisé' : full ? 'Déjà max' : `${p.quantite} en stock`;
                    const label = [p.nom, p.variant_nom].filter(Boolean).join(' · ');
                    return (
                      <div
                        key={key}
                        className={`sm-drop-item${p.quantite === 0 || full ? ' disabled' : ''}`}
                        onMouseDown={() => !full && p.quantite > 0 && addProduct(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '7px 12px', width: '100%', boxSizing: 'border-box' }}
                      >
                        <span style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500, color: '#000' }}>{label}</span>
                        <span style={{ flexShrink: 0, width: 90, textAlign: 'right', fontSize: 12, fontWeight: 600, color: stockColor, paddingLeft: 8 }}>{stockLabel}</span>
                        <span style={{ flexShrink: 0, width: 115, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#000', paddingLeft: 8 }}>{fmt(p.prix_unitaire)} FCFA</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {showDrop && prodSearch && filtered.length === 0 && !loadingStock && (
                <div className="sm-drop">
                  <div className="sm-drop-empty">Aucun produit correspondant</div>
                </div>
              )}
            </div>

            {/* Panier vide */}
            {items.length === 0 && (
              <div className="sm-empty">
                <CartIcon />
                <span>Aucun article — recherchez ci-dessus</span>
              </div>
            )}

            {/* Liste panier */}
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
                          type="number"
                          min={1}
                          max={item.stock_dispo}
                          value={item.qty}
                          onChange={e => setQtyDirect(item.item_key, e.target.value)}
                        />
                        <button className="sm-qty-btn" type="button" disabled={item.qty >= item.stock_dispo} onClick={() => changeQty(item.item_key, +1)}>+</button>
                      </div>
                      <div className="sm-cart-price">× {fmt(item.prix_unitaire)}</div>
                      <div className="sm-cart-total">{fmt(item.prix_unitaire * item.qty)}</div>
                      <button className="sm-cart-rm" type="button" aria-label="Retirer" onClick={() => removeItem(item.item_key)}>
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="sm-totals">
                  <div className="sm-tot-row">
                    <span className="sm-tot-label">
                      {items.reduce((s, i) => s + i.qty, 0)} article{items.reduce((s, i) => s + i.qty, 0) > 1 ? 's' : ''} — Sous-total
                    </span>
                    <span className="sm-tot-val">{fmt(sousTotal)} FCFA</span>
                  </div>
                  {remise > 0 && (
                    <div className="sm-tot-row sm-tot-disc">
                      <span className="sm-tot-label">Remise</span>
                      <span className="sm-tot-val">− {fmt(remise)} FCFA</span>
                    </div>
                  )}
                  <div className="sm-tot-row sm-tot-main">
                    <span className="sm-tot-label" style={{ fontWeight: 600, color: '#14110E' }}>Total</span>
                    <span className="sm-tot-val">{fmt(total || sousTotal)} FCFA</span>
                  </div>
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
