"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, Search, Loader2, Check, AlertCircle,
  PackagePlus, PackageMinus, ArrowLeftRight, Package,
  ArrowRight,
} from "lucide-react";

/* ─── Types ─── */
interface ProduitStock {
  produit_id: number;
  nom:        string;
  reference:  string;
  stock:      number; // stock magasin
}

type MouvType = "entree" | "sortie" | "ajustement";

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
  const [type,     setType]     = useState<MouvType>("entree");
  const [selected, setSelected] = useState<ProduitStock | null>(null);
  const [qty,      setQty]      = useState("");
  const [ref,      setRef]      = useState("");
  const [note,     setNote]     = useState("");

  /* ── Product search ── */
  const [search,      setSearch]      = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ── Submission ── */
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Load products when modal opens ── */
  async function openModal() {
    reset();
    setOpen(true);
    if (produits.length > 0) return; // already loaded
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
    setSelected(null);
    setQty("");
    setRef("");
    setNote("");
    setSearch("");
    setShowDropdown(false);
    setError("");
    setSuccess(false);
  }

  function closeModal() {
    setOpen(false);
    reset();
  }

  /* ── Filtered products ── */
  const filtered = produits.filter(p => {
    if (!search.trim()) return false;
    const q = search.toLowerCase();
    return p.nom.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
  });

  const selectedType = TYPES.find(t => t.value === type)!;

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError("Sélectionnez un produit."); return; }
    const quantity = Number(qty);
    if (!quantity || quantity <= 0) { setError("La quantité doit être supérieure à 0."); return; }

    setSaving(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        produit_id: selected.produit_id,
        quantite:   quantity,
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
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Ajouter un mouvement
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

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
                  <p className="font-bold text-xl text-slate-800">Mouvement enregistré !</p>
                  <p className="text-slate-400 text-sm">Actualisation en cours…</p>
                </div>
              ) : (
                <form id="mouvement-form" onSubmit={handleSubmit} className="space-y-5">

                  {/* Info banner */}
                  <div className={`flex items-start gap-3 p-4 rounded-2xl border ${selectedType.border}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${selectedType.color}`}>
                      <selectedType.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-800 mb-0.5">{selectedType.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{selectedType.desc}</p>
                    </div>
                  </div>

                  {/* Row 1: Type + Produit */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Type de mouvement */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Type de mouvement <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={type}
                          onChange={e => { setType(e.target.value as MouvType); setSelected(null); }}
                          className="w-full appearance-none px-4 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all pr-10 font-semibold text-slate-700"
                        >
                          {TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.labelBtn}</option>
                          ))}
                        </select>
                        <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sélection du produit */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Sélection du produit <span className="text-red-400">*</span>
                      </label>
                      {selected ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-brand-400 bg-brand-50">
                          <Package className="w-4 h-4 text-brand-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-800 truncate">{selected.nom}</p>
                            <p className="text-[10px] text-slate-400 font-mono">stock: {selected.stock}</p>
                          </div>
                          <button type="button" onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-brand-100 text-slate-400 shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative" ref={searchRef}>
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={search}
                            placeholder={loadingProds ? "Chargement…" : "Rechercher un produit…"}
                            disabled={loadingProds}
                            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all disabled:opacity-50"
                          />
                          {loadingProds && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                          )}

                          {showDropdown && filtered.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto">
                              {filtered.map(p => (
                                <button
                                  key={p.produit_id}
                                  type="button"
                                  onClick={() => { setSelected(p); setSearch(""); setShowDropdown(false); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-slate-800 truncate">{p.nom}</p>
                                    <p className="text-xs text-slate-400 font-mono">{p.reference}</p>
                                  </div>
                                  <span className={`text-xs font-bold shrink-0 ${
                                    p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-amber-500" : "text-emerald-600"
                                  }`}>
                                    {p.stock} en stock
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {showDropdown && search.trim() !== "" && filtered.length === 0 && !loadingProds && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 px-4 py-3 text-sm text-slate-400 text-center">
                              Aucun produit trouvé
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Quantité + Référence */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Quantité à déplacer <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all font-display font-700 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Référence <span className="font-normal text-slate-400">(optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={ref}
                        onChange={e => setRef(e.target.value)}
                        placeholder="Ex : BL-2025-001"
                        className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none transition-all font-mono"
                      />
                    </div>
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
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Stock preview */}
                  {selected && qty && Number(qty) > 0 && (
                    <div className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
                      type === "entree"
                        ? "bg-emerald-50 text-emerald-700"
                        : type === "sortie"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      <span>Stock magasin après opération :</span>
                      <span className="font-bold text-base">
                        {type === "entree"
                          ? selected.stock + Number(qty)
                          : type === "sortie"
                          ? Math.max(0, selected.stock - Number(qty))
                          : selected.stock + Number(qty)
                        } u.
                        <span className="text-xs ml-1 opacity-70">
                          ({type === "entree" || type === "ajustement" ? "+" : "−"}{qty})
                        </span>
                      </span>
                    </div>
                  )}

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
                  disabled={saving || !selected || !qty}
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
                  {saving ? "Enregistrement…" : `Confirmer la ${selectedType.label.toLowerCase()}`}
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
