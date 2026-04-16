"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, Warehouse, ToggleLeft, ToggleRight } from "lucide-react";
import type { Entrepot } from "@/lib/admin-db";

interface Props { initialEntrepots: Entrepot[] }

const emptyForm = { nom: "", adresse: "", telephone: "", responsable: "", actif: true, sort_order: 0 };

export default function EntrepotsManager({ initialEntrepots }: Props) {
  const [entrepots, setEntrepots] = useState<Entrepot[]>(initialEntrepots);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [form,      setForm]      = useState(emptyForm);
  const [adding,    setAdding]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(""), 3000); }
  function setField(k: keyof typeof emptyForm, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function handleAdd() {
    if (!form.nom.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/entrepots", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      // Reload list
      const r2 = await fetch("/api/admin/entrepots");
      const d2 = await r2.json();
      setEntrepots(d2.data);
      setAdding(false); setForm(emptyForm); flash("Entrepôt créé ✓");
    } else { flash(data.error ?? "Erreur"); }
    setSaving(false);
  }

  function startEdit(e: Entrepot) {
    setEditId(e.id);
    setForm({ nom: e.nom, adresse: e.adresse, telephone: e.telephone, responsable: e.responsable, actif: e.actif, sort_order: e.sort_order });
  }

  async function handleEdit() {
    if (!form.nom.trim() || editId === null) return;
    setSaving(true);
    const res = await fetch(`/api/admin/entrepots/${editId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editId }),
    });
    if (res.ok) {
      setEntrepots(prev => prev.map(e => e.id === editId ? { ...e, ...form, id: editId, created_at: e.created_at } : e));
      setEditId(null); flash("Entrepôt modifié ✓");
    } else {
      const data = await res.json(); flash(data.error ?? "Erreur");
    }
    setSaving(false);
  }

  async function handleDelete(id: number, nom: string) {
    if (!confirm(`Supprimer l'entrepôt "${nom}" ?`)) return;
    const res = await fetch(`/api/admin/entrepots/${id}`, { method: "DELETE" });
    if (res.ok) { setEntrepots(prev => prev.filter(e => e.id !== id)); flash("Entrepôt supprimé"); }
    else { const data = await res.json(); flash(data.error ?? "Erreur"); }
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none";
  const labelCls = "block text-xs font-bold text-slate-500 mb-1";

  function EntrepotForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
    return (
      <div className="bg-white rounded-2xl border-2 border-brand-200 p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nom *</label>
            <input className={inputCls} value={form.nom} onChange={e => setField("nom", e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Responsable</label>
            <input className={inputCls} value={form.responsable} onChange={e => setField("responsable", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Téléphone</label>
            <input className={inputCls} value={form.telephone} onChange={e => setField("telephone", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Ordre d'affichage</label>
            <input className={inputCls} type="number" value={form.sort_order}
              onChange={e => setField("sort_order", Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Adresse</label>
            <input className={inputCls} value={form.adresse} onChange={e => setField("adresse", e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <button type="button" onClick={() => setField("actif", !form.actif)}>
            {form.actif
              ? <ToggleRight className="w-8 h-8 text-brand-700" />
              : <ToggleLeft  className="w-8 h-8 text-slate-400" />}
          </button>
          <span className="text-sm font-semibold text-slate-700">Actif</span>
        </label>
        <div className="flex gap-2">
          <button onClick={onSave} disabled={saving || !form.nom.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {editId !== null ? "Mettre à jour" : "Créer"}
          </button>
          <button onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
            <X className="w-3.5 h-3.5" /> Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {!adding && editId === null && (
        <button onClick={() => { setAdding(true); setForm(emptyForm); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors">
          <Plus className="w-4 h-4" /> Ajouter un entrepôt
        </button>
      )}

      {adding && <EntrepotForm onSave={handleAdd} onCancel={() => setAdding(false)} />}

      <div className="space-y-3">
        {entrepots.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400">
            <Warehouse className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucun entrepôt configuré</p>
          </div>
        )}
        {entrepots.map(e => (
          <div key={e.id}>
            {editId === e.id ? (
              <EntrepotForm onSave={handleEdit} onCancel={() => setEditId(null)} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${e.actif ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"}`}>
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{e.nom}</p>
                      {!e.actif && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">INACTIF</span>}
                    </div>
                    {e.responsable && <p className="text-xs text-slate-500">Resp. : {e.responsable}</p>}
                    {e.telephone  && <p className="text-xs text-slate-400">{e.telephone}</p>}
                    {e.adresse    && <p className="text-xs text-slate-400">{e.adresse}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => startEdit(e)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-brand-700 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(e.id, e.nom)}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
