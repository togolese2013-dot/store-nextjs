"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Printer, FileText } from "lucide-react";

interface Facture {
  id: number;
  reference: string;
  client_nom: string | null;
  client_telephone: string | null;
  total: number;
  remise: number;
  montant_recu: number;
  produits_list: string | null;
  nb_articles: number;
  statut: string;
  created_at: string;
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/factures");
    if (res.ok) {
      const data = await res.json();
      setFactures(data.factures ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function handlePrint(f: Facture) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture ${f.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', sans-serif; color: #1e293b; padding: 40px; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
          .ref-block { text-align: right; }
          .ref { font-size: 20px; font-weight: 800; color: #1e3a8a; }
          .date { color: #64748b; font-size: 12px; margin-top: 4px; }
          .divider { border: none; border-top: 1.5px solid #e2e8f0; margin: 20px 0; }
          .client { margin-bottom: 24px; }
          .client h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 6px; }
          .client p { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; border-bottom: 1.5px solid #e2e8f0; }
          td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .totals { width: 240px; margin-left: auto; }
          .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .totals .total { font-size: 16px; font-weight: 800; border-top: 2px solid #1e3a8a; padding-top: 10px; margin-top: 4px; color: #1e3a8a; }
          .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Ma Boutique</div>
          <div class="ref-block">
            <div class="ref">FACTURE ${f.reference}</div>
            <div class="date">${formatDate(f.created_at)}</div>
          </div>
        </div>
        <hr class="divider">
        ${f.client_nom ? `
        <div class="client">
          <h3>Facturé à</h3>
          <p>${f.client_nom}</p>
          ${f.client_telephone ? `<p>${f.client_telephone}</p>` : ""}
        </div>` : ""}
        <table>
          <thead>
            <tr>
              <th>Produits</th>
              <th class="text-right">Articles</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${f.produits_list ?? "—"}</td>
              <td class="text-right">${f.nb_articles}</td>
              <td class="text-right" style="font-weight:700">${formatPrice(f.total)}</td>
            </tr>
          </tbody>
        </table>
        <div class="totals">
          ${f.remise > 0 ? `<div class="row"><span>Remise</span><span>-${formatPrice(f.remise)}</span></div>` : ""}
          <div class="row total"><span>Total</span><span>${formatPrice(f.total)}</span></div>
          <div class="row" style="color:#64748b"><span>Montant reçu</span><span>${formatPrice(f.montant_recu)}</span></div>
        </div>
        <div class="footer">Merci pour votre achat !</div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Factures</h1>
        <p className="text-slate-500 text-sm mt-1">Factures des ventes validées</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Chargement…</div>
        ) : factures.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucune facture disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Référence</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Date</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Client</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Produits</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-center whitespace-nowrap">Articles</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-right whitespace-nowrap">Total</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-center whitespace-nowrap">Imprimer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {factures.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-brand-800">{f.reference}</td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(f.created_at)}</td>
                    <td className="px-5 py-3.5">
                      {f.client_nom ? (
                        <div>
                          <p className="font-semibold text-slate-900">{f.client_nom}</p>
                          {f.client_telephone && <p className="text-xs text-slate-400">{f.client_telephone}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Client anonyme</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-slate-600 truncate text-xs">{f.produits_list ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                        {f.nb_articles}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">{formatPrice(f.total)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handlePrint(f)}
                        className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mx-auto hover:bg-brand-100 hover:text-brand-700 text-slate-500 transition-colors"
                        title="Imprimer la facture"
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
    </div>
  );
}
