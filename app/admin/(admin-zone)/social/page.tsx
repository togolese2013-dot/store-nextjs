"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, Facebook, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ExternalLink, Search, X,
} from "lucide-react";

interface Product {
  id: number;
  nom: string;
  slug: string | null;
  reference: string;
  prix_unitaire: number;
  image_url: string | null;
}

const POST_TYPES = [
  { value: "promotion",  label: "🏷️ Promotion spéciale" },
  { value: "nouveaute",  label: "✨ Nouveauté" },
  { value: "top_ventes", label: "🔥 Top ventes" },
  { value: "ordinaire",  label: "📦 Produit ordinaire" },
];

export default function SocialPage() {
  const [products, setProducts]         = useState<Product[]>([]);
  const [selected, setSelected]         = useState<Product[]>([]);
  const [postType, setPostType]         = useState("promotion");
  const [status, setStatus]             = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback]         = useState("");
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadError, setLoadError]       = useState("");
  const [query, setQuery]               = useState("");
  const [showResults, setShowResults]   = useState(false);
  const searchRef                       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/products?limit=200&includeInactive=false", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setProducts(Array.isArray(d?.products) ? d.products : []))
      .catch(e => setLoadError(`Impossible de charger les produits (${e})`))
      .finally(() => setLoadingProds(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = query.trim().length === 0 ? [] : products.filter(p =>
    !selected.find(s => s.id === p.id) &&
    p.nom.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  function addProduct(p: Product) {
    if (selected.length >= 3) return;
    setSelected(prev => [...prev, p]);
    setQuery("");
    setShowResults(false);
    reset();
  }

  function removeProduct(id: number) {
    setSelected(prev => prev.filter(p => p.id !== id));
    reset();
  }

  async function handlePublish() {
    if (selected.length === 0) { setFeedback("Sélectionnez au moins un produit."); return; }
    setStatus("loading");
    setFeedback("");

    const payload = {
      type: postType,
      products: selected.map(({ nom, slug, reference, prix_unitaire, image_url }) => ({ nom, slug, reference, prix_unitaire, image_url })),
    };

    try {
      const res  = await fetch("/api/admin/social/publish", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);

      setStatus("success");
      setFeedback("Publication envoyée avec succès sur votre page Facebook !");
      setSelected([]);
    } catch (err: any) {
      setStatus("error");
      setFeedback(err?.message || "Erreur lors de l'envoi au webhook n8n.");
    }
  }

  function reset() {
    setStatus("idle");
    setFeedback("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/config" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
            <Facebook className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-800 text-2xl text-slate-900">Réseaux Sociaux</h1>
            <p className="text-slate-400 text-sm mt-0.5">Publiez sur Facebook avec Claude AI.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Type de post */}
        <div className="px-6 pt-6 pb-4">
          <label className="text-sm font-semibold text-slate-700 block mb-2">Type de publication</label>
          <div className="relative">
            <select
              value={postType}
              onChange={e => { setPostType(e.target.value); reset(); }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
            >
              {POST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Produits */}
        <div className="px-6 pb-4">
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            Produits à mettre en avant{" "}
            <span className="text-slate-400 font-normal">({selected.length}/3)</span>
          </label>

          {/* Tags des produits sélectionnés */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selected.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-xl">
                  {p.nom}
                  <button onClick={() => removeProduct(p.id)} className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Barre de recherche */}
          {loadingProds ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement des produits…
            </div>
          ) : loadError ? (
            <div className="flex items-center gap-2 text-red-500 text-sm py-4 justify-center bg-red-50 rounded-xl px-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {loadError}
            </div>
          ) : selected.length < 3 ? (
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Rechercher un produit…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {query && (
                  <button onClick={() => { setQuery(""); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown résultats */}
              {showResults && filtered.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {filtered.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors text-left"
                    >
                      <span className="font-medium text-slate-800 truncate">{p.nom}</span>
                      <span className="text-xs text-slate-400 shrink-0 ml-3 tabular-nums">
                        {Number(p.prix_unitaire).toLocaleString("fr-FR")} F
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showResults && query.trim().length > 0 && filtered.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-400">
                  Aucun résultat pour « {query} »
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Maximum 3 produits atteint. Retirez-en un pour en ajouter un autre.</p>
          )}
        </div>

        {/* Info Claude */}
        <div className="mx-6 mb-4 bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
          Claude AI génère le texte de la publication en français, puis n8n la publie automatiquement sur votre page Facebook.
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mx-6 mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}>
            {status === "success"
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle  className="w-4 h-4 shrink-0 mt-0.5" />
            }
            {feedback}
          </div>
        )}

        {/* Action */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={handlePublish}
            disabled={status === "loading" || status === "success" || selected.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {status === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Publication en cours…</>
            ) : status === "success" ? (
              <><CheckCircle2 className="w-4 h-4" /> Publié !</>
            ) : (
              <><Facebook className="w-4 h-4" /> Publier sur Facebook</>
            )}
          </button>

          <a
            href="https://www.facebook.com/profile.php?id=1110500725482756"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-600 transition-colors"
          >
            Voir la page <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* n8n link */}
      <p className="text-center text-xs text-slate-300 mt-6">
        Workflow géré par{" "}
        <a href="https://n8n.togolese.fr" target="_blank" rel="noopener noreferrer"
           className="text-slate-400 hover:text-slate-600 underline transition-colors">
          n8n.togolese.fr
        </a>
      </p>

    </div>
  );
}
