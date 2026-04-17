"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, Search, Loader2, Check, AlertCircle,
  PackagePlus, PackageMinus, ArrowLeftRight, Package,
  ArrowRight, Trash2,
} from "lucide-react";

/* ─── Types ─── */
interface ProduitStock {
  produit_id: number;
  nom:        string;
  reference:  string;
  stock:      number;
}

type MouvType = "entree" | "sortie" | "ajustement";

interface MouvItem {
  produit:      ProduitStock | null;
  qty:          string;
  search:       string;
  showDropdown: boolean;
}

const TYPES: {
  value:    MouvType;
  label:    string;
  labelBtn: string;
  icon:     React.ElementType;
  color:    string;
  border:   string;
  desc:     string;
  apiPath:  string;
}[] = [
  {
    value:    "entree",
    label:    "Entrée",
    labelBtn: "Entrée (stock +)",
    icon:     PackagePlus,
    color:    "text-emerald-600 bg-emerald-100",
    border:   "border-emerald-400 bg-emerald-50",
    desc:     "Les entrées augmentent le stock magasin. Utilisez ce type lors d'une réception de marchandise ou d'un réapprovisionnement.",
    apiPath:  "/api/admin/stock/entree",
  },
  {
    value:    "sortie",
    label:    "Sortie (→ boutique)",
    labelBtn: "Sortie (stock −)",
    icon:     PackageMinus,
    color:    "text-red-600 bg-red-100",
    border:   "border-red-400 bg-red-50",
    desc:     "Les sorties diminuent le stock magasin et transfèrent la quantité vers le stock boutique pour la mise en vente.",
    apiPath:  "/api/admin/stock/sortie",
  },
  {
    value:    "ajustement",
    label:    "Ajustement",
    labelBtn: "Ajustement (±)",
    icon:     ArrowLeftRight,
    color:    "text-amber-600 bg-amber-100",
    border:   "border-amber-400 bg-amber-50",
    desc:     "L'ajustement corrige le stock magasin à la hausse (+) ou à la baisse (−). Utilisez ce type après un inventaire physique.",
    apiPath:  "/api/admin/stock/ajustement",
  },
];

function emptyItem(): MouvItem {
  return { produit: null, qty: "", search: "", showDropdown: false };
}

