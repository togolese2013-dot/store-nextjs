"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, User, Phone, MapPin, MessageSquare, Link2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
}

interface OrderItem {
  product_id: number;
  nom: string;
  reference: string;
  qty: number;
  prix_unitaire: number;
  total: number;
}

interface DeliveryZone {
  id: number;
  nom: string;
  fee: number;
}

interface Props {
  zones: DeliveryZone[];
}

export default function CreateOrderForm({ zones }: Props) {
  const router = useRouter();

  // Product search
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cart
  const [items, setItems] = useState<OrderItem[]>([]);

  // Client fields
  const [nom, setNom]                           = useState("");
  const [telephone, setTelephone]               = useState("");
  const [adresse, setAdresse]                   = useState("");
  const [lienLocalisation, setLienLocalisation] = useState("");
  const [note, setNote]                         = useState("");
  const [zoneId, setZoneId]                     = useState<number>(zones[0]?.id ?? 0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const selectedZone = zones.find(z => z.id === Number(zoneId));
  const deliveryFee  = selectedZone?.fee ?? 0;
  const subtotal     = items.reduce((s, i) => s + i.total, 0);
  const total        = subtotal + deliveryFee;

  // Debounced product search
  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  function addProduct(p: Product) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1, total: (next[idx].qty + 1) * next[idx].prix_unitaire };
        return next;
      }
      return [...prev, { product_id: p.id, nom: p.nom, reference: p.reference, qty: 1, prix_unitaire: p.prix, total: p.prix }];
    });
    setQuery("");
    setResults([]);
  }

  function updateQty(idx: number, delta: number) {
    setItems(prev => {
      const next = [...prev];
      const newQty = next[idx].qty + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], qty: newQty, total: newQty * next[idx].prix_unitaire };
      return next;
    });
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!telephone.trim()) { setError("Le téléphone est requis."); return; }
    if (items.length === 0) { setError("Ajoutez au moins un article."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom, telephone, adresse,
          lien_localisation: lienLocalisation || undefined,
          zone_livraison: selectedZone?.nom ?? "",
          delivery_fee: deliveryFee,
          note,
          items: items.map(({ product_id, nom, reference, qty, prix_unitaire, total }) => ({
            product_id, nom, reference, qty, prix_unitaire, total,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      router.push(`/admin/orders/${json.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left — product search + cart */}
      <div className="lg:col-span-2 space-y-5">

        {/* Search */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Articles
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400"
              autoComplete="off"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}

            {results.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                {results.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-50 text-left transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{p.nom}</p>
                      <p className="text-xs text-slate-400">{p.reference} · stock: {p.stock}</p>
                    </div>
                    <span className="font-display font-700 text-brand-600 text-sm">{formatPrice(p.prix)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items table */}
          {items.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Article</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Qté</th>
                    <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">P.U.</th>
                    <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Total</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={item.product_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5">
                        <p className="font-semibold text-slate-800">{item.nom}</p>
                        <p className="text-xs text-slate-400">{item.reference}</p>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => updateQty(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-semibold">{item.qty}</span>
                          <button type="button" onClick={() => updateQty(idx, +1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{formatPrice(item.prix_unitaire)}</td>
                      <td className="py-2.5 text-right font-display font-700 text-slate-900">{formatPrice(item.total)}</td>
                      <td className="py-2.5 pl-2">
                        <button type="button" onClick={() => removeItem(idx)}
                          className="p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-300 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-300 text-sm py-8">Aucun article ajouté</p>
          )}
        </div>
      </div>

      {/* Right — client info + summary */}
      <div className="space-y-5">

        {/* Client */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Client
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nom</label>
            <input value={nom} onChange={e => setNom(e.target.value)} type="text" placeholder="Nom du client"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={telephone} onChange={e => setTelephone(e.target.value)} type="tel" placeholder="+228 XX XX XX XX"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Zone de livraison</label>
            <select value={zoneId} onChange={e => setZoneId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400 bg-white">
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.nom} — {formatPrice(z.fee)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea value={adresse} onChange={e => setAdresse(e.target.value)} rows={2} placeholder="Adresse de livraison"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400 resize-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Lien de localisation (Maps)</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={lienLocalisation} onChange={e => setLienLocalisation(e.target.value)} type="url"
                placeholder="https://maps.google.com/..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Note interne</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Note ou instruction…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400 resize-none" />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h2 className="font-bold text-slate-700">Récapitulatif</h2>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Livraison ({selectedZone?.nom ?? "—"})</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-display font-800 text-lg text-slate-900 border-t border-slate-100 pt-3">
            <span>Total</span>
            <span className="text-brand-600">{formatPrice(total)}</span>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting || items.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer la commande
          </button>
        </div>
      </div>
    </form>
  );
}
