"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Plus, Trash2, Loader2, ImagePlus, ChevronDown, ChevronUp } from "lucide-react";
import type { Category } from "@/lib/utils";

interface PendingVariant {
  _key:    string;
  nom:     string;
  prix:    string;
  stock:   string;
  imageUrl: string;
  uploading: boolean;
}

interface Props {
  categories: Category[];
}

const inp = "w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
const lbl = "block text-xs font-semibold text-slate-500 mb-1.5";

function genRef() {
  return `PROD-${Math.floor(Math.random() * 1e8).toString().padStart(8, "0")}`;
}

function pct(achat: number, vente: number) {
  if (!achat || !vente || vente <= 0) return null;
  return Math.round(((vente - achat) / vente) * 100);
}

export default function AddProductModal({ categories }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Form state
  const [nom,          setNom]          = useState("");
  const [reference,    setReference]    = useState(genRef());
  const [categorie_id, setCategorie]    = useState<number | "">("");
  const [unite,        setUnite]        = useState("");
  const [description,  setDescription]  = useState("");
  const [prixAchat,    setPrixAchat]    = useState<string>("");
  const [prixVente,    setPrixVente]    = useState<string>("");
  const [remise,       setRemise]       = useState<string>("");
  const [stockMag,     setStockMag]     = useState<string>("");
  const [stockBout,    setStockBout]    = useState<string>("");
  const [seuilMin,     setSeuilMin]     = useState<string>("5");
  const [actif,        setActif]        = useState(true);

  // Images
  const [mainImage,       setMainImage]       = useState<string>("");
  const [secondaryImages, setSecondaryImages] = useState<string[]>([]);
  const [uploadingMain,   setUploadingMain]   = useState(false);
  const [uploadingSecond, setUploadingSecond] = useState(false);
  const [showSecondary,   setShowSecondary]   = useState(false);
  const mainInputRef   = useRef<HTMLInputElement>(null);
  const secondInputRef = useRef<HTMLInputElement>(null);

  // Variants
  const [variants, setVariants] = useState<PendingVariant[]>([]);

  // Submit
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const marge = pct(Number(prixAchat), Number(prixVente));

  // ── Upload ─────────────────────────────────────────────────────────────────
  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("files", file);
    const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || !data.urls?.[0]) throw new Error(data.errors?.[0] || "Erreur upload");
    return data.urls[0];
  }

  async function handleMainUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingMain(true);
    try { setMainImage(await uploadFile(f)); }
    catch (err) { setError(err instanceof Error ? err.message : "Erreur upload"); }
    finally { setUploadingMain(false); e.target.value = ""; }
  }

  async function handleSecondaryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingSecond(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      setSecondaryImages(prev => [...prev, ...urls]);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur upload"); }
    finally { setUploadingSecond(false); e.target.value = ""; }
  }

  async function uploadVariantImage(key: string, file: File) {
    setVariants(vs => vs.map(v => v._key === key ? { ...v, uploading: true } : v));
    try {
      const url = await uploadFile(file);
      setVariants(vs => vs.map(v => v._key === key ? { ...v, imageUrl: url, uploading: false } : v));
    } catch { setVariants(vs => vs.map(v => v._key === key ? { ...v, uploading: false } : v)); }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setNom(""); setReference(genRef()); setCategorie(""); setUnite("");
    setDescription(""); setPrixAchat(""); setPrixVente(""); setRemise("");
    setStockMag(""); setStockBout(""); setSeuilMin("5"); setActif(true);
    setMainImage(""); setSecondaryImages([]); setVariants([]); setError("");
    setShowSecondary(false);
  }, []);

  function closeModal() { setOpen(false); reset(); }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim())        { setError("Le nom est obligatoire."); return; }
    if (!reference.trim())  { setError("La référence est obligatoire."); return; }
    if (!prixVente)         { setError("Le prix de vente est obligatoire."); return; }

    setError(""); setLoading(true);

    try {
      const allImages = mainImage ? [mainImage, ...secondaryImages] : secondaryImages;

      const payload: Record<string, unknown> = {
        nom:           nom.trim(),
        reference:     reference.trim(),
        description:   description || null,
        categorie_id:  categorie_id || null,
        prix_unitaire: Number(prixVente),
        remise:        remise ? Number(remise) : 0,
        stock_magasin: stockMag  ? Number(stockMag)  : 0,
        stock_boutique: stockBout ? Number(stockBout) : 0,
        stock_minimum: seuilMin  ? Number(seuilMin)  : 5,
        actif,
        image_url:     mainImage || null,
        images:        allImages.length > 0 ? allImages : undefined,
      };

      const res  = await fetch("/api/admin/products", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors de la création"); return; }

      // Save variants if any
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
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" /> Ajouter un produit
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Ajouter un produit</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── Left panel — images ── */}
                <div className="w-72 shrink-0 border-r border-slate-100 overflow-y-auto p-5 space-y-4 bg-slate-50/50">

                  {/* Image principale */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                      <ImagePlus className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">Image principale</span>
                    </div>

                    {/* Upload zone */}
                    <div className="p-4">
                      <div
                        onClick={() => mainInputRef.current?.click()}
                        className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all overflow-hidden"
                      >
                        {mainImage ? (
                          <img src={mainImage} alt="principale" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                        ) : uploadingMain ? (
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-300 mb-2" />
                            <span className="text-sm text-slate-400 font-medium">Téléverser l&apos;image</span>
                          </>
                        )}
                      </div>
                      <input ref={mainInputRef} type="file" accept="image/*" className="sr-only" onChange={handleMainUpload} />
                    </div>

                    {/* Changer / Supprimer */}
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => mainInputRef.current?.click()}
                        className="flex-1 py-2 rounded-lg border border-blue-500 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors"
                      >
                        Changer
                      </button>
                      {mainImage && (
                        <button
                          type="button"
                          onClick={() => setMainImage("")}
                          className="flex-1 py-2 rounded-lg border border-red-300 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Images secondaires */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowSecondary(s => !s)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-slate-400" />
                        Images secondaires
                        {secondaryImages.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">{secondaryImages.length}</span>
                        )}
                      </div>
                      {showSecondary ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {showSecondary && (
                      <div className="px-4 pb-4 space-y-3">
                        {secondaryImages.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                            Aucune image secondaire
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {secondaryImages.map((url, i) => (
                              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setSecondaryImages(prev => prev.filter((_, j) => j !== i))}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => secondInputRef.current?.click()}
                          disabled={uploadingSecond}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        >
                          {uploadingSecond ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Ajouter
                        </button>
                        <input ref={secondInputRef} type="file" multiple accept="image/*" className="sr-only" onChange={handleSecondaryUpload} />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right panel — form ── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                  )}

                  {/* Informations générales */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Informations générales</h3>

                    <div>
                      <label className={lbl}>Nom du produit *</label>
                      <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Casque Audio Premium" required className={inp} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Référence</label>
                        <input value={reference} onChange={e => setReference(e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Catégorie</label>
                        <select value={categorie_id} onChange={e => setCategorie(e.target.value ? Number(e.target.value) : "")} className={inp}>
                          <option value="">Sélectionner…</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={lbl}>Unité</label>
                      <select value={unite} onChange={e => setUnite(e.target.value)} className={inp}>
                        <option value="">Sélectionner…</option>
                        <option value="pièce">Pièce</option>
                        <option value="kg">Kg</option>
                        <option value="litre">Litre</option>
                        <option value="boîte">Boîte</option>
                        <option value="carton">Carton</option>
                        <option value="sachet">Sachet</option>
                      </select>
                    </div>

                    <div>
                      <label className={lbl}>Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Description du produit…" rows={3}
                        className={`${inp} resize-none`} />
                    </div>
                  </section>

                  {/* Tarifs et variations */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tarifs et variations</h3>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={lbl}>Prix d&apos;achat</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                          <input type="number" min="0" value={prixAchat} onChange={e => setPrixAchat(e.target.value)}
                            placeholder="0" className={`${inp} pl-7`} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Prix de vente *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                          <input type="number" min="0" value={prixVente} onChange={e => setPrixVente(e.target.value)}
                            placeholder="0" required className={`${inp} pl-7`} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Marge</label>
                        <div className="h-[42px] px-3.5 rounded-xl border border-slate-200 bg-green-50 flex flex-col justify-center">
                          <span className="text-sm font-bold text-green-700">
                            {marge !== null ? `${marge}%` : "-"}
                          </span>
                          <span className="text-[10px] text-green-500">Calcul auto</span>
                        </div>
                      </div>
                    </div>

                    {/* Remise */}
                    <div className="w-1/3">
                      <label className={lbl}>Remise (%)</label>
                      <input type="number" min="0" max="99" value={remise} onChange={e => setRemise(e.target.value)}
                        placeholder="0" className={inp} />
                    </div>

                    {/* Variantes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={lbl + " mb-0"}>Variantes</label>
                        <button type="button"
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
                              {/* Photo */}
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
                              {/* Nom */}
                              <input value={v.nom} onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, nom: e.target.value } : x))}
                                placeholder="Ex: Rouge XL" className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white" />
                              {/* Prix */}
                              <input type="number" min="0" value={v.prix}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, prix: e.target.value } : x))}
                                placeholder="Prix" className="w-20 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white text-right" />
                              {/* Stock */}
                              <input type="number" min="0" value={v.stock}
                                onChange={e => setVariants(vs => vs.map(x => x._key === v._key ? { ...x, stock: e.target.value } : x))}
                                placeholder="Qté" className="w-16 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white text-right" />
                              {/* Supprimer */}
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

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={lbl}>Stock Magasin</label>
                        <input type="number" min="0" value={stockMag} onChange={e => setStockMag(e.target.value)}
                          placeholder="0" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Stock Boutique</label>
                        <input type="number" min="0" value={stockBout} onChange={e => setStockBout(e.target.value)}
                          placeholder="0" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Seuil minimum</label>
                        <input type="number" min="0" value={seuilMin} onChange={e => setSeuilMin(e.target.value)}
                          placeholder="5" className={inp} />
                      </div>
                    </div>

                    {/* Stock total */}
                    <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">Stock total (auto)</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {((Number(stockMag) || 0) + (Number(stockBout) || 0)).toFixed(0)}
                      </p>
                      <p className="text-xs text-blue-500 mt-0.5">Magasin + Boutique</p>
                    </div>

                    {/* Actif */}
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
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
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
