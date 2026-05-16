"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Users, Loader2, CheckCircle2, AlertTriangle, Search, X, Package } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { formatPrice } from "@/lib/utils";

type Audience = "tous" | "debiteurs" | "ville";

interface Result { sent: number; failed: number; total: number }

interface Product {
  id:            number;
  nom:           string;
  slug:          string | null;
  reference:     string;
  prix_unitaire: number;
}

const SITE_URL = "https://togolese.tg";

function buildProductBlock(p: Product): string {
  const link = `${SITE_URL}/products/${p.slug ?? p.reference}`;
  return `🛍️ *${p.nom}*\n💰 Prix : ${formatPrice(p.prix_unitaire)}\n🔗 ${link}`;
}

// ─── Product Search ────────────────────────────────────────────────────────────

function ProductSearch({
  selected,
  onAdd,
  onRemove,
}: {
  selected: Product[];
  onAdd:    (p: Product) => void;
  onRemove: (id: number) => void;
}) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Product[]>([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/products?q=${encodeURIComponent(q)}&limit=8`, { credentials: "include" });
      const data = await res.json();
      const list: Product[] = (data.data ?? data ?? []).map((p: any) => ({
        id:            p.id,
        nom:           p.nom,
        slug:          p.slug ?? null,
        reference:     p.reference,
        prix_unitaire: Number(p.prix_unitaire ?? 0),
      }));
      setResults(list.filter(p => !selected.some(s => s.id === p.id)));
      setOpen(true);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selected]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 300);
  }

  function pick(p: Product) {
    onAdd(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Produits à promouvoir <span className="normal-case font-normal text-slate-400">(optionnel · max 3)</span>
      </label>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(p => (
            <span key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
              <Package className="w-3 h-3" />
              {p.nom}
              <button onClick={() => onRemove(p.id)} className="ml-0.5 text-amber-400 hover:text-amber-700">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {selected.length < 3 && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
              placeholder="Rechercher un produit…"
              value={query}
              onChange={onChange}
              onFocus={() => results.length > 0 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
          </div>

          {open && results.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {results.map(p => (
                <button
                  key={p.id}
                  onMouseDown={() => pick(p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-amber-50 text-left transition-colors"
                >
                  <span className="text-sm font-medium text-slate-800 truncate">{p.nom}</span>
                  <span className="text-xs text-slate-400 ml-2 shrink-0">{formatPrice(p.prix_unitaire)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CampagneWaManager() {
  const [message,  setMessage]  = useState("");
  const [audience, setAudience] = useState<Audience>("tous");
  const [ville,    setVille]    = useState("");
  const [count,    setCount]    = useState<number | null>(null);
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<Result | null>(null);
  const [error,    setError]    = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  const loadCount = useCallback(async () => {
    setCount(null);
    const qs = new URLSearchParams({ audience });
    if (audience === "ville" && ville.trim()) qs.set("ville", ville.trim());
    try {
      const res = await fetch(`/api/admin/whatsapp-campagne/preview?${qs}`, { credentials: "include" });
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch { setCount(0); }
  }, [audience, ville]);

  useEffect(() => { loadCount(); }, [loadCount]);

  function addProduct(p: Product) {
    const block = buildProductBlock(p);
    setProducts(prev => [...prev, p]);
    setMessage(prev => {
      const base = prev.trim();
      return base ? `${base}\n\n${block}` : block;
    });
  }

  function removeProduct(id: number) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    setProducts(prev => prev.filter(x => x.id !== id));
    const block = buildProductBlock(p);
    setMessage(prev => prev.replace(`\n\n${block}`, "").replace(`${block}\n\n`, "").replace(block, "").trim());
  }

  async function send() {
    if (!message.trim()) { setError("Message requis."); return; }
    if (!count) { setError("Aucun destinataire."); return; }
    if (!confirm(`Envoyer ce message à ${count} client(s) via WhatsApp ?`)) return;

    setSending(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp-campagne/send", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ message, audience, ville }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setResult(data);
      setMessage("");
      setProducts([]);
    } catch { setError("Impossible d'envoyer."); }
    finally { setSending(false); }
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white";

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Campagne WhatsApp"
        subtitle="Envoyez un message à une sélection de clients."
        accent="amber"
      />

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">

        {/* Audience */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audience</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: "tous",      label: "Tous les clients" },
              { key: "debiteurs", label: "Débiteurs" },
              { key: "ville",     label: "Par ville" },
            ] as { key: Audience; label: string }[]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setAudience(opt.key)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  audience === opt.key
                    ? "bg-amber-500 text-white border-amber-500"
                    : "border-slate-200 text-slate-600 hover:border-amber-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {audience === "ville" && (
            <input
              className={`${inputCls} mt-3`}
              placeholder="Ex : Lomé, Kara…"
              value={ville}
              onChange={e => setVille(e.target.value)}
            />
          )}
        </div>

        {/* Recipients count */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4 text-amber-500" />
          {count === null
            ? "Calcul en cours…"
            : <span><strong className="text-slate-900">{count}</strong> destinataire(s)</span>
          }
        </div>

        {/* Product search */}
        <ProductSearch selected={products} onAdd={addProduct} onRemove={removeProduct} />

        {/* Message */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Message
          </label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={8}
            placeholder="Rédigez votre message WhatsApp… ou sélectionnez un produit ci-dessus pour pré-remplir."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">{message.length} caractères</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Campagne envoyée !</p>
              <p>{result.sent} envoyé(s) · {result.failed} échec(s) · {result.total} total</p>
            </div>
          </div>
        )}

        <button
          onClick={send}
          disabled={sending || !count}
          className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? `Envoi en cours… (~${Math.ceil((count ?? 0) * 0.6)}s)` : "Envoyer la campagne"}
        </button>

        <p className="text-xs text-slate-400 text-center">
          Un délai de 600ms est appliqué entre chaque envoi pour respecter les limites Meta.
        </p>
      </div>
    </div>
  );
}
