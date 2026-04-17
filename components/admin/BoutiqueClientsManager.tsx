"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Eye, Pencil, Trash2, Loader2,
  ChevronLeft, ChevronRight, X, MapPin, Phone,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import TabBar     from "@/components/admin/TabBar";
import { formatPrice } from "@/lib/utils";
import type { BoutiqueClient } from "@/lib/admin-db";

type Filtre = "tous" | "debiteurs" | "dettes";

const TYPE_BADGE: Record<string, string> = {
  particulier:   "bg-slate-100 text-slate-600",
  professionnel: "bg-blue-100 text-blue-700",
};

// ─── Modal Formulaire ─────────────────────────────────────────────────────────

interface FormModalProps {
  client:   Partial<BoutiqueClient> | null;
  onClose:  () => void;
  onSaved:  () => void;
}

function FormModal({ client, onClose, onSaved }: FormModalProps) {
  const isEdit = !!client?.id;
  const [form, setForm] = useState({
    nom:          client?.nom ?? "",
    telephone:    client?.telephone ?? "",
    email:        client?.email ?? "",
    localisation: client?.localisation ?? "",
    type_client:  client?.type_client ?? "particulier",
    solde:        client?.solde ?? 0,
    notes:        client?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) { setError("Nom requis"); return; }
    setSaving(true);
    setError("");
    const url    = isEdit ? `/api/admin/boutique-clients/${client!.id}` : "/api/admin/boutique-clients";
    const method = isEdit ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data   = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erreur"); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{isEdit ? "Modifier le client" : "Ajouter un client"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nom *</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
                value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom du client" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
                value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="Ex : 90123456" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400" type="email"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Localisation</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
                value={form.localisation} onChange={e => setForm(f => ({ ...f, localisation: e.target.value }))} placeholder="Ville / Quartier" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
                value={form.type_client} onChange={e => setForm(f => ({ ...f, type_client: e.target.value as "particulier" | "professionnel" }))}>
                <option value="particulier">Particulier</option>
                <option value="professionnel">Professionnel</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Solde (F CFA)</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400" type="number" step="1"
                value={form.solde} onChange={e => setForm(f => ({ ...f, solde: Number(e.target.value) }))}
                placeholder="0 = neutre, positif = en avance, négatif = débiteur" />
              <p className="text-xs text-slate-400 mt-1">Positif = en avance · Négatif = débiteur</p>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
              <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 resize-none"
                rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Remarques internes…" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BoutiqueClientsManager() {
  const [clients,  setClients]  = useState<BoutiqueClient[]>([]);
  const [total,    setTotal]    = useState(0);
  const [counts,   setCounts]   = useState({ tous: 0, debiteurs: 0, dettes: 0 });
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [query,    setQuery]    = useState("");
  const [filtre,   setFiltre]   = useState<Filtre>("tous");
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<Partial<BoutiqueClient> | null | false>(false);
  const [migNeeded, setMigNeeded] = useState(false);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), q: query, filtre });
    const res = await fetch(`/api/admin/boutique-clients?${qs}`);
    const data = await res.json();
    if (res.ok) {
      setClients(data.data);
      setTotal(data.total);
      if (data._migrationNeeded) setMigNeeded(true);
    }
    setLoading(false);
  }, [page, query, filtre]);

  // Load counts for tabs
  const loadCounts = useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      fetch("/api/admin/boutique-clients?filtre=tous&page=1&q=").then(r => r.json()),
      fetch("/api/admin/boutique-clients?filtre=debiteurs&page=1&q=").then(r => r.json()),
      fetch("/api/admin/boutique-clients?filtre=dettes&page=1&q=").then(r => r.json()),
    ]);
    setCounts({ tous: r1.total ?? 0, debiteurs: r2.total ?? 0, dettes: r3.total ?? 0 });
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  function handleFiltre(f: Filtre) {
    setFiltre(f);
    setPage(1);
  }

  async function handleDelete(id: number, nom: string) {
    if (!confirm(`Supprimer le client "${nom}" ?`)) return;
    await fetch(`/api/admin/boutique-clients/${id}`, { method: "DELETE" });
    load();
    loadCounts();
  }

  const pages = Math.ceil(total / limit);

  const TABS: { key: Filtre; label: string; count: number; icon: React.ElementType }[] = [
    { key: "tous",      label: "Tous les clients",    count: counts.tous,      icon: Users },
    { key: "debiteurs", label: "Clients débiteurs",   count: counts.debiteurs, icon: Users },
    { key: "dettes",    label: "Dettes",              count: counts.dettes,    icon: Users },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des clients"
        subtitle="Gérez votre base clients et leurs dettes."
        accent="amber"
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        searchPlaceholder="Rechercher…"
        onRefresh={() => { load(); loadCounts(); }}
        ctaLabel="Ajouter un client"
        onCtaClick={() => setModal({})}
      />

      <TabBar
        tabs={TABS.map(t => ({ key: t.key, label: t.label, icon: t.icon, count: t.count }))}
        active={filtre}
        onChange={k => handleFiltre(k as Filtre)}
        accent="amber"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : migNeeded ? (
          <div className="py-16 text-center text-amber-600 px-6">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-bold mb-1">Migration requise</p>
            <p className="text-sm text-slate-500">Exécutez <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">scripts/boutique-clients-migration.sql</code> sur votre base de données.</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucun client trouvé</p>
            <button onClick={() => setModal({})} className="mt-3 text-sm text-amber-600 hover:underline">Ajouter le premier client</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">NOM</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">CONTACT</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">LOCALISATION</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">SOLDE</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{c.nom}</p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${TYPE_BADGE[c.type_client]}`}>
                        {c.type_client}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {c.telephone && (
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                        <Phone className="w-3 h-3 text-slate-400" /> {c.telephone}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {c.localisation ? (
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <MapPin className="w-3 h-3 text-slate-400" /> {c.localisation}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`font-bold text-sm ${
                      c.solde > 0 ? "text-emerald-600" : c.solde < 0 ? "text-red-600" : "text-slate-400"
                    }`}>
                      {formatPrice(c.solde)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setModal(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.nom)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{total} client{total > 1 ? "s" : ""}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-xs font-semibold">Page {page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal !== false && (
        <FormModal
          client={modal}
          onClose={() => setModal(false)}
          onSaved={() => { load(); loadCounts(); }}
        />
      )}
    </div>
  );
}
