"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";

export default function ReviewActions({ reviewId, approved }: { reviewId: number; approved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId, approved: !approved }),
    });
    setBusy(false); router.refresh();
  }

  async function del() {
    if (!confirm("Supprimer cet avis ?")) return;
    setBusy(true);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId, _delete: true }),
    });
    setBusy(false); router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <button onClick={toggle} disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
          approved
            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
            : "bg-green-50 text-green-600 hover:bg-green-100"
        }`}
      >
        {approved ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        {approved ? "Masquer" : "Approuver"}
      </button>
      <button onClick={del} disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Supprimer
      </button>
    </div>
  );
}
