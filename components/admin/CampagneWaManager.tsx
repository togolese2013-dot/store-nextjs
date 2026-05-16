"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Users, Loader2, CheckCircle2, AlertTriangle, Search, X, Package, ImageIcon } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { formatPrice } from "@/lib/utils";

interface Result { sent: number; failed: number; total: number; errors?: string[] }

interface Product {
  id:            number;
  nom:           string;
  slug:          string | null;
  reference:     string;
  prix_unitaire: number;
  image_url:     string | null;
}

interface Client {
  id:        number;
  nom:       string;
  telephone: string;
}

const SITE_URL = "https://togolese.tg";

function buildProductBlock(p: Product): string {
  const link = `${SITE_URL}/products/${p.slug ?? p.reference}`;
  return `🛍️ *${p.nom}*\n💰 Prix : ${formatPrice(p.prix_unitaire)}\n🔗 ${link}`;
}

// ─── Client Search ─────────────────────────────────────────────────────────────

function ClientSearch({ selected, onAdd, onRemove, disabled }: {
  selected: Client[];
  onAdd:    (c: Client) => void;
  onRemove: (id: number) => void;
  disabled: boolean;
}) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/boutique-clients?q=${encodeURIComponent(q)}&page=1`, { credentials: "include" });
      const data = await res.json();
      const list: Client[] = (data.data ?? [])
        .filter((c: any) => c.telephone)
        .map((c: any) => ({ id: c.id, nom: c.nom, telephone: c.telephone }))
        .filter((c: Client) => !selected.some(s => s.id === c.id));
      setResults(list);
      setOpen(list.length > 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selected]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 300);
  }

  function pick(c: Client) {
    onAdd(c);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className={disabled ? "opacity-40 pointer-events-none" : ""}>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Sélectionner des clients
      </label>

      {/* Tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(c => (
            <span key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
              <Users className="w-3 h-3" />
              {c.nom}
              <span className="text-amber-400 font-normal">· {c.telephone}</span>
              <button onClick={() => onRemove(c.id)} className="ml-0.5 text-amber-400 hover:text-amber-700">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
          placeholder="Rechercher un client par nom ou téléphone…"
          value={query}
          onChange={onChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}

        {open && results.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {results.map(c => (
              <button
                key={c.id}
                onMouseDown={() => pick(c)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-amber-50 text-left transition-colors"
              >
                <span className="text-sm font-medium text-slate-800">{c.nom}</span>
                <span className="text-xs text-slate-400">{c.telephone}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Search ────────────────────────────────────────────────────────────

function ProductSearch({ selected, onAdd, onRemove }: {
  selected: Product[];
  onAdd:    (p: Product) => void;
  onRemove: (id: number) => void;
}) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/products?q=${encodeURIComponent(q)}&limit=8`, { credentials: "include" });
      const data = await res.json();
      const list: Product[] = (data.products ?? data.data ?? []).map((p: any) => ({
        id:            p.id,
        nom:           p.nom,
        slug:          p.slug ?? null,
        reference:     p.reference,
        prix_unitaire: Number(p.prix_unitaire ?? 0),
        image_url:     p.image_url ?? null,
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
        Produit à promouvoir <span className="normal-case font-normal text-slate-400">(optionnel · 1 max)</span>
      </label>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          {selected[0].image_url ? (
            <img src={selected[0].image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-amber-200" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 truncate">{selected[0].nom}</p>
            <p className="text-xs text-amber-600">{formatPrice(selected[0].prix_unitaire)}</p>
            {selected[0].image_url
              ? <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5"><ImageIcon className="w-3 h-3" /> Photo incluse</p>
              : <p className="text-[10px] text-slate-400 mt-0.5">Pas d'image — message texte</p>
            }
          </div>
          <button onClick={() => onRemove(selected[0].id)} className="p-1.5 rounded-lg text-amber-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {selected.length === 0 && (
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

          {open && results.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {results.map(p => (
                <button
                  key={p.id}
                  onMouseDown={() => pick(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 text-left transition-colors"
                >
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-slate-400" /></div>
                  }
                  <span className="text-sm font-medium text-slate-800 truncate flex-1">{p.nom}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatPrice(p.prix_unitaire)}</span>
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
  const [message,   setMessage]   = useState("");
  const [sendAll,   setSendAll]   = useState(false);
  const [clients,   setClients]   = useState<Client[]>([]);
  const [count,     setCount]     = useState<number | null>(null);
  const [sending,   setSending]   = useState(false);
  const [result,    setResult]    = useState<Result | null>(null);
  const [error,     setError]     = useState("");
  const [products,  setProducts]  = useState<Product[]>([]);

  const loadCount = useCallback(async () => {
    setCount(null);
    try {
      if (sendAll) {
        const res  = await fetch("/api/admin/whatsapp-campagne/preview", { credentials: "include" });
        const data = await res.json();
        setCount(data.count ?? 0);
      } else {
        setCount(clients.length);
      }
    } catch { setCount(0); }
  }, [sendAll, clients]);

  useEffect(() => { loadCount(); }, [loadCount]);

  function toggleSendAll(checked: boolean) {
    setSendAll(checked);
    if (checked) setClients([]);
  }

  function addProduct(p: Product) {
    setProducts([p]);
    setMessage(buildProductBlock(p));
  }

  function removeProduct(_id: number) {
    setProducts([]);
    setMessage("");
  }

  async function send() {
    if (!message.trim()) { setError("Message requis."); return; }
    if (!sendAll && clients.length === 0) { setError("Sélectionnez au moins un client ou cochez \"Tous les clients\"."); return; }
    if (!count) { setError("Aucun destinataire avec un numéro de téléphone."); return; }
    if (!confirm(`Envoyer ce message à ${count} client(s) via WhatsApp ?`)) return;

    setSending(true); setError(""); setResult(null);
    try {
      const image_url  = products[0]?.image_url ?? undefined;
      const client_ids = sendAll ? undefined : clients.map(c => c.id);
      const res = await fetch("/api/admin/whatsapp-campagne/send", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ message, client_ids, image_url }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setResult(data);
      setMessage("");
      setProducts([]);
      setClients([]);
      setSendAll(false);
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

        {/* Client search */}
        <ClientSearch
          selected={clients}
          onAdd={c => { setClients(prev => [...prev, c]); setSendAll(false); }}
          onRemove={id => setClients(prev => prev.filter(c => c.id !== id))}
          disabled={sendAll}
        />

        {/* Send all checkbox */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendAll}
            onChange={e => toggleSendAll(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500"
          />
          <span className="text-sm font-semibold text-slate-700">
            Envoyer à tous les clients
            {sendAll && count !== null && (
              <span className="ml-2 text-amber-600 font-normal">({count} destinataires)</span>
            )}
          </span>
        </label>

        {/* Recipients count */}
        {!sendAll && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4 text-amber-500" />
            <span><strong className="text-slate-900">{clients.length}</strong> client(s) sélectionné(s)</span>
          </div>
        )}

        {/* Product search */}
        <ProductSearch selected={products} onAdd={addProduct} onRemove={removeProduct} />

        {/* Message */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={8}
            placeholder="Rédigez votre message… ou sélectionnez un produit ci-dessus pour pré-remplir."
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
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm ${result.failed === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Campagne terminée</p>
              <p>{result.sent} envoyé(s) · {result.failed} échec(s) · {result.total} total</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs font-mono bg-white/60 rounded px-2 py-1">{e}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={send}
          disabled={sending || (!sendAll && clients.length === 0)}
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
