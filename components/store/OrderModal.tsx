/**
 * OrderModal — création et édition réelles de commandes (Store).
 * Remplace l'ancienne EditOrderModal (état local uniquement, jamais persistée).
 */
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Order, OrderItem, OrderStatus, DeliveryZone } from './types';
import type { Product } from '@/lib/utils';
import { finalPrice } from '@/lib/utils';

const STATUTS: OrderStatus[] = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];
const STATUS_FR_TO_API: Record<OrderStatus, string> = {
  'En attente': 'pending',
  'Confirmée':  'confirmed',
  'Expédiée':   'shipped',
  'Livrée':     'delivered',
  'Annulée':    'cancelled',
};

const inputStyle: React.CSSProperties = {
  height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 9,
  font: 'inherit', fontSize: '16px', color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
};
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase',
  color: 'var(--muted-2)', fontWeight: 500, marginBottom: 10,
};

export interface OrderModalProps {
  mode: 'create' | 'edit';
  order?: Order;
  zones: DeliveryZone[];
  onClose: () => void;
  onSaved: () => void;
}

export default function OrderModal({ mode, order, zones, onClose, onSaved }: OrderModalProps) {
  const [nom, setNom]             = useState(order?.client ?? '');
  const [telephone, setTelephone] = useState(order?.telephone ?? '');
  const [zone, setZone]           = useState(order?.zone ?? '');
  const [fraisLivraison, setFrais] = useState(order?.fraisLivraison ?? 0);
  const [adresse, setAdresse]     = useState(order?.adresse ?? '');
  const [note, setNote]           = useState('');
  const [statut, setStatut]       = useState<OrderStatus>(order?.status ?? 'En attente');
  const [items, setItems]         = useState<OrderItem[]>(order?.items ?? []);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  /* ── Recherche produit ── */
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      fetch(`/api/admin/products?q=${encodeURIComponent(query.trim())}&limit=8`)
        .then(r => r.json())
        .then(d => setResults(Array.isArray(d.data) ? d.data : (Array.isArray(d.products) ? d.products : [])))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  function addProduct(p: Product) {
    const prix = finalPrice(p);
    setItems(prev => {
      const existing = prev.find(i => i.id === String(p.id));
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: String(p.id), nom: p.nom, qty: 1, prix }];
    });
    setQuery('');
    setResults([]);
  }

  function updateQty(id: string, qty: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function selectZone(name: string) {
    setZone(name);
    const z = zones.find(z => z.name === name);
    if (z) setFrais(z.price);
  }

  const subtotal   = items.reduce((s, i) => s + i.qty * i.prix, 0);
  const totalFinal = Math.max(0, subtotal + fraisLivraison);

  async function handleSave() {
    if (!telephone.trim()) { setError('Téléphone requis.'); return; }
    if (items.length === 0) { setError('Ajoutez au moins un article.'); return; }
    setError('');
    setSaving(true);
    try {
      const apiItems = items.map(i => ({
        id: i.id, nom: i.nom, qty: i.qty, prix_unitaire: i.prix, total: i.qty * i.prix,
      }));

      if (mode === 'create') {
        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom, telephone, adresse, zone_livraison: zone,
            delivery_fee: fraisLivraison, note, items: apiItems,
          }),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Échec de la création.'); }
      } else if (order) {
        const res = await fetch(`/api/admin/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'update', nom, telephone, adresse, zone_livraison: zone,
            delivery_fee: fraisLivraison, note, items: apiItems,
          }),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Échec de la mise à jour.'); }

        if (statut !== order.status) {
          const statusRes = await fetch(`/api/admin/orders/${order.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: STATUS_FR_TO_API[statut] }),
          });
          if (!statusRes.ok) { const d = await statusRes.json().catch(() => ({})); throw new Error(d.error || 'Échec du changement de statut.'); }
        }
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(20,17,14,.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 14,
        width: '100%', maxWidth: 600, maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,.18)',
      }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 500, marginBottom: 2 }}>
              {mode === 'create' ? 'Nouvelle commande' : 'Modifier la commande'}
            </div>
            {order && <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{order.ref}</div>}
          </div>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: 'var(--muted)', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section>
            <div style={sectionTitleStyle}>Client</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={labelStyle}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Nom</span>
                <input value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Téléphone</span>
                <input value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <label style={labelStyle}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Zone de livraison</span>
                {zones.length > 0 ? (
                  <select value={zone} onChange={e => selectZone(e.target.value)} style={inputStyle}>
                    <option value="">— Choisir —</option>
                    {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                  </select>
                ) : (
                  <input value={zone} onChange={e => setZone(e.target.value)} style={inputStyle} />
                )}
              </label>
              <label style={labelStyle}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Frais de livraison (F)</span>
                <input type="number" value={fraisLivraison} onChange={e => setFrais(Number(e.target.value) || 0)} style={inputStyle} />
              </label>
            </div>
            <label style={{ ...labelStyle, marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Adresse</span>
              <input value={adresse} onChange={e => setAdresse(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </label>
          </section>

          {mode === 'edit' && (
            <section>
              <div style={sectionTitleStyle}>Statut</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {STATUTS.map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setStatut(s)}
                    style={{
                      padding: '5px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                      border: statut === s ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: statut === s ? 'var(--accent-bg)' : 'var(--surface)',
                      color: statut === s ? 'var(--accent)' : 'var(--ink-2)',
                      cursor: 'pointer', font: 'inherit',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <div style={sectionTitleStyle}>Articles ({items.length})</div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un produit à ajouter…"
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              />
              {(results.length > 0 || searching) && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  border: '1px solid var(--border)', borderRadius: 9, background: 'var(--surface)',
                  boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10, maxHeight: 220, overflowY: 'auto',
                }}>
                  {searching && <div style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--muted)' }}>Recherche…</div>}
                  {!searching && results.map(p => (
                    <button
                      key={p.id} type="button" onClick={() => addProduct(p)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', width: '100%',
                        padding: '9px 14px', border: 0, borderTop: '1px solid var(--border)',
                        background: 'transparent', cursor: 'pointer', font: 'inherit', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>{p.nom}</span>
                      <span style={{ fontSize: 12.5, fontFamily: '"Geist Mono", monospace', color: 'var(--muted)' }}>{finalPrice(p).toLocaleString('fr-FR')} F</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div style={{ padding: '18px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Aucun article</div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '9px 14px', fontWeight: 500 }}>Article</th>
                      <th style={{ textAlign: 'center', fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '9px 14px', fontWeight: 500 }}>Qté</th>
                      <th style={{ textAlign: 'right', fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '9px 14px', fontWeight: 500 }}>Total</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink)' }}>{item.nom}</td>
                        <td style={{ padding: '6px 14px', textAlign: 'center' }}>
                          <input
                            type="number" min={1} value={item.qty}
                            onChange={e => updateQty(item.id, Number(e.target.value) || 1)}
                            style={{ width: 52, height: 28, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 6, font: 'inherit', fontSize: 12.5 }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: '"Geist Mono", monospace', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{(item.qty * item.prix).toLocaleString('fr-FR')} F</td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" onClick={() => removeItem(item.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, lineHeight: 1 }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <label style={labelStyle}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Notes internes</span>
            <input value={note} onChange={e => setNote(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
          </label>

          <section style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500, marginBottom: 2 }}>Récapitulatif</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-2)' }}>
              <span>Sous-total</span>
              <span style={{ fontFamily: '"Geist Mono", monospace' }}>{subtotal.toLocaleString('fr-FR')} F</span>
            </div>
            {fraisLivraison > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-2)' }}>
                <span>Frais de livraison</span>
                <span style={{ fontFamily: '"Geist Mono", monospace' }}>+{fraisLivraison.toLocaleString('fr-FR')} F</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              <span>Total</span>
              <span style={{ fontFamily: '"Geist Mono", monospace', color: 'var(--accent)' }}>{totalFinal.toLocaleString('fr-FR')} F</span>
            </div>
          </section>

          {error && <div style={{ fontSize: 12.5, color: 'var(--danger)' }}>{error}</div>}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button" onClick={onClose}
            style={{ height: 36, padding: '0 18px', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', background: 'transparent' }}
          >
            Annuler
          </button>
          <button
            type="button" onClick={handleSave} disabled={saving}
            style={{ height: 36, padding: '0 20px', border: 0, borderRadius: 9, cursor: saving ? 'default' : 'pointer', font: 'inherit', fontSize: 13, fontWeight: 600, color: 'white', background: 'var(--accent)', opacity: saving ? .6 : 1 }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
