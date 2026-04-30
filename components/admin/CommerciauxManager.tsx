"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Eye, Pencil, UserX, Loader2, X,
  ChevronLeft, ChevronRight, Package, DollarSign,
  ShoppingCart, TrendingUp, Check, Circle, Search,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import TabBar     from "@/components/admin/TabBar";
import StatCard   from "@/components/admin/StatCard";
import { formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Commercial {
  id:                     number;
  nom:                    string;
  email:                  string;
  telephone:              string | null;
  taux_commission:        number;
  actif:                  number;
  nb_produits:            number;
  nb_ventes:              number;
  total_commissions:      number;
  commissions_en_attente: number;
  created_at:             string;
}

interface Commission {
  id:               number;
  commercial_id:    number;
  commercial_nom:   string;
  commercial_email: string;
  facture_id:       number | null;
  montant:          number;
  statut:           "en_attente" | "paye";
  note:             string | null;
  created_at:       string;
  paid_at:          string | null;
}

interface Stats {
  commerciaux_actifs:      number;
  ventes_total:            number;
  commissions_total:       number;
  commissions_payees:      number;
  commissions_en_attente:  number;
}

interface Produit { id: number; nom: string }

// ─── Modal Formulaire Commercial ─────────────────────────────────────────────

function FormModal({ commercial, onClose, onSaved }: {
  commercial: Partial<Commercial> | null;
  onClose:    () => void;
  onSaved:    () => void;
}) {
  const isEdit = !!commercial?.id;
  const [form, setForm] = useState({
    nom:             commercial?.nom             ?? "",
    email:           commercial?.email           ?? "",
    telephone:       commercial?.telephone       ?? "",
    taux_commission: commercial?.taux_commission ?? 5,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim() || !form.email.trim()) { setError("Nom et email requis"); return; }
    setSaving(true); setError("");
    const url    = isEdit ? `/api/admin/commerciaux/${commercial!.id}` : "/api/admin/commerciaux";
    const method = isEdit ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data   = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erreur"); return; }
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{isEdit ? "Modifier le commercial" : "Ajouter un commercial"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nom complet *</label>
            <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
              value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex : Joel Djanta" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
            <input type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joel@togolese.net" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone</label>
            <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
              value={form.telephone ?? ""} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="90123456" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Taux de commission (%)</label>
            <input type="number" min="0" max="100" step="0.5"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
              value={form.taux_commission} onChange={e => setForm(f => ({ ...f, taux_commission: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Gérer Produits ─────────────────────────────────────────────────────

function ProduitsModal({ commercial, onClose, onSaved }: {
  commercial: Commercial;
  onClose:    () => void;
  onSaved:    () => void;
}) {
  const [allProduits,      setAllProduits]      = useState<Produit[]>([]);
  const [selectedIds,      setSelectedIds]      = useState<Set<number>>(new Set());
  const [search,           setSearch]           = useState("");
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products?limit=500").then(r => r.json()),
      fetch(`/api/admin/commerciaux/${commercial.id}/produits`).then(r => r.json()),
    ]).then(([allRes, assignedRes]) => {
      setAllProduits(allRes.items ?? []);
      setSelectedIds(new Set((assignedRes.items ?? []).map((p: Produit) => p.id)));
      setLoading(false);
    });
  }, [commercial.id]);

  function toggle(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/commerciaux/${commercial.id}/produits`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit_ids: [...selectedIds] }),
    });
    setSaving(false);
    onSaved(); onClose();
  }

  const filtered = allProduits.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Produits — {commercial.nom}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{selectedIds.size} produit(s) sélectionné(s)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
              placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Aucun produit trouvé</p>
          ) : filtered.map(p => (
            <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
              <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${selectedIds.has(p.id) ? "bg-emerald-700 border-emerald-700" : "border-slate-300"}`}>
                {selectedIds.has(p.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <input type="checkbox" className="sr-only" checked={selectedIds.has(p.id)} onChange={() => toggle(p.id)} />
              <span className="text-sm text-slate-700 leading-tight">{p.nom}</span>
            </label>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

type Tab = "commerciaux" | "commissions" | "acces";

const TABS = [
  { key: "commerciaux",  label: "Commerciaux",    icon: Users },
  { key: "commissions",  label: "Commissions",    icon: DollarSign },
  { key: "acces",        label: "Accès Produits", icon: Package },
];

export default function CommerciauxManager() {
  const [tab,          setTab]          = useState<Tab>("commerciaux");
  const [commerciaux,  setCommerciaux]  = useState<Commercial[]>([]);
  const [commissions,  setCommissions]  = useState<Commission[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [formModal,    setFormModal]    = useState<Partial<Commercial> | null | false>(false);
  const [prodModal,    setProdModal]    = useState<Commercial | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, cmRes, sRes] = await Promise.all([
        fetch("/api/admin/commerciaux").then(r => r.json()),
        fetch("/api/admin/commerciaux/commissions").then(r => r.json()),
        fetch("/api/admin/commerciaux/stats").then(r => r.json()),
      ]);
      setCommerciaux(cRes.items ?? []);
      setCommissions(cmRes.items ?? []);
      setStats(sRes ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActif(c: Commercial) {
    await fetch(`/api/admin/commerciaux/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, actif: c.actif ? 0 : 1 }),
    });
    load();
  }

  async function payerCommission(id: number) {
    await fetch(`/api/admin/commerciaux/commissions/${id}`, { method: "PATCH" });
    load();
  }

  const filteredCommerciaux = commerciaux.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Onglet Commerciaux ────────────────────────────────────────────────────
  function TabCommerciaux() {
    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Commerciaux actifs"   value={stats?.commerciaux_actifs ?? 0}              icon={Users}       iconColor="text-emerald-500" />
          <StatCard title="Ventes total"          value={stats?.ventes_total ?? 0}                    icon={ShoppingCart} iconColor="text-amber-500" />
          <StatCard title="Chiffre d'affaires"   value={formatPrice(0)}                              icon={TrendingUp}  iconColor="text-blue-500" />
          <StatCard title="Commissions totales"  value={formatPrice(stats?.commissions_total ?? 0)}  icon={DollarSign}  iconColor="text-violet-500" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Commercial</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Ventes</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Commissions</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Taux</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : filteredCommerciaux.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucun commercial trouvé</td></tr>
                ) : filteredCommerciaux.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{c.nom}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{c.nb_ventes}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{formatPrice(c.total_commissions)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.taux_commission.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${c.actif ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        {c.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setProdModal(c)} title="Voir produits"
                          className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setFormModal(c)} title="Modifier"
                          className="p-1.5 rounded-lg border border-slate-200 text-amber-600 hover:bg-amber-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActif(c)} title={c.actif ? "Désactiver" : "Activer"}
                          className="p-1.5 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 transition-colors">
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── Onglet Commissions ────────────────────────────────────────────────────
  function TabCommissions() {
    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total commissions"      value={formatPrice(stats?.commissions_total ?? 0)}       icon={DollarSign} iconColor="text-slate-500" />
          <StatCard title="Commissions payées"     value={formatPrice(stats?.commissions_payees ?? 0)}      icon={Check}      iconColor="text-emerald-500" />
          <StatCard title="Commissions en attente" value={formatPrice(stats?.commissions_en_attente ?? 0)}  icon={DollarSign} iconColor="text-amber-500" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Commercial</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Montant</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></td></tr>
                ) : commissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <DollarSign className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-400 text-sm">Aucune commission enregistrée</p>
                    </td>
                  </tr>
                ) : commissions.map(cm => (
                  <tr key={cm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{cm.commercial_nom}</p>
                      <p className="text-xs text-slate-400">{cm.commercial_email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(cm.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatPrice(cm.montant)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cm.statut === "paye" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        {cm.statut === "paye" ? "Payée" : "En attente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {cm.statut === "en_attente" && (
                        <button onClick={() => payerCommission(cm.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 ml-auto">
                          <Check className="w-3 h-3" /> Marquer payée
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── Onglet Accès Produits ─────────────────────────────────────────────────
  function TabAccesProduits() {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Commercial</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Produits attribués</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></td></tr>
              ) : commerciaux.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-400">Aucun commercial</td></tr>
              ) : commerciaux.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.nom}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.nb_produits === 0
                      ? <span className="text-slate-400 italic">Aucun produit attribué</span>
                      : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold"><Package className="w-3 h-3" />{c.nb_produits} produit(s)</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setProdModal(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">
                      <Pencil className="w-3 h-3" /> Gérer Produits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe Commerciale"
        subtitle="Gestion des commerciaux et performance de vente"
        accent="amber"
        searchValue={tab === "commerciaux" ? search : undefined}
        onSearchChange={tab === "commerciaux" ? setSearch : undefined}
        onSearch={tab === "commerciaux" ? e => e.preventDefault() : undefined}
        searchPlaceholder="Rechercher un commercial…"
        ctaLabel="Ajouter Commercial"
        ctaIcon={Plus}
        onCtaClick={() => setFormModal({})}
      />

      <TabBar
        tabs={TABS}
        active={tab}
        onChange={k => { setTab(k as Tab); setSearch(""); }}
        accent="amber"
      />

      {tab === "commerciaux"  && <TabCommerciaux />}
      {tab === "commissions"  && <TabCommissions />}
      {tab === "acces"        && <TabAccesProduits />}

      {formModal !== false && (
        <FormModal
          commercial={formModal}
          onClose={() => setFormModal(false)}
          onSaved={load}
        />
      )}
      {prodModal && (
        <ProduitsModal
          commercial={prodModal}
          onClose={() => setProdModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
