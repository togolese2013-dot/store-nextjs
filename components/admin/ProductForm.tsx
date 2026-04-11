"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";
import { clsx } from "clsx";
import RelatedProductsManager from "./RelatedProductsManager";
import VariantsManager from "./VariantsManager";

interface ProductData {
  id?:            number;
  reference:      string;
  nom:            string;
  description:    string;
  categorie_id:   number | "";
  prix_unitaire:  number | "";
  stock_boutique: number | "";
  remise:         number | "";
  neuf:           boolean;
  actif:          boolean;
  image_url:      string;
  images:         string[]; // Gallery images
}

interface Props {
  categories: Category[];
  initial?:   Partial<ProductData>;
}

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";
const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";

export default function ProductForm({ categories, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<ProductData>({
    reference:      initial?.reference      ?? "",
    nom:            initial?.nom            ?? "",
    description:    initial?.description    ?? "",
    categorie_id:   initial?.categorie_id   ?? "",
    prix_unitaire:  initial?.prix_unitaire   ?? "",
    stock_boutique: initial?.stock_boutique  ?? "",
    remise:         initial?.remise          ?? "",
    neuf:           initial?.neuf            ?? false,
    actif:          initial?.actif           ?? true,
    image_url:      initial?.image_url       ?? "",
    images:         initial?.images          ?? [],
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [schema, setSchema] = useState<{
    hasRemise: boolean;
    hasNeuf: boolean;
    hasImagesJson: boolean;
  }>({ hasRemise: true, hasNeuf: true, hasImagesJson: true });

  // Charger le schéma de la base de données
  useEffect(() => {
    async function loadSchema() {
      try {
        const res = await fetch("/api/admin/schema/columns");
        if (res.ok) {
          const data = await res.json();
          setSchema({
            hasRemise: data.hasRemise,
            hasNeuf: data.hasNeuf,
            hasImagesJson: data.hasImagesJson,
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement du schéma:", error);
      }
    }
    loadSchema();
  }, []);

  function set(field: keyof ProductData, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append("files", f));
    
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.urls) {
        set("images", [...form.images, ...data.urls]);
      } else {
        setError(data.error || "Erreur lors de l'upload");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    set("images", form.images.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false); setLoading(true);

    try {
      const url    = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      
      // Filtrer les champs selon le schéma de la base de données
      const dataToSend: any = {
        reference: form.reference,
        nom: form.nom,
        description: form.description,
        categorie_id: form.categorie_id || null,
        prix_unitaire: form.prix_unitaire,
        stock_boutique: form.stock_boutique,
        actif: form.actif,
        image_url: form.image_url,
      };

      if (schema.hasRemise) {
        dataToSend.remise = form.remise;
      }
      if (schema.hasNeuf) {
        dataToSend.neuf = form.neuf;
      }
      if (schema.hasImagesJson && form.images.length > 0) {
        dataToSend.images = form.images;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setSuccess(true);
      if (!isEdit) router.push("/admin/products");
      else         router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm">
          Produit {isEdit ? "mis à jour" : "créé"} avec succès !
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-5">
        <h2 className="font-display font-700 text-slate-900 text-base border-b border-slate-100 pb-3">Informations générales</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nom du produit *</label>
            <input type="text" value={form.nom} onChange={e => set("nom", e.target.value)}
              placeholder="Ex: Casque Audio Premium" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Référence (slug) *</label>
            <input type="text" value={form.reference} onChange={e => set("reference", e.target.value.replace(/\s+/g, "-").toLowerCase())}
              placeholder="casque-audio-premium" required className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Description du produit…" rows={4}
            className={clsx(inputCls, "resize-none")} />
        </div>

        <div>
          <label className={labelCls}>Catégorie</label>
          <select value={form.categorie_id} onChange={e => set("categorie_id", e.target.value ? Number(e.target.value) : "")}
            className={inputCls}
          >
            <option value="">— Sans catégorie —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-5">
        <h2 className="font-display font-700 text-slate-900 text-base border-b border-slate-100 pb-3">Prix & stock</h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Prix unitaire (FCFA) *</label>
            <input type="number" min="0" value={form.prix_unitaire}
              onChange={e => set("prix_unitaire", e.target.value ? Number(e.target.value) : "")}
              placeholder="25000" required className={inputCls} />
          </div>
          {schema.hasRemise && (
            <div>
              <label className={labelCls}>Remise (%)</label>
              <input type="number" min="0" max="99" value={form.remise}
                onChange={e => set("remise", e.target.value ? Number(e.target.value) : "")}
                placeholder="0" className={inputCls} />
            </div>
          )}
          <div>
            <label className={labelCls}>Stock boutique</label>
            <input type="number" min="0" value={form.stock_boutique}
              onChange={e => set("stock_boutique", e.target.value ? Number(e.target.value) : "")}
              placeholder="10" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-5">
        <h2 className="font-display font-700 text-slate-900 text-base border-b border-slate-100 pb-3">Images & options</h2>

        {/* Galerie d'images */}
        <div>
          <label className={labelCls}>Galerie d'images</label>
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-50 text-brand-900 font-semibold text-sm cursor-pointer hover:bg-brand-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {uploading ? "Upload en cours..." : "Ajouter des images"}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" 
                  onChange={handleUploadImages} disabled={uploading}
                  className="sr-only" />
              </label>
              <span className="text-xs text-slate-500">JPG, PNG, WebP, GIF (max 5 Mo par fichier)</span>
            </div>

            {/* Liste des images */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                      ×
                    </button>
                    <div className="text-xs text-center mt-1 text-slate-500">Image {idx + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image principale (compatibilité) */}
        <div>
          <label className={labelCls}>URL de l'image principale (optionnel)</label>
          <input type="text" value={form.image_url} onChange={e => set("image_url", e.target.value)}
            placeholder="https://… ou uploads/photo.jpg" className={inputCls} />
          <p className="text-xs text-slate-500 mt-1">Utilisée comme image par défaut si la galerie est vide</p>
        </div>

        <div className="flex flex-wrap gap-6">
          {schema.hasNeuf && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer"
                  checked={form.neuf} onChange={e => set("neuf", e.target.checked)} />
                <div className="w-10 h-6 rounded-full bg-slate-200 peer-checked:bg-brand-900 transition-colors" />
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Marquer comme "Nouveau"</span>
            </label>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer"
                checked={form.actif} onChange={e => set("actif", e.target.checked)} />
              <div className="w-10 h-6 rounded-full bg-slate-200 peer-checked:bg-green-500 transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Produit actif (visible sur le site)</span>
          </label>
        </div>
      </div>

      {/* Section variantes (uniquement en mode édition) */}
      {isEdit && initial?.id && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-display font-700 text-slate-900 text-base border-b border-slate-100 pb-3">
            Variantes (taille, couleur, modèle…)
          </h2>
          <VariantsManager productId={initial.id} />
        </div>
      )}

      {/* Section produits liés (uniquement en mode édition) */}
      {isEdit && initial?.id && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-display font-700 text-slate-900 text-base border-b border-slate-100 pb-3">
            Produits recommandés "Vous aimerez aussi"
          </h2>
          <RelatedProductsManager productId={initial.id} />
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le produit"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
