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
  onSuccess?: () => void;
}

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";

function newVariant(): PendingVariant {
  return { _key: Math.random().toString(36).slice(2), nom: "", rawOptions: "", prix: "", stock: "", reference_sku: "", imageUrl: "", uploading: false };
}

export default function ProductForm({ categories, initial, onSuccess }: Props) {
  const router  = useRouter();
  const isEdit  = !!initial?.id;

  const initialImages = initial?.images?.length
    ? initial.images
    : initial?.image_url ? [initial.image_url] : [];

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
    ...initial,
    images:        initialImages,
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

  // ── Base64 helper ──────────────────────────────────────────────────────────
  function toBase64(file: File): Promise<{ data: string; type: string }> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve({ data: r.result as string, type: file.type });
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // ── Gallery upload ─────────────────────────────────────────────────────────
  async function handleUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const compressed = await Promise.all(Array.from(files).map(f => compressImage(f)));
      const b64Files   = await Promise.all(compressed.map(toBase64));
      const res  = await fetch("/api/admin/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ files: b64Files }),
      });
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
    try {
      const b64 = await toBase64(file);
      const res  = await fetch("/api/admin/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ files: [b64] }),
      });
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
      const method = isEdit ? "PATCH" : "POST";

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
      if (form.images.length > 0) payload.images = form.images;

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
      if (onSuccess) { onSuccess(); return; }
      if (!isEdit) router.push(`/admin/products/${data.id}`);
      else         router.refresh();
    } catch { setError("Erreur réseau."); }
    finally   { setLoading(false); }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">
          {isEdit ? "Modifier le produit" : "Nouveau produit"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row min-h-0">

          {/* ── Left — Images ── */}
          <div className="w-full lg:w-72 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 p-5 space-y-3 bg-slate-50/60">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Images produit</p>
            <p className="text-xs text-slate-400 mb-3">La 1ère image = image principale.</p>

            <label className={clsx(
              "flex flex-col items-center gap-2 py-7 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400 cursor-pointer",
              "hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/40 transition-all",
              uploading && "opacity-60 pointer-events-none"
            )}>
              {uploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <ImagePlus className="w-7 h-7" />}
              <span className="text-sm font-semibold">{uploading ? "Upload…" : "Ajouter des images"}</span>
              <span className="text-xs">JPG, PNG, WebP</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUploadImages} disabled={uploading} className="sr-only" />
            </label>

            {form.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 border-transparent hover:border-brand-300 transition-all">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-brand-900 text-white text-[9px] font-bold leading-none">Principal</span>
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
              <p className="text-xs text-slate-400 text-center">Aucune image</p>
            )}
          </div>

          {/* ── Right — Form fields ── */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                Produit {isEdit ? "mis à jour" : "créé"} avec succès !
              </div>
            )}

            {/* Informations générales */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Informations générales</h3>

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
                <label className={labelCls}>Catégorie *</label>
                <select value={form.categorie_id} onChange={e => set("categorie_id", e.target.value ? Number(e.target.value) : "")}
                  className={inputCls} required>
                  <option value="">Sélectionner une catégorie…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls + " mb-0"}>Mini description (site vitrine) *</label>
                  <span className={`text-xs font-semibold ${form.description.length > 160 ? "text-red-500" : "text-slate-400"}`}>
                    {form.description.length}/160
                  </span>
                </div>
                <textarea value={form.description}
                  onChange={e => set("description", e.target.value.slice(0, 160))}
                  placeholder="Description courte affichée sur le site (160 caractères max)…"
                  rows={3} maxLength={160} required
                  className={clsx(inputCls, "resize-none")} />
              </div>
            </section>

            {/* Tarifs */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tarifs</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Prix (FCFA) *</label>
                  <input type="number" min="0" value={form.prix_unitaire}
                    onChange={e => set("prix_unitaire", e.target.value ? Number(e.target.value) : "")}
                    placeholder="25000" required className={inputCls} />
                </div>
                {schema.hasRemise && (
                  <div>
                    <label className={labelCls}>Remise (FCFA)</label>
                    <input type="number" min="0" value={form.remise}
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
                  <label className={labelCls}>Seuil minimum</label>
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
            </section>

            {/* Variantes */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Variantes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Taille, couleur, modèle…</p>
                </div>
                {!isEdit && (
                  <button type="button" onClick={() => setVariants(vs => [...vs, newVariant()])}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:border-brand-400 hover:text-brand-600 transition-colors">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                )}
              </div>

              {!isEdit && (
                <div className="space-y-2">
                  {variants.length === 0 && (
                    <div className="px-4 py-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      Aucune variante configurée
                    </div>
                  )}
                  {variants.map(v => (
                    <div key={v._key} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="shrink-0 cursor-pointer">
                          <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center hover:border-brand-400 transition-colors">
                            {v.imageUrl ? <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                              : v.uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                              : <ImagePlus className="w-3.5 h-3.5 text-slate-300" />}
                          </div>
                          <input type="file" accept="image/*" className="sr-only"
                            ref={el => { variantRefs.current[v._key] = el; }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(v._key, f); e.target.value = ""; }} />
                        </label>
                        <input value={v.nom}
                          onChange={e => updateVariant(v._key, { nom: e.target.value })}
                          placeholder="Ex: Rouge XL"
                          className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white" />
                        <button type="button" onClick={() => setVariants(vs => vs.filter(x => x._key !== v._key))}
                          className="shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 pl-12">
                        <input type="number" min="0" value={v.prix}
                          onChange={e => updateVariant(v._key, { prix: e.target.value ? Number(e.target.value) : "" })}
                          placeholder="Prix FCFA"
                          className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white" />
                        <input type="number" min="0" value={v.stock}
                          onChange={e => updateVariant(v._key, { stock: e.target.value ? Number(e.target.value) : "" })}
                          placeholder="Qté"
                          className="w-24 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isEdit && initial?.id && <VariantsManager productId={initial.id} />}
            </section>

          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le produit"}
          </button>
        </div>
      </form>

      {/* ── Produits recommandés (sous le formulaire) ── */}
      {isEdit && initial?.id && (
        <div className="border-t border-slate-100 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm">
            Produits recommandés <span className="text-slate-400 font-normal">"Vous aimerez aussi"</span>
          </h3>
          <RelatedProductsManager productId={initial.id} />
        </div>
      )}
    </div>
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
