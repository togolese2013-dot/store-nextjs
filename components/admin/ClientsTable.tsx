"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Users, Crown, Ban, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Client } from "@/lib/admin-db";

interface ClientRow extends Client {
  total_orders?: number;
  total_spent?:  number;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  normal:    { label: "Normal",    cls: "bg-slate-100 text-slate-600" },
  vip:       { label: "VIP",       cls: "bg-amber-100 text-amber-700" },
  blacklist: { label: "Blacklist", cls: "bg-red-100 text-red-700" },
};

export default function ClientsTable() {
  const [clients,         setClients]         = useState<ClientRow[]>([]);
  const [total,           setTotal]           = useState(0);
  const [page,            setPage]            = useState(1);
  const [search,          setSearch]          = useState("");
  const [query,           setQuery]           = useState("");
  const [loading,         setLoading]         = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), q: query });
    const res = await fetch(`/api/admin/clients?${qs}`);
    const data = await res.json();
    if (res.ok) {
      setClients(data.data);
      setTotal(data.total);
      if (data._migrationNeeded) setMigrationNeeded(true);
    }
    setLoading(false);
  }, [page, query]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none"
            placeholder="Rechercher par téléphone ou nom…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="submit"
          className="px-5 py-2.5 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
        >
          Chercher
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : migrationNeeded ? (
          <div className="py-16 text-center text-amber-600 px-6">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-bold mb-1">Migration requise</p>
            <p className="text-sm text-slate-500">Exécutez <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">scripts/features-migration.sql</code> sur votre base de données pour activer le CRM.</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucun client trouvé</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Ville</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Inscrit le</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map(c => {
                const badge = STATUS_BADGE[c.statut] ?? STATUS_BADGE.normal;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-bold text-sm shrink-0">
                          {(c.nom || c.telephone).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{c.nom || <span className="text-slate-400 italic">Sans nom</span>}</p>
                          <p className="text-xs text-slate-400">{c.telephone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">
                      {c.ville || "—"}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${badge.cls}`}>
                        {c.statut === "vip" && <Crown className="w-3 h-3" />}
                        {c.statut === "blacklist" && <Ban className="w-3 h-3" />}
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs text-right hidden lg:table-cell">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/crm/${c.id}`}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-800 transition-colors"
                      >
                        Voir fiche
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    </div>
  );
}
