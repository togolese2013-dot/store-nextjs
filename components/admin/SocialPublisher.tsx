"use client";

import { useState, useEffect } from "react";
import { X, Facebook, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

interface Product {
  id: number;
  nom: string;
  slug: string | null;
  prix_unitaire: number;
  image_principale: string | null;
}

interface Props {
  onClose: () => void;
  webhookUrl: string;
}

const POST_TYPES = [
  { value: "promotion",  label: "🏷️ Promotion spéciale" },
  { value: "nouveaute",  label: "✨ Nouveauté" },
  { value: "top_ventes", label: "🔥 Top ventes" },
];

export default function SocialPublisher({ onClose, webhookUrl }: Props) {
  const [products, setProducts]   = useState<Product[]>([]);
  const [selected, setSelected]   = useState<number[]>([]);
  const [postType, setPostType]   = useState("promotion");
  const [status, setStatus]       = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage]     = useState("");
  const [loadingProds, setLoadingProds] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "";

  useEffect(() => {
    fetch(`${API}/api/admin/products?limit=30`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data?.products) ? data.products : []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProds(false));
  }, [API]);

  function toggleProduct(id: number) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  }

  async function handlePublish() {
    if (selected.length === 0) {
      setMessage("Sélectionnez au moins un produit.");
      return;
    }
    if (!webhookUrl) {
      setMessage("URL webhook n8n non configurée dans les réglages.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const selectedProducts = products
      .filter(p => selected.includes(p.id))
      .map(({ nom, slug, prix_unitaire }) => ({ nom, slug, prix_unitaire }));

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: selectedProducts, type: postType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setStatus("success");
      setMessage("Publication envoyée avec succès sur votre page Facebook !");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Erreur lors de l'envoi au webhook n8n.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Facebook className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800">Publier sur Facebook</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Type de post */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Type de publication</label>
            <div className="relative">
              <select
                value={postType}
                onChange={e => setPostType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
              >
                {POST_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sélection produits */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Produits à mettre en avant{" "}
              <span className="text-slate-400 font-normal">(1 à 3)</span>
            </label>

            {loadingProds ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {products.map(p => {
                  const checked = selected.includes(p.id);
                  const disabled = !checked && selected.length >= 3;
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${
                        checked
                          ? "border-blue-400 bg-blue-50"
                          : disabled
                          ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleProduct(p.id)}
                        className="accent-blue-600 w-4 h-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.nom}</p>
                        <p className="text-xs text-slate-400">{Number(p.prix_unitaire).toLocaleString("fr-FR")} FCFA</p>
                      </div>
                    </label>
                  );
                })}
                {products.length === 0 && (
                  <p className="text-slate-400 text-sm py-2">Aucun produit disponible.</p>
                )}
              </div>
            )}
          </div>

          {/* Claude notice */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
            Claude AI va générer automatiquement le texte de la publication en français, puis n8n la publiera sur votre page Facebook.
          </div>

          {/* Feedback */}
          {message && (
            <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
              status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : status === "error"
                ? "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-700"
            }`}>
              {status === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handlePublish}
            disabled={status === "loading" || status === "success"}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {status === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Publication…</>
            ) : status === "success" ? (
              <><CheckCircle2 className="w-4 h-4" /> Publié !</>
            ) : (
              <><Facebook className="w-4 h-4" /> Publier</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
