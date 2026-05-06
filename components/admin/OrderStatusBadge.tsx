"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmée",  cls: "bg-blue-100 text-blue-700" },
  shipped:   { label: "Expédiée",   cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "Livrée",     cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée",    cls: "bg-red-100 text-red-700" },
};

export default function OrderStatusBadge({
  orderId,
  status: initialStatus,
}: {
  orderId: number;
  status:  string;
}) {
  const router  = useRouter();
  const [status,  setStatus]  = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const info = STATUS_MAP[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };

  async function confirm(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "confirmed" }),
    });
    setStatus("confirmed");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${info.cls}`}>
        {info.label}
      </span>
      {status === "pending" && (
        <button
          onClick={confirm}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <CheckCircle className="w-3 h-3" />}
          Confirmer
        </button>
      )}
    </div>
  );
}
