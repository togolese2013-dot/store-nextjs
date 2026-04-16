"use client";

import { X, Package, Tag, DollarSign, Boxes, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id:             number;
  reference:      string;
  nom:            string;
  description:    string | null;
  categorie_nom:  string | null;
  prix_unitaire:  number;
  remise:         number;
  stock_boutique: number;
  image_url:      string | null;
}

interface Props {
  product: Product;
  onClose: () => void;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F CFA";
}

export default function ProductQuickViewModal({ product, onClose }: Props) {
  const finalPrice = product.remise > 0
    ? product.prix_unitaire * (1 - product.remise / 100)
    : product.prix_unitaire;

  const imgSrc = product.image_url
    ? product.image_url.startsWith("http") ? product.image_url : `/uploads/${product.image_url}`
    : null;

  const stockStatus =
    product.stock_boutique === 0 ? { label: "Épuisé",     cls: "bg-red-100 text-red-700"     } :
    product.stock_boutique <= 5  ? { label: "Faible",     cls: "bg-amber-100 text-amber-700" } :
                                   { label: "Disponible", cls: "bg-green-100 text-green-700"  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-display font-800 text-lg text-slate-900 truncate pr-4">{product.nom}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Image + badges */}
          <div className="flex gap-5">
            <div className="w-28 h-28 rounded-2xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
              {imgSrc ? (
                <Image src={imgSrc} alt={product.nom} fill className="object-contain p-2" sizes="112px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <Package className="w-10 h-10" strokeWidth={1} />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg self-start">
                {product.reference}
              </span>
              {product.categorie_nom && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Tag className="w-3.5 h-3.5" /> {product.categorie_nom}
                </span>
              )}
              <span className={`self-start px-2.5 py-0.5 rounded-full text-xs font-bold ${stockStatus.cls}`}>
                {stockStatus.label}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Prix</p>
              </div>
              <p className="font-display font-800 text-xl text-slate-900">{formatPrice(finalPrice)}</p>
              {product.remise > 0 && (
                <p className="text-xs text-slate-400 line-through mt-0.5">{formatPrice(product.prix_unitaire)}</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Boxes className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Stock</p>
              </div>
              <p className={`font-display font-800 text-xl ${
                product.stock_boutique === 0 ? "text-red-500" :
                product.stock_boutique <= 5  ? "text-amber-500" : "text-green-600"
              }`}>
                {product.stock_boutique}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">unités disponibles</p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{product.description}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <Link
            href={`/admin/products/${product.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
          >
            Modifier le produit
          </Link>
          <Link
            href={`/products/${product.reference}`}
            target="_blank"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
