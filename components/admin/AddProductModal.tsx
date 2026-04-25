"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Loader2, ImagePlus, GripVertical } from "lucide-react";
import type { Category } from "@/lib/utils";
interface PendingVariant {
  _key:       string;
  rawOptions: string;
  prix:       string;
  remise:     string;
  stock:      string;
  imageUrl:   string;
  uploading:  boolean;
}

interface Props {
  categories: Category[];
  marques:    { id: number; nom: string }[];
}

const inp = "w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all";
const lbl = "block text-xs font-semibold text-slate-500 mb-1.5";

function parseVariantOptions(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  raw.split(",").forEach(pair => {
    const [k, ...rest] = pair.split("=");
    if (k?.trim() && rest.length) result[k.trim()] = rest.join("=").trim();
  });
  return result;
}
function autoVariantNom(opts: Record<string, string>): string {
  return Object.values(opts).filter(Boolean).join(" · ");
}


export default function AddProductModal({ categories, marques }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Form fields
  const [nom,          setNom]         = useState("");
  const [categorie_id, setCategorie]   = useState<number | "">("");
  const [marque_id,    setMarque]      = useState<number | "">("");
  const [description,        setDescription]       = useState("");
  const [descriptionLongue, setDescriptionLongue] = useState("");
  const [prixAchat,    setPrixAchat]   = useState("");
  const [prixVente,    setPrixVente]   = useState("");
  const [remise,       setRemise]      = useState("");
  const [stockMag,     setStockMag]    = useState("");
  const [seuilMin,     setSeuilMin]    = useState("5");
  const [actif,        setActif]       = useState(true);
  const [neuf,         setNeuf]        = useState(false);

  // Images — main (single) + secondary (multiple)
  const [mainImage,       setMainImage]       = useState("");
  const [secondImages,    setSecondImages]    = useState<string[]>([]);
  const [uploadingMain,   setUploadingMain]   = useState(false);
  const [uploadingSecond, setUploadingSecond] = useState(false);
  const mainInputRef   = useRef<HTMLInputElement>(null);
  const secondInputRef = useRef<HTMLInputElement>(null);

  // Drag-to-reorder state (secondary images)
  const dragIdx = useRef<number | null>(null);

  // Variants
  const [variants, setVariants] = useState<PendingVariant[]>([]);
  const hasVariants = variants.length > 0;

  // Submit
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");


  // ── Upload helpers ─────────────────────────────────────────────────────────
  async function toBase64(file: File): Promise<{ data: string; type: string }> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve({ data: r.result as string, type: file.type });
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function uploadFiles(files: File[]): Promise<string[]> {
    const b64Files = await Promise.all(files.map(toBase64));
    const res  = await fetch("/api/admin/upload", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ files: b64Files }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0] || data.error || "Erreur upload");
    const validUrls = (data.urls ?? []).filter((u: unknown) => typeof u === "string" && (u as string).trim() !== "");
    if (!validUrls.length) throw new Error(data.errors?.[0] || "Échec de l'upload — vérifiez la taille ou le format des images");
    return validUrls;
  }

  async function handleMainImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true); setError("");
    try {
      const urls = await uploadFiles([file]);
      if (urls[0]) setMainImage(urls[0]);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur upload"); }
    finally { setUploadingMain(false); e.target.value = ""; }
  }

  async function handleSecondaryImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingSecond(true); setError("");
    try {
      const urls = await uploadFiles(files);
      setSecondImages(prev => [...prev, ...urls]);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur upload"); }
    finally { setUploadingSecond(false); e.target.value = ""; }
  }

  // ── Drag-to-reorder (secondary images) ────────────────────────────────────
  function onDragStart(idx: number) { dragIdx.current = idx; }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    setSecondImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(idx, 0, item);
      dragIdx.current = idx;
      return arr;
    });
  }

  function onDragEnd() { dragIdx.current = null; }

  function moveSecondary(from: number, to: number) {
    if (to < 0 || to >= secondImages.length) return;
    setSecondImages(prev => {
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
    setNom(""); setCategorie(""); setMarque(""); setDescription(""); setDescriptionLongue("");
    setPrixAchat(""); setPrixVente(""); setRemise("");
    setStockMag(""); setSeuilMin("5"); setActif(true); setNeuf(false);
    setMainImage(""); setSecondImages([]); setVariants([]); setError("");
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
      // Ensure images_json column exists before inserting (invalidates backend cache)
      await fetch("/api/admin/schema/migrate", { method: "POST" }).catch(() => {});

      const payload: Record<string, unknown> = {
        nom:                nom.trim(),
        description:        description || null,
        description_longue: descriptionLongue.trim() || null,
        categorie_id:       categorie_id || null,
        marque_id:     marque_id    || null,
        prix_unitaire: Number(prixVente),
        remise:        remise ? Number(remise) : 0,
        stock_magasin: stockMag  ? Number(stockMag)  : 0,
        stock_minimum: seuilMin  ? Number(seuilMin)  : 5,
        actif,
        neuf,
        image_url:     mainImage || null,
        images:        secondImages.length > 0 ? secondImages : undefined,
      };

      console.log("[DEBUG AddProduct] secondImages:", secondImages, "payload.images:", payload.images);
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
          const opts = parseVariantOptions(v.rawOptions);
          return fetch(`/api/admin/products/${data.id}/variants`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              nom:          autoVariantNom(opts) || "Variante",
              options:      opts,
              prix:         Number(v.prix)   || 0,
              remise:       Number(v.remise) || 0,
              stock:        Number(v.stock)  || 0,
              reference_sku: null,
              image_url:    v.imageUrl || null,
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl w-full sm:max-w-6xl" style={{ maxHeight: "96dvh", display: "flex", flexDirection: "column" }}>

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
                <div className="w-full lg:w-72 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-4 space-y-4 bg-slate-50/60 max-h-64 lg:max-h-none">

                  {/* Photo principale */}
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Photo principale</p>
                    <button
                      type="button"
                      onClick={() => mainInputRef.current?.click()}
                      disabled={uploadingMain}
                      className="w-full relative aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden hover:border-brand-400 transition-all disabled:opacity-50"
                    >
                      {mainImage ? (
                        <img src={mainImage} alt="" className="w-full h-full object-contain p-1" />
                      ) : uploadingMain ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-xs">Upload…</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-600">
                          <ImagePlus className="w-7 h-7" />
                          <span className="text-xs font-semibold">Choisir une photo</span>
                        </div>
                      )}
                    </button>
                    {mainImage && (
                      <button type="button" onClick={() => setMainImage("")}
                        className="mt-1.5 w-full text-xs text-red-500 hover:text-red-600 font-semibold text-center">
                        Supprimer
                      </button>
                    )}
                    <input ref={mainInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handleMainImage} className="sr-only" />
                  </div>

                  {/* Photos secondaires */}
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Photos secondaires</p>
                    <button
                      type="button"
                      onClick={() => secondInputRef.current?.click()}
                      disabled={uploadingSecond}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400 hover:border-brand-400 hover:text-brand-600 transition-all disabled:opacity-50 text-xs font-semibold"
                    >
                      {uploadingSecond ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {uploadingSecond ? "Upload…" : "Ajouter des photos"}
                    </button>
                    <input ref={secondInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
                      onChange={handleSecondaryImages} className="sr-only" />

                    {secondImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {secondImages.map((url, idx) => (
                          <div
                            key={url + idx}
                            draggable
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={e => onDragOver(e, idx)}
                            onDragEnd={onDragEnd}
                            className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-transparent hover:border-blue-300 cursor-grab transition-all"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                              {idx > 0 && (
                                <button type="button" onClick={() => moveSecondary(idx, idx - 1)}
                                  className="w-4 h-4 rounded bg-black/60 text-white text-[10px] flex items-center justify-center">‹</button>
                              )}
                              {idx < secondImages.length - 1 && (
                                <button type="button" onClick={() => moveSecondary(idx, idx + 1)}
                                  className="w-4 h-4 rounded bg-black/60 text-white text-[10px] flex items-center justify-center">›</button>
                              )}
                            </div>
                            <button type="button"
                              onClick={() => setSecondImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center hover:bg-red-600">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {secondImages.length > 0 && (
                      <p className="text-[10px] text-center text-slate-400 mt-1">{secondImages.length} photo{secondImages.length > 1 ? "s" : ""} · glisse pour réordonner</p>
                    )}
                  </div>

                  {/* hidden — drag handle icon kept for legacy import */}
                  <span className="hidden"><GripVertical /></span>
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
                        <label className={lbl + " mb-0"}>Mini description (carte produit) *</label>
                        <span className={`text-xs font-semibold ${description.length > 250 ? "text-red-500" : "text-slate-400"}`}>
                          {description.length}/250
                        </span>
                      </div>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value.slice(0, 250))}
                        placeholder="Description courte affichée sur les cartes produit (250 car. max)…"
                        rows={3}
                        maxLength={250}
                        required
                        className={`${inp} resize-none`}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Description complète (page produit)</label>
                      <textarea
                        value={descriptionLongue}
                        onChange={e => setDescriptionLongue(e.target.value)}
                        placeholder="Description détaillée : caractéristiques, matériaux, dimensions, utilisation…"
                        rows={5}
                        className={`${inp} resize-y`}
                      />
                    </div>
                  </section>

                  {/* Tarifs */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tarifs</h3>

                    {hasVariants ? (
                      <div className="px-4 py-3 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-700 font-semibold">
                        Prix, remise et stock gérés individuellement par variante
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </section>

                  {/* Stock */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Stock</h3>

                    {hasVariants ? (
                      <div className="px-4 py-3 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-700 font-semibold">
                        Stock géré individuellement par variante
                      </div>
                    ) : (
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
                    )}

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

                  {/* Variantes */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Variantes</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Taille, couleur… (optionnel)</p>
                      </div>
                      <button type="button"
                        onClick={() => setVariants(vs => [...vs, { _key: Math.random().toString(36).slice(2), rawOptions: "", prix: "", remise: "", stock: "", imageUrl: "", uploading: false }])}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:border-brand-400 hover:text-brand-600 transition-colors">
                        <Plus className="w-3 h-3" /> Ajouter
                      </button>
                    </div>

                    {variants.length === 0 ? (
                      <div className="px-4 py-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Aucune variante — prix et stock globaux utilisés
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(v._key, f); e.target.value = ""; }} />
                              </label>
                              <input value={v.rawOptions}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, rawOptions: e.target.value } : x))}
                                placeholder="Taille=XL, Couleur=Noir"
                                className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white" />
                              <button type="button" onClick={() => setVariants(vs => vs.filter(x => x._key !== v._key))}
                                className="shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pl-12">
                              <input type="number" min="0" value={v.prix}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, prix: e.target.value } : x))}
                                placeholder="Prix FCFA"
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white w-full" />
                              <input type="number" min="0" value={v.remise}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, remise: e.target.value } : x))}
                                placeholder="Remise FCFA"
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white w-full" />
                              <input type="number" min="0" value={v.stock}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, stock: e.target.value } : x))}
                                placeholder="Stock"
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-4 sm:px-7 py-3 sm:py-4 border-t border-slate-100 shrink-0 bg-white rounded-b-2xl">
                <button type="button" onClick={closeModal}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors">
                  <X className="w-4 h-4" /> Fermer
                </button>
                <button type="submit" disabled={loading || uploadingMain || uploadingSecond}
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
