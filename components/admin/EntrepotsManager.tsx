"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, Pencil, Trash2, Warehouse, Phone, MapPin,
  X, Save, Package, ChevronDown, ChevronUp, Settings,
  ShoppingBag, ImagePlus,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

interface Entrepot {
  id: number;
  nom: string;
  telephone: string | null;
  adresse: string | null;
  notes: string | null;
  actif: boolean;
}

interface ExternalProduct {
  id: number;
  nom: string;
  reference: string;
  prix_unitaire: number;
  prix_entrepot: number | null;
  actif: boolean;
  image_url: string | null;
}

interface AddForm {
  nom: string;
  prix_unitaire: string;
  prix_entrepot: string;
  description: string;
  description_longue: string;
  image_url: string;
  slug: string;
}

function emptyAddForm(): AddForm {
  return { nom: "", prix_unitaire: "", prix_entrepot: "", description: "", description_longue: "", image_url: "", slug: "" };
}

function emptyFournisseur(): Partial<Entrepot> {
  return { nom: "", telephone: "", adresse: "", notes: "", actif: true };
}

const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";

export default function EntrepotsManager() {
  const [entrepots,    setEntrepots]    = useState<Entrepot[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  /* fournisseurs modal */
  const [showModal,    setShowModal]    = useState(false);
  const [fForm,        setFForm]        = useState<Partial<Entrepot> | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState<number | null>(null);

  /* products per entrepot */
  const [expanded,     setExpanded]     = useState<number[]>([]);
  const [products,     setProducts]     = useState<Record<number, ExternalProduct[]>>({});
  const [loadingProds, setLoadingProds] = useState<number[]>([]);

  /* add product modal */
  const [addFor,       setAddFor]       = useState<number | null>(null);
  const [addForm,      setAddForm]      = useState<AddForm>(emptyAddForm());
  const [addSaving,    setAddSaving]    = useState(false);
  const [addError,     setAddError]     = useState("");

  /* edit product modal */
  const [editProduct,  setEditProduct]  = useState<ExternalProduct | null>(null);
  const [editEntrepot, setEditEntrepot] = useState<number | null>(null);
  const [editForm,     setEditForm]     = useState<AddForm>(emptyAddForm());
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState("");

  /* image upload */
  const [uploadingImg, setUploadingImg] = useState(false);

  const fetchEntrepots = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/entrepots");
      const data = await res.json();
      setEntrepots(Array.isArray(data.entrepots) ? data.entrepots : []);
    } catch { setError("Impossible de charger les fournisseurs."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntrepots(); }, [fetchEntrepots]);

  const fetchProducts = useCallback(async (entrepotId: number) => {
    setLoadingProds(prev => [...prev, entrepotId]);
    try {
      const res  = await fetch(`/api/admin/products?entrepot_id=${entrepotId}&limit=100`);
      const data = await res.json();
      setProducts(prev => ({ ...prev, [entrepotId]: Array.isArray(data.products) ? data.products : [] }));
    } catch {
      setProducts(prev => ({ ...prev, [entrepotId]: [] }));
    } finally {
      setLoadingProds(prev => prev.filter(id => id !== entrepotId));
    }
  }, []);

  function toggleExpand(id: number) {
    const isOpen = expanded.includes(id);
    if (isOpen) {
      setExpanded(prev => prev.filter(x => x !== id));
    } else {
      setExpanded(prev => [...prev, id]);
      if (products[id] === undefined) fetchProducts(id);
    }
  }

  /* ── Image upload ── */
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

  function toBase64(file: File): Promise<{ data: string; type: string }> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve({ data: r.result as string, type: file.type });
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function uploadAndSetImage(
    file: File,
    setForm: React.Dispatch<React.SetStateAction<AddForm>>,
    setFormError: React.Dispatch<React.SetStateAction<string>>,
  ) {
    setUploadingImg(true);
    try {
      const compressed = await compressImage(file);
      const b64 = await toBase64(compressed);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [b64] }),
      });
      const data = await res.json();
      if (!res.ok || !data.urls?.[0]) throw new Error(data.error || "Erreur upload image");
      setForm(f => ({ ...f, image_url: data.urls[0] }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur upload image");
    } finally {
      setUploadingImg(false);
    }
  }

  /* ── Add product ── */
  function openAdd(entrepotId: number) {
    setAddFor(entrepotId);
    setAddForm(emptyAddForm());
    setAddError("");
  }

  async function handleAddProduct() {
    if (!addForm.nom.trim())    { setAddError("Nom obligatoire."); return; }
    if (!addForm.prix_unitaire) { setAddError("Prix de vente obligatoire."); return; }
    setAddSaving(true); setAddError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom:                addForm.nom.trim(),
          slug:               addForm.slug.trim() || toSlug(addForm.nom.trim()),
          description:        addForm.description.trim() || null,
          description_longue: addForm.description_longue.trim() || null,
          prix_unitaire:      Number(addForm.prix_unitaire),
          prix_entrepot:      addForm.prix_entrepot ? Number(addForm.prix_entrepot) : null,
          entrepot_id:        addFor,
          image_url:          addForm.image_url.trim() || null,
          stock_magasin:      0,
          stock_boutique:     0,
          actif:              true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Erreur création."); return; }
      setAddFor(null);
      if (addFor !== null) fetchProducts(addFor);
    } catch { setAddError("Erreur réseau."); }
    finally   { setAddSaving(false); }
  }

  /* ── Edit product ── */
  async function openEdit(p: ExternalProduct, entrepotId: number) {
    setEditEntrepot(entrepotId);
    setEditError("");
    setEditProduct(p);
    setEditForm({
      nom:                p.nom,
      prix_unitaire:      String(p.prix_unitaire),
      prix_entrepot:      p.prix_entrepot != null ? String(p.prix_entrepot) : "",
      description:        "",
      description_longue: "",
      image_url:          p.image_url ?? "",
      slug:               "",
    });
    try {
      const res  = await fetch(`/api/admin/products/${p.id}`);
      const data = await res.json();
      const full = data.product;
      if (full) {
        setEditForm({
          nom:                full.nom                ?? p.nom,
          prix_unitaire:      String(full.prix_unitaire  ?? p.prix_unitaire),
          prix_entrepot:      full.prix_entrepot != null ? String(full.prix_entrepot) : (p.prix_entrepot != null ? String(p.prix_entrepot) : ""),
          description:        full.description         ?? "",
          description_longue: full.description_longue  ?? "",
          image_url:          full.image_url           ?? p.image_url ?? "",
          slug:               full.slug                ?? "",
        });
      }
    } catch { /* keep prefilled values */ }
  }

  async function handleEditProduct() {
    if (!editForm.nom.trim())    { setEditError("Nom obligatoire."); return; }
    if (!editForm.prix_unitaire) { setEditError("Prix de vente obligatoire."); return; }
    if (!editProduct) return;
    setEditSaving(true); setEditError("");
    try {
      const res = await fetch(`/api/admin/products/${editProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom:                editForm.nom.trim(),
          slug:               editForm.slug.trim() || undefined,
          description:        editForm.description.trim() || null,
          description_longue: editForm.description_longue.trim() || null,
          prix_unitaire:      Number(editForm.prix_unitaire),
          prix_entrepot:      editForm.prix_entrepot ? Number(editForm.prix_entrepot) : null,
          image_url:          editForm.image_url.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Erreur."); return; }
      setEditProduct(null);
      if (editEntrepot !== null) fetchProducts(editEntrepot);
    } catch { setEditError("Erreur réseau."); }
    finally   { setEditSaving(false); }
  }

  /* ── Fournisseur CRUD ── */
  async function handleSaveFournisseur() {
    if (!fForm?.nom?.trim()) { setError("Nom obligatoire."); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/admin/entrepots", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      setFForm(null);
      await fetchEntrepots();
    } catch { setError("Erreur réseau."); }
    finally   { setSaving(false); }
  }

  async function handleDeleteFournisseur(id: number) {
    if (!confirm("Supprimer ce fournisseur ? Les produits liés perdront leur source.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/entrepots/${id}`, { method: "DELETE" });
      await fetchEntrepots();
    } catch { setError("Erreur suppression."); }
    finally   { setDeleting(null); }
  }

  async function handleDeleteProduct(productId: number, entrepotId: number) {
    if (!confirm("Supprimer ce produit externe ?")) return;
    try {
      await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      setProducts(prev => ({ ...prev, [entrepotId]: (prev[entrepotId] ?? []).filter(p => p.id !== productId) }));
    } catch { setError("Erreur suppression produit."); }
  }

  /* ── Shared product form modal ── */
  function ProductFormFields({
    form, setForm, error: formError, saving: formSaving, onSave, onCancel, title,
    onImageUpload,
  }: {
    form: AddForm;
    setForm: React.Dispatch<React.SetStateAction<AddForm>>;
    error: string;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
    title: string;
    onImageUpload: (file: File) => void;
  }) {
    const prix  = Number(form.prix_unitaire) || 0;
    const achat = Number(form.prix_entrepot) || 0;
    const marge = form.prix_unitaire && form.prix_entrepot ? prix - achat : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-700" /> {title}
            </h2>
            <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {formError && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}

            {/* Photo */}
            <div>
              <label className={labelCls}>Photo</label>
              {form.image_url ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-contain p-2" />
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                    className="absolute top-1.5 right-1.5 p-1 bg-white rounded-lg shadow text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-brand-300 transition-colors">
                  {uploadingImg
                    ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    : <ImagePlus className="w-5 h-5 text-slate-300" />}
                  <span className="text-xs text-slate-400">{uploadingImg ? "Envoi en cours…" : "Cliquer pour choisir une image"}</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(f); e.target.value = ""; }} />
                </label>
              )}
            </div>

            {/* Nom */}
            <div>
              <label className={labelCls}>Nom du produit *</label>
              <input type="text" value={form.nom} autoFocus
                onChange={e => {
                  const newNom = e.target.value;
                  setForm(f => ({
                    ...f,
                    nom:  newNom,
                    slug: (f.slug === "" || f.slug === toSlug(f.nom)) ? toSlug(newNom) : f.slug,
                  }));
                }}
                placeholder="Ex: iPhone 15 Pro" className={inputCls} />
            </div>

            {/* Slug */}
            <div>
              <label className={labelCls}>Slug URL</label>
              <input type="text" value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="auto-generé depuis le nom" className={inputCls} />
            </div>

            {/* Prix fournisseur → Prix de vente */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Prix fournisseur (FCFA)</label>
                <input type="number" min="0" value={form.prix_entrepot}
                  onChange={e => setForm(f => ({ ...f, prix_entrepot: e.target.value }))}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  Prix de vente (FCFA) *
                  {marge !== null && (
                    <span className={`ml-1.5 font-bold ${marge >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      ({marge >= 0 ? "+" : ""}{formatPrice(marge)})
                    </span>
                  )}
                </label>
                <input type="number" min="0" value={form.prix_unitaire}
                  onChange={e => setForm(f => ({ ...f, prix_unitaire: e.target.value }))}
                  placeholder="0" className={inputCls} />
              </div>
            </div>

            {/* Mini description */}
            <div>
              <label className={labelCls}>Mini description</label>
              <textarea value={form.description} rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Résumé court affiché dans les listes…" className={inputCls} />
            </div>

            {/* Description complète */}
            <div>
              <label className={labelCls}>Description complète</label>
              <textarea value={form.description_longue} rows={4}
                onChange={e => setForm(f => ({ ...f, description_longue: e.target.value }))}
                placeholder="Détails complets du produit, caractéristiques…" className={inputCls} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors">
                Annuler
              </button>
              <button onClick={onSave} disabled={formSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors disabled:opacity-60">
                {formSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Produits externes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Produits récupérés chez des fournisseurs, vendus sur le site</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(""); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:border-slate-300 hover:text-slate-700 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" /> Gérer les fournisseurs
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : entrepots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Aucun fournisseur configuré</p>
          <p className="text-slate-400 text-sm mt-1">Ajoutez d&apos;abord un fournisseur via &quot;Gérer les fournisseurs&quot;</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors">
            <Plus className="w-4 h-4" /> Ajouter un fournisseur
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {entrepots.map(e => {
            const isExpanded = expanded.includes(e.id);
            const prods      = products[e.id] ?? [];
            const isLoading  = loadingProds.includes(e.id);

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

                <button type="button" onClick={() => toggleExpand(e.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${e.actif ? "bg-emerald-50" : "bg-slate-100"}`}>
                    <Warehouse className={`w-4 h-4 ${e.actif ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{e.nom}</p>
                      {!e.actif && <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Inactif</span>}
                      {isExpanded && (
                        <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                          {prods.length} produit{prods.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      {e.telephone && <span className="flex items-center gap-1 text-xs text-slate-400"><Phone className="w-3 h-3" />{e.telephone}</span>}
                      {e.adresse   && <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3 h-3" />{e.adresse}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        {isLoading ? "Chargement…" : `${prods.length} produit${prods.length !== 1 ? "s" : ""}`}
                      </p>
                      <button onClick={() => openAdd(e.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 transition-colors">
                        <Plus className="w-3 h-3" /> Ajouter un produit
                      </button>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                      </div>
                    ) : prods.length === 0 ? (
                      <div className="py-10 text-center">
                        <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Aucun produit pour ce fournisseur</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {prods.map(p => {
                          const marge  = p.prix_entrepot != null ? p.prix_unitaire - p.prix_entrepot : null;
                          const imgSrc = p.image_url
                            ? (p.image_url.startsWith("http") || p.image_url.startsWith("/") ? p.image_url : `/api/uploads/${p.image_url}`)
                            : null;
                          return (
                            <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden relative shrink-0">
                                {imgSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={imgSrc} alt={p.nom} className="absolute inset-0 w-full h-full object-contain p-1" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                    <Package className="w-4 h-4" strokeWidth={1} />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">{p.nom}</p>
                                <p className="text-xs text-slate-400 font-mono">{p.reference}</p>
                              </div>

                              <div className="text-right shrink-0 hidden sm:block">
                                <p className="text-sm font-bold text-slate-900">{formatPrice(p.prix_unitaire)}</p>
                                {p.prix_entrepot != null && (
                                  <p className="text-xs text-slate-400">Achat : {formatPrice(p.prix_entrepot)}</p>
                                )}
                              </div>

                              {marge != null && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 hidden md:block">
                                  +{formatPrice(marge)}
                                </span>
                              )}

                              {!p.actif && <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">Inactif</span>}

                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => openEdit(p, e.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors" title="Modifier">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteProduct(p.id, e.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add product modal ── */}
      {addFor !== null && (
        <ProductFormFields
          form={addForm}
          setForm={setAddForm}
          error={addError}
          saving={addSaving}
          onSave={handleAddProduct}
          onCancel={() => setAddFor(null)}
          title={`Nouveau produit — ${entrepots.find(e => e.id === addFor)?.nom ?? ""}`}
          onImageUpload={file => uploadAndSetImage(file, setAddForm, setAddError)}
        />
      )}

      {/* ── Edit product modal ── */}
      {editProduct !== null && (
        <ProductFormFields
          form={editForm}
          setForm={setEditForm}
          error={editError}
          saving={editSaving}
          onSave={handleEditProduct}
          onCancel={() => setEditProduct(null)}
          title={`Modifier — ${editProduct.nom}`}
          onImageUpload={file => uploadAndSetImage(file, setEditForm, setEditError)}
        />
      )}

      {/* ── Fournisseurs modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-brand-700" /> Gérer les fournisseurs
              </h2>
              <button onClick={() => { setShowModal(false); setFForm(null); setError(""); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

              {fForm && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {fForm.id ? "Modifier" : "Nouveau fournisseur"}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nom *</label>
                      <input type="text" value={fForm.nom ?? ""}
                        onChange={e => setFForm(f => ({ ...f, nom: e.target.value }))}
                        placeholder="Boutique Koffi" className={inputCls} autoFocus />
                    </div>
                    <div>
                      <label className={labelCls}>Téléphone / WhatsApp</label>
                      <input type="text" value={fForm.telephone ?? ""}
                        onChange={e => setFForm(f => ({ ...f, telephone: e.target.value }))}
                        placeholder="+228 90 00 00 00" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Adresse</label>
                    <input type="text" value={fForm.adresse ?? ""}
                      onChange={e => setFForm(f => ({ ...f, adresse: e.target.value }))}
                      placeholder="Lomé, Marché central…" className={inputCls} />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => { setFForm(null); setError(""); }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors">
                      Annuler
                    </button>
                    <button onClick={handleSaveFournisseur} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors disabled:opacity-60">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {entrepots.map(e => (
                  <div key={e.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${e.actif ? "bg-emerald-50" : "bg-slate-100"}`}>
                      <Warehouse className={`w-3.5 h-3.5 ${e.actif ? "text-emerald-600" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{e.nom}</p>
                      {e.telephone && <p className="text-xs text-slate-400">{e.telephone}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setFForm({ ...e }); setError(""); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteFournisseur(e.id)} disabled={deleting === e.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                        {deleting === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!fForm && (
                <button onClick={() => { setFForm(emptyFournisseur()); setError(""); }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-brand-300 hover:text-brand-700 transition-colors">
                  <Plus className="w-4 h-4" /> Ajouter un fournisseur
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
