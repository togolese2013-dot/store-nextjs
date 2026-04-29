"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminUser, Utilisateur, Permission } from "@/lib/admin-db";
import type { AdminPermissions, ModuleKey } from "@/lib/admin-permissions";
import { ADMIN_MODULES } from "@/lib/admin-permissions";
import {
  X, Pencil, Trash2, Loader2, ShieldCheck, Eye, EyeOff,
  Crown, UserCircle2, ChevronDown, ChevronUp, Users, Package,
  ShoppingBag, Settings, BarChart2, RefreshCw,
} from "lucide-react";

// ── Styles ────────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 transition-colors";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

// ── Helpers ───────────────────────────────────────────────────────────────────

const POSTES = ["Administrateur", "Commercial", "Responsable", "Livreur"] as const;
type Poste = typeof POSTES[number];

const POSTE_COLORS: Record<string, string> = {
  Administrateur: "bg-violet-100 text-violet-700",
  Commercial:     "bg-blue-100 text-blue-700",
  Responsable:    "bg-amber-100 text-amber-700",
  Livreur:        "bg-green-100 text-green-700",
  staff:          "bg-slate-100 text-slate-600",
};

const AVATAR_BG: Record<string, string> = {
  Administrateur: "bg-violet-500",
  Commercial:     "bg-blue-500",
  Responsable:    "bg-amber-500",
  Livreur:        "bg-green-500",
  staff:          "bg-slate-400",
};

const MODULE_ICONS: Record<ModuleKey, React.ElementType> = {
  magasin:  Package,
  boutique: ShoppingBag,
  store:    Settings,
  crm:      Users,
  admin:    BarChart2,
};

