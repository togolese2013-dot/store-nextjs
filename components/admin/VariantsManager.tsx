"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";

export interface Variant {
  id:            number;
  produit_id:    number;
  nom:           string;
  options:       Record<string, string>;
  prix:          number;
  remise:        number;
  stock:         number;
  reference_sku: string | null;
  image_url:     string | null;
}

interface Props {
  productId:      number;
  onCountChange?: (count: number) => void;
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";

type EditDraft = { options: Record<string, string>; prix: number; remise: number; stock: number; image_url: string | null };
type PendingDraft = EditDraft & { _key: string; rawOptions: string; uploading: boolean };

function emptyPending(): PendingDraft {
  return { _key: Math.random().toString(36).slice(2), options: {}, rawOptions: "", prix: 0, remise: 0, stock: 0, image_url: null, uploading: false };
}

function parseOptions(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  raw.split(",").forEach((pair) => {
    const [k, ...rest] = pair.split("=");
    if (k?.trim() && rest.length) result[k.trim()] = rest.join("=").trim();
  });
  return result;
}

function serializeOptions(opts: Record<string, string>): string {
  return Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(", ");
}

function autoNom(opts: Record<string, string>): string {
  return Object.values(opts).filter(Boolean).join(" · ");
}

async function uploadImageFile(file: File): Promise<string | null> {
  const reader = new FileReader();
  const b64 = await new Promise<string>((resolve, reject) => {
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res  = await fetch("/api/admin/upload", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ files: [{ data: b64, type: file.type }] }),
  });
  const data = await res.json();
  return (res.ok && data.urls?.[0]) ? data.urls[0] : null;
}

// ── VariantRow (existing variants — edit in-place) ────────────────────────────
interface RowProps {
  variant:  Variant;
  onSave:   (v: Variant) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function VariantRow({ variant, onSave, onDelete }: RowProps) {
  const [open,       setOpen]       = useState(false);
  const [draft,      setDraft]      = useState<EditDraft>({
    options:   variant.options,
    prix:      variant.prix,
    remise:    variant.remise ?? 0,
    stock:     variant.stock,
    image_url: variant.image_url,
  });
  const [rawOptions, setRawOptions] = useState(serializeOptions(variant.options));
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);

