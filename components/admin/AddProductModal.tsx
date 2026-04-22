"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Loader2, ImagePlus, GripVertical } from "lucide-react";
import type { Category } from "@/lib/utils";
interface PendingVariant {
  _key:      string;
  nom:       string;
  prix:      string;
  stock:     string;
  imageUrl:  string;
  uploading: boolean;
}

interface Props {
  categories: Category[];
  marques:    { id: number; nom: string }[];
}

const inp = "w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all";
const lbl = "block text-xs font-semibold text-slate-500 mb-1.5";


export default function AddProductModal({ categories, marques }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Form fields
  const [nom,          setNom]         = useState("");
  const [categorie_id, setCategorie]   = useState<number | "">("");
  const [marque_id,    setMarque]      = useState<number | "">("");
  const [description,  setDescription] = useState("");
  const [prixAchat,    setPrixAchat]   = useState("");
  const [prixVente,    setPrixVente]   = useState("");
  const [remise,       setRemise]      = useState("");
  const [stockMag,     setStockMag]    = useState("");
  const [seuilMin,     setSeuilMin]    = useState("5");
  const [actif,        setActif]       = useState(true);
  const [neuf,         setNeuf]        = useState(false);

  // Images — ordered array, index 0 = principale
  const [images,        setImages]        = useState<string[]>([]);
  const [uploadingImgs, setUploadingImgs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-to-reorder state
  const dragIdx = useRef<number | null>(null);

  // Variants
  const [variants, setVariants] = useState<PendingVariant[]>([]);

  // Submit
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");


  // ── Upload images ──────────────────────────────────────────────────────────
  async function toBase64(file: File): Promise<{ data: string; type: string }> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve({ data: r.result as string, type: file.type });
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImgs(true);
    setError("");
    try {
      const b64Files = await Promise.all(files.map(toBase64));
      const res  = await fetch("/api/admin/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ files: b64Files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.[0] || data.error || "Erreur upload");
      setImages(prev => [...prev, ...(data.urls ?? [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploadingImgs(false);
      e.target.value = "";
    }
  }

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  function onDragStart(idx: number) { dragIdx.current = idx; }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    setImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(idx, 0, item);
      dragIdx.current = idx;
      return arr;
    });
  }

  function onDragEnd() { dragIdx.current = null; }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  // ── Variant image upload ───────────────────────────────────────────────────
  async function uploadVariantImage(key: string, file: File) {
    setVariants(vs => vs.map(v => v._key === key ? { ...v, uploading: true } : v));
    try {
      const b64 = await toBase64(file);
      const res  = await fetch("/api/admin/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ files: [b64] }),
      });
      const data = await res.json();
      if (res.ok && data.urls?.[0])
        setVariants(vs => vs.map(v => v._key === key ? { ...v, imageUrl: data.urls[0], uploading: false } : v));
      else
        setVariants(vs => vs.map(v => v._key === key ? { ...v, uploading: false } : v));
    } catch {
      setVariants(vs => vs.map(v => v._key === key ? { ...v, uploading: false } : v));
    }
  }

  // ── Reset & close ──────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setNom(""); setCategorie(""); setMarque(""); setDescription("");
    setPrixAchat(""); setPrixVente(""); setRemise("");
    setStockMag(""); setSeuilMin("5"); setActif(true); setNeuf(false);
    setImages([]); setVariants([]); setError("");
  }, []);

  function closeModal() { setOpen(false); reset(); }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim())           { setError("Le nom est obligatoire."); return; }
    if (!categorie_id)         { setError("La catégorie est obligatoire."); return; }
    if (!description.trim())   { setError("La mini description est obligatoire."); return; }
    if (!prixVente)            { setError("Le prix de vente est obligatoire."); return; }
    setError(""); setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nom:           nom.trim(),
        description:   description || null,
        categorie_id:  categorie_id || null,
        marque_id:     marque_id    || null,
        prix_unitaire: Number(prixVente),
        remise:        remise ? Number(remise) : 0,
        stock_magasin: stockMag  ? Number(stockMag)  : 0,
        stock_minimum: seuilMin  ? Number(seuilMin)  : 5,
        actif,
        neuf,
        image_url:     images[0] ?? null,
        images:        images.length > 0 ? images : undefined,
      };

      const res  = await fetch("/api/admin/products", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors de la création"); return; }

      // Save variants
      if (data.id && variants.length > 0) {
        await Promise.all(variants.map(v => {
          const opts: Record<string, string> = {};
          if (v.imageUrl) opts.image_url = v.imageUrl;
          return fetch(`/api/admin/products/${data.id}/variants`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              nom:   v.nom || "Variante",
              options: opts,
              prix:  Number(v.prix)  || 0,
              stock: Number(v.stock) || 0,
              reference_sku: null,
            }),
          });
        }));
      }

      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
      >
        Ajouter un produit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl" style={{ maxHeight: "96vh", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-7 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Ajouter un produit</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

                {/* ── Left — Images ── */}
                <div className="w-full lg:w-72 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-4 space-y-3 bg-slate-50/60 max-h-56 lg:max-h-none">
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Images produit</p>
                    <p className="text-xs text-slate-400 mb-3">La 1ère image = image principale. Glisse pour réordonner.</p>
                  </div>

                  {/* Upload zone */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImgs}
                    className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/40 transition-all disabled:opacity-50"
                  >
                    {uploadingImgs
                      ? <Loader2 className="w-7 h-7 animate-spin" />
                      : <ImagePlus className="w-7 h-7" />
                    }
                    <span className="text-sm font-semibold">
                      {uploadingImgs ? "Upload en cours…" : "Ajouter des images"}
                    </span>
                    <span className="text-xs">JPG, PNG, WebP — plusieurs à la fois</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageFiles}
                    className="sr-only"
                  />

                  {/* Image grid with drag-to-reorder */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((url, idx) => (
                        <div
                          key={url + idx}
                          draggable
                          onDragStart={() => onDragStart(idx)}
                          onDragOver={e => onDragOver(e, idx)}
                          onDragEnd={onDragEnd}
                          className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 border-transparent hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />

                          {/* Badge principale */}
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold leading-none">
                              Principal
                            </span>
                          )}

                          {/* Drag handle — desktop only */}
                          <div className="absolute bottom-1.5 left-1.5 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4 text-white drop-shadow" />
                          </div>

                          {/* Move buttons — always visible */}
                          <div className="absolute bottom-1.5 right-1.5 flex gap-0.5">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, idx - 1)}
                                className="w-5 h-5 rounded bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                                title="Déplacer à gauche"
                              >‹</button>
                            )}
                            {idx < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, idx + 1)}
                                className="w-5 h-5 rounded bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                                title="Déplacer à droite"
                              >›</button>
                            )}
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center hover:bg-red-600 shadow-sm transition-colors"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length > 1 && (
                    <p className="text-xs text-center text-slate-400">
                      {images.length} images · glisse pour changer l&apos;ordre
                    </p>
                  )}
                </div>

                {/* ── Right — Form ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>
                  )}

                  {/* Informations générales */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Informations générales</h3>

                    <div>
                      <label className={lbl}>Nom du produit *</label>
                      <input
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        placeholder="Ex: Casque Audio Premium"
                        required
                        className={inp}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Catégorie *</label>
                        <select value={categorie_id} onChange={e => setCategorie(e.target.value ? Number(e.target.value) : "")} className={inp} required>
                          <option value="">Sélectionner une catégorie…</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Marque</label>
                        <select value={marque_id} onChange={e => setMarque(e.target.value ? Number(e.target.value) : "")} className={inp}>
                          <option value="">— Aucune —</option>
                          {marques.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={lbl + " mb-0"}>Mini description (site vitrine) *</label>
                        <span className={`text-xs font-semibold ${description.length > 160 ? "text-red-500" : "text-slate-400"}`}>
                          {description.length}/160
                        </span>
                      </div>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value.slice(0, 160))}
                        placeholder="Description courte affichée sur le site (160 caractères max)…"
                        rows={3}
                        maxLength={160}
                        required
                        className={`${inp} resize-none`}
                      />
                    </div>
                  </section>

                  {/* Tarifs */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tarifs</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Prix d&apos;achat (FCFA)</label>
                        <input type="number" min="0" value={prixAchat} onChange={e => setPrixAchat(e.target.value)}
                          placeholder="0" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Prix de vente (FCFA) *</label>
                        <input type="number" min="0" value={prixVente} onChange={e => setPrixVente(e.target.value)}
                          placeholder="0" required className={inp} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Remise (FCFA)</label>
                        <input type="number" min="0" value={remise} onChange={e => setRemise(e.target.value)}
                          placeholder="0" className={inp} />
                        {remise && Number(prixVente) > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            Prix final : {(Number(prixVente) - Number(remise)).toLocaleString("fr-FR")} FCFA
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Variantes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={lbl + " mb-0"}>Variantes</label>
                        <button
                          type="button"
                          onClick={() => setVariants(vs => [...vs, { _key: Math.random().toString(36).slice(2), nom: "", prix: "", stock: "", imageUrl: "", uploading: false }])}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:border-brand-400 hover:text-brand-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Ajouter
                        </button>
                      </div>

                      {variants.length === 0 ? (
                        <div className="px-4 py-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          Aucune variante configurée
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {variants.map(v => (
                            <div key={v._key} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                              {/* Row 1: image + nom + delete */}
                              <div className="flex items-center gap-2">
                                <label className="shrink-0 cursor-pointer">
                                  <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center hover:border-blue-400 transition-colors">
                                    {v.imageUrl ? (
                                      <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : v.uploading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                    ) : (
                                      <ImagePlus className="w-3.5 h-3.5 text-slate-300" />
                                    )}
                                  </div>
                                  <input type="file" accept="image/*" className="sr-only"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(v._key, f); e.target.value = ""; }} />
                                </label>
                                <input
                                  value={v.nom}
                                  onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, nom: e.target.value } : x))}
                                  placeholder="Ex: Rouge XL"
                                  className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white"
                                />
                                <button type="button" onClick={() => setVariants(vs => vs.filter(x => x._key !== v._key))}
                                  className="shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              {/* Row 2: prix + stock */}
                              <div className="flex gap-2 pl-12">
                                <input
                                  type="number" min="0" value={v.prix}
                                  onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, prix: e.target.value } : x))}
                                  placeholder="Prix FCFA"
                                  className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white"
                                />
                                <input
                                  type="number" min="0" value={v.stock}
                                  onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, stock: e.target.value } : x))}
                                  placeholder="Qté"
                                  className="w-24 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Stock */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Stock</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Stock Magasin</label>
                        <input type="number" min="0" value={stockMag} onChange={e => setStockMag(e.target.value)}
                          placeholder="0" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Seuil minimum (alerte)</label>
                        <input type="number" min="0" value={seuilMin} onChange={e => setSeuilMin(e.target.value)}
                          placeholder="5" className={inp} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" checked={actif} onChange={e => setActif(e.target.checked)} />
                          <div className="w-10 h-6 rounded-full bg-slate-200 peer-checked:bg-green-500 transition-colors" />
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Produit actif (visible sur le site)</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" checked={neuf} onChange={e => setNeuf(e.target.checked)} />
                          <div className="w-10 h-6 rounded-full bg-slate-200 peer-checked:bg-blue-500 transition-colors" />
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Marquer nouveau</span>
                      </label>
                    </div>
                  </section>

                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-4 sm:px-7 py-3 sm:py-4 border-t border-slate-100 shrink-0 bg-white rounded-b-2xl">
                <button type="button" onClick={closeModal}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors">
                  <X className="w-4 h-4" /> Fermer
                </button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {loading ? "Création…" : "Créer le produit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
