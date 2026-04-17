"use client";

import { useState } from "react";
import { Building2, Plus, Pencil, Trash2, Phone, Mail, MapPin, X, Save, Loader2, AlertCircle, Users } from "lucide-react";
import type { Fournisseur } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";

interface Props {
  initial: Fournisseur[];
}

const empty: Omit<Fournisseur, "id" | "created_at"> = {
  nom: "", contact: "", telephone: "", email: "", adresse: "", note: "",
};

const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

export default function FournisseursManager({ initial }: Props) {
  const [list,    setList]    = useState<Fournisseur[]>(initial);
  const [modal,   setModal]   = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Fournisseur | null>(null);
  const [form,    setForm]    = useState(empty);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState<number | null>(null);
  const [error,   setError]   = useState("");

  function openCreate() {
    setForm(empty);
    setEditing(null);
    setError("");
    setModal("create");
  }

  function openEdit(f: Fournisseur) {
    setForm({ nom: f.nom, contact: f.contact ?? "", telephone: f.telephone ?? "", email: f.email ?? "", adresse: f.adresse ?? "", note: f.note ?? "" });
    setEditing(f);
    setError("");
    setModal("edit");
  }

  function closeModal() { setModal(null); setError(""); }

  async function handleSave() {
    if (!form.nom.trim()) { setError("Le nom est obligatoire."); return; }
    setSaving(true); setError("");
    try {
      if (modal === "create") {
        const res = await fetch("/api/admin/fournisseurs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const newF: Fournisseur = { id: data.id, created_at: new Date().toISOString(), ...form };
        setList(l => [newF, ...l]);
      } else if (editing) {
        const res = await fetch(`/api/admin/fournisseurs/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setList(l => l.map(f => f.id === editing.id ? { ...f, ...form } : f));
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/fournisseurs/${id}`, { method: "DELETE" });
      setList(l => l.filter(f => f.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Fournisseurs"
        subtitle={`${list.length} fournisseur${list.length !== 1 ? "s" : ""} enregistré${list.length !== 1 ? "s" : ""}`}
        accent="brand"
        ctaLabel="Ajouter un fournisseur"
        ctaIcon={Plus}
        onCtaClick={openCreate}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Fournisseurs</p>
            <Building2 className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{list.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Avec contact</p>
            <Users className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {list.filter(f => f.telephone || f.contact).length}
          </p>
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <Building2 className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-semibold">Aucun fournisseur</p>
          <p className="text-sm mt-1">Ajoutez votre premier fournisseur pour commencer.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 hover:border-slate-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{f.nom}</p>
                    {f.contact && <p className="text-xs text-slate-400">{f.contact}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(f)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                {f.telephone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{f.telephone}</span>
                  </div>
                )}
                {f.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{f.email}</span>
                  </div>
                )}
                {f.adresse && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{f.adresse}</span>
                  </div>
                )}
              </div>
              {f.note && (
                <p className="text-xs text-slate-400 border-t border-slate-50 pt-2 line-clamp-2">{f.note}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-lg text-slate-900">
                {modal === "create" ? "Nouveau fournisseur" : "Modifier le fournisseur"}
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
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nom *</label>
                  <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Ex: Grossiste ABC" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Contact / Responsable</label>
                  <input type="text" value={form.contact ?? ""} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="Ex: Jean Dupont" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input type="tel" value={form.telephone ?? ""} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="+228 90 00 00 00" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={form.email ?? ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="contact@fournisseur.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Adresse</label>
                  <input type="text" value={form.adresse ?? ""} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                    placeholder="Lomé, Togo" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Note</label>
                  <textarea value={form.note ?? ""} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    rows={2} placeholder="Informations complémentaires…"
                    className={`${inputCls} resize-none`} />
                </div>
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
    </div>
  );
}
