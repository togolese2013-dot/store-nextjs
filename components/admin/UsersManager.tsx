"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminUser } from "@/lib/admin-db";
import { Plus, Loader2, ShieldCheck, User, UserX } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";
const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";
const ROLES = ["super_admin", "admin", "editor"] as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", editor: "Éditeur",
};

export default function UsersManager({
  users, currentSessionId,
}: { users: AdminUser[]; currentSessionId: number }) {
  const router = useRouter();
  const [showForm,  setShowForm]  = useState(false);
  const [nom,       setNom]       = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [role,      setRole]      = useState<typeof ROLES[number]>("admin");
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");

  async function create() {
    if (!nom || !email || !password) { setMsg("Tous les champs sont requis."); return; }
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, email, password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Erreur"); return; }
    setShowForm(false); setNom(""); setEmail(""); setPassword("");
    router.refresh();
  }

  async function toggleActive(id: number, actif: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !actif }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-700 text-slate-900">{users.length} utilisateur{users.length > 1 ? "s" : ""}</h2>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {users.map(u => (
            <div key={u.id} className="px-5 py-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${u.actif ? "bg-brand-900" : "bg-slate-300"}`}>
                {u.nom.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{u.nom}
                  {u.id === currentSessionId && <span className="ml-2 text-xs text-brand-500 font-normal">(vous)</span>}
                </p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                u.role === "super_admin" ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"
              }`}>
                {u.role === "super_admin" && <ShieldCheck className="w-3 h-3" />}
                {ROLE_LABELS[u.role]}
              </span>
              {u.id !== currentSessionId && (
                <button onClick={() => toggleActive(u.id, u.actif)}
                  className={`p-2 rounded-xl transition-colors ${u.actif ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`}
                  title={u.actif ? "Désactiver" : "Activer"}
                >
                  {u.actif ? <UserX className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl border border-brand-100 p-6 space-y-4">
          <h3 className="font-display font-700 text-slate-900">Nouvel utilisateur</h3>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Nom</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} className={inputCls} placeholder="Prénom Nom" /></div>
            <div><label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@exemple.com" /></div>
            <div><label className={labelCls}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" /></div>
            <div><label className={labelCls}>Rôle</label>
              <select value={role} onChange={e => setRole(e.target.value as typeof ROLES[number])} className={inputCls}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={create} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer l'utilisateur
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
            >Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
