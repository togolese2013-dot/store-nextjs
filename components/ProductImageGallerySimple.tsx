"use client";

import { useState } from "react";
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

export default function ProductImageGallerySimple({ images, productName, defaultImage }: Props) {
  const all = [...images];
  if (defaultImage && !all.includes(defaultImage)) all.unshift(defaultImage);

  const [idx, setIdx] = useState(0);

  if (all.length === 0) {
    return (
      <div className="aspect-square bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">📷</span>
        </div>
        <span className="text-sm font-medium">Photo bientôt disponible</span>
      </div>
    );
  }

  const prev = () => setIdx(i => (i - 1 + all.length) % all.length);
  const next = () => setIdx(i => (i + 1) % all.length);

  return (
    <div className="flex flex-col h-full">

      {/* ── Main image — square, covers full zone ── */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden group">
        <Image
          key={all[idx]}
          src={resolveUrl(all[idx])}
          alt={`${productName} — ${idx + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-opacity duration-300"
          priority={idx === 0}
        />

        {/* Prev / Next arrows — visible on hover */}
        {all.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Image précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={next}
              aria-label="Image suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </>
        )}

        {/* Image counter */}
        {all.length > 1 && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/40 text-white text-xs font-medium backdrop-blur-sm">
            {idx + 1} / {all.length}
          </span>
        )}
      </div>

      {/* ── Thumbnails — horizontal scroll ── */}
      {all.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto px-4 pb-1 scrollbar-thin">
          {all.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Voir image ${i + 1}`}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === idx
                  ? "border-brand-600 shadow-md"
                  : "border-transparent hover:border-slate-300"
              }`}
            >
              <Image
                src={resolveUrl(src)}
                alt={`${productName} miniature ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
