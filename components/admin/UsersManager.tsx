"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Utilisateur, Permission } from "@/lib/admin-db";
import { X, Pencil, Trash2, Loader2, ShieldCheck, Eye, EyeOff, ChevronDown } from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const POSTES = ["Administrateur", "Commercial", "Responsable", "Livreur"] as const;
type Poste = typeof POSTES[number];

const POSTE_COLORS: Record<Poste, string> = {
  Administrateur: "bg-violet-100 text-violet-700",
  Commercial:     "bg-blue-100 text-blue-700",
  Responsable:    "bg-amber-100 text-amber-700",
  Livreur:        "bg-green-100 text-green-700",
};

const AVATAR_COLORS: Record<Poste, string> = {
  Administrateur: "bg-violet-500",
  Commercial:     "bg-blue-500",
  Responsable:    "bg-amber-500",
  Livreur:        "bg-green-500",
};

function avatarColor(poste: string): string {
  return AVATAR_COLORS[poste as Poste] ?? "bg-slate-400";
}

function posteColor(poste: string): string {
  return POSTE_COLORS[poste as Poste] ?? "bg-slate-100 text-slate-600";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function groupByModule(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const p of permissions) {
    const mod = p.module || "Général";
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(p);
  }
  return groups;
}

// ─── input styles ─────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1";


// ─── Modal Overlay ────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── Checkbox SVG ─────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Permissions Modal ────────────────────────────────────────────────────────

