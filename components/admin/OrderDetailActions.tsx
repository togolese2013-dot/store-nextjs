"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import {
  Edit2, Trash2, X, Check, Loader2, AlertTriangle,
  Plus, Minus,
} from "lucide-react";

interface OrderItem {
  nom:           string;
  reference?:    string;
  qty:           number;
  prix_unitaire: number;
  total:         number;
}

interface Order {
  id:              number;
  reference:       string;
  nom:             string;
  telephone:       string;
  adresse:         string;
  zone_livraison:  string;
  delivery_fee:    number;
  note:            string;
  subtotal:        number;
  total:           number;
  status:          string;
  statut_paiement: string | null;
  items:           OrderItem[];
}

/* ── Payment status options ── */
const PAYMENT_OPTIONS = [
  { value: "non_paye",  label: "Non payé",   cls: "bg-slate-100 text-slate-600" },
  { value: "paye",      label: "Payé",        cls: "bg-green-100 text-green-700" },
  { value: "rembourse", label: "Remboursé",   cls: "bg-red-100 text-red-600" },
];

/* ── Payment status selector ── */
function PaymentStatusSelect({ orderId, current }: { orderId: number; current: string | null }) {
  const router  = useRouter();
  const [val,    setVal]    = useState(current ?? "non_paye");
  const [saving, setSaving] = useState(false);

  const opt = PAYMENT_OPTIONS.find(o => o.value === val) ?? PAYMENT_OPTIONS[0];

  async function change(v: string) {
    setSaving(true);
    setVal(v);
    await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ field: "payment", payment_status: v }),
      credentials: "include",
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={val}
      onChange={e => change(e.target.value)}
      disabled={saving}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-0 outline-none cursor-pointer w-full ${opt.cls}`}
    >
      {PAYMENT_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ── Delete confirm ── */
function DeleteConfirm({ orderId, reference }: { orderId: number; reference: string }) {
  const router   = useRouter();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method:      "DELETE",
      credentials: "include",
    });
    router.push("/admin/orders");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold transition-colors"
      >
        <Trash2 className="w-4 h-4" /> Supprimer la commande
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
      <span className="text-sm text-red-700 font-semibold flex-1">Supprimer {reference} ?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-1"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Confirmer
      </button>
      <button
        onClick={() => setOpen(false)}
        className="p-1 rounded-lg hover:bg-red-200 text-red-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ── Edit modal ── */
function EditModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const router = useRouter();
  const [nom,          setNom]          = useState(order.nom);
  const [telephone,    setTelephone]    = useState(order.telephone);
  const [adresse,      setAdresse]      = useState(order.adresse);
  const [zone,         setZone]         = useState(order.zone_livraison);
  const [note,         setNote]         = useState(order.note ?? "");
  const [deliveryFee,  setDeliveryFee]  = useState(order.delivery_fee);
  const [items,        setItems]        = useState<OrderItem[]>(order.items.map(i => ({ ...i })));
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  function updateItem(idx: number, field: "qty" | "prix_unitaire", raw: string) {
    const val = field === "qty" ? Math.max(1, parseInt(raw) || 1) : Math.max(0, parseFloat(raw) || 0);
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val, total: field === "qty" ? val * next[idx].prix_unitaire : next[idx].qty * val };
      return next;
    });
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total    = subtotal + deliveryFee;

  async function handleSave() {
    if (!telephone.trim()) { setError("Le téléphone est requis."); return; }
    if (items.length === 0) { setError("Au moins un article requis."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ field: "update", nom, telephone, adresse, zone_livraison: zone, note, delivery_fee: deliveryFee, items }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur serveur");
      onClose();
      router.refresh();
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl my-6">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Modifier la commande {order.reference}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Client info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Informations client</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
                <input value={nom} onChange={e => setNom(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Nom du client" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone *</label>
                <input value={telephone} onChange={e => setTelephone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="+228..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse</label>
                <input value={adresse} onChange={e => setAdresse(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Adresse" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Zone</label>
                <input value={zone} onChange={e => setZone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Zone de livraison" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="Note ou instruction particulière" />
              </div>
            </div>
          </div>

          {/* Articles */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Articles</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.nom}</p>
                    {item.reference && <p className="text-xs text-slate-400">{item.reference}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateItem(idx, "qty", String(item.qty - 1))}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                      <Minus className="w-3 h-3 text-slate-500" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                    <button onClick={() => updateItem(idx, "qty", String(item.qty + 1))}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                      <Plus className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                  <div className="shrink-0">
                    <input
                      type="number"
                      value={item.prix_unitaire}
                      onChange={e => updateItem(idx, "prix_unitaire", e.target.value)}
                      className="w-24 px-2 py-1 text-sm text-right rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="w-20 text-right text-sm font-bold text-slate-900 shrink-0">
                    {formatPrice(item.total)}
                  </p>
                  <button onClick={() => removeItem(idx)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Frais livraison + totaux */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600 font-semibold">Frais de livraison</label>
              <input
                type="number"
                value={deliveryFee}
                onChange={e => setDeliveryFee(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-28 px-2 py-1 text-sm text-right rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Sous-total</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span><span className="text-emerald-700">{formatPrice(total)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function OrderDetailActions({ order }: { order: Order }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      {/* Statut paiement */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <h2 className="font-bold text-slate-700">Statut du paiement</h2>
        <PaymentStatusSelect orderId={order.id} current={order.statut_paiement} />
        <p className="text-xs text-slate-400">Enregistré automatiquement à la sélection.</p>
      </div>

      {/* Modifier + Supprimer */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <h2 className="font-bold text-slate-700">Actions</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-bold transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Modifier la commande
          </button>
          <DeleteConfirm orderId={order.id} reference={order.reference} />
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && <EditModal order={order} onClose={() => setEditOpen(false)} />}
    </>
  );
}
