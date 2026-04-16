"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export interface Variant {
  id: number;
  produit_id: number;
  nom: string;
  options: Record<string, string>;
  prix: number;
  stock: number;
  reference_sku: string | null;
}

interface Props {
  productId: number;
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";

type DraftVariant = Omit<Variant, "id" | "produit_id">;

const emptyDraft = (): DraftVariant => ({
  nom: "",
  options: {},
  prix: 0,
  stock: 0,
  reference_sku: null,
});

/** Parse "Taille=M, Couleur=Rouge" → { Taille: "M", Couleur: "Rouge" } */
function parseOptions(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  raw.split(",").forEach((pair) => {
    const [k, ...rest] = pair.split("=");
    if (k?.trim() && rest.length) result[k.trim()] = rest.join("=").trim();
  });
  return result;
}

/** { Taille: "M", Couleur: "Rouge" } → "Taille=M, Couleur=Rouge" */
function serializeOptions(opts: Record<string, string>): string {
  return Object.entries(opts)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

function autoNom(opts: Record<string, string>): string {
  return Object.values(opts).filter(Boolean).join(" · ");
}

interface RowProps {
  variant: Variant;
  onSave: (v: Variant) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function VariantRow({ variant, onSave, onDelete }: RowProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Variant>(variant);
  const [rawOptions, setRawOptions] = useState(serializeOptions(variant.options));
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof Variant>(k: K, v: Variant[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function handleOptionsChange(raw: string) {
    setRawOptions(raw);
    const opts = parseOptions(raw);
    setDraft((d) => ({
      ...d,
      options: opts,
      nom: d.nom || autoNom(opts),
    }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave({ ...draft, options: parseOptions(rawOptions) });
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
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {optLabels.length > 0 ? (
              optLabels.map(([k, v]) => (
                <span
                  key={k}
                  className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 text-xs font-semibold"
                >
                  {k}: {v}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">{variant.nom || "Variante sans options"}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              {variant.prix.toLocaleString("fr-FR")} FCFA
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full font-medium ${
                variant.stock === 0
                  ? "bg-red-50 text-red-600"
                  : variant.stock <= 5
                  ? "bg-amber-50 text-amber-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              Stock : {variant.stock}
            </span>
            {variant.reference_sku && (
              <span className="font-mono text-slate-400">{variant.reference_sku}</span>
            )}
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </div>

      {/* Edit form */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Options (format : Taille=M, Couleur=Rouge)
            </label>
            <input
              type="text"
              value={rawOptions}
              onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="Taille=M, Couleur=Rouge"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Nom de la variante (auto-rempli ou personnalisé)
            </label>
            <input
              type="text"
              value={draft.nom}
              onChange={(e) => setField("nom", e.target.value)}
              placeholder="M · Rouge"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Prix (FCFA)</label>
              <input
                type="number"
                min="0"
                value={draft.prix}
                onChange={(e) => setField("prix", Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={draft.stock}
                onChange={(e) => setField("stock", Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">SKU / Référence</label>
              <input
                type="text"
                value={draft.reference_sku ?? ""}
                onChange={(e) => setField("reference_sku", e.target.value || null)}
                placeholder="REF-M-ROUGE"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => onDelete(variant.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VariantsManager({ productId }: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDraft, setNewDraft] = useState<DraftVariant>(emptyDraft());
  const [rawNewOptions, setRawNewOptions] = useState("");
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/products/${productId}/variants`);
    if (res.ok) setVariants(await res.json());
    setLoading(false);
  }, [productId]);

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

  function setNewField<K extends keyof DraftVariant>(k: K, v: DraftVariant[K]) {
    setNewDraft((d) => ({ ...d, [k]: v }));
  }

  function handleNewOptionsChange(raw: string) {
    setRawNewOptions(raw);
    const opts = parseOptions(raw);
    setNewDraft((d) => ({
      ...d,
      options: opts,
      nom: d.nom || autoNom(opts),
    }));
  }

  async function handleAdd() {
    if (!newDraft.prix && newDraft.prix !== 0) return;
    setAdding(true);
    await fetch(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newDraft, options: parseOptions(rawNewOptions) }),
    });
    setNewDraft(emptyDraft());
    setRawNewOptions("");
    setShowAdd(false);
    setAdding(false);
    await load();
    setMsg("Variante ajoutée ✓");
    setTimeout(() => setMsg(""), 2000);
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
        <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm">
          {msg}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Les variantes permettent de définir des combinaisons (taille, couleur…) avec chacune son propre prix et stock.
        Sur la fiche produit, le client choisira parmi ces options.
      </p>

      {variants.length > 0 ? (
        <div className="space-y-2">
          {variants.map((v) => (
            <VariantRow key={v.id} variant={v} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          Aucune variante — le produit se vend tel quel (prix et stock globaux).
        </div>
      )}

      {showAdd ? (
        <div className="border-2 border-brand-200 rounded-2xl p-4 bg-brand-50/50 space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Nouvelle variante</h4>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Options (format : Taille=M, Couleur=Rouge)
            </label>
            <input
              type="text"
              value={rawNewOptions}
              onChange={(e) => handleNewOptionsChange(e.target.value)}
              placeholder="Taille=XL, Couleur=Noir"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Nom (optionnel — auto-rempli depuis les options)
            </label>
            <input
              type="text"
              value={newDraft.nom}
              onChange={(e) => setNewField("nom", e.target.value)}
              placeholder="XL · Noir"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Prix (FCFA) *</label>
              <input
                type="number"
                min="0"
                value={newDraft.prix}
                onChange={(e) => setNewField("prix", Number(e.target.value))}
                placeholder="25000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={newDraft.stock}
                onChange={(e) => setNewField("stock", Number(e.target.value))}
                placeholder="10"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">SKU / Référence</label>
              <input
                type="text"
                value={newDraft.reference_sku ?? ""}
                onChange={(e) => setNewField("reference_sku", e.target.value || null)}
                placeholder="REF-XL-NOIR"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 disabled:opacity-60 transition-colors"
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewDraft(emptyDraft()); setRawNewOptions(""); }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-700 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Ajouter une variante
        </button>
      )}
    </div>
  );
}