const MODULE_COLORS: Record<ModuleKey, { bg: string; ring: string; text: string; dot: string }> = {
  magasin:  { bg: "bg-brand-50",   ring: "border-brand-200",   text: "text-brand-700",   dot: "bg-brand-500" },
  boutique: { bg: "bg-amber-50",   ring: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" },
  store:    { bg: "bg-emerald-50", ring: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  crm:      { bg: "bg-indigo-50",  ring: "border-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  admin:    { bg: "bg-violet-50",  ring: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500" },
};

function avatarBg(poste: string | null) { return AVATAR_BG[poste ?? ""] ?? "bg-slate-400"; }
function posteColor(poste: string | null) { return POSTE_COLORS[poste ?? ""] ?? "bg-slate-100 text-slate-600"; }

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function parsePermissions(json: string | null): AdminPermissions {
  if (!json) return {};
  try { return JSON.parse(json) as AdminPermissions; } catch { return {}; }
}

// ── Shared modal overlay ──────────────────────────────────────────────────────

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-brand-600 border-brand-600" : "bg-white border-slate-300"
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ACCOUNTS — Permissions modal
// ════════════════════════════════════════════════════════════════════════════

function AdminPermissionsModal({
  user,
  onClose,
}: {
  user:    AdminUser;
  onClose: () => void;
}) {
  const router = useRouter();
  const [perms,   setPerms]   = useState<AdminPermissions>(() => parsePermissions(user.permissions));
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");
  const [open,    setOpen]    = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    (Object.keys(ADMIN_MODULES) as ModuleKey[]).forEach(k => { init[k] = true; });
    return init;
  });

  const moduleKeys = Object.keys(ADMIN_MODULES) as ModuleKey[];

  function isModuleEnabled(mk: ModuleKey) { return mk in perms; }

  function toggleModule(mk: ModuleKey) {
    setPerms(prev => {
      const next = { ...prev };
      if (mk in next) {
        delete next[mk];
      } else {
        next[mk] = "all";
      }
      return next;
    });
  }

  function getModulePages(mk: ModuleKey): string[] {
    const p = perms[mk];
    if (!p) return [];
    if (p === "all") return ADMIN_MODULES[mk].pages.map(pg => pg.id);
    return p as string[];
  }

  function isPageChecked(mk: ModuleKey, pageId: string) {
    const p = perms[mk];
    if (!p) return false;
    if (p === "all") return true;
    return (p as string[]).includes(pageId);
  }

  function togglePage(mk: ModuleKey, pageId: string) {
    setPerms(prev => {
      const next = { ...prev };
      const allPageIds = ADMIN_MODULES[mk].pages.map(pg => pg.id);
      let current = getModulePages(mk);

      if (current.includes(pageId)) {
        current = current.filter(p => p !== pageId);
      } else {
        current = [...current, pageId];
      }

      if (current.length === 0) {
        delete next[mk];
      } else if (current.length === allPageIds.length) {
        next[mk] = "all";
      } else {
        next[mk] = current;
      }
      return next;
    });
  }

  function toggleAllPages(mk: ModuleKey) {
    const allPages = ADMIN_MODULES[mk].pages.map(pg => pg.id);
    const current  = getModulePages(mk);
    const allChecked = current.length === allPages.length;

    setPerms(prev => {
      const next = { ...prev };
      if (allChecked) {
        // Désactiver le module entier
        delete next[mk];
      } else {
        next[mk] = "all";
      }
      return next;
    });
  }

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/users/${user.id}/permissions`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ permissions: Object.keys(perms).length ? perms : null }),
    });
    setSaving(false);
    if (!res.ok) { setMsg("Erreur lors de la sauvegarde."); return; }
    router.refresh();
    onClose();
  }

  const enabledCount = Object.keys(perms).length;

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Permissions d&apos;accès</p>
            <h2 className="font-bold text-lg text-slate-900">{user.nom}</h2>
            <p className="text-xs text-slate-400 mt-0.5">@{user.username} · {enabledCount} carte{enabledCount > 1 ? "s" : ""} activée{enabledCount > 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note super_admin */}
        {user.role === "super_admin" && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
            <Crown className="w-4 h-4 shrink-0" />
            Super Admin — accès total à toutes les cartes, quelles que soient les permissions.
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {moduleKeys.map(mk => {
            const mod      = ADMIN_MODULES[mk];
            const colors   = MODULE_COLORS[mk];
            const Icon     = MODULE_ICONS[mk];
            const enabled  = isModuleEnabled(mk);
            const pages    = mod.pages;
            const checked  = getModulePages(mk);
            const allCheck = checked.length === pages.length;
            const isOpen   = open[mk];

            return (
              <div
                key={mk}
                className={`rounded-2xl border transition-all ${
                  enabled ? `${colors.ring} ${colors.bg}` : "border-slate-200 bg-white"
                }`}
              >
                {/* Module header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Enable/disable toggle */}
                  <button
                    type="button"
                    onClick={() => toggleModule(mk)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      enabled ? "bg-brand-600" : "bg-slate-200"
                    }`}
                    disabled={user.role === "super_admin"}
                    title={enabled ? "Désactiver ce module" : "Activer ce module"}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${enabled ? colors.bg : "bg-slate-100"}`}>
                    <Icon className={`w-4 h-4 ${enabled ? colors.text : "text-slate-400"}`} />
                  </div>

                  <div className="flex-1">
                    <p className={`font-bold text-sm ${enabled ? colors.text : "text-slate-400"}`}>
                      {mod.label}
                    </p>
                    {enabled && (
                      <p className="text-xs text-slate-400">{checked.length}/{pages.length} pages</p>
                    )}
                  </div>

                  {enabled && (
                    <button
                      type="button"
                      onClick={() => setOpen(o => ({ ...o, [mk]: !isOpen }))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Pages list */}
                {enabled && isOpen && (
                  <div className="px-4 pb-4 border-t border-white/60 pt-3">
                    {/* Toggle all */}
                    <button
                      type="button"
                      onClick={() => toggleAllPages(mk)}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-3 transition-colors"
                    >
                      <CheckBox
                        checked={allCheck}
                        onChange={() => toggleAllPages(mk)}
                      />
                      Tout sélectionner
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {pages.map(pg => (
                        <button
                          key={pg.id}
                          type="button"
                          onClick={() => togglePage(mk, pg.id)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors"
                        >
                          <CheckBox
                            checked={isPageChecked(mk, pg.id)}
                            onChange={() => togglePage(mk, pg.id)}
                          />
                          <span className="text-sm text-slate-700 font-medium">{pg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          {msg && <p className="text-sm text-red-600 flex-1">{msg}</p>}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-bold hover:bg-brand-800 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ACCOUNTS — Create/Edit modal
// ════════════════════════════════════════════════════════════════════════════

function AdminUserFormModal({
  user,
  onClose,
}: {
  user:    AdminUser | null;
  onClose: () => void;
}) {
  const router   = useRouter();
  const isEdit   = !!user;
  const [nom,       setNom]       = useState(user?.nom       ?? "");
  const [username,  setUsername]  = useState(user?.username  ?? "");
  const [email,     setEmail]     = useState(user?.email     ?? "");
  const [telephone, setTelephone] = useState(user?.telephone ?? "");
  const [poste,     setPoste]     = useState(user?.poste     ?? "Responsable");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");

  // Auto-suggest username from nom
  function handleNomChange(v: string) {
    setNom(v);
    if (!isEdit && !username) {
      setUsername(v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 30));
    }
  }

  async function submit() {
    if (!nom || !username) { setMsg("Nom et nom d'utilisateur requis."); return; }
    if (!isEdit && !password) { setMsg("Mot de passe requis à la création."); return; }
    setLoading(true); setMsg("");

    const body: Record<string, string> = { nom, username, poste };
    if (email)     body.email     = email;
    if (telephone) body.telephone = telephone;
    if (password)  body.password  = password;

    const res = await fetch(
      isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users",
      { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Erreur"); return; }
    router.refresh();
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">
            {isEdit ? "Modifier le compte" : "Nouveau compte admin"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{msg}</p>}

          <div>
            <label className={labelCls}>Nom complet *</label>
            <input type="text" value={nom} onChange={e => handleNomChange(e.target.value)}
              className={inputCls} placeholder="Prénom Nom" />
          </div>

          <div>
            <label className={labelCls}>Nom d&apos;utilisateur * (pour la connexion)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
              <input type="text" value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className={inputCls + " pl-7"} placeholder="nom_utilisateur" />
            </div>
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
            <label className={labelCls}>Poste</label>
            <select value={poste} onChange={e => setPoste(e.target.value)} className={inputCls}>
              {POSTES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>{isEdit ? "Nouveau mot de passe" : "Mot de passe *"}</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                className={inputCls + " pr-10"}
                placeholder={isEdit ? "Laisser vide = inchangé" : "••••••••"}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le compte"}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEAM — Create/Edit modal (utilisateurs)
// ════════════════════════════════════════════════════════════════════════════

function TeamFormModal({ user, onClose }: { user: Utilisateur | null; onClose: () => void }) {
  const router   = useRouter();
  const isEdit   = !!user;
  const [nom,       setNom]       = useState(user?.nom       ?? "");
  const [email,     setEmail]     = useState(user?.email     ?? "");
  const [telephone, setTelephone] = useState(user?.telephone ?? "");
  const [poste,     setPoste]     = useState<string>(user?.poste ?? "Commercial");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");

  async function submit() {
    if (!nom || !poste) { setMsg("Nom et poste requis."); return; }
    if (!isEdit && !password) { setMsg("Mot de passe requis."); return; }
    setLoading(true); setMsg("");

    const body: Record<string, string> = { nom, poste };
    if (email)     body.email     = email;
    if (telephone) body.telephone = telephone;
    if (password)  body.motDePasse = password;

    const res = await fetch(
      isEdit ? `/api/admin/team/${user!.id}` : "/api/admin/team",
      { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Erreur"); return; }
    router.refresh();
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">
            {isEdit ? "Modifier le membre" : "Nouveau membre d'équipe"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{msg}</p>}

          <div>
            <label className={labelCls}>Nom complet *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} className={inputCls} placeholder="Prénom Nom" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@ex.com" />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} className={inputCls} placeholder="+228 90 00 00 00" />
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
              <input type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputCls + " pr-10"}
                placeholder={isEdit ? "Laisser vide = inchangé" : "••••••••"}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteModal({ nom, url, onClose }: { nom: string; url: string; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  async function confirm() {
    setLoading(true); setErr("");
    const res = await fetch(url, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      try { const d = await res.json(); setErr(d.error || "Erreur lors de la suppression."); }
      catch { setErr("Erreur lors de la suppression."); }
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">Supprimer ?</h3>
          <p className="text-sm text-slate-500 mb-4">
            <strong>{nom}</strong> et tous ses accès seront définitivement supprimés.
          </p>
          {err && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-4">{err}</p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button onClick={confirm} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ── Permission summary chips ──────────────────────────────────────────────────

function PermChips({ permissions }: { permissions: string | null }) {
  const perms = parsePermissions(permissions);
  const keys  = Object.keys(perms) as ModuleKey[];
  if (!keys.length) return <span className="text-xs text-slate-400">Aucun accès</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {keys.map(mk => {
        const c = MODULE_COLORS[mk];
        const p = perms[mk];
        const count = p === "all"
          ? ADMIN_MODULES[mk].pages.length
          : (p as string[]).length;
        return (
          <span key={mk} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {ADMIN_MODULES[mk].label}
            <span className="opacity-70">·{count}</span>
          </span>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

// ── Team module badges ────────────────────────────────────────────────────────

const MODULE_LABEL: Record<string, string> = {
  magasin:  "Magasin",
  boutique: "Boutique",
  store:    "Store",
  crm:      "CRM",
  admin:    "Admin",
};

const MODULE_BADGE_COLOR: Record<string, string> = {
  magasin:  "bg-brand-50 text-brand-700 border-brand-200",
  boutique: "bg-amber-50 text-amber-700 border-amber-200",
  store:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  crm:      "bg-indigo-50 text-indigo-700 border-indigo-200",
  admin:    "bg-violet-50 text-violet-700 border-violet-200",
};

function TeamModuleBadges({ modules }: { modules: string[] }) {
  if (!modules.length) return <span className="text-xs text-slate-400 italic">Aucun accès</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {modules.map(mod => (
        <span
          key={mod}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            MODULE_BADGE_COLOR[mod] ?? "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {MODULE_LABEL[mod] ?? mod}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type Tab = "admin-accounts" | "team";

export default function UsersManager({
  adminUsers,
  initialUtilisateurs,
  allPermissions,
  teamModules,
}: {
  adminUsers:           AdminUser[];
  initialUtilisateurs:  Utilisateur[];
  allPermissions:       Permission[];
  teamModules:          Record<number, string[]>;
}) {
  const router = useRouter();
  const [tab,        setTab]        = useState<Tab>("admin-accounts");

  // Admin accounts state
  const [showCreate,  setShowCreate]  = useState(false);
  const [editAdmin,   setEditAdmin]   = useState<AdminUser | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<AdminUser | null>(null);
  const [permsAdmin,  setPermsAdmin]  = useState<AdminUser | null>(null);
  const [togglingA,   setTogglingA]   = useState<number | null>(null);

  // Team state
  const [showCreateT, setShowCreateT] = useState(false);
  const [editTeam,    setEditTeam]    = useState<Utilisateur | null>(null);
  const [deleteTeam,  setDeleteTeam]  = useState<Utilisateur | null>(null);
  const [togglingT,   setTogglingT]   = useState<number | null>(null);

  void allPermissions;

  async function toggleAdminActif(u: AdminUser) {
    setTogglingA(u.id);
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: u.actif ? 0 : 1 }),
    });
    setTogglingA(null);
    router.refresh();
  }

  async function toggleTeamActif(u: Utilisateur) {
    setTogglingT(u.id);
    await fetch(`/api/admin/team/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: u.actif ? 0 : 1 }),
    });
    setTogglingT(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Équipe & Accès</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gérez les comptes admin et les membres de l&apos;équipe</p>
        </div>
        <button
          onClick={() => tab === "admin-accounts" ? setShowCreate(true) : setShowCreateT(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([ "admin-accounts", "team"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "admin-accounts" ? (
              <span className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5" />
                Comptes Admin
                <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">
                  {adminUsers.length}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserCircle2 className="w-3.5 h-3.5" />
                Équipe Opérationnelle
                <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                  {initialUtilisateurs.length}
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ TAB : Comptes Admin ══════════ */}
      {tab === "admin-accounts" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-[44px_1fr_160px_110px_1fr_180px] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span />
            <span>Compte</span>
            <span>Poste</span>
            <span>Statut</span>
            <span>Cartes accessibles</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-slate-50">
            {adminUsers.length === 0 && (
              <div className="px-5 py-12 text-center text-slate-400 text-sm">
                Aucun compte admin enregistré.
              </div>
            )}
            {adminUsers.map(u => (
              <div key={u.id}
                className="grid grid-cols-[44px_1fr_160px_110px_1fr_180px] gap-3 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors"
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(u.poste)}`}>
                  {u.nom.charAt(0).toUpperCase()}
                </div>

                {/* Nom + username */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm truncate">{u.nom}</p>
                    {u.role === "super_admin" && (
                      <span title="Super Admin">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                </div>

                {/* Poste */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${posteColor(u.poste)}`}>
                  {u.poste ?? "—"}
                </span>

                {/* Statut */}
                <button
                  onClick={() => toggleAdminActif(u)}
                  disabled={togglingA === u.id}
                  title={u.actif ? "Cliquer pour désactiver" : "Cliquer pour activer"}
                >
                  {togglingA === u.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.actif ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {u.actif ? "Actif" : "Inactif"}
                    </span>
                  )}
                </button>

                {/* Cartes */}
                <div>
                  {u.role === "super_admin"
                    ? <span className="text-xs font-semibold text-amber-600 flex items-center gap-1"><Crown className="w-3 h-3" />Tout accès</span>
                    : <PermChips permissions={u.permissions} />
                  }
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  {u.role !== "super_admin" && (
                    <button
                      onClick={() => setPermsAdmin(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Accès
                    </button>
                  )}
                  <button onClick={() => setEditAdmin(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteAdmin(u)}
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
      )}

      {/* ══════════ TAB : Équipe Opérationnelle ══════════ */}
      {tab === "team" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-[44px_1fr_140px_100px_1fr_100px] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span />
            <span>Membre</span>
            <span>Poste</span>
            <span>Statut</span>
            <span>Accès</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-slate-50">
            {initialUtilisateurs.length === 0 && (
              <div className="px-5 py-12 text-center text-slate-400 text-sm">
                Aucun membre enregistré.
              </div>
            )}
            {initialUtilisateurs.map(u => (
              <div key={u.id}
                className="grid grid-cols-[44px_1fr_140px_100px_1fr_100px] gap-3 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(u.poste)}`}>
                  {u.nom.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{u.nom}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email || u.telephone || "—"}</p>
                </div>

                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${posteColor(u.poste)}`}>
                  {u.poste}
                </span>

                <button
                  onClick={() => toggleTeamActif(u)}
                  disabled={togglingT === u.id}
                  title={u.actif ? "Cliquer pour désactiver" : "Cliquer pour activer"}
                >
                  {togglingT === u.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.actif ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {u.actif ? "Actif" : "Inactif"}
                    </span>
                  )}
                </button>

                {/* Access badges */}
                <TeamModuleBadges modules={teamModules[u.id] ?? []} />

                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => setEditTeam(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTeam(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate  && <AdminUserFormModal user={null}       onClose={() => setShowCreate(false)} />}
      {editAdmin   && <AdminUserFormModal user={editAdmin}  onClose={() => setEditAdmin(null)} />}
      {permsAdmin  && <AdminPermissionsModal user={permsAdmin} onClose={() => setPermsAdmin(null)} />}
      {deleteAdmin && (
        <DeleteModal
          nom={deleteAdmin.nom}
          url={`/api/admin/users/${deleteAdmin.id}`}
          onClose={() => setDeleteAdmin(null)}
        />
      )}

      {showCreateT && <TeamFormModal user={null}      onClose={() => setShowCreateT(false)} />}
      {editTeam    && <TeamFormModal user={editTeam}  onClose={() => setEditTeam(null)} />}
      {deleteTeam  && (
        <DeleteModal
          nom={deleteTeam.nom}
          url={`/api/admin/team/${deleteTeam.id}`}
          onClose={() => setDeleteTeam(null)}
        />
      )}
    </div>
  );
}
