"use client";

import { useState, useCallback, useRef } from "react";
import ProductImageGallerySimple from "@/components/ProductImageGallerySimple";
import ProductVariantSelector, { type Variant } from "@/components/ProductVariantSelector";
import type { Product } from "@/lib/utils";

interface Props {
  product:       Product;
  variants:      Variant[];
  defaultImages: string[];
  badges?:       React.ReactNode; // promo/nouveau overlay badges
  headerSlot:    React.ReactNode; // brand + title + rating + description
  footerSlot:    React.ReactNode; // share + trust badges
}

function resolveUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/api/uploads/${url}`;
}

export default function ProductGalleryWithVariants({
  product, variants, defaultImages, badges, headerSlot, footerSlot,
}: Props) {
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleVariantChange = useCallback((v: Variant | null) => {
    const img = v?.image_url ? resolveUrl(v.image_url) : null;
    setVariantImage(img);
    // Mobile only — scroll to top so user sees the updated image
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Variant image first, then product images (no duplicates)
  const images = variantImage
    ? [variantImage, ...defaultImages.filter(u => u !== variantImage)]
    : defaultImages;

  return (
    <div className="grid lg:grid-cols-2 gap-0">
      {/* Left — gallery; key forces remount (idx reset) when variant image changes */}
      <div ref={galleryRef} className="relative lg:rounded-l-3xl overflow-hidden border-r border-slate-100">
        <ProductImageGallerySimple
          key={variantImage ?? "default"}
          images={images}
          productName={product.nom}
        />
        {badges && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {badges}
          </div>
        )}
      </div>

      {/* Right — info */}
      <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
        {headerSlot}
        <ProductVariantSelector
          product={product}
          variants={variants}
          onVariantChange={handleVariantChange}
        />
        {footerSlot}
      </div>
    </div>
  );
}
