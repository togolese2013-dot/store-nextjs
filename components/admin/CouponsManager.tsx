"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/lib/admin-db";
import { Plus, Trash2, Save, Tag, Loader2 } from "lucide-react";

const inputCls = "px-3 py-2 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";
const empty: Omit<Coupon, "id" | "uses_count" | "created_at"> = {
  code: "", type: "percent", valeur: 10, min_order: 0, max_uses: 0, expires_at: null, actif: true,
};

export default function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router  = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [form,    setForm]    = useState<typeof empty | null>(null);
  const [saving,  setSaving]  = useState<number | "new" | null>(null);

  function setF(k: keyof typeof empty, v: unknown) {
    setForm(f => f ? { ...f, [k]: v } : null);
  }

  async function save(coupon: Coupon) {
    setSaving(coupon.id);
    await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    });
    setSaving(null); router.refresh();
  }

  async function add() {
    if (!form?.code.trim()) return;
    setSaving("new");
    await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(null); setForm(null); router.refresh();
  }

  async function del(id: number) {
    if (!confirm("Supprimer ce coupon ?")) return;
    setSaving(id);
    await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, _delete: true }),
    });
    setCoupons(c => c.filter(x => x.id !== id)); setSaving(null);
  }

  return (
    <div className="space-y-5">
      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-700 text-slate-900">Coupons actifs</h2>
          <button onClick={() => setForm({ ...empty })}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouveau coupon
          </button>
        </div>

        {coupons.length === 0 && !form ? (
          <div className="py-16 flex flex-col items-center text-slate-400">
            <Tag className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-semibold">Aucun coupon créé</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {coupons.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <span className="font-mono font-bold text-brand-900 bg-brand-50 px-3 py-1 rounded-xl text-sm">{c.code}</span>
                <span className="text-sm text-slate-600">
                  -{c.type === "percent" ? `${c.valeur}%` : `${c.valeur} FCFA`}
                  {c.min_order > 0 ? ` · min ${c.min_order} FCFA` : ""}
                  {c.max_uses > 0 ? ` · ${c.uses_count}/${c.max_uses} utilisations` : ""}
                </span>
                <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.actif ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {c.actif ? "Actif" : "Inactif"}
                </span>
                <button onClick={() => del(c.id)} disabled={saving === c.id}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  {saving === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New coupon form */}
      {form && (
        <div className="bg-white rounded-3xl border border-brand-100 p-6 space-y-4">
          <h3 className="font-display font-700 text-slate-900">Nouveau coupon</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Code *</label>
              <input type="text" value={form.code} onChange={e => setF("code", e.target.value.toUpperCase())}
                placeholder="PROMO10" className={`${inputCls} w-full font-mono uppercase`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setF("type", e.target.value)} className={`${inputCls} w-full`}>
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (FCFA)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Valeur</label>
              <input type="number" min="0" value={form.valeur} onChange={e => setF("valeur", Number(e.target.value))} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Commande minimum (FCFA, 0 = sans minimum)</label>
              <input type="number" min="0" value={form.min_order} onChange={e => setF("min_order", Number(e.target.value))} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Nb utilisations max (0 = illimité)</label>
              <input type="number" min="0" value={form.max_uses} onChange={e => setF("max_uses", Number(e.target.value))} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Expire le (optionnel)</label>
              <input type="date" value={form.expires_at?.substring(0, 10) ?? ""}
                onChange={e => setF("expires_at", e.target.value || null)} className={`${inputCls} w-full`} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={add} disabled={saving === "new" || !form.code.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-50"
            >
              {saving === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Créer le coupon
            </button>
            <button onClick={() => setForm(null)}
              className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
            >Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
