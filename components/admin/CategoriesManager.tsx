"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2, FolderOpen } from "lucide-react";
import type { AdminCategory } from "@/lib/admin-db";

interface Props { initialCategories: AdminCategory[] }

export default function CategoriesManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories);
  const [editId,  setEditId]  = useState<number | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [newNom,  setNewNom]  = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding,  setAdding]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(""), 3000); }

  async function handleAdd() {
    if (!newNom.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ nom: newNom, description: newDesc }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories(prev => [...prev, { id: data.id, nom: newNom.trim(), description: newDesc.trim() }].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNewNom(""); setNewDesc(""); setAdding(false);
      flash("Catégorie créée ✓");
    } else {
      flash(data.error ?? "Erreur");
    }
    setSaving(false);
  }

  function startEdit(cat: AdminCategory) {
    setEditId(cat.id); setEditNom(cat.nom); setEditDesc(cat.description);
  }

  async function handleEdit() {
    if (!editNom.trim() || editId === null) return;
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${editId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ nom: editNom, description: editDesc }),
    });
    if (res.ok) {
      setCategories(prev =>
        prev.map(c => c.id === editId ? { id: editId, nom: editNom.trim(), description: editDesc.trim() } : c)
          .sort((a, b) => a.nom.localeCompare(b.nom))
      );
      setEditId(null); flash("Catégorie modifiée ✓");
    } else {
      const data = await res.json();
      flash(data.error ?? "Erreur");
    }
    setSaving(false);
  }

  async function handleDelete(id: number, nom: string) {
    if (!confirm(`Supprimer la catégorie "${nom}" ? Les produits liés ne seront pas supprimés.`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== id));
      flash("Catégorie supprimée");
    } else {
      const data = await res.json();
      flash(data.error ?? "Erreur");
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none";

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {/* Add button */}
      {!adding && (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter une catégorie
        </button>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-4 space-y-3">
          <p className="font-bold text-sm text-slate-700">Nouvelle catégorie</p>
          <input className={inputCls} placeholder="Nom *" value={newNom} onChange={e => setNewNom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus
          />
          <input className={inputCls} placeholder="Description (optionnel)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !newNom.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Créer
            </button>
            <button onClick={() => { setAdding(false); setNewNom(""); setNewDesc(""); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucune catégorie</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nom</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  {editId === cat.id ? (
                    <>
                      <td className="px-5 py-3">
                        <input className={inputCls} value={editNom} onChange={e => setEditNom(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleEdit()} autoFocus
                        />
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <input className={inputCls} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={handleEdit} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 disabled:opacity-50 transition-colors"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Sauver
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900">{cat.nom}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                        {cat.description || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => startEdit(cat)}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-brand-700 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(cat.id, cat.nom)}
                            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
