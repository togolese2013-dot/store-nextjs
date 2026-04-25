"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import RecentlyViewed from "@/components/RecentlyViewed";

export default function RecentlyViewedPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Retour au compte
        </Link>

        <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Vu récemment</h1>
        <p className="text-sm text-slate-400 mb-6">Vos derniers produits consultés</p>
      </div>

      <RecentlyViewed maxItems={20} />
    </div>
  );
}
