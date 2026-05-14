"use client";

import { useState } from "react";
import { Wand2, Loader2, CheckCircle } from "lucide-react";

export default function GenerateSlugsButton({ canGenerateSlugs = true }: { canGenerateSlugs?: boolean }) {
  if (!canGenerateSlugs) return null;
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ updated: number } | null>(null);

  async function handleClick() {
    if (!confirm("Générer les slugs pour tous les produits sans slug ?")) return;
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/admin/products/generate-slugs", { method: "POST" });
      const data = await res.json();
      if (res.ok) setResult({ updated: data.updated });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-700 text-white text-sm font-bold hover:bg-violet-600 transition-colors disabled:opacity-60"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Wand2 className="w-4 h-4" />}
        {loading ? "Génération…" : "Générer les slugs"}
      </button>
      {result !== null && (
        <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
          <CheckCircle className="w-4 h-4" />
          {result.updated} slugs générés
        </span>
      )}
    </div>
  );
}
