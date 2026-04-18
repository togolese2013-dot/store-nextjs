"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/utils";
import { Loader2, Save, Plus, Trash2, ImagePlus, Package } from "lucide-react";
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
  stock_magasin:  number | "";
  stock_minimum:  number | "";
  remise:         number | "";
  neuf:           boolean;
  actif:          boolean;
  image_url:      string;
  images:         string[];
}

interface PendingVariant {
  _key:         string;
  nom:          string;
  rawOptions:   string;
  prix:         number | "";
  stock:        number | "";
  reference_sku: string;
  imageUrl:     string;
  uploading:    boolean;
}

interface Props {
  categories: Category[];
  initial?:   Partial<ProductData>;
}

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";

function newVariant(): PendingVariant {
  return { _key: Math.random().toString(36).slice(2), nom: "", rawOptions: "", prix: "", stock: "", reference_sku: "", imageUrl: "", uploading: false };
}

export default function ProductForm({ categories, initial }: Props) {
  const router  = useRouter();
  const isEdit  = !!initial?.id;

  const [form, setForm] = useState<ProductData>({
    reference:     initial?.reference     ?? "",
    nom:           initial?.nom           ?? "",
    description:   initial?.description   ?? "",
    categorie_id:  initial?.categorie_id  ?? "",
    prix_unitaire: initial?.prix_unitaire ?? "",
    stock_magasin: initial?.stock_magasin ?? "",
    stock_minimum: initial?.stock_minimum ?? 5,
    remise:        initial?.remise        ?? "",
    neuf:          initial?.neuf          ?? false,
    actif:         initial?.actif         ?? true,
    image_url:     initial?.image_url     ?? "",
    images:        initial?.images        ?? [],
    ...initial,
  });

  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [schema,    setSchema]    = useState({ hasRemise: true, hasNeuf: true, hasImagesJson: true });

  // Pending variants (creation mode only — in edit mode VariantsManager handles it live)
  const [variants,   setVariants]   = useState<PendingVariant[]>([]);
  const variantRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/admin/schema/columns")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSchema({ hasRemise: d.hasRemise, hasNeuf: d.hasNeuf, hasImagesJson: d.hasImagesJson }); })
      .catch(() => {});
  }, []);

  function set(field: keyof ProductData, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
  }

  // ── Image compression ─────────────────────────────────────────────────────
  async function compressImage(file: File, maxDim = 1200, quality = 0.85): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  // ── Gallery upload ─────────────────────────────────────────────────────────
  async function handleUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const compressed = await Promise.all(Array.from(files).map(f => compressImage(f)));
      const fd = new FormData();
      compressed.forEach(f => fd.append("files", f));
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.urls) {
        const newImages = [...form.images, ...data.urls];
        set("images", newImages);
        if (!form.image_url && data.urls[0]) set("image_url", data.urls[0]);
      } else {
        setError(data.error || "Erreur lors de l'upload");
      }
    } catch { setError("Erreur réseau"); }
    finally   { setUploading(false); e.target.value = ""; }
  }

  // ── Variant helpers ────────────────────────────────────────────────────────
  function updateVariant(key: string, patch: Partial<PendingVariant>) {
    setVariants(vs => vs.map(v => v._key === key ? { ...v, ...patch } : v));
  }

  async function uploadVariantImage(key: string, file: File) {
    updateVariant(key, { uploading: true });
    const fd = new FormData();
    fd.append("files", file);
    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) updateVariant(key, { imageUrl: data.urls[0], uploading: false });
      else updateVariant(key, { uploading: false });
    } catch { updateVariant(key, { uploading: false }); }
  }

  function parseOptions(raw: string): Record<string, string> {
    const r: Record<string, string> = {};
    raw.split(",").forEach(p => {
      const [k, ...rest] = p.split("=");
      if (k?.trim() && rest.length) r[k.trim()] = rest.join("=").trim();
    });
    return r;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false); setLoading(true);

    try {
      const url    = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        reference:     form.reference,
        nom:           form.nom,
        description:   form.description,
        categorie_id:  form.categorie_id || null,
        prix_unitaire: form.prix_unitaire,
        stock_magasin: form.stock_magasin !== "" ? Number(form.stock_magasin) : 0,
        stock_minimum: form.stock_minimum !== "" ? form.stock_minimum : 5,
        actif:         form.actif,
        image_url:     form.image_url,
      };
      if (schema.hasRemise)    payload.remise = form.remise;
      if (schema.hasNeuf)      payload.neuf   = form.neuf;
      if (schema.hasImagesJson && form.images.length > 0) payload.images = form.images;

      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }

      // Save pending variants after product creation
      if (!isEdit && data.id && variants.length > 0) {
        await Promise.all(variants.map(v => {
          const opts = parseOptions(v.rawOptions);
          if (v.imageUrl) opts["image_url"] = v.imageUrl;
          return fetch(`/api/admin/products/${data.id}/variants`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ nom: v.nom || Object.values(opts).join(" · ") || "Variante", options: opts, prix: Number(v.prix) || 0, stock: Number(v.stock) || 0, reference_sku: v.reference_sku || null }),
          });
        }));
      }

      setSuccess(true);
      if (!isEdit) router.push(`/admin/products/${data.id}`);
      else         router.refresh();
    } catch { setError("Erreur réseau."); }
    finally   { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          Produit {isEdit ? "mis à jour" : "créé"} avec succès !
        </div>
      )}

      {/* ── Informations générales ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">Informations générales</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nom du produit *</label>
            <input type="text" value={form.nom} onChange={e => set("nom", e.target.value)}
              placeholder="Ex: Casque Audio Premium" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Référence (slug) *</label>
            <input type="text" value={form.reference}
              onChange={e => set("reference", e.target.value.replace(/\s+/g, "-").toLowerCase())}
              placeholder="casque-audio-premium" required className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Catégorie</label>
          <select value={form.categorie_id} onChange={e => set("categorie_id", e.target.value ? Number(e.target.value) : "")}
            className={inputCls}>
            <option value="">— Sans catégorie —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Description du produit…" rows={3}
            className={clsx(inputCls, "resize-none")} />
        </div>
      </div>

      {/* ── Prix & stock ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">Prix & stock</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Prix (FCFA) *</label>
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
            <label className={labelCls}>Stock magasin</label>
            <input type="number" min="0" value={form.stock_magasin}
              onChange={e => set("stock_magasin", e.target.value ? Number(e.target.value) : "")}
              placeholder="10" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Stock mini. (alerte)</label>
            <input type="number" min="0" value={form.stock_minimum}
              onChange={e => set("stock_minimum", e.target.value ? Number(e.target.value) : "")}
              placeholder="5" className={inputCls} />
          </div>
        </div>

        <div className="flex flex-wrap gap-5 pt-1">
          {schema.hasNeuf && (
            <Toggle checked={form.neuf} onChange={v => set("neuf", v)} label='Marquer comme "Nouveau"' color="brand" />
          )}
          <Toggle checked={form.actif} onChange={v => set("actif", v)} label="Produit actif (visible)" color="green" />
        </div>
      </div>

      {/* ── Images ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">Images produit</h2>

        {/* Upload */}
        <label className={clsx(
          "flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 cursor-pointer w-fit",
          "hover:border-brand-400 hover:text-brand-700 transition-colors",
          uploading && "opacity-60 pointer-events-none"
        )}>
          <ImagePlus className="w-4 h-4" />
          {uploading ? "Upload en cours…" : "Ajouter des photos"}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUploadImages} disabled={uploading} className="sr-only" />
        </label>

        {form.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {form.images.map((url, idx) => (
              <div key={idx} className="relative group">
                <div className={clsx(
                  "aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 transition-all",
                  idx === 0 ? "border-brand-400" : "border-transparent"
                )}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
                {idx === 0 && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-lg bg-brand-900 text-white text-[9px] font-bold">Principale</span>
                )}
                <button type="button"
                  onClick={() => {
                    const next = form.images.filter((_, i) => i !== idx);
                    set("images", next);
                    if (form.image_url === url) set("image_url", next[0] ?? "");
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                >×</button>
              </div>
            ))}
          </div>
        )}

        {form.images.length === 0 && (
          <p className="text-xs text-slate-400">Aucune image — la première image ajoutée sera l'image principale.</p>
        )}
      </div>

      {/* ── Variantes ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Variantes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Taille, couleur, modèle… — chacune avec son prix et stock</p>
          </div>
          {!isEdit && (
            <button type="button" onClick={() => setVariants(vs => [...vs, newVariant()])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          )}
        </div>

        {/* Creation mode — inline variant list */}
        {!isEdit && (
          <div className="space-y-3">
            {variants.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Pas de variantes — le produit se vend tel quel.
              </div>
            )}
            {variants.map(v => (
              <div key={v._key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {/* Photo variante */}
                  <label className="shrink-0 cursor-pointer group">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center group-hover:border-brand-400 transition-colors">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : v.uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <ImagePlus className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition-colors" />
                      )}
                    </div>
                    <input type="file" accept="image/*" className="sr-only"
                      ref={el => { variantRefs.current[v._key] = el; }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(v._key, f); e.target.value = ""; }}
                    />
                  </label>

                  {/* Champs */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2 sm:col-span-2">
                      <label className={labelCls}>Nom / options</label>
                      <input type="text" value={v.nom}
                        onChange={e => updateVariant(v._key, { nom: e.target.value })}
                        placeholder="Ex: Rouge XL  ou  Taille=XL, Couleur=Rouge"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Prix (FCFA) *</label>
                      <input type="number" min="0" value={v.prix}
                        onChange={e => updateVariant(v._key, { prix: e.target.value ? Number(e.target.value) : "" })}
                        placeholder="25000" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Quantité</label>
                      <input type="number" min="0" value={v.stock}
                        onChange={e => updateVariant(v._key, { stock: e.target.value ? Number(e.target.value) : "" })}
                        placeholder="10" className={inputCls} />
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button type="button" onClick={() => setVariants(vs => vs.filter(x => x._key !== v._key))}
                    className="shrink-0 mt-6 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {variants.length > 0 && (
              <button type="button" onClick={() => setVariants(vs => [...vs, newVariant()])}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-700 transition-colors w-full justify-center">
                <Plus className="w-4 h-4" /> Ajouter une variante
              </button>
            )}
          </div>
        )}

        {/* Edit mode — live VariantsManager */}
        {isEdit && initial?.id && <VariantsManager productId={initial.id} />}
      </div>

      {/* ── Produits recommandés ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">
          Produits recommandés <span className="text-slate-400 font-normal">"Vous aimerez aussi"</span>
        </h2>
        {isEdit && initial?.id ? (
          <RelatedProductsManager productId={initial.id} />
        ) : (
          <div className="py-6 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Package className="w-7 h-7 mx-auto mb-2 opacity-25" />
            Créez d'abord le produit pour ajouter des recommandations.<br />
            <span className="text-xs">Vous serez redirigé vers la page d'édition après la création.</span>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pb-8">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-7 py-3 rounded-xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le produit"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Toggle component ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, color }: { checked: boolean; onChange: (v: boolean) => void; label: string; color: "brand" | "green" }) {
  const trackOn = color === "green" ? "peer-checked:bg-green-500" : "peer-checked:bg-brand-900";
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={clsx("w-10 h-6 rounded-full bg-slate-200 transition-colors", trackOn)} />
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}
