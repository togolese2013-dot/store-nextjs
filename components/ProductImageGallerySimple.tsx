"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

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

/* ─── Lightbox overlay ─── */
function Lightbox({
  images, current, onClose, onChange,
}: {
  images:   string[];
  current:  number;
  onClose:  () => void;
  onChange: (i: number) => void;
}) {
  const prev = () => onChange((current - 1 + images.length) % images.length);
  const next = () => onChange((current + 1) % images.length);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
          {current + 1} / {images.length}
        </span>
      )}

      {/* Main image */}
      <div
        className="relative w-full max-w-4xl max-h-[85dvh] mx-6 aspect-[4/3]"
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={resolveUrl(images[current])}
          alt={`Image ${current + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 896px"
          className="object-contain"
          priority
        />
      </div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Image suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnail dots (mobile) / strip (desktop) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4" onClick={e => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`transition-all rounded-full ${
                i === current
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Gallery ─── */
export default function ProductImageGallerySimple({ images, productName, defaultImage }: Props) {
  const all: string[] = [...images].filter(u => typeof u === "string" && u.trim() !== "");
  if (defaultImage && defaultImage.trim() !== "" && !all.includes(defaultImage)) all.unshift(defaultImage);

  const [idx,       setIdx]       = useState(0);
  const [thumbOff,  setThumbOff]  = useState(0);
  const [lightbox,  setLightbox]  = useState(false);
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
    <>
      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={all}
          current={idx}
          onClose={() => setLightbox(false)}
          onChange={i => setIdx(i)}
        />
      )}

      <div className="flex flex-col bg-white">

        {/* ── Main image ── */}
        <div
          className="relative w-full aspect-[4/3] bg-white overflow-hidden cursor-zoom-in group"
          onClick={() => setLightbox(true)}
          title="Cliquer pour agrandir"
        >
          <Image
            key={all[idx]}
            src={resolveUrl(all[idx])}
            alt={`${productName} — ${idx + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
            priority={idx === 0}
          />

          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>

          {all.length > 1 && (
            <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md bg-black/30 text-white text-xs font-medium backdrop-blur-sm">
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
    </>
  );
}
