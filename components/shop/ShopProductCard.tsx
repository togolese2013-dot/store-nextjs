"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { type Product, finalPrice, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function resolveImg(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return `${SITE}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export default function ShopProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const price = finalPrice(product);
  const isPromo = product.remise > 0;
  const discountPct =
    isPromo && product.prix_unitaire > 0
      ? Math.round((product.remise / product.prix_unitaire) * 100)
      : 0;
  const isNew = Boolean(
    product.neuf &&
      product.date_creation &&
      Date.now() - new Date(product.date_creation).getTime() <= 30 * 24 * 60 * 60 * 1000
  );
  const outOf = product.stock_boutique === 0;

  const imgSrc = resolveImg(product.image_url || product.images?.[0] || null);

  const badge = isPromo ? `-${discountPct}%` : isNew ? "Nouveau" : null;
  const badgeColor = isPromo ? "#E07A2C" : "#2D6A4F";

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOf) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link href={`/products/${product.slug ?? product.reference}`}>
      <article className="bg-white rounded-[14px] overflow-hidden border border-[#E8E1D4] cursor-pointer hover:border-[#C8BBAA] transition-colors">
        {/* Image */}
        <div className="relative h-[130px] bg-[rgba(232,225,212,0.25)] overflow-hidden">
          {imgSrc && !imgErr ? (
            <Image
              src={imgSrc}
              alt={product.nom}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 50vw, 200px"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#8A8278] text-[9px] font-mono uppercase tracking-wider">
                {product.categorie_nom ?? "produit"}
              </span>
            </div>
          )}
          {badge && (
            <span
              className="absolute top-2 left-2 text-white text-[8.5px] font-bold uppercase tracking-[0.06em] px-[7px] py-[3px] rounded-full"
              style={{ background: badgeColor }}
            >
              {badge}
            </span>
          )}
          {outOf && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-[11px] font-bold text-[#8A8278] uppercase tracking-widest">Rupture</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-[11px] pt-[9px] pb-3">
          {product.categorie_nom && (
            <p className="text-[9.5px] text-[#8A8278] uppercase tracking-[0.06em] mb-0.5">
              {product.categorie_nom}
            </p>
          )}
          <h3 className="text-[12.5px] text-[#14110E] font-medium leading-[1.25] mb-[6px] tracking-[-0.01em] line-clamp-2">
            {product.nom}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[13px] font-mono font-medium text-[#14110E]">
                {formatPrice(price)}
              </span>
              {isPromo && (
                <span className="text-[11px] text-[#8A8278] line-through ml-1.5">
                  {formatPrice(product.prix_unitaire)}
                </span>
              )}
            </div>
            <button
              onClick={handleAdd}
              disabled={outOf}
              className="w-[26px] h-[26px] rounded-full grid place-items-center border-none cursor-pointer transition-colors disabled:opacity-40"
              style={{ background: added ? "#2D6A4F" : "#14110E", color: "white" }}
              aria-label="Ajouter au panier"
            >
              {added ? (
                <Check className="w-3 h-3" strokeWidth={2.5} />
              ) : (
                <Plus className="w-[13px] h-[13px]" strokeWidth={2.4} />
              )}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
