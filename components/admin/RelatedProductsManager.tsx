"use client";

import { useState, useEffect } from "react";
import { Search, X, Plus, Loader2, Tag, Package, TrendingUp } from "lucide-react";
import type { Product } from "@/lib/utils";

interface RelatedProduct {
  id: number;
  produit_lié_id: number;
  type: "similaire" | "complementaire" | "upsell";
  ordre: number;
  reference: string;
  nom: string;
  prix_unitaire: number;
  remise: number;
  image_url: string | null;
  categorie_nom: string | null;
}

interface Props {
  productId: number;
}

const typeLabels = {
  similaire: { label: "Similaire", icon: Tag, color: "bg-blue-100 text-blue-800" },
  complementaire: { label: "Complémentaire", icon: Package, color: "bg-green-100 text-green-800" },
  upsell: { label: "Upsell", icon: TrendingUp, color: "bg-purple-100 text-purple-800" },
};

export default function RelatedProductsManager({ productId }: Props) {
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Charger les produits liés
  useEffect(() => {
    loadRelated();
  }, [productId]);

  async function loadRelated() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/related`);
      const data = await res.json();
      if (res.ok) {
        setRelated(data.related || []);
      } else {
        setError(data.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        // Filtrer les produits déjà liés et le produit courant
        const alreadyRelatedIds = new Set(related.map(r => r.produit_lié_id));
        setSearchResults(
          data.products.filter((p: Product) => 
            p.id !== productId && !alreadyRelatedIds.has(p.id)
          )
        );
      }
    } catch {
      setError("Erreur de recherche");
    } finally {
      setSearching(false);
    }
  }

  async function addRelated(productIdToAdd: number, type: RelatedProduct["type"] = "similaire") {
    setAdding(productIdToAdd);
    setError("");
    
    try {
      const res = await fetch(`/api/admin/products/${productId}/related`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produit_lié_id: productIdToAdd, type }),
      });
      
      const data = await res.json();
      if (res.ok) {
        await loadRelated();
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setError(data.error || "Erreur d'ajout");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setAdding(null);
    }
  }

  async function removeRelated(relationId: number) {
    setRemoving(relationId);
    setError("");
    
    try {
      const res = await fetch(`/api/admin/products/${productId}/related/${relationId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de suppression");
      } else {
        await loadRelated();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setRemoving(null);
    }
  }

  function updateType(relationId: number, newType: RelatedProduct["type"]) {
    // Note: Pour simplifier, on pourrait faire un PUT API, mais pour l'instant on recharge
    // Dans une version future, on pourrait optimiser avec un état local
    loadRelated();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Recherche de produits à ajouter */}
      <div className="bg-slate-50 rounded-2xl p-4">
        <h3 className="font-bold text-slate-700 mb-3">Ajouter un produit lié</h3>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchProducts()}
              placeholder="Rechercher un produit par nom ou référence..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>
          <button
            onClick={searchProducts}
            disabled={searching}
            className="px-4 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
          </button>
        </div>

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {product.image_url && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={product.image_url.startsWith("http") 
                          ? product.image_url 
                          : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${product.image_url}`}
                        alt={product.nom}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{product.nom}</div>
                    <div className="text-xs text-slate-500">Réf. {product.reference}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                    onChange={(e) => addRelated(product.id, e.target.value as RelatedProduct["type"])}
                    disabled={adding === product.id}
                  >
                    <option value="similaire">Similaire</option>
                    <option value="complementaire">Complémentaire</option>
                    <option value="upsell">Upsell</option>
                  </select>
                  <button
                    onClick={() => addRelated(product.id, "similaire")}
                    disabled={adding === product.id}
                    className="px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-semibold hover:bg-brand-800 disabled:opacity-50 flex items-center gap-1"
                  >
                    {adding === product.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liste des produits liés */}
      <div>
        <h3 className="font-bold text-slate-700 mb-3">
          Produits liés ({related.length})
        </h3>

        {related.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Aucun produit lié pour l'instant.
            <div className="mt-1">Utilisez la recherche ci-dessus pour en ajouter.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {related.map((rel) => {
              const TypeIcon = typeLabels[rel.type].icon;
              const typeColor = typeLabels[rel.type].color;
              
              return (
                <div key={rel.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Type badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${typeColor}`}>
                      <TypeIcon className="w-3 h-3" />
                      {typeLabels[rel.type].label}
                    </div>

                    {/* Product info */}
                    <div className="flex items-center gap-3 flex-1">
                      {rel.image_url && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={rel.image_url.startsWith("http") 
                              ? rel.image_url 
                              : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${rel.image_url}`}
                            alt={rel.nom}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rel.nom}</div>
                        <div className="text-xs text-slate-500">
                          Réf. {rel.reference} • {rel.categorie_nom || "Sans catégorie"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <select
                      value={rel.type}
                      onChange={(e) => updateType(rel.id, e.target.value as RelatedProduct["type"])}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                    >
                      <option value="similaire">Similaire</option>
                      <option value="complementaire">Complémentaire</option>
                      <option value="upsell">Upsell</option>
                    </select>
                    <button
                      onClick={() => removeRelated(rel.id)}
                      disabled={removing === rel.id}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      {removing === rel.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}