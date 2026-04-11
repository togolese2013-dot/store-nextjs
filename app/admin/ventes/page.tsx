"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { PlusCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Vente {
  id: number;
  reference: string;
  client_nom: string | null;
  client_telephone: string | null;
  total: number;
  remise: number;
  montant_recu: number;
  monnaie: number;
  statut: "validee" | "annulee";
  nb_articles: number;
  note: string | null;
  created_at: string;
}

export default function VentesPage() {
  const [ventes, setVentes]   = useState<Vente[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/ventes?page=${p}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      setVentes(data.ventes);
      setTotal(data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const totalPages = Math.ceil(total / limit);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Ventes</h1>
          <p className="text-slate-500 text-sm mt-1">{total} vente{total !== 1 ? "s" : ""} enregistrée{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/ventes/nouvelle"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Nouvelle vente
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Chargement…</div>
        ) : ventes.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">Aucune vente enregistrée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Référence</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Date</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Client</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-center whitespace-nowrap">Articles</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-right whitespace-nowrap">Total</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-right whitespace-nowrap">Monnaie</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 whitespace-nowrap">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ventes.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-brand-800">{v.reference}</td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(v.created_at)}</td>
                    <td className="px-5 py-3.5">
                      {v.client_nom ? (
                        <div>
                          <p className="font-semibold text-slate-900">{v.client_nom}</p>
                          {v.client_telephone && <p className="text-xs text-slate-400">{v.client_telephone}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Client anonyme</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                        {v.nb_articles}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">{formatPrice(v.total)}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-700 font-semibold">
                      {v.monnaie > 0 ? formatPrice(v.monnaie) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        v.statut === "validee"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {v.statut === "validee" ? "Validée" : "Annulée"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
