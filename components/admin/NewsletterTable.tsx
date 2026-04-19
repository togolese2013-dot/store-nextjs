"use client";

import { useState, useMemo } from "react";
import { Search, Trash2, Download, Mail } from "lucide-react";

interface Subscriber {
  id:            number;
  email:         string;
  subscribed_at: string;
}

interface Props {
  initialSubscribers: Subscriber[];
}

export default function NewsletterTable({ initialSubscribers }: Props) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [search, setSearch]           = useState("");
  const [deleting, setDeleting]       = useState<number | null>(null);
  const [confirmId, setConfirmId]     = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subscribers.filter(s => s.email.toLowerCase().includes(q));
  }, [subscribers, search]);

  async function handleDelete(id: number) {
    if (confirmId !== id) { setConfirmId(id); return; }
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      });
      if (res.ok) {
        setSubscribers(s => s.filter(sub => sub.id !== id));
        setConfirmId(null);
      }
    } finally {
      setDeleting(null);
    }
  }

  function exportCSV() {
    const header = "email,date_inscription\n";
    const rows   = subscribers.map(s =>
      `${s.email},${new Date(s.subscribed_at).toLocaleDateString("fr-FR")}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `newsletter_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
        <Mail className="w-4 h-4 text-indigo-500" />
        <h2 className="font-bold text-slate-900 text-sm flex-1">Abonnés</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 w-48"
              placeholder="Rechercher un email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Inscrit le</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-slate-800 font-medium">{s.email}</p>
                </td>
                <td className="px-5 py-4 text-right text-slate-400 text-xs hidden sm:table-cell">
                  {new Date(s.subscribed_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                      confirmId === s.id
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-red-50 text-red-500 hover:bg-red-100"
                    }`}
                    title={confirmId === s.id ? "Confirmer la suppression" : "Désabonner"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            {search ? "Aucun résultat pour cette recherche" : "Aucun abonné"}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
        {filtered.length} abonné{filtered.length !== 1 ? "s" : ""}
        {search && ` trouvé${filtered.length !== 1 ? "s" : ""} · ${subscribers.length} au total`}
      </div>
    </div>
  );
}
