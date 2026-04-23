"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images:       string[];
  productName:  string;
  defaultImage?: string | null;
}

function resolveUrl(src: string): string {
  if (src.startsWith("http")) return src;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

const THUMB_VISIBLE = 4;

export default function ProductImageGallerySimple({ images, productName, defaultImage }: Props) {
  const all: string[] = [...images];
  if (defaultImage && !all.includes(defaultImage)) all.unshift(defaultImage);

  const [idx,       setIdx]       = useState(0);
  const [thumbOff,  setThumbOff]  = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  if (all.length === 0) {
    return (
      <div className="aspect-[4/3] bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">📷</span>
        </div>
        <span className="text-sm font-medium">Photo bientôt disponible</span>
      </div>
    );
  }

  const canPrevThumb = thumbOff > 0;
  const canNextThumb = thumbOff + THUMB_VISIBLE < all.length;

  function selectImg(i: number) {
    setIdx(i);
    if (i < thumbOff) setThumbOff(i);
    else if (i >= thumbOff + THUMB_VISIBLE) setThumbOff(i - THUMB_VISIBLE + 1);
  }

  function prevThumb() { if (canPrevThumb) setThumbOff(o => o - 1); }
  function nextThumb() { if (canNextThumb) setThumbOff(o => o + 1); }

  const visibleThumbs = all.slice(thumbOff, thumbOff + THUMB_VISIBLE);

  return (
    <div className="flex flex-col bg-white">

      {/* ── Main image ── */}
      <div className="relative w-full aspect-[4/3] bg-slate-50 overflow-hidden">
        <Image
          key={all[idx]}
          src={resolveUrl(all[idx])}
          alt={`${productName} — ${idx + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain transition-opacity duration-300"
          priority={idx === 0}
        />
        {all.length > 1 && (
          <span className="absolute bottom-2 right-3 px-2 py-0.5 rounded-md bg-black/30 text-white text-xs font-medium backdrop-blur-sm">
            {idx + 1} / {all.length}
          </span>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {all.length >= 1 && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">

          {/* Prev arrow */}
          <button
            onClick={prevThumb}
            disabled={!canPrevThumb}
            aria-label="Précédent"
            className="shrink-0 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Thumbnails */}
          <div ref={stripRef} className="flex flex-1 gap-2">
            {visibleThumbs.map((src, vi) => {
              const globalIdx = thumbOff + vi;
              const active    = globalIdx === idx;
              return (
                <button
                  key={globalIdx}
                  onClick={() => selectImg(globalIdx)}
                  aria-label={`Voir image ${globalIdx + 1}`}
                  className={`relative flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    active
                      ? "border-brand-700 shadow-md"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Image
                    src={resolveUrl(src)}
                    alt={`${productName} miniature ${globalIdx + 1}`}
                    fill
                    sizes="(max-width: 1024px) 25vw, 12vw"
                    className="object-cover"
                  />
                </button>
              );
            })}
            {/* Filler slots si moins de THUMB_VISIBLE images */}
            {visibleThumbs.length < THUMB_VISIBLE && Array.from({ length: THUMB_VISIBLE - visibleThumbs.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 aspect-square" />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={nextThumb}
            disabled={!canNextThumb}
            aria-label="Suivant"
            className="shrink-0 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      )}
    </div>
  );
}
