"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Minus, Trash2, Search, Printer, FilePlus, X, ChevronDown, ChevronUp } from "lucide-react";

interface Proformat {
  id: number;
  reference: string;
  client_nom: string;
  client_telephone: string | null;
  client_adresse: string | null;
  client_email: string | null;
  items: ProformatItem[];
  sous_total: number;
  remise: number;
  total: number;
  validite_jours: number;
  statut: "actif" | "accepte" | "expire" | "annule";
  note: string | null;
  created_at: string;
}

interface ProformatItem {
  produit_id?: number;
  produit_nom: string;
  produit_ref?: string;
  prix_unitaire: number;
  quantite: number;
  total: number;
}

interface Produit {
  id: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
}

type View = "list" | "new";

export default function ProformatPage() {
  const [view, setView]           = useState<View>("list");
  const [proformats, setProformats] = useState<Proformat[]>([]);
  const [loading, setLoading]     = useState(true);

  // Form state
  const [clientNom, setClientNom]       = useState("");
  const [clientTel, setClientTel]       = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [clientEmail, setClientEmail]   = useState("");
  const [validite, setValidite]         = useState(30);
  const [remise, setRemise]             = useState(0);
  const [note, setNote]                 = useState("");
  const [items, setItems]               = useState<ProformatItem[]>([]);
  const [query, setQuery]               = useState("");
  const [results, setResults]           = useState<Produit[]>([]);
  const [saving, setSaving]             = useState(false);
  const [created, setCreated]           = useState<string | null>(null);

  // Manual item
  const [manualNom, setManualNom]   = useState("");
  const [manualPrix, setManualPrix] = useState("");
  const [manualQty, setManualQty]   = useState(1);
  const [showManual, setShowManual] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/proformat");
    if (res.ok) {
      const data = await res.json();
      setProformats(data.proformats ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=6`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.products ?? data.produits ?? []);
    }
  }

  function addProduct(p: Produit) {
    setResults([]); setQuery("");
    setItems(prev => {
      const idx = prev.findIndex(i => i.produit_id === p.id);
      if (idx >= 0) {
        return prev.map((i, j) => j === idx ? { ...i, quantite: i.quantite + 1, total: (i.quantite + 1) * i.prix_unitaire } : i);
      }
      return [...prev, { produit_id: p.id, produit_nom: p.nom, produit_ref: p.reference, prix_unitaire: p.prix, quantite: 1, total: p.prix }];
    });
  }

  function addManualItem() {
    if (!manualNom || !manualPrix) return;
    const prix = parseFloat(manualPrix) || 0;
    setItems(prev => [...prev, { produit_nom: manualNom, prix_unitaire: prix, quantite: manualQty, total: prix * manualQty }]);
    setManualNom(""); setManualPrix(""); setManualQty(1); setShowManual(false);
  }

  function updateQty(idx: number, delta: number) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const q = Math.max(1, item.quantite + delta);
      return { ...item, quantite: q, total: q * item.prix_unitaire };
    }));
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const sousTotal = items.reduce((s, i) => s + i.total, 0);
  const totalNet  = Math.max(0, sousTotal - remise);

  async function handleSubmit() {
    if (!clientNom || !items.length) return;
    setSaving(true);
    const res = await fetch("/api/admin/proformat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_nom: clientNom,
        client_telephone: clientTel || null,
        client_adresse: clientAdresse || null,
        client_email: clientEmail || null,
        items,
        remise,
        validite_jours: validite,
        note: note || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreated(data.reference);
      setItems([]); setClientNom(""); setClientTel(""); setClientAdresse(""); setClientEmail("");
      setRemise(0); setNote(""); setValidite(30);
      load();
    }
    setSaving(false);
  }

  function resetForm() {
    setCreated(null); setView("list");
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function handlePrint(p: Proformat) {
    const parsedItems: ProformatItem[] = typeof p.items === "string" ? JSON.parse(p.items) : p.items;
    const expireDate = new Date(p.created_at);
    expireDate.setDate(expireDate.getDate() + p.validite_jours);

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Proformat ${p.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', sans-serif; color: #1e293b; padding: 40px; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .logo { font-size: 22px; font-weight: 900; }
          .ref-block { text-align: right; }
          .ref { font-size: 20px; font-weight: 800; color: #d97706; }
          .date { color: #64748b; font-size: 12px; margin-top: 4px; }
          .validity { display: inline-block; margin-top: 6px; padding: 3px 10px; background: #fef3c7; color: #92400e; border-radius: 99px; font-size: 11px; font-weight: 600; }
          .divider { border: none; border-top: 1.5px solid #e2e8f0; margin: 20px 0; }
          .client { margin-bottom: 24px; }
          .client h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 6px; }
          .client p { font-weight: 600; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; border-bottom: 1.5px solid #e2e8f0; }
          td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .totals { width: 240px; margin-left: auto; }
          .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .totals .total { font-size: 16px; font-weight: 800; border-top: 2px solid #d97706; padding-top: 10px; margin-top: 4px; color: #d97706; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Ma Boutique</div>
          <div class="ref-block">
            <div class="ref">PROFORMAT ${p.reference}</div>
            <div class="date">Émis le ${formatDate(p.created_at)}</div>
            <div class="validity">Valable jusqu'au ${expireDate.toLocaleDateString("fr-FR")}</div>
          </div>
        </div>
        <hr class="divider">
        <div class="client">
          <h3>Destinataire</h3>
          <p>${p.client_nom}</p>
          ${p.client_telephone ? `<p>${p.client_telephone}</p>` : ""}
          ${p.client_email ? `<p>${p.client_email}</p>` : ""}
          ${p.client_adresse ? `<p>${p.client_adresse}</p>` : ""}
        </div>
        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th class="text-right">Qté</th>
              <th class="text-right">P.U.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${parsedItems.map(i => `
            <tr>
              <td>${i.produit_nom}${i.produit_ref ? ` <span style="color:#94a3b8;font-size:11px">(${i.produit_ref})</span>` : ""}</td>
              <td class="text-right">${i.quantite}</td>
              <td class="text-right">${formatPrice(i.prix_unitaire)}</td>
              <td class="text-right" style="font-weight:700">${formatPrice(i.total)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
        <div class="totals">
          <div class="row"><span>Sous-total</span><span>${formatPrice(p.sous_total)}</span></div>
          ${p.remise > 0 ? `<div class="row"><span>Remise</span><span>-${formatPrice(p.remise)}</span></div>` : ""}
          <div class="row total"><span>Total TTC</span><span>${formatPrice(p.total)}</span></div>
        </div>
        ${p.note ? `<p style="margin-top:24px;color:#64748b;font-size:12px">Note : ${p.note}</p>` : ""}
        <div class="footer">Ce document est une facture proformat et ne constitue pas une facture définitive.</div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  const STATUT_STYLES: Record<string, string> = {
    actif:   "bg-blue-100 text-blue-700",
    accepte: "bg-emerald-100 text-emerald-700",
    expire:  "bg-slate-100 text-slate-500",
    annule:  "bg-red-100 text-red-600",
  };

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <FilePlus className="w-10 h-10 text-amber-600" />
        </div>
        <div>
          <h2 className="font-display font-800 text-2xl text-slate-900">Proformat créé !</h2>
          <p className="text-slate-500 mt-1">Référence : <span className="font-bold text-slate-800">{created}</span></p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { const p = proformats.find(x => x.reference === created); if (p) handlePrint(p); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Proformats</h1>
          <p className="text-slate-500 text-sm mt-1">Factures proformat imprimables</p>
        </div>
        <button
          onClick={() => setView(v => v === "new" ? "list" : "new")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
            view === "new" ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          {view === "new" ? <><X className="w-4 h-4" /> Annuler</> : <><Plus className="w-4 h-4" /> Nouveau proformat</>}
        </button>
      </div>

      {view === "new" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left */}
          <div className="lg:col-span-3 space-y-4">
            {/* Client */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <p className="font-bold text-sm text-slate-700 mb-3">Informations client <span className="text-red-400">*</span></p>
              <div className="grid grid-cols-2 gap-3">
                <input value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder="Nom client *"
                  className="col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                <input value={clientTel} onChange={e => setClientTel(e.target.value)} placeholder="Téléphone"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                <input value={clientAdresse} onChange={e => setClientAdresse(e.target.value)} placeholder="Adresse"
                  className="col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>

            {/* Product search */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <p className="font-bold text-sm text-slate-700 mb-3">Ajouter des produits</p>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Rechercher un produit..." value={query}
                  onChange={e => search(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              {results.length > 0 && (
                <div className="mt-2 divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                  {results.map(p => (
                    <button key={p.id} onClick={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 text-left transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{p.nom}</p>
                        <p className="text-xs text-slate-400">{p.reference}</p>
                      </div>
                      <p className="font-bold text-sm text-amber-700">{formatPrice(p.prix)}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual item */}
              <button
                onClick={() => setShowManual(v => !v)}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showManual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Ajouter un article manuellement
              </button>
              {showManual && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  <input value={manualNom} onChange={e => setManualNom(e.target.value)} placeholder="Désignation"
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300" />
                  <input type="number" value={manualPrix} onChange={e => setManualPrix(e.target.value)} placeholder="Prix"
                    className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300" />
                  <input type="number" min={1} value={manualQty} onChange={e => setManualQty(parseInt(e.target.value) || 1)}
                    className="w-16 px-3 py-2 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-300" />
                  <button onClick={addManualItem}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
                    Ajouter
                  </button>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Validité (jours)</label>
                  <input type="number" min={1} value={validite} onChange={e => setValidite(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Remise (FCFA)</label>
                  <input type="number" min={0} value={remise || ""} onChange={e => setRemise(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note / conditions (optionnel)" rows={2}
                className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            </div>
          </div>

          {/* Right — items + total */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 sticky top-6">
              <p className="font-bold text-slate-900 mb-4">Articles ({items.length})</p>

              {items.length === 0 ? (
                <div className="py-10 text-center text-slate-300 text-sm">Aucun article ajouté</div>
              ) : (
                <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.produit_nom}</p>
                        <p className="text-xs text-slate-400">{formatPrice(item.prix_unitaire)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantite}</span>
                        <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeItem(idx)} className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-900 w-16 text-right shrink-0">{formatPrice(item.total)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Sous-total</span><span className="font-semibold">{formatPrice(sousTotal)}</span>
                </div>
                {remise > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Remise</span><span>-{formatPrice(remise)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total</span><span className="text-amber-600">{formatPrice(totalNet)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!clientNom || items.length === 0 || saving}
                className="mt-4 w-full py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving ? "Création…" : <><FilePlus className="w-4 h-4" /> Créer le proformat</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Chargement…</div>
          ) : proformats.length === 0 ? (
            <div className="py-20 text-center">
              <FilePlus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Aucun proformat créé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Référence</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Date</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Client</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500 text-right whitespace-nowrap">Total</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Validité</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">Statut</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500 text-center">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {proformats.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-amber-700">{p.reference}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{p.client_nom}</p>
                        {p.client_telephone && <p className="text-xs text-slate-400">{p.client_telephone}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">{formatPrice(p.total)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{p.validite_jours} jours</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUT_STYLES[p.statut] ?? "bg-slate-100 text-slate-500"}`}>
                          {p.statut}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handlePrint(p)}
                          className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mx-auto hover:bg-amber-100 hover:text-amber-700 text-slate-500 transition-colors"
                          title="Imprimer le proformat"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
