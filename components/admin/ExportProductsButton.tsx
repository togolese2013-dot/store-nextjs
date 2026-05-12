"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Props {
  q?: string;
  catId?: number;
  brandId?: number;
  statut?: string;
}

export default function ExportProductsButton({ q, catId, brandId, statut }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q)       params.set("q",        q);
      if (catId)   params.set("category", String(catId));
      if (brandId) params.set("brand",    String(brandId));
      if (statut && statut !== "all") params.set("statut", statut);

      const url = `/api/admin/products/export${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de l'export.");
        return;
      }

      // Extract filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : "produits.csv";

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      alert("Erreur réseau lors de l'export.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      title="Exporter les produits en CSV"
    >
      <Download className={`w-4 h-4 ${loading ? "animate-bounce" : ""}`} />
      {loading ? "Export…" : "Exporter CSV"}
    </button>
  );
}
