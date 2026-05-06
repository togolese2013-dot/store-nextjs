"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export default function OrderConfirmButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "confirmed" }),
    });
    setDone(true);
    setLoading(false);
    router.refresh();
  }

  if (done) return null;

  return (
    <button
      onClick={confirm}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <CheckCircle className="w-4 h-4" />}
      Confirmer la commande
    </button>
  );
}
