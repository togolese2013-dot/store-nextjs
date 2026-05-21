"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, Pencil, Trash2, Warehouse, Phone, MapPin,
  X, Save, Package, ChevronDown, ChevronUp, Settings2,
} from "lucide-react";
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

interface ExternalProduct {
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

function emptyFournisseur(): Partial<Entrepot> {
  return { nom: "", telephone: "", adresse: "", notes: "", actif: true };
}

export default function EntrepotsManager() {
  const [entrepots,    setEntrepots]    = useState<Entrepot[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  /* fournisseurs modal */
  const [showModal,    setShowModal]    = useState(false);
  const [form,         setForm]         = useState<Partial<Entrepot> | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState<number | null>(null);

  /* products per entrepot */
  const [expanded,     setExpanded]     = useState<Set<number>>(new Set());
  const [products,     setProducts]     = useState<Record<number, ExternalProduct[]>>({});
  const [loadingProds, setLoadingProds] = useState<Set<number>>(new Set());

  const fetchEntrepots = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/entrepots");
      const data = await res.json();
      setEntrepots(data.entrepots ?? []);
    } catch { setError("Impossible de charger les fournisseurs."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntrepots(); }, [fetchEntrepots]);

  async function fetchProducts(entrepotId: number) {
    setLoadingProds(prev => new Set(prev).add(entrepotId));
    try {
      const res  = await fetch(`/api/admin/products?entrepot_id=${entrepotId}&limit=100`);
      const data = await res.json();
      setProducts(prev => ({ ...prev, [entrepotId]: data.products ?? [] }));
    } catch { /* silent */ }
    finally {
      setLoadingProds(prev => { const s = new Set(prev); s.delete(entrepotId); return s; });
    }
  }

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); if (!products[id]) fetchProducts(id); }
      return next;
    });
  }

  /* ── Fournisseur CRUD ── */
  async function handleSaveFournisseur() {
    if (!form?.nom?.trim()) { setError("Nom obligatoire."); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/admin/entrepots", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      setForm(null);
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

  const totalProducts = Object.values(products).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Produits externes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Produits récupérés chez des fournisseurs, vendus sur le site</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowModal(true); setError(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:border-slate-300 hover:text-slate-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" /> Gérer les fournisseurs
          </button>
        </div>
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
          <p className="text-slate-400 text-sm mt-1">Ajoutez d'abord un fournisseur via "Gérer les fournisseurs"</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter un fournisseur
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {entrepots.map(e => {
            const isExpanded = expanded.has(e.id);
            const prods      = products[e.id] ?? [];
            const isLoading  = loadingProds.has(e.id);
            const count      = isExpanded ? prods.length : null;

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

                {/* Fournisseur header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(e.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${e.actif ? "bg-emerald-50" : "bg-slate-100"}`}>
                    <Warehouse className={`w-4 h-4 ${e.actif ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">{e.nom}</p>
                      {!e.actif && <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Inactif</span>}
                      {count !== null && (
                        <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                          {count} produit{count !== 1 ? "s" : ""}
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

                {/* Products list */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        {isLoading ? "Chargement…" : `${prods.length} produit${prods.length !== 1 ? "s" : ""}`}
                      </p>
                      <Link
                        href={`/admin/products/new?entrepot_id=${e.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Ajouter un produit
                      </Link>
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
                          const marge = p.prix_entrepot != null ? p.prix_unitaire - p.prix_entrepot : null;
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

                              {!p.actif && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">Inactif</span>
                              )}

                              <div className="flex items-center gap-1 shrink-0">
                                <Link href={`/admin/products/${p.id}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                                  title="Modifier">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Link>
                                <button onClick={() => handleDeleteProduct(p.id, e.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Supprimer">
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

      {/* ── Fournisseurs modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-brand-700" /> Gérer les fournisseurs
              </h2>
              <button onClick={() => { setShowModal(false); setForm(null); setError(""); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

              {/* Inline form */}
              {form && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {form.id ? "Modifier" : "Nouveau fournisseur"}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nom *</label>
                      <input type="text" value={form.nom ?? ""}
                        onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                        placeholder="Boutique Koffi" className={inputCls} autoFocus />
                    </div>
                    <div>
                      <label className={labelCls}>Téléphone / WhatsApp</label>
                      <input type="text" value={form.telephone ?? ""}
                        onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                        placeholder="+228 90 00 00 00" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Adresse</label>
                    <input type="text" value={form.adresse ?? ""}
                      onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                      placeholder="Lomé, Marché central…" className={inputCls} />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => { setForm(null); setError(""); }}
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

              {/* List */}
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
                      <button onClick={() => { setForm({ ...e }); setError(""); }}
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

              {!form && (
                <button onClick={() => { setForm(emptyFournisseur()); setError(""); }}
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
