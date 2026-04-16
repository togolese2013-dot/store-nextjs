"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Warehouse } from "lucide-react";

interface StockRow {
  entrepot_id:  number;
  nom_entrepot: string;
  stock:        number;
}

interface EntrepotRow {
  id:  number;
  nom: string;
}

interface Props { produitId: number }

export default function StockParEntrepot({ produitId }: Props) {
  const [rows,    setRows]    = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<number | null>(null);
  const [msg,     setMsg]     = useState("");

  useEffect(() => {
    async function load() {
      // Load all entrepots + current stocks for this product
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/entrepots"),
        fetch(`/api/admin/products/${produitId}/stocks`),
      ]);
      const entrepots: EntrepotRow[] = r1.ok ? (await r1.json()).data : [];
      const stocks: StockRow[]       = r2.ok ? (await r2.json()).data : [];

      const stockMap = Object.fromEntries(stocks.map(s => [s.entrepot_id, s.stock]));
      setRows(entrepots.map(e => ({
        entrepot_id:  e.id,
        nom_entrepot: e.nom,
        stock:        stockMap[e.id] ?? 0,
      })));
      setLoading(false);
    }
    load();
  }, [produitId]);

  async function saveStock(entrepot_id: number, stock: number) {
    setSaving(entrepot_id);
    const res = await fetch(`/api/admin/entrepots/${entrepot_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit_id: produitId, _stock: stock }),
    });
    setSaving(null);
    if (res.ok) {
      setMsg("Stock mis à jour ✓"); setTimeout(() => setMsg(""), 2000);
    } else {
      setMsg("Erreur");
    }
  }

  function updateStock(entrepot_id: number, val: number) {
    setRows(prev => prev.map(r => r.entrepot_id === entrepot_id ? { ...r, stock: val } : r));
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-400 py-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Chargement des stocks…
    </div>
  );

  if (rows.length === 0) return (
    <p className="text-sm text-slate-400 py-4">Aucun entrepôt configuré. <a href="/admin/entrepots" className="text-brand-700 underline">Créer un entrepôt</a></p>
  );

  return (
    <div className="space-y-3">
      {msg && (
        <p className={`text-sm px-3 py-2 rounded-xl ${msg.includes("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </p>
      )}
      {rows.map(r => (
        <div key={r.entrepot_id} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Warehouse className="w-4 h-4 text-slate-500" />
          </div>
          <span className="flex-1 text-sm font-semibold text-slate-700">{r.nom_entrepot}</span>
          <input
            type="number" min={0}
            className="w-24 px-3 py-1.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-center"
            value={r.stock}
            onChange={e => updateStock(r.entrepot_id, Number(e.target.value))}
          />
          <button
            onClick={() => saveStock(r.entrepot_id, r.stock)}
            disabled={saving === r.entrepot_id}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {saving === r.entrepot_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Sauver
          </button>
        </div>
      ))}
    </div>
  );
}
