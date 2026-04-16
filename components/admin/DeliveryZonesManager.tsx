"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DeliveryZone } from "@/lib/admin-db";
import { Plus, Trash2, Save, GripVertical, Loader2 } from "lucide-react";

const inputCls = "px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans";

export default function DeliveryZonesManager({ initialZones }: { initialZones: DeliveryZone[] }) {
  const router  = useRouter();
  const [zones,   setZones]   = useState<DeliveryZone[]>(initialZones);
  const [saving,  setSaving]  = useState<number | "new" | null>(null);
  const [newZone, setNewZone] = useState<{ nom: string; fee: number } | null>(null);

  async function saveZone(zone: DeliveryZone) {
    setSaving(zone.id);
    await fetch("/api/admin/delivery-zones", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(zone),
    });
    setSaving(null);
    router.refresh();
  }

  async function deleteZone(id: number) {
    if (!confirm("Supprimer cette zone ?")) return;
    setSaving(id);
    await fetch("/api/admin/delivery-zones", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, _delete: true }),
    });
    setZones(z => z.filter(x => x.id !== id));
    setSaving(null);
  }

  async function addZone() {
    if (!newZone?.nom.trim()) return;
    setSaving("new");
    await fetch("/api/admin/delivery-zones", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: newZone.nom, fee: newZone.fee || 0, actif: true, sort_order: zones.length }),
    });
    setSaving(null);
    setNewZone(null);
    router.refresh();
  }

  function updateLocal(id: number, field: keyof DeliveryZone, value: unknown) {
    setZones(z => z.map(x => x.id === id ? { ...x, [field]: value } : x));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-[1fr_120px_80px_auto] gap-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>Nom de la zone</span>
            <span>Frais (FCFA)</span>
            <span>Actif</span>
            <span />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {zones.map(zone => (
            <div key={zone.id} className="px-5 py-3 grid grid-cols-[1fr_120px_80px_auto] gap-3 items-center">
              <input type="text" value={zone.nom}
                onChange={e => updateLocal(zone.id, "nom", e.target.value)}
                className={`${inputCls} w-full`}
              />
              <input type="number" value={zone.fee}
                onChange={e => updateLocal(zone.id, "fee", Number(e.target.value))}
                className={`${inputCls} w-full`} min="0"
              />
              <label className="flex items-center justify-center">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer"
                    checked={zone.actif}
                    onChange={e => updateLocal(zone.id, "actif", e.target.checked)}
                  />
                  <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-green-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
              <div className="flex gap-1.5">
                <button onClick={() => saveZone(zone)} disabled={saving === zone.id}
                  className="p-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                  title="Sauvegarder"
                >
                  {saving === zone.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteZone(zone.id)} disabled={saving === zone.id}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new */}
        {newZone ? (
          <div className="px-5 py-3 border-t border-dashed border-slate-200 grid grid-cols-[1fr_120px_80px_auto] gap-3 items-center bg-brand-50/30">
            <input type="text" value={newZone.nom}
              onChange={e => setNewZone(n => n ? { ...n, nom: e.target.value } : n)}
              placeholder="Nom de la nouvelle zone" autoFocus
              className={`${inputCls} w-full`}
            />
            <input type="number" value={newZone.fee}
              onChange={e => setNewZone(n => n ? { ...n, fee: Number(e.target.value) } : n)}
              placeholder="Frais" min="0" className={`${inputCls} w-full`}
            />
            <span />
            <div className="flex gap-1.5">
              <button onClick={addZone} disabled={saving === "new"}
                className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                {saving === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button onClick={() => setNewZone(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNewZone({ nom: "", fee: 0 })}
            className="w-full flex items-center justify-center gap-2 py-4 text-sm font-semibold text-slate-500 hover:text-brand-700 hover:bg-brand-50/50 transition-colors border-t border-dashed border-slate-200"
          >
            <Plus className="w-4 h-4" /> Ajouter une zone
          </button>
        )}
      </div>
    </div>
  );
}
