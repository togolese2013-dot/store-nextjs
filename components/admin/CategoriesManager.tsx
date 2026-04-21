"use client";

import { useState } from "react";
import {
  FolderOpen, Plus, Pencil, Trash2, X, Save, Loader2, AlertCircle, Package, Tag,
} from "lucide-react";
import type { AdminCategory, AdminMarque } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";

interface Props {
  initialCategories: AdminCategory[];
  initialMarques?:   AdminMarque[];
}

type Tab = "categories" | "marques";

const empty    = { nom: "", description: "" };
const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

export default function CategoriesManager({ initialCategories, initialMarques = [] }: Props) {
  const [tab, setTab] = useState<Tab>("categories");

  // ── Categories state ──
  const [list,     setList]    = useState<AdminCategory[]>(initialCategories);
  const [modal,    setModal]   = useState<"create" | "edit" | null>(null);
  const [editing,  setEditing] = useState<AdminCategory | null>(null);
  const [form,     setForm]    = useState(empty);
  const [saving,   setSaving]  = useState(false);
  const [deleting, setDeleting]= useState<number | null>(null);
  const [error,    setError]   = useState("");

  // ── Marques state ──
  const [marques,        setMarques]        = useState<AdminMarque[]>(initialMarques);
  const [marqueModal,    setMarqueModal]    = useState<"create" | "edit" | null>(null);
  const [editingMarque,  setEditingMarque]  = useState<AdminMarque | null>(null);
  const [marqueForm,     setMarqueForm]     = useState(empty);
  const [marqueSaving,   setMarqueSaving]   = useState(false);
  const [marqueDeleting, setMarqueDeleting] = useState<number | null>(null);
  const [marqueError,    setMarqueError]    = useState("");

  // ── Categories handlers ──
  function openCreate() { setForm(empty); setEditing(null); setError(""); setModal("create"); }
  function openEdit(cat: AdminCategory) { setForm({ nom: cat.nom, description: cat.description }); setEditing(cat); setError(""); setModal("edit"); }
  function closeModal() { setModal(null); setError(""); }

  async function handleSave() {
    if (!form.nom.trim()) { setError("Le nom est obligatoire."); return; }
    setSaving(true); setError("");
    try {
      if (modal === "create") {
        const res  = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: form.nom.trim(), description: form.description.trim() }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setList(l => [...l, { id: data.id, nom: form.nom.trim(), description: form.description.trim(), nb_produits: 0 }].sort((a, b) => a.nom.localeCompare(b.nom)));
      } else if (editing) {
        const res  = await fetch(`/api/admin/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: form.nom.trim(), description: form.description.trim() }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setList(l => l.map(c => c.id === editing.id ? { ...c, nom: form.nom.trim(), description: form.description.trim() } : c).sort((a, b) => a.nom.localeCompare(b.nom)));
      }
      closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  }

  async function handleDelete(cat: AdminCategory) {
    if (!confirm(`Supprimer "${cat.nom}" ?\nLes ${cat.nb_produits} produit(s) liés ne seront pas supprimés.`)) return;
    setDeleting(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      if (res.ok) setList(l => l.filter(c => c.id !== cat.id));
    } finally { setDeleting(null); }
  }

  // ── Marques handlers ──
  function openMarqueCreate() { setMarqueForm(empty); setEditingMarque(null); setMarqueError(""); setMarqueModal("create"); }
  function openMarqueEdit(m: AdminMarque) { setMarqueForm({ nom: m.nom, description: m.description }); setEditingMarque(m); setMarqueError(""); setMarqueModal("edit"); }
  function closeMarqueModal() { setMarqueModal(null); setMarqueError(""); }

  async function handleMarqueSave() {
    if (!marqueForm.nom.trim()) { setMarqueError("Le nom est obligatoire."); return; }
    setMarqueSaving(true); setMarqueError("");
    try {
      if (marqueModal === "create") {
        const res  = await fetch("/api/admin/marques", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: marqueForm.nom.trim(), description: marqueForm.description.trim() }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMarques(l => [...l, { id: data.id, nom: marqueForm.nom.trim(), description: marqueForm.description.trim(), nb_produits: 0 }].sort((a, b) => a.nom.localeCompare(b.nom)));
      } else if (editingMarque) {
        const res  = await fetch(`/api/admin/marques/${editingMarque.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: marqueForm.nom.trim(), description: marqueForm.description.trim() }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMarques(l => l.map(m => m.id === editingMarque.id ? { ...m, nom: marqueForm.nom.trim(), description: marqueForm.description.trim() } : m).sort((a, b) => a.nom.localeCompare(b.nom)));
      }
      closeMarqueModal();
    } catch (err) { setMarqueError(err instanceof Error ? err.message : "Erreur"); }
    finally { setMarqueSaving(false); }
  }

  async function handleMarqueDelete(m: AdminMarque) {
    if (!confirm(`Supprimer "${m.nom}" ?`)) return;
    setMarqueDeleting(m.id);
    try {
      const res = await fetch(`/api/admin/marques/${m.id}`, { method: "DELETE" });
      if (res.ok) setMarques(l => l.filter(x => x.id !== m.id));
    } finally { setMarqueDeleting(null); }
  }

  const totalProduits = list.reduce((s, c) => s + c.nb_produits, 0);

  return (
    <div className="space-y-6">

      {/* Header adapts per tab */}
      <PageHeader
        title={tab === "categories" ? "Catégories" : "Marques"}
        subtitle={tab === "categories" ? "Organisez vos produits par catégorie" : "Organisez vos produits par marque"}
        accent="brand"
        ctaLabel={tab === "categories" ? "Ajouter une catégorie" : "Ajouter une marque"}
        ctaIcon={Plus}
        onCtaClick={tab === "categories" ? openCreate : openMarqueCreate}
      />

      {/* KPI dashboard — always 3 cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Catégories</p>
            <FolderOpen className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{list.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Produits catalogués</p>
            <Package className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalProduits}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Marques</p>
            <Tag className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{marques.length}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-slate-100 pb-0">
        {(["categories", "marques"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-brand-700 text-brand-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t === "categories" ? <FolderOpen className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
            {t === "categories" ? `Catégories (${list.length})` : `Marques (${marques.length})`}
          </button>
        ))}
      </div>

      {/* ── Categories tab content ── */}
      {tab === "categories" && (
        list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
            <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Aucune catégorie</p>
            <p className="text-sm mt-1">Créez votre première catégorie pour organiser vos produits.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map(cat => (
              <div key={cat.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{cat.nom}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cat.nb_produits > 0
                          ? `${cat.nb_produits} produit${cat.nb_produits > 1 ? "s" : ""}`
                          : <span className="italic">Aucun produit</span>
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(cat)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat)} disabled={deleting === cat.id}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40">
                      {deleting === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {cat.description ? (
                  <p className="text-sm text-slate-500 line-clamp-2 border-t border-slate-50 pt-3">{cat.description}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic border-t border-slate-50 pt-3">Pas de description</p>
                )}
                {cat.nb_produits > 0 && (
                  <a href={`/admin/products?category=${cat.id}`}
                    className="self-start text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                    Voir les produits →
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Marques tab content ── */}
      {tab === "marques" && (
        marques.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
            <Tag className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Aucune marque</p>
            <p className="text-sm mt-1">Créez votre première marque pour organiser vos produits.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {marques.map(m => (
              <div key={m.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5 text-brand-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{m.nom}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {m.nb_produits > 0
                          ? `${m.nb_produits} produit${m.nb_produits > 1 ? "s" : ""}`
                          : <span className="italic">Aucun produit</span>
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openMarqueEdit(m)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleMarqueDelete(m)} disabled={marqueDeleting === m.id}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40">
                      {marqueDeleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {m.description ? (
                  <p className="text-sm text-slate-500 line-clamp-2 border-t border-slate-50 pt-3">{m.description}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic border-t border-slate-50 pt-3">Pas de description</p>
                )}
                {m.nb_produits > 0 && (
                  <a href={`/admin/products?filter=brand:${m.id}`}
                    className="self-start text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors">
                    Voir les produits →
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal catégorie */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-lg text-slate-900">
                {modal === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nom *</label>
                <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Électronique" autoFocus onKeyDown={e => e.key === "Enter" && handleSave()} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description optionnelle…" rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={closeModal}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal marque */}
      {marqueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-lg text-slate-900">
                {marqueModal === "create" ? "Nouvelle marque" : "Modifier la marque"}
              </h2>
              <button onClick={closeMarqueModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {marqueError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {marqueError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nom *</label>
                <input type="text" value={marqueForm.nom} onChange={e => setMarqueForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Samsung" autoFocus onKeyDown={e => e.key === "Enter" && handleMarqueSave()} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={marqueForm.description} onChange={e => setMarqueForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description optionnelle…" rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={closeMarqueModal}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleMarqueSave} disabled={marqueSaving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60">
                {marqueSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {marqueSaving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
