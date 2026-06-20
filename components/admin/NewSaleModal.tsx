"use client";

import { useEffect, useMemo, useState } from 'react';
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
const PlusIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

const MODES_PAIEMENT = [
  { value: 'especes',           label: 'Espèces' },
  { value: 'mixx_by_yas',       label: 'Mixx by Yas' },
  { value: 'moov_money',        label: 'Moov Money' },
  { value: 'virement_bancaire', label: 'Virement bancaire' },
];

const fmt = (n: number) => n.toLocaleString('fr-FR');

interface SaleLine {
  item_key: string;
  qty: string | number;
}

export interface NewSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function NewSaleModal({ open, onClose, onSubmitted }: NewSaleModalProps) {
  const [stock,        setStock]        = useState<BoutiqueStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [lines,        setLines]        = useState<SaleLine[]>([{ item_key: '', qty: 1 }]);
  const [client,       setClient]       = useState('');
  const [payment,      setPayment]      = useState('especes');
  const [discount,     setDiscount]     = useState('');
  const [note,         setNote]         = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!open) return;
    setLines([{ item_key: '', qty: 1 }]);
    setClient('');
    setPayment('especes');
    setDiscount('');
    setNote('');
    setSaving(false);
    setError('');
    setLoadingStock(true);
    fetch('/api/admin/stock-boutique?limit=500&filter=disponible')
      .then(r => r.json())
      .then(d => { if (d.items) setStock(d.items); })
      .finally(() => setLoadingStock(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  const stockMap = useMemo(() => {
    const m = new Map<string, BoutiqueStockItem>();
    stock.forEach(p => m.set(`${p.produit_id}_v${p.variant_id ?? 0}`, p));
    return m;
  }, [stock]);

  const options = useMemo(() =>
    stock.map(p => ({
      key:      `${p.produit_id}_v${p.variant_id ?? 0}`,
      label:    [
        p.nom + (p.variant_nom ? ` — ${p.variant_nom}` : ''),
        `${p.quantite} en stock`,
        `${fmt(p.prix_unitaire)} FCFA`,
      ].join('  ·  '),
      disabled: p.quantite === 0,
    })),
  [stock]);

  const grand  = lines.reduce((s, l) => {
    const p = stockMap.get(l.item_key);
    return s + (p ? p.prix_unitaire * (parseInt(String(l.qty), 10) || 0) : 0);
  }, 0);
  const remise = parseInt(discount, 10) || 0;
  const net    = Math.max(0, grand - remise);

  if (!open) return null;

  const setLine    = (i: number, key: keyof SaleLine, val: SaleLine[keyof SaleLine]) =>
    setLines(prev => prev.map((l, j) => j === i ? { ...l, [key]: val } : l));
  const addLine    = () => setLines(prev => [...prev, { item_key: '', qty: 1 }]);
  const removeLine = (i: number) => setLines(prev => prev.filter((_, j) => j !== i));

  async function submit() {
    if (saving) return;
    const validLines = lines.filter(l => l.item_key);
    if (validLines.length === 0) { setError('Ajoutez au moins un article.'); return; }
    setSaving(true);
    setError('');

    const items = validLines.map(l => {
      const p   = stockMap.get(l.item_key)!;
      const qty = parseInt(String(l.qty), 10) || 1;
      return {
        produit_id: p.produit_id,
        nom:        p.nom,
        reference:  p.reference,
        qty,
        prix:       p.prix_unitaire,
        total:      p.prix_unitaire * qty,
        ...(p.variant_id ? { variant_id: p.variant_id } : {}),
      };
    });

    const payload = {
      client_nom:      client.trim() || 'Client anonyme',
      avec_livraison:  false,
      mode_paiement:   payment,
      statut_paiement: 'paye_total',
      sous_total:      grand,
      ...(remise > 0 ? { remise } : {}),
      total:           net || grand,
      ...(note.trim() ? { note: note.trim() } : {}),
      items,
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

  const canSubmit = lines.some(l => l.item_key) && !saving;

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
          <div className="sm-grid2">

            <div className="sm-field sm-full">
              <label className="sm-label">Client</label>
              <input
                className="sm-in"
                type="text"
                value={client}
                onChange={e => setClient(e.target.value)}
                placeholder="Client anonyme"
              />
            </div>

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
          </div>

          <div className="sm-field sm-full">
            <label className="sm-label">Articles vendus</label>
            <div className="sm-lines">
              {lines.map((l, i) => {
                const p         = stockMap.get(l.item_key);
                const unit      = p ? p.prix_unitaire : 0;
                const lineTotal = unit * (parseInt(String(l.qty), 10) || 0);
                return (
                  <div className="sm-line" key={i}>
                    <div className="sm-line-top">
                      <div className="sm-select-wrap" style={{ flex: 1, minWidth: 0 }}>
                        <select
                          className="sm-in"
                          value={l.item_key}
                          disabled={loadingStock}
                          onChange={e => { setLine(i, 'item_key', e.target.value); setLine(i, 'qty', 1); }}
                        >
                          <option value="" disabled>
                            {loadingStock ? 'Chargement…' : 'Produit…'}
                          </option>
                          {options.map(o => (
                            <option key={o.key} value={o.key} disabled={o.disabled}>{o.label}</option>
                          ))}
                        </select>
                        <span className="sm-caret"><ChevronIcon /></span>
                      </div>
                      <button type="button" className="sm-x sm-line-x" onClick={() => removeLine(i)} aria-label="Retirer">
                        <CloseIcon size={14} />
                      </button>
                    </div>
                    <div className="sm-line-bot">
                      <div className="sm-qty">
                        <span className="sm-qty-l">Qté</span>
                        <input
                          className="sm-in mono"
                          type="number"
                          min={1}
                          max={p?.quantite}
                          value={l.qty}
                          onChange={e => setLine(i, 'qty', e.target.value)}
                        />
                      </div>
                      <span className="sm-unit">× {unit ? fmt(unit) : '—'} FCFA</span>
                      <span className="sm-line-total">{lineTotal ? fmt(lineTotal) + ' FCFA' : '—'}</span>
                    </div>
                  </div>
                );
              })}

              <button type="button" className="sm-add" onClick={addLine}>
                <PlusIcon size={13} /> Ajouter une ligne
              </button>

              <div className="sm-total">
                <span className="sm-total-l">Total des achats</span>
                <span className="sm-total-v">{fmt(grand)} FCFA</span>
              </div>
              {remise > 0 && (
                <div className="sm-total sm-total-sub">
                  <span className="sm-total-l">Net à payer (après remise)</span>
                  <span className="sm-total-v">{fmt(net)} FCFA</span>
                </div>
              )}
            </div>
          </div>

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
