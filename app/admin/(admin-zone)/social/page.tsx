"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Facebook, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ExternalLink,
} from "lucide-react";

interface Product {
  id: number;
  nom: string;
  slug: string | null;
  prix_unitaire: number;
}

const POST_TYPES = [
  { value: "promotion",  label: "🏷️ Promotion spéciale" },
  { value: "nouveaute",  label: "✨ Nouveauté" },
  { value: "top_ventes", label: "🔥 Top ventes" },
  { value: "ordinaire",  label: "📦 Produit ordinaire" },
];

export default function SocialPage() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [selected, setSelected]       = useState<number[]>([]);
  const [postType, setPostType]       = useState("promotion");
  const [status, setStatus]           = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback]       = useState("");
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadError, setLoadError]       = useState("");

  useEffect(() => {
    fetch("/api/admin/products?limit=200&includeInactive=false", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setProducts(Array.isArray(d?.products) ? d.products : []))
      .catch(e => setLoadError(`Impossible de charger les produits (${e})`))
      .finally(() => setLoadingProds(false));
  }, []);

  const toggleProduct = useCallback((id: number) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  }, []);

  async function handlePublish() {
    if (selected.length === 0) { setFeedback("Sélectionnez au moins un produit."); return; }
    setStatus("loading");
    setFeedback("");

    const payload = {
      type: postType,
      products: products
        .filter(p => selected.includes(p.id))
        .map(({ nom, slug, prix_unitaire }) => ({ nom, slug, prix_unitaire })),
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
            <span className="text-slate-400 font-normal">(1 à 3)</span>
          </label>

          {loadingProds ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement des produits…
            </div>
          ) : loadError ? (
            <div className="flex items-center gap-2 text-red-500 text-sm py-6 justify-center bg-red-50 rounded-xl px-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {loadError}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-6">Aucun produit disponible.</div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {products.map(p => {
                const checked  = selected.includes(p.id);
                const disabled = !checked && selected.length >= 3;
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all select-none ${
                      checked
                        ? "border-blue-400 bg-blue-50"
                        : disabled
                        ? "border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed"
                        : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => { toggleProduct(p.id); reset(); }}
                      className="accent-blue-600 w-4 h-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.nom}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                      {Number(p.prix_unitaire).toLocaleString("fr-FR")} F
                    </span>
                  </label>
                );
              })}
            </div>
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
