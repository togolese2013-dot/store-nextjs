"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, Plus, Trash2, X, Save, Loader2, AlertCircle,
  CheckCircle2, Clock, ChevronDown, DollarSign, ShoppingCart,
  Plane, Ship, Search, UserPlus,
} from "lucide-react";
import type { Achat, Fournisseur } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import PageHeader from "@/components/admin/PageHeader";

interface AdminProduct {
  id:             number;
  nom:            string;
  reference:      string;
  prix_unitaire:  number;
  stock_magasin:  number;
  stock_boutique: number;
}

interface Props {
  initialAchats: Achat[];
  total:         number;
  stats:         { total: number; en_attente: number; recu: number; montant_total: number };
  fournisseurs:  Fournisseur[];
  products:      AdminProduct[];
  page:          number;
  limit:         number;
}

interface LineItem {
  produit_id:    number | null;
  designation:   string;
  quantite:      number | "";
  prix_unitaire: number | "";
  search:        string;
  showDropdown:  boolean;
}

const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

const STATUT_COLORS: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-700",
  recu:       "bg-blue-100 text-blue-700",
  valide:     "bg-green-100 text-green-700",
};

function emptyLine(): LineItem {
  return { produit_id: null, designation: "", quantite: "", prix_unitaire: "", search: "", showDropdown: false };
}

