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
}

const inp = "w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
const lbl = "block text-xs font-semibold text-slate-500 mb-1.5";

function pct(achat: number, vente: number) {
  if (!achat || !vente || vente <= 0) return null;
  return Math.round(((vente - achat) / vente) * 100);
}

export default function AddProductModal({ categories }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Form fields
  const [nom,          setNom]         = useState("");
  const [categorie_id, setCategorie]   = useState<number | "">("");
  const [description,  setDescription] = useState("");
  const [prixAchat,    setPrixAchat]   = useState("");
  const [prixVente,    setPrixVente]   = useState("");
  const [remise,       setRemise]      = useState("");
  const [stockMag,     setStockMag]    = useState("");
  const [seuilMin,     setSeuilMin]    = useState("5");
  const [actif,        setActif]       = useState(true);

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

  const marge = pct(Number(prixAchat), Number(prixVente));

  // ── Upload images ──────────────────────────────────────────────────────────
  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImgs(true);
    setError("");
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("files", f));
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.[0] || data.error || "Erreur upload");
      const urls: string[] = data.urls ?? [];
      setImages(prev => [...prev, ...urls]);
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

  // ── Variant image upload ───────────────────────────────────────────────────
  async function uploadVariantImage(key: string, file: File) {
    setVariants(vs => vs.map(v => v._key === key ? { ...v, uploading: true } : v));
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
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
    setNom(""); setCategorie(""); setDescription("");
    setPrixAchat(""); setPrixVente(""); setRemise("");
    setStockMag(""); setSeuilMin("5"); setActif(true);
    setImages([]); setVariants([]); setError("");
  }, []);

  function closeModal() { setOpen(false); reset(); }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim())  { setError("Le nom est obligatoire."); return; }
    if (!prixVente)   { setError("Le prix de vente est obligatoire."); return; }
    setError(""); setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nom:           nom.trim(),
        description:   description || null,
        categorie_id:  categorie_id || null,
        prix_unitaire: Number(prixVente),
        remise:        remise ? Number(remise) : 0,
        stock_magasin: stockMag  ? Number(stockMag)  : 0,
        stock_minimum: seuilMin  ? Number(seuilMin)  : 5,
        actif,
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
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" /> Ajouter un produit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl" style={{ maxHeight: "95vh", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Ajouter un produit</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── Left — Images ── */}
                <div className="w-80 shrink-0 border-r border-slate-100 overflow-y-auto p-6 space-y-4 bg-slate-50/60">
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Images produit</p>
                    <p className="text-xs text-slate-400 mb-3">La 1ère image = image principale. Glisse pour réordonner.</p>
                  </div>

                  {/* Upload zone */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImgs}
                    className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/40 transition-all disabled:opacity-50"
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

                          {/* Drag handle */}
                          <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4 text-white drop-shadow" />
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
                <div className="flex-1 overflow-y-auto p-7 space-y-7">

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

                    <div>
                      <label className={lbl}>Catégorie</label>
                      <select value={categorie_id} onChange={e => setCategorie(e.target.value ? Number(e.target.value) : "")} className={inp}>
                        <option value="">Sélectionner…</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={lbl}>Description</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Description du produit…"
                        rows={3}
                        className={`${inp} resize-none`}
                      />
                    </div>
                  </section>

                  {/* Tarifs */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tarifs</h3>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={lbl}>Prix d&apos;achat</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input type="number" min="0" value={prixAchat} onChange={e => setPrixAchat(e.target.value)}
                            placeholder="0" className={`${inp} pl-7`} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Prix de vente *</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input type="number" min="0" value={prixVente} onChange={e => setPrixVente(e.target.value)}
                            placeholder="0" required className={`${inp} pl-7`} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Marge</label>
                        <div className="h-[42px] px-3.5 rounded-xl border border-slate-200 bg-green-50 flex flex-col justify-center">
                          <span className="text-sm font-bold text-green-700">{marge !== null ? `${marge}%` : "—"}</span>
                          <span className="text-[10px] text-green-500">Calcul auto</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Remise (%)</label>
                        <input type="number" min="0" max="99" value={remise} onChange={e => setRemise(e.target.value)}
                          placeholder="0" className={inp} />
                      </div>
                    </div>

                    {/* Variantes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={lbl + " mb-0"}>Variantes</label>
                        <button
                          type="button"
                          onClick={() => setVariants(vs => [...vs, { _key: Math.random().toString(36).slice(2), nom: "", prix: "", stock: "", imageUrl: "", uploading: false }])}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors"
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
                            <div key={v._key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
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
                                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white"
                              />
                              <input
                                type="number" min="0" value={v.prix}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, prix: e.target.value } : x))}
                                placeholder="Prix"
                                className="w-24 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white text-right"
                              />
                              <input
                                type="number" min="0" value={v.stock}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, stock: e.target.value } : x))}
                                placeholder="Qté"
                                className="w-16 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white text-right"
                              />
                              <button type="button" onClick={() => setVariants(vs => vs.filter(x => x._key !== v._key))}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
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

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={actif} onChange={e => setActif(e.target.checked)} />
                        <div className="w-10 h-6 rounded-full bg-slate-200 peer-checked:bg-green-500 transition-colors" />
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Produit actif (visible sur le site)</span>
                    </label>
                  </section>

                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-100 shrink-0 bg-white rounded-b-2xl">
                <button type="button" onClick={closeModal}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors">
                  <X className="w-4 h-4" /> Fermer
                </button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60">
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