/* ════════════════════════════════════
   COMPONENT
════════════════════════════════════ */
export default function MouvementModal() {
  const router = useRouter();

  /* ── Visibility ── */
  const [open, setOpen] = useState(false);

  /* ── Data ── */
  const [produits,     setProduits]     = useState<ProduitStock[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);

  /* ── Form state ── */
  const [type,  setType]  = useState<MouvType>("entree");
  const [ref,   setRef]   = useState("");
  const [note,  setNote]  = useState("");
  const [items, setItems] = useState<MouvItem[]>([emptyItem()]);

  /* ── Submission ── */
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  /* ── Dropdown refs (one per item) ── */
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      setItems(prev => prev.map((item, i) => {
        if (dropdownRefs.current[i] && !dropdownRefs.current[i]!.contains(e.target as Node)) {
          return { ...item, showDropdown: false };
        }
        return item;
      }));
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Load products when modal opens ── */
  async function openModal() {
    reset();
    setOpen(true);
    if (produits.length > 0) return;
    setLoadingProds(true);
    try {
      const res  = await fetch("/api/admin/stock/produits");
      const data = await res.json();
      setProduits(data.produits ?? []);
    } finally {
      setLoadingProds(false);
    }
  }

  function reset() {
    setType("entree");
    setRef("");
    setNote("");
    setItems([emptyItem()]);
    setError("");
    setSuccess(false);
  }

  function closeModal() {
    setOpen(false);
    reset();
  }

  /* ── Item helpers ── */
  function updateItem(index: number, patch: Partial<MouvItem>) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function filteredFor(index: number): ProduitStock[] {
    const search = items[index]?.search ?? "";
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return produits.filter(p => p.nom.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q));
  }

  const selectedType = TYPES.find(t => t.value === type)!;

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].produit) { setError(`Ligne ${i + 1} : sélectionnez un produit.`); return; }
      const qty = Number(items[i].qty);
      if (!qty || qty <= 0) { setError(`Ligne ${i + 1} : la quantité doit être supérieure à 0.`); return; }
    }

    setSaving(true);
    setError("");

    try {
      for (const item of items) {
        const body: Record<string, unknown> = {
          produit_id: item.produit!.produit_id,
          quantite:   Number(item.qty),
        };
        if (ref.trim())  body.reference = ref.trim();
        if (note.trim()) body.note      = note.trim();
        if (type === "ajustement") body.motif = note.trim() || "Ajustement inventaire";

        const res  = await fetch(selectedType.apiPath, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur");
      }

      setSuccess(true);
      setTimeout(() => {
        closeModal();
        router.refresh();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Ajouter un mouvement
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Nouveau mouvement de stock</h3>
                  <p className="text-xs text-slate-400">Enregistrez une entrée, sortie ou ajustement de stock</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {success ? (
                <div className="flex flex-col items-center py-12 gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="font-bold text-xl text-slate-800">
                    {items.length > 1 ? `${items.length} mouvements enregistrés !` : "Mouvement enregistré !"}
                  </p>
                  <p className="text-slate-400 text-sm">Actualisation en cours…</p>
                </div>
              ) : (
                <form id="mouvement-form" onSubmit={handleSubmit} className="space-y-5">

                  {/* Info banner + type */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Type de mouvement */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Type de mouvement <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={type}
                          onChange={e => setType(e.target.value as MouvType)}
                          className="w-full appearance-none px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-all pr-10 font-semibold text-slate-700"
                        >
                          {TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.labelBtn}</option>
                          ))}
                        </select>
                        <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {/* Référence globale */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Référence <span className="font-normal text-slate-400">(optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={ref}
                        onChange={e => setRef(e.target.value)}
                        placeholder="Ex : BL-2025-001"
                        className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className={`flex items-start gap-3 p-3 rounded-2xl border ${selectedType.border}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${selectedType.color}`}>
                      <selectedType.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{selectedType.desc}</p>
                  </div>

                  {/* Items list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500">
                        Produits <span className="text-red-400">*</span>
                      </label>
                      <span className="text-xs text-slate-400">{items.length} ligne{items.length > 1 ? "s" : ""}</span>
                    </div>

                    {items.map((item, index) => {
                      const filtered = filteredFor(index);
                      return (
                        <div key={index} className="flex items-start gap-2 p-3 rounded-2xl border border-slate-100 bg-slate-50">
                          {/* Product selector */}
                          <div className="flex-1 min-w-0">
                            {item.produit ? (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-emerald-400 bg-white">
                                <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-slate-800 truncate">{item.produit.nom}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">stock: {item.produit.stock}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateItem(index, { produit: null, search: "" })}
                                  className="p-1 rounded-lg hover:bg-emerald-50 text-slate-400 shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="relative"
                                ref={el => { dropdownRefs.current[index] = el; }}
                              >
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  value={item.search}
                                  placeholder={loadingProds ? "Chargement…" : "Rechercher un produit…"}
                                  disabled={loadingProds}
                                  onChange={e => updateItem(index, { search: e.target.value, showDropdown: true })}
                                  onFocus={() => updateItem(index, { showDropdown: true })}
                                  className="w-full pl-9 pr-4 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                                />
                                {loadingProds && (
                                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                                )}
                                {item.showDropdown && filtered.length > 0 && (
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-44 overflow-y-auto">
                                    {filtered.map(p => (
                                      <button
                                        key={p.produit_id}
                                        type="button"
                                        onClick={() => updateItem(index, { produit: p, search: "", showDropdown: false })}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                                      >
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                          <Package className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-sm text-slate-800 truncate">{p.nom}</p>
                                          <p className="text-xs text-slate-400 font-mono">{p.reference}</p>
                                        </div>
                                        <span className={`text-xs font-bold shrink-0 ${
                                          p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-amber-500" : "text-emerald-600"
                                        }`}>
                                          {p.stock}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {item.showDropdown && item.search.trim() !== "" && filtered.length === 0 && !loadingProds && (
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 px-4 py-3 text-sm text-slate-400 text-center">
                                    Aucun produit trouvé
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quantity */}
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={e => updateItem(index, { qty: e.target.value })}
                            placeholder="Qté"
                            className="w-20 shrink-0 px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-display font-700 text-center"
                          />

                          {/* Remove button (not on first item if only one) */}
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Add item button */}
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-700 text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Ajouter un produit
                    </button>
                  </div>

                  {/* Note / Motif */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      {type === "ajustement" ? "Motif de l'ajustement" : "Note"}
                      {type !== "ajustement" && <span className="font-normal text-slate-400 ml-1">(optionnel)</span>}
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={2}
                      placeholder={
                        type === "ajustement"
                          ? "Ex : Inventaire physique du 14/04/2026"
                          : "Informations complémentaires…"
                      }
                      className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition-colors resize-none"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="border-t border-slate-100 px-6 py-4 shrink-0 flex gap-3">
                <button
                  type="submit"
                  form="mouvement-form"
                  disabled={saving || items.every(i => !i.produit || !i.qty)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 text-white ${
                    type === "entree"     ? "bg-emerald-600 hover:bg-emerald-700" :
                    type === "sortie"    ? "bg-red-600 hover:bg-red-700" :
                    "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <selectedType.icon className="w-4 h-4" />
                  }
                  {saving
                    ? "Enregistrement…"
                    : items.length > 1
                    ? `Confirmer ${items.length} ${selectedType.label.toLowerCase()}s`
                    : `Confirmer la ${selectedType.label.toLowerCase()}`
                  }
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