export default function AchatsManager({ initialAchats, total, stats, fournisseurs: initFournisseurs, products, page, limit }: Props) {
  const router = useRouter();
  const [achats,      setAchats]      = useState<Achat[]>(initialAchats);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(initFournisseurs);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<number | null>(null);
  const [error,       setError]       = useState("");

  // New fournisseur inline
  const [showNewFourn,  setShowNewFourn]  = useState(false);
  const [newFournNom,   setNewFournNom]   = useState("");
  const [savingFourn,   setSavingFourn]   = useState(false);

  const [form, setForm] = useState({
    fournisseur_id: "",
    transport:      "" as "" | "avion" | "bateau",
    date_achat:     new Date().toISOString().slice(0, 10),
    statut:         "en_attente" as "en_attente" | "recu" | "valide",
    notes:          "",
  });
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);

  function addLine()             { setLines(l => [...l, emptyLine()]); }
  function removeLine(i: number) { setLines(l => l.filter((_, idx) => idx !== i)); }

  function setLineField(i: number, key: keyof LineItem, val: unknown) {
    setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [key]: val } : ln));
  }

  function selectProduct(i: number, prod: AdminProduct) {
    setLines(l => l.map((ln, idx) => idx !== i ? ln : {
      ...ln,
      produit_id:    prod.id,
      designation:   prod.nom,
      prix_unitaire: prod.prix_unitaire,
      search:        prod.nom,
      showDropdown:  false,
    }));
  }

  const montantTotal = lines.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0), 0);

  async function handleSave() {
    setError("");
    if (!form.date_achat) { setError("La date est obligatoire."); return; }
    const validLines = lines.filter(l => l.designation.trim() && Number(l.quantite) > 0);
    if (!validLines.length) { setError("Ajoutez au moins un article valide."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/achats", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fournisseur_id: form.fournisseur_id ? Number(form.fournisseur_id) : null,
          date_achat:     form.date_achat,
          statut:         form.statut,
          transport:      form.transport || null,
          note:           form.notes || null,
          items: validLines.map(l => ({
            produit_id:    l.produit_id,
            designation:   l.designation,
            quantite:      Number(l.quantite),
            prix_unitaire: Number(l.prix_unitaire) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ fournisseur_id: "", transport: "", date_achat: new Date().toISOString().slice(0, 10), statut: "en_attente", notes: "" });
    setLines([emptyLine()]);
    setShowNewFourn(false);
    setNewFournNom("");
  }

  async function handleCreateFournisseur() {
    if (!newFournNom.trim()) return;
    setSavingFourn(true);
    try {
      const res  = await fetch("/api/admin/fournisseurs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nom: newFournNom.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newF = { id: data.id, nom: newFournNom.trim() } as Fournisseur;
      setFournisseurs(f => [...f, newF]);
      setForm(f => ({ ...f, fournisseur_id: String(data.id) }));
      setShowNewFourn(false);
      setNewFournNom("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingFourn(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cet achat ?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/achats/${id}`, { method: "DELETE" });
      setAchats(l => l.filter(a => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatut(id: number, statut: string) {
    await fetch(`/api/admin/achats/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ statut }),
    });
    setAchats(l => l.map(a => a.id === id ? { ...a, statut: statut as Achat["statut"] } : a));
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">

      <PageHeader
        title="Achats fournisseurs"
        subtitle="Suivi des commandes fournisseurs"
        accent="brand"
        onRefresh={() => router.refresh()}
        ctaLabel="Nouvel achat"
        ctaIcon={Plus}
        onCtaClick={() => { setShowForm(true); setError(""); }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total achats",  icon: ShoppingCart,  val: stats.total,         money: false },
          { label: "En attente",    icon: Clock,         val: stats.en_attente,    money: false },
          { label: "Reçus",         icon: CheckCircle2,  val: stats.recu,          money: false },
          { label: "Montant total", icon: DollarSign,    val: stats.montant_total, money: true  },
        ].map(({ label, icon: Icon, val, money }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 leading-tight">{label}</p>
              <Icon className="w-7 h-7 text-slate-400 opacity-20 shrink-0" />
            </div>
            {money ? (
              <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
                {val.toLocaleString("fr-FR")}<span className="text-sm font-bold text-emerald-500 ml-1">FCFA</span>
              </p>
            ) : (
              <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{val}</p>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {achats.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-slate-400">
            <Truck className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Aucun achat enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Référence</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden md:table-cell">Fournisseur</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden sm:table-cell">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Montant</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Statut</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {achats.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 font-mono text-xs">{a.reference}</p>
                      {a.transport && (
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                          {a.transport === "avion" ? <Plane className="w-3 h-3" /> : <Ship className="w-3 h-3" />}
                          {a.transport === "avion" ? "Avion" : "Bateau"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                      {a.fournisseur_nom ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-500 hidden sm:table-cell text-xs">
                      {new Date(a.date_achat).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-slate-900">{formatPrice(a.montant_total)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="relative inline-block">
                        <select
                          value={a.statut}
                          onChange={e => handleStatut(a.id, e.target.value)}
                          className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-bold cursor-pointer border-0 outline-none ${STATUT_COLORS[a.statut] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          <option value="en_attente">En attente</option>
                          <option value="recu">Reçu</option>
                          <option value="valide">Validé</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40">
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page} sur {totalPages} · {total} résultats</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-400 transition-colors">← Précédent</a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}`} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-400 transition-colors">Suivant →</a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Nouvel achat fournisseur</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">

              {/* Fournisseur */}
              <div>
                <label className={labelCls}>Fournisseur</label>
                <div className="flex gap-2">
                  <select
                    value={form.fournisseur_id}
                    onChange={e => setForm(f => ({ ...f, fournisseur_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Sélectionner —</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewFourn(v => !v)}
                    title="Nouveau fournisseur"
                    className="shrink-0 px-2.5 rounded-xl border border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                {showNewFourn && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newFournNom}
                      onChange={e => setNewFournNom(e.target.value)}
                      placeholder="Nom du fournisseur"
                      className={inputCls}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateFournisseur(); }}}
                    />
                    <button
                      type="button"
                      onClick={handleCreateFournisseur}
                      disabled={savingFourn || !newFournNom.trim()}
                      className="shrink-0 px-3 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      {savingFourn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
                    </button>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className={labelCls}>Date d&apos;achat *</label>
                <input
                  type="date"
                  value={form.date_achat}
                  onChange={e => setForm(f => ({ ...f, date_achat: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* Transport */}
              <div>
                <label className={labelCls}>Mode de transport</label>
                <div className="flex gap-2">
                  {(["avion", "bateau"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, transport: f.transport === t ? "" : t }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        form.transport === t
                          ? t === "avion"
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {t === "avion" ? <Plane className="w-4 h-4" /> : <Ship className="w-4 h-4" />}
                      {t === "avion" ? "Avion" : "Bateau"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className={labelCls}>Statut</label>
                <select
                  value={form.statut}
                  onChange={e => setForm(f => ({ ...f, statut: e.target.value as "en_attente" | "recu" | "valide" }))}
                  className={inputCls}
                >
                  <option value="en_attente">En attente</option>
                  <option value="recu">Reçu</option>
                  <option value="valide">Validé</option>
                </select>
              </div>

              {/* Note */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Note</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Informations complémentaires…"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            {/* Articles */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls + " mb-0"}>Articles *</label>
                <button type="button" onClick={addLine}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                </button>
              </div>
              <div className="space-y-2">
                {lines.map((ln, i) => {
                  const filtered = products.filter(p =>
                    ln.search.length > 0
                      ? p.nom.toLowerCase().includes(ln.search.toLowerCase()) || p.reference.toLowerCase().includes(ln.search.toLowerCase())
                      : true
                  ).slice(0, 8);

                  return (
                    <div key={i} className="space-y-1">
                      <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                        {/* Product search */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={ln.search}
                            onChange={e => {
                              setLineField(i, "search", e.target.value);
                              setLineField(i, "designation", e.target.value);
                              setLineField(i, "produit_id", null);
                              setLineField(i, "showDropdown", true);
                            }}
                            onFocus={() => setLineField(i, "showDropdown", true)}
                            onBlur={() => setTimeout(() => setLineField(i, "showDropdown", false), 150)}
                            placeholder="Chercher un produit ou saisir…"
                            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                          {ln.showDropdown && filtered.length > 0 && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                              {filtered.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onMouseDown={() => selectProduct(i, p)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2"
                                >
                                  <span className="font-medium text-slate-800 truncate">{p.nom}</span>
                                  <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                                    Mag:{p.stock_magasin} · Btq:{p.stock_boutique}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input type="number" min="1" value={ln.quantite}
                          onChange={e => setLineField(i, "quantite", e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Qté"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-center" />
                        <input type="number" min="0" value={ln.prix_unitaire}
                          onChange={e => setLineField(i, "prix_unitaire", e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Prix u."
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
                        <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Show selected product stock info */}
                      {ln.produit_id && (() => {
                        const p = products.find(p => p.id === ln.produit_id);
                        return p ? (
                          <p className="text-[10px] text-slate-400 pl-2">
                            Stock actuel — Magasin : <span className="font-bold text-slate-600">{p.stock_magasin}</span> · Boutique : <span className="font-bold text-slate-600">{p.stock_boutique}</span>
                          </p>
                        ) : null;
                      })()}
                    </div>
                  );
                })}
              </div>
              {montantTotal > 0 && (
                <div className="mt-3 text-right">
                  <span className="text-xs text-slate-500 font-semibold">Total : </span>
                  <span className="font-bold text-slate-900">{montantTotal.toLocaleString("fr-FR")}</span>
                  <span className="text-xs font-bold text-emerald-500 ml-1">FCFA</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowForm(false); resetForm(); }}
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
