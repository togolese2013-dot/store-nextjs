"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "pending",   label: "En attente",  cls: "bg-amber-100 text-amber-700" },
  { value: "confirmed", label: "Confirmée",   cls: "bg-blue-100 text-blue-700" },
  { value: "shipped",   label: "Expédiée",    cls: "bg-purple-100 text-purple-700" },
  { value: "delivered", label: "Livrée",      cls: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Annulée",     cls: "bg-red-100 text-red-700" },
];

export default function OrderStatusSelect({
  orderId, currentStatus,
}: { orderId: number; currentStatus: string }) {
  const router  = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const current = OPTIONS.find(o => o.value === status) ?? OPTIONS[0];

  async function change(val: string) {
    setSaving(true);
    setStatus(val);
    await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: val }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={e => change(e.target.value)}
      disabled={saving}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-0 outline-none cursor-pointer ${current.cls}`}
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
