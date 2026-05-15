"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DeliveryZone } from "@/lib/admin-db";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

const inputCls = "px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans";

const COL = {
  nom:      { width: "1fr"   },
  fee:      { width: "130px" },
  confirm:  { width: "120px" },
  actif:    { width: "90px"  },
  actions:  { width: "80px"  },
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: `${COL.nom.width} ${COL.fee.width} ${COL.confirm.width} ${COL.actif.width} ${COL.actions.width}`,
  gap: "12px",
  alignItems: "center",
};

function Toggle({ checked, onChange, color }: { checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <div className="relative cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={`w-9 h-5 rounded-full transition-colors ${checked ? color : "bg-slate-200"}`} />
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </div>
  );
}

export default function DeliveryZonesManager({ initialZones }: { initialZones: DeliveryZone[] }) {
  const router  = useRouter();
  const [zones,   setZones]   = useState<DeliveryZone[]>(initialZones);
  const [saving,  setSaving]  = useState<number | "new" | null>(null);
  const [newZone, setNewZone] = useState<{ nom: string; fee: number; prix_libre: boolean } | null>(null);

  async function saveZone(zone: DeliveryZone) {
    setSaving(zone.id);
    const res = await fetch("/api/admin/delivery-zones", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(zone),
    });
    setSaving(null);
    if (!res.ok) { alert(`Erreur ${res.status} — vérifiez que le backend est bien déployé.`); return; }
    router.refresh();
  }

  async function deleteZone(id: number) {
    if (!confirm("Supprimer cette zone ?")) return;
    setSaving(id);
    const res = await fetch("/api/admin/delivery-zones", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, _delete: true }),
    });
    if (!res.ok) { setSaving(null); alert(`Erreur ${res.status}`); return; }
    setZones(z => z.filter(x => x.id !== id));
    setSaving(null);
  }

  async function addZone() {
    if (!newZone?.nom.trim()) return;
    setSaving("new");
    const res = await fetch("/api/admin/delivery-zones", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: newZone.nom, fee: newZone.fee || 0, prix_libre: newZone.prix_libre, actif: true, sort_order: zones.length }),
    });
    setSaving(null);
    if (!res.ok) { alert(`Erreur ${res.status} — vérifiez que le backend est bien déployé.`); return; }

    const updated = await fetch("/api/admin/delivery-zones", { credentials: "include" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (Array.isArray(updated)) setZones(updated);
    setNewZone(null);
  }

  function updateLocal(id: number, field: keyof DeliveryZone, value: unknown) {
    setZones(z => z.map(x => x.id === id ? { ...x, [field]: value } : x));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50" style={gridStyle}>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Nom de la zone</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Frais (FCFA)</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">À confirmer</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Actif</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {zones.map(zone => (
            <div key={zone.id} className="px-5 py-3" style={gridStyle}>
              <input type="text" value={zone.nom}
                onChange={e => updateLocal(zone.id, "nom", e.target.value)}
                className={`${inputCls} w-full`}
              />
              <div className="text-center">
                <input type="number" value={zone.fee}
                  onChange={e => updateLocal(zone.id, "fee", Number(e.target.value))}
                  className={`${inputCls} w-full text-center`} min="0"
                  disabled={zone.prix_libre}
                />
                {!zone.prix_libre && <p className="text-[10px] text-slate-400 mt-0.5">0 = gratuit</p>}
              </div>
              <div className="flex justify-center">
                <Toggle checked={zone.prix_libre} color="bg-amber-400"
                  onChange={v => updateLocal(zone.id, "prix_libre", v)} />
              </div>
              <div className="flex justify-center">
                <Toggle checked={zone.actif} color="bg-green-500"
                  onChange={v => updateLocal(zone.id, "actif", v)} />
              </div>
              <div className="flex gap-1.5 justify-center">
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
          <div className="px-5 py-3 border-t border-dashed border-slate-200 bg-brand-50/30" style={gridStyle}>
            <input type="text" value={newZone.nom}
              onChange={e => setNewZone(n => n ? { ...n, nom: e.target.value } : n)}
              placeholder="Nom de la nouvelle zone" autoFocus
              className={`${inputCls} w-full`}
            />
            <input type="number" value={newZone.fee}
              onChange={e => setNewZone(n => n ? { ...n, fee: Number(e.target.value) } : n)}
              placeholder="Frais" min="0" className={`${inputCls} w-full text-center`}
              disabled={newZone.prix_libre}
            />
            <div className="flex justify-center">
              <Toggle checked={newZone.prix_libre} color="bg-amber-400"
                onChange={v => setNewZone(n => n ? { ...n, prix_libre: v } : n)} />
            </div>
            <span />
            <div className="flex gap-1.5 justify-center">
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
          <button onClick={() => setNewZone({ nom: "", fee: 0, prix_libre: false })}
            className="w-full flex items-center justify-center gap-2 py-4 text-sm font-semibold text-slate-500 hover:text-brand-700 hover:bg-brand-50/50 transition-colors border-t border-dashed border-slate-200"
          >
            <Plus className="w-4 h-4" /> Ajouter une zone
          </button>
        )}
      </div>
    </div>
  );
}