  function setField<K extends keyof EditDraft>(k: K, v: EditDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function handleOptionsChange(raw: string) {
    setRawOptions(raw);
    setDraft((d) => ({ ...d, options: parseOptions(raw) }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImageFile(file);
    if (url) setField("image_url", url);
    setUploading(false);
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true);
    const opts = parseOptions(rawOptions);
    await onSave({
      ...variant,
      options:   opts,
      nom:       autoNom(opts) || variant.nom || "Variante",
      prix:      draft.prix,
      remise:    draft.remise,
      stock:     draft.stock,
      image_url: draft.image_url,
    });
    setSaving(false);
    setOpen(false);
  }

  const optLabels = Object.entries(variant.options);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      {/* Summary row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {variant.image_url
            ? <img src={variant.image_url} alt="" className="w-full h-full object-cover" />
            : <ImagePlus className="w-4 h-4 text-slate-300" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {optLabels.length > 0 ? (
              optLabels.map(([k, v]) => (
                <span key={k} className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 text-xs font-semibold">
                  {k}: {v}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">{variant.nom || "Variante sans options"}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{variant.prix.toLocaleString("fr-FR")} FCFA</span>
            {(variant.remise ?? 0) > 0 && (
              <span className="text-emerald-600 font-semibold">-{variant.remise.toLocaleString("fr-FR")} FCFA</span>
            )}
            <span className={`px-1.5 py-0.5 rounded-full font-medium ${
              variant.stock === 0 ? "bg-red-50 text-red-600" : variant.stock <= 5 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
            }`}>
              Stock : {variant.stock}
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>

      {/* Edit form */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">

          {/* Photo */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Photo de la variante</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                {draft.image_url
                  ? <img src={draft.image_url} alt="" className="w-full h-full object-cover" />
                  : uploading
                    ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    : <ImagePlus className="w-5 h-5 text-slate-300" />
                }
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700 cursor-pointer transition-colors">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  {uploading ? "Upload…" : draft.image_url ? "Changer" : "Ajouter une photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                </label>
                {draft.image_url && (
                  <button type="button" onClick={() => setField("image_url", null)}
                    className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Options (ex : Taille=M, Couleur=Rouge)</label>
            <input type="text" value={rawOptions} onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="Taille=M, Couleur=Rouge" className={inputCls} />
          </div>

          {/* Prix + Remise + Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Prix (FCFA)</label>
              <input type="number" min="0" value={draft.prix} onChange={(e) => setField("prix", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Remise (FCFA)</label>
              <input type="number" min="0" value={draft.remise} onChange={(e) => setField("remise", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Stock</label>
              <input type="number" min="0" value={draft.stock} onChange={(e) => setField("stock", Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer
            </button>
            <button type="button" onClick={() => onDelete(variant.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── VariantsManager ────────────────────────────────────────────────────────────
export default function VariantsManager({ productId, onCountChange }: Props) {
  const [variants,    setVariants]    = useState<Variant[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [pendingNew,  setPendingNew]  = useState<PendingDraft[]>([]);
  const [showAdd,     setShowAdd]     = useState(false);
  const [newDraft,    setNewDraft]    = useState<PendingDraft>(emptyPending());
  const [savingAll,   setSavingAll]   = useState(false);
  const [uploadingNew,setUploadingNew]= useState(false);
  const [msg,         setMsg]         = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/products/${productId}/variants`);
    if (res.ok) {
      const data = await res.json();
      const arr: Variant[] = Array.isArray(data) ? data : (data.variants ?? []);
      setVariants(arr);
      onCountChange?.(arr.length);
    }
    setLoading(false);
  }, [productId, onCountChange]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(v: Variant) {
    await fetch(`/api/admin/products/${productId}/variants/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    await load();
    setMsg("Variante mise à jour ✓");
    setTimeout(() => setMsg(""), 2000);
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette variante ?")) return;
    await fetch(`/api/admin/products/${productId}/variants/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleNewImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNew(true);
    const url = await uploadImageFile(file);
    if (url) setNewDraft(d => ({ ...d, image_url: url }));
    setUploadingNew(false);
    e.target.value = "";
  }

  function handleAddToPending() {
    const opts = parseOptions(newDraft.rawOptions);
    setPendingNew(prev => [...prev, { ...newDraft, options: opts }]);
    setNewDraft(emptyPending());
    setShowAdd(false);
  }

  function removePending(key: string) {
    setPendingNew(prev => prev.filter(p => p._key !== key));
  }

  async function handleSaveAll() {
    if (pendingNew.length === 0) return;
    setSavingAll(true);
    const count = pendingNew.length;
    await Promise.all(pendingNew.map(v =>
      fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom:          autoNom(v.options) || "Variante",
          options:      v.options,
          prix:         v.prix,
          remise:       v.remise,
          stock:        v.stock,
          reference_sku: null,
          image_url:    v.image_url,
        }),
      })
    ));
    setPendingNew([]);
    setSavingAll(false);
    await load();
    setMsg(`${count} variante(s) enregistrée(s) ✓`);
    setTimeout(() => setMsg(""), 2500);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des variantes…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {msg && (
        <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm">{msg}</div>
      )}

      <p className="text-xs text-slate-500">
        Définissez des variantes (taille, couleur…). Chaque variante a son propre prix et stock.
      </p>

      {/* Existing variants */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v) => (
            <VariantRow key={v.id} variant={v} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pending new variants (not yet saved) */}
      {pendingNew.length > 0 && (
        <div className="space-y-2">
          {pendingNew.map(p => {
            const optLabels = Object.entries(p.options);
            return (
              <div key={p._key} className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-brand-300 rounded-2xl bg-brand-50/40">
                <div className="w-9 h-9 rounded-lg bg-white border border-brand-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    : <ImagePlus className="w-4 h-4 text-slate-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {optLabels.length > 0 ? optLabels.map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">{k}: {v}</span>
                    )) : <span className="text-xs text-slate-400">Sans options</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{p.prix.toLocaleString("fr-FR")} FCFA</span>
                    <span className="px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">Stock : {p.stock}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] uppercase tracking-wide">Nouveau</span>
                  </div>
                </div>
                <button type="button" onClick={() => removePending(p._key)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* Save all pending button */}
          <button type="button" onClick={handleSaveAll} disabled={savingAll}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 disabled:opacity-60 transition-colors">
            {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingAll ? "Enregistrement…" : `Enregistrer ${pendingNew.length} variante${pendingNew.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Empty state */}
      {variants.length === 0 && pendingNew.length === 0 && !showAdd && (
        <div className="py-6 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          Aucune variante — le produit se vend tel quel (prix et stock globaux).
        </div>
      )}

      {/* Add new variant form */}
      {showAdd ? (
        <div className="border-2 border-brand-200 rounded-2xl p-4 bg-brand-50/50 space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Nouvelle variante</h4>

          {/* Photo */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Photo de la variante</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                {newDraft.image_url
                  ? <img src={newDraft.image_url} alt="" className="w-full h-full object-cover" />
                  : uploadingNew
                    ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    : <ImagePlus className="w-4 h-4 text-slate-300" />
                }
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700 cursor-pointer transition-colors">
                {uploadingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                {uploadingNew ? "Upload…" : "Ajouter une photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleNewImageChange} />
              </label>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Options (ex : Taille=XL, Couleur=Noir)</label>
            <input type="text" value={newDraft.rawOptions}
              onChange={e => setNewDraft(d => ({ ...d, rawOptions: e.target.value, options: parseOptions(e.target.value) }))}
              placeholder="Taille=XL, Couleur=Noir" className={inputCls} />
          </div>

          {/* Prix + Remise + Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Prix (FCFA) *</label>
              <input type="number" min="0" value={newDraft.prix}
                onChange={e => setNewDraft(d => ({ ...d, prix: Number(e.target.value) }))}
                placeholder="25000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Remise (FCFA)</label>
              <input type="number" min="0" value={newDraft.remise}
                onChange={e => setNewDraft(d => ({ ...d, remise: Number(e.target.value) }))}
                placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Stock</label>
              <input type="number" min="0" value={newDraft.stock}
                onChange={e => setNewDraft(d => ({ ...d, stock: Number(e.target.value) }))}
                placeholder="10" className={inputCls} />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={handleAddToPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter à la liste
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setNewDraft(emptyPending()); }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-700 transition-colors w-full justify-center">
          <Plus className="w-4 h-4" /> Ajouter une variante
        </button>
      )}
    </div>
  );
}
