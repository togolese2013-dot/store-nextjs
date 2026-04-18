"use client";

import { useState } from "react";
import { X, Package, Tag, Boxes, ExternalLink, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { finalPrice, formatPrice } from "@/lib/utils";

interface Product {
  id:             number;
  reference:      string;
  nom:            string;
  description:    string | null;
  categorie_nom:  string | null;
  prix_unitaire:  number;
  remise:         number;
  stock_boutique: number;
  stock_magasin:  number;
  image_url:      string | null;
  images:         string[];
}

interface Props {
  product: Product;
  onClose: () => void;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/api/uploads/${url}`;
}

export default function ProductQuickViewModal({ product, onClose }: Props) {
  const price     = finalPrice(product);
  const hasPromo  = product.remise > 0;

  // Build ordered image list: images array first, fallback to image_url
  const allImages: string[] = product.images && product.images.length > 0
    ? product.images.map(normalizeUrl)
    : product.image_url
      ? [normalizeUrl(product.image_url)]
      : [];

  const [activeIdx, setActiveIdx] = useState(0);
  const mainImg = allImages[activeIdx] ?? null;

  const stockTotal = (product.stock_magasin ?? 0) + (product.stock_boutique ?? 0);
  const stockStatus =
    stockTotal === 0 ? { label: "Épuisé",     cls: "bg-red-100 text-red-700",     dot: "bg-red-500"   } :
    stockTotal <= 5  ? { label: "Stock faible", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" } :
                       { label: "Disponible",  cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${stockStatus.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot}`} />
              {stockStatus.label}
            </span>
            <h2 className="font-bold text-lg text-slate-900 truncate">{product.nom}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-auto">

          {/* Left — Gallery */}
          <div className="md:w-72 shrink-0 bg-slate-50 flex flex-col items-center justify-start p-6 gap-4 border-b md:border-b-0 md:border-r border-slate-100">
            {/* Main image */}
            <div className="relative w-full aspect-square rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              {mainImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImg} alt={product.nom} className="absolute inset-0 w-full h-full object-contain p-3" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                  <Package className="w-16 h-16" strokeWidth={1} />
                </div>
              )}

              {/* Image nav arrows (if multiple images) */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveIdx(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveIdx(i => (i + 1) % allImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/40 text-white text-[10px] font-bold">
                    {activeIdx + 1}/{allImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {allImages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === activeIdx
                        ? "border-emerald-500 shadow-md"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-contain p-0.5 bg-white" />
                  </button>
                ))}
              </div>
            )}

            {allImages.length === 0 && (
              <p className="text-xs text-slate-400 text-center">Aucune image</p>
            )}
          </div>

          {/* Right — Info */}
          <div className="flex-1 p-7 space-y-5 overflow-y-auto">

            {/* Reference + Category */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs text-slate-600 font-semibold">
                {product.reference}
              </span>
              {product.categorie_nom && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                  <Tag className="w-3 h-3" />
                  {product.categorie_nom.toUpperCase()}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Prix final</p>
              <p className="font-bold text-3xl text-slate-900">{formatPrice(price)}</p>
              {hasPromo && (
                <p className="text-sm text-slate-400 mt-1">
                  Prix initial : <span className="line-through">{formatPrice(product.prix_unitaire)}</span>
                  {" · "}
                  <span className="text-emerald-600 font-semibold">
                    -{formatPrice(product.remise)} de réduction
                  </span>
                </p>
              )}
            </div>

            {/* Stock grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Boxes className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Stock magasin</p>
                </div>
                <p className={`font-bold text-2xl ${
                  product.stock_magasin === 0 ? "text-red-500" :
                  product.stock_magasin <= 5  ? "text-amber-500" : "text-emerald-600"
                }`}>
                  {product.stock_magasin}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">unités en stock</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Boxes className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Stock boutique</p>
                </div>
                <p className={`font-bold text-2xl ${
                  product.stock_boutique === 0 ? "text-red-500" :
                  product.stock_boutique <= 5  ? "text-amber-500" : "text-emerald-600"
                }`}>
                  {product.stock_boutique}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">unités disponibles</p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-7 py-5 border-t border-slate-100 shrink-0 flex gap-3 bg-slate-50/60">
          <Link
            href={`/admin/products/${product.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Modifier le produit
          </Link>
          <Link
            href={`/products/${product.reference}`}
            target="_blank"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Voir en boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
