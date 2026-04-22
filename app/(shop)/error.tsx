"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ShopError]", error.message, "digest:", error.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Une erreur est survenue</h1>
        <p className="text-slate-500 text-sm mb-1">
          {error.message || "Erreur inattendue côté serveur."}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono mb-6">Digest : {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