function PermissionsModal({
  user,
  allPermissions,
  onClose,
}: {
  user: Utilisateur;
  allPermissions: Permission[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loaded,   setLoaded]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");

  // Load current permissions on mount
  useEffect(() => {
    fetch(`/api/admin/users/${user.id}/permissions`)
      .then(r => r.json())
      .then((ids: number[]) => {
        setSelected(new Set(ids));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user.id]);

  const grouped = groupByModule(allPermissions);

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleModule(perms: Permission[]) {
    const allChecked = perms.every(p => selected.has(p.id));
    setSelected(prev => {
      const next = new Set(prev);
      perms.forEach(p => allChecked ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  }

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/users/${user.id}/permissions`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ permissionIds: Array.from(selected) }),
    });
    setSaving(false);
    if (!res.ok) { setMsg("Erreur lors de la sauvegarde."); return; }
    router.refresh();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Gestion des accès</p>
            <h2 className="font-bold text-lg text-slate-900">{user.nom}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {!loaded ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Chargement...
            </div>
          ) : (
            Object.entries(grouped).map(([module, perms]) => {
              const allChecked  = perms.every(p => selected.has(p.id));
              const someChecked = perms.some(p => selected.has(p.id));
              return (
                <div key={module} className="border border-slate-200 rounded-2xl overflow-hidden">
                  {/* Module header — click to toggle all */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    onClick={() => toggleModule(perms)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        allChecked
                          ? "bg-blue-500 border-blue-500"
                          : someChecked
                          ? "bg-blue-100 border-blue-300"
                          : "border-slate-300 bg-white"
                      }`}>
                        {allChecked && <CheckIcon />}
                        {someChecked && !allChecked && (
                          <span className="w-2 h-0.5 bg-blue-500 rounded" />
                        )}
                      </span>
                      <span className="font-semibold text-sm text-slate-800">{module}</span>
                      <span className="text-xs text-slate-400">
                        {perms.filter(p => selected.has(p.id)).length}/{perms.length}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Permissions grid — 2 columns */}
                  <div className="grid grid-cols-2 gap-px bg-slate-100">
                    {perms.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggle(p.id)}
                        className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-blue-50 transition-colors text-left"
                      >
                        <span className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                          selected.has(p.id)
                            ? "bg-blue-500 border-blue-500"
                            : "border-slate-300 bg-white"
                        }`}>
                          {selected.has(p.id) && <CheckIcon />}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800 leading-tight">{p.nom}</p>
                          {p.description && (
                            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{p.description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          {msg && <p className="text-sm text-red-600 flex-1">{msg}</p>}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button onClick={save} disabled={saving || !loaded}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── User Form Modal (Create / Edit) ─────────────────────────────────────────

function UserFormModal({
  user,
  onClose,
}: {
  user: Utilisateur | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [nom,       setNom]       = useState(user?.nom             ?? "");
  const [email,     setEmail]     = useState(user?.email           ?? "");
  const [telephone, setTelephone] = useState(user?.telephone       ?? "");
  const [poste,     setPoste]     = useState<string>(user?.poste ?? "Commercial");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");

  const isEdit = !!user;

  async function submit() {
    if (!nom || !poste) { setMsg("Nom et poste sont requis."); return; }
    if (!isEdit && !password) { setMsg("Mot de passe requis."); return; }
    setLoading(true); setMsg("");

    const body: Record<string, string> = { nom, poste };
    if (email)     body.email      = email;
    if (telephone) body.telephone  = telephone;
    if (password)  body.motDePasse = password;

    const res = await fetch(
      isEdit ? `/api/admin/users/${user.id}` : "/api/admin/users",
      {
        method:  isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      }
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Erreur"); return; }
    router.refresh();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">
            {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{msg}</p>}

          <div>
            <label className={labelCls}>Nom complet *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              className={inputCls} placeholder="Prénom Nom" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={inputCls} placeholder="email@ex.com" />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                className={inputCls} placeholder="+228 90 00 00 00" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Poste *</label>
            <select value={poste} onChange={e => setPoste(e.target.value)} className={inputCls}>
              {POSTES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>{isEdit ? "Nouveau mot de passe" : "Mot de passe *"}</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputCls + " pr-10"}
                placeholder={isEdit ? "Laisser vide pour ne pas changer" : "••••••••"}
              />
              <button type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ user, onClose }: { user: Utilisateur; onClose: () => void }) {
  const router    = useRouter();
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    router.refresh();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">Supprimer l&apos;utilisateur ?</h3>
          <p className="text-sm text-slate-500 mb-6">
            <strong>{user.nom}</strong> sera définitivement supprimé ainsi que tous ses accès.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button onClick={confirm} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersManager({
  initialUtilisateurs,
  allPermissions,
}: {
  initialUtilisateurs: Utilisateur[];
  allPermissions:      Permission[];
}) {
  // Use prop directly — router.refresh() will cause server re-render + new props
  const users = initialUtilisateurs;

  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser,   setEditUser]   = useState<Utilisateur | null>(null);
  const [deleteUser, setDeleteUser] = useState<Utilisateur | null>(null);
  const [accessUser, setAccessUser] = useState<Utilisateur | null>(null);
  const [toggling,   setToggling]   = useState<number | null>(null);

  async function toggleActif(u: Utilisateur) {
    setToggling(u.id);
    await fetch(`/api/admin/users/${u.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ actif: u.actif ? 0 : 1 }),
    });
    setToggling(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Utilisateurs</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {users.length} membre{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_140px_110px_120px_160px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <span>Utilisateur</span>
          <span>Rôle</span>
          <span>Statut</span>
          <span>Date</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Data rows */}
        <div className="divide-y divide-slate-50">
          {users.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">
              Aucun utilisateur enregistré.
            </div>
          )}
          {users.map(u => (
            <div
              key={u.id}
              className="grid grid-cols-[1fr_140px_110px_120px_160px] gap-4 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors"
            >
              {/* Avatar + Name/Email */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(u.poste)}`}>
                  {u.nom.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{u.nom}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email || u.telephone || "—"}</p>
                </div>
              </div>

              {/* Poste badge */}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${posteColor(u.poste)}`}>
                {u.poste}
              </span>

              {/* Statut toggle */}
              <button
                onClick={() => toggleActif(u)}
                disabled={toggling === u.id}
                title={u.actif ? "Cliquer pour désactiver" : "Cliquer pour activer"}
              >
                {toggling === u.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    u.actif
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {u.actif ? "Actif" : "Inactif"}
                  </span>
                )}
              </button>

              {/* Date */}
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {formatDate(u.date_creation)}
              </span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => setAccessUser(u)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Accès
                </button>
                <button
                  onClick={() => setEditUser(u)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteUser(u)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <UserFormModal user={null} onClose={() => setShowCreate(false)} />
      )}
      {editUser && (
        <UserFormModal user={editUser} onClose={() => setEditUser(null)} />
      )}
      {deleteUser && (
        <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} />
      )}
      {accessUser && (
        <PermissionsModal
          user={accessUser}
          allPermissions={allPermissions}
          onClose={() => setAccessUser(null)}
        />
      )}
    </div>
  );
}
