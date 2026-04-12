"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle, Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  produit_id: number;
  produit_nom: string;
  produit_ref: string;
  prix_unitaire: number;
  quantite: number;
  total: number;
}

interface Produit {
  id: number;
  nom: string;
  reference: string;
  prix_unitaire: number;
  stock_boutique: number;
}

export default function NouvelleVentePage() {
  const router = useRouter();
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<Produit[]>([]);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [remise, setRemise]           = useState(0);
  const [montantRecu, setMontantRecu] = useState("");
  const [clientNom, setClientNom]     = useState("");
  const [clientTel, setClientTel]     = useState("");
  const [note, setNote]               = useState("");
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/admin/products?q=${encodeURIComponent(q)}&limit=8`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.products ?? data.produits ?? []);
    }
  }, []);

  function addToCart(p: Produit) {
    setResults([]);
    setQuery("");
    setCart(prev => {
      const idx = prev.findIndex(i => i.produit_id === p.id);
      if (idx >= 0) {
        return prev.map((i, j) => j === idx
          ? { ...i, quantite: i.quantite + 1, total: (i.quantite + 1) * i.prix_unitaire }
          : i
        );
      }
      return [...prev, {
        produit_id: p.id, produit_nom: p.nom, produit_ref: p.reference,
        prix_unitaire: p.prix_unitaire, quantite: 1, total: p.prix_unitaire,
      }];
    });
  }

  function updateQty(idx: number, delta: number) {
    setCart(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const q = Math.max(1, item.quantite + delta);
      return { ...item, quantite: q, total: q * item.prix_unitaire };
    }));
  }

  function removeItem(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  const sousTotal = cart.reduce((s, i) => s + i.total, 0);
  const totalNet  = Math.max(0, sousTotal - remise);
  const monnaie   = Math.max(0, (parseInt(montantRecu) || 0) - totalNet);

  async function handleSubmit() {
    if (!cart.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ventes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_nom: clientNom || null,
          client_telephone: clientTel || null,
          items: cart,
          remise,
          montant_recu: parseInt(montantRecu) || totalNet,
          note: note || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(data.reference);
        setCart([]);
        setRemise(0);
        setMontantRecu("");
        setClientNom("");
        setClientTel("");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="font-display font-800 text-2xl text-slate-900">Vente enregistrée !</h2>
          <p className="text-slate-500 mt-1">Référence : <span className="font-bold text-slate-800">{success}</span></p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/admin/factures`)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-900 text-white font-semibold hover:bg-brand-800 transition-colors"
          >
            <Printer className="w-4 h-4" /> Voir la facture
          </button>
          <button
            onClick={() => setSuccess(null)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle vente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Nouvelle vente</h1>
        <p className="text-slate-500 text-sm mt-1">Vente en boutique physique</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — product search */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <p className="font-bold text-sm text-slate-700 mb-3">Rechercher un produit</p>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nom, référence..."
                value={query}
                onChange={e => search(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            {results.length > 0 && (
              <div className="mt-2 divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                {results.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-50 text-left transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{p.nom}</p>
                      <p className="text-xs text-slate-400">{p.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-brand-800">{formatPrice(p.prix_unitaire)}</p>
                      <p className="text-xs text-slate-400">Stock: {p.stock_boutique ?? "—"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Client info */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <p className="font-bold text-sm text-slate-700 mb-3">Client (optionnel)</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={clientNom} onChange={e => setClientNom(e.target.value)}
                placeholder="Nom client" className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              <input value={clientTel} onChange={e => setClientTel(e.target.value)}
                placeholder="Téléphone" className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note (optionnel)" rows={2}
              className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
          </div>
        </div>

        {/* Right — cart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-brand-700" />
              <p className="font-bold text-slate-900">Panier</p>
              <span className="ml-auto text-xs font-semibold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                {cart.length} article{cart.length !== 1 ? "s" : ""}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-300">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{item.produit_nom}</p>
                      <p className="text-xs text-slate-400">{formatPrice(item.prix_unitaire)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantite}</span>
                      <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(idx)} className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-900 w-16 text-right shrink-0">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Sous-total</span><span className="font-semibold">{formatPrice(sousTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Remise (FCFA)</span>
                <input type="number" min={0} value={remise || ""} onChange={e => setRemise(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 pt-1 border-t border-slate-100">
                <span>Total</span><span className="text-brand-800">{formatPrice(totalNet)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Montant reçu</span>
                <input type="number" min={0} value={montantRecu} onChange={e => setMontantRecu(e.target.value)}
                  placeholder={formatPrice(totalNet)}
                  className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
              </div>
              {parseInt(montantRecu) > 0 && (
                <div className="flex justify-between text-sm font-semibold text-emerald-700">
                  <span>Monnaie</span><span>{formatPrice(monnaie)}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || loading}
              className="mt-4 w-full py-3.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "Enregistrement..." : <>
                <CheckCircle className="w-4 h-4" /> Valider la vente
              </>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
