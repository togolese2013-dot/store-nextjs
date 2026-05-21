"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2, Warehouse, Phone, MapPin, X, Save, Package, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface Entrepot {
  id: number;
  nom: string;
  telephone: string | null;
  adresse: string | null;
  notes: string | null;
  actif: boolean;
}

interface EntrepotProduct {
  id: number;
  nom: string;
  reference: string;
  prix_unitaire: number;
  prix_entrepot: number | null;
  actif: boolean;
  image_url: string | null;
}

const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";

function emptyForm(): Partial<Entrepot> {
  return { nom: "", telephone: "", adresse: "", notes: "", actif: true };
}

export default function EntrepotsManager() {
  const [entrepots,       setEntrepots]       = useState<Entrepot[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [deleting,        setDeleting]        = useState<number | null>(null);
  const [error,           setError]           = useState("");
  const [form,            setForm]            = useState<Partial<Entrepot> | null>(null);
  const [expanded,        setExpanded]        = useState<Set<number>>(new Set());
  const [products,        setProducts]        = useState<Record<number, EntrepotProduct[]>>({});
  const [loadingProds,    setLoadingProds]    = useState<Set<number>>(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/entrepots");
      const data = await res.json();
      setEntrepots(data.entrepots ?? []);
    } catch { setError("Impossible de charger les entrepôts."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function fetchProducts(entrepotId: number) {
    setLoadingProds(prev => new Set(prev).add(entrepotId));
    try {
      const res  = await fetch(`/api/admin/products?entrepot_id=${entrepotId}&limit=100`);
      const data = await res.json();
      setProducts(prev => ({ ...prev, [entrepotId]: data.products ?? [] }));
    } catch { /* silently fail */ }
    finally {
      setLoadingProds(prev => { const s = new Set(prev); s.delete(entrepotId); return s; });
    }
  }

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!products[id]) fetchProducts(id);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form?.nom?.trim()) { setError("Nom obligatoire."); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/admin/entrepots", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      setForm(null);
      await fetchAll();
    } catch { setError("Erreur réseau."); }
    finally   { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cet entrepôt ? Les produits liés perdront leur entrepôt.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/entrepots/${id}`, { method: "DELETE" });
      await fetchAll();
    } catch { setError("Erreur lors de la suppression."); }
    finally   { setDeleting(null); }
  }

  async function handleDeleteProduct(productId: number, entrepotId: number) {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      setProducts(prev => ({ ...prev, [entrepotId]: (prev[entrepotId] ?? []).filter(p => p.id !== productId) }));
    } catch { setError("Erreur suppression produit."); }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-brand-700" />
          <h1 className="text-xl font-bold text-slate-900">Entrepôts</h1>
          <span className="ml-2 text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{entrepots.length}</span>
        </div>
        {!form && (
          <button
            onClick={() => { setForm(emptyForm()); setError(""); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvel entrepôt
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Form */}
      {form && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">
              {form.id ? "Modifier l'entrepôt" : "Nouvel entrepôt"}
            </h2>
            <button onClick={() => { setForm(null); setError(""); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom *</label>
              <input
                type="text"
                value={form.nom ?? ""}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Ex: Boutique Koffi"
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Téléphone / WhatsApp</label>
              <input
                type="text"
                value={form.telephone ?? ""}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                placeholder="+228 90 00 00 00"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Adresse</label>
            <input
              type="text"
              value={form.adresse ?? ""}
              onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
              placeholder="Lomé, Marché central…"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={form.notes ?? ""}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Infos utiles sur cet entrepôt…"
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={form.actif !== false}
                  onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-green-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              Actif
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setForm(null); setError(""); }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : entrepots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Warehouse className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Aucun entrepôt configuré</p>
          <p className="text-slate-300 text-xs mt-1">Ajoutez vos entrepôts pour lier vos produits</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {entrepots.map(e => {
            const isExpanded = expanded.has(e.id);
            const prods      = products[e.id] ?? [];
            const isLoadingP = loadingProds.has(e.id);

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

                {/* Entrepôt header */}
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${e.actif ? "bg-emerald-50" : "bg-slate-100"}`}>
                    <Warehouse className={`w-4 h-4 ${e.actif ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{e.nom}</p>
                      {!e.actif && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Inactif</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {e.telephone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {e.telephone}
                        </span>
                      )}
                      {e.adresse && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" /> {e.adresse}
                        </span>
                      )}
                    </div>
                    {e.notes && <p className="text-xs text-slate-400 mt-1 truncate">{e.notes}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleExpand(e.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Produits
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => { setForm({ ...e }); setError(""); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deleting === e.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deleting === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Products section */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {isLoadingP ? "Chargement…" : `${prods.length} produit${prods.length !== 1 ? "s" : ""}`}
                      </p>
                      <Link
                        href={`/admin/products/new?entrepot_id=${e.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Ajouter un produit
                      </Link>
                    </div>

                    {isLoadingP ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                      </div>
                    ) : prods.length === 0 ? (
                      <div className="py-8 text-center">
                        <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Aucun produit pour cet entrepôt</p>
                        <p className="text-slate-300 text-xs mt-1">Cliquez "Ajouter un produit" pour commencer</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {prods.map(p => {
                          const marge = p.prix_entrepot != null ? p.prix_unitaire - p.prix_entrepot : null;
                          return (
                            <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden relative shrink-0">
                                {p.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.image_url.startsWith("http") || p.image_url.startsWith("/") ? p.image_url : `/api/uploads/${p.image_url}`}
                                    alt={p.nom} className="absolute inset-0 w-full h-full object-contain p-1" />
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
                                <span className="text-xs font-bold text-emerald-600 shrink-0 hidden md:block">
                                  +{formatPrice(marge)}
                                </span>
                              )}

                              {!p.actif && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">Inactif</span>
                              )}

                              <div className="flex items-center gap-1 shrink-0">
                                <Link
                                  href={`/admin/products/${p.id}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                                  title="Modifier"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, e.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Supprimer"
                                >
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
    </div>
  );
}
