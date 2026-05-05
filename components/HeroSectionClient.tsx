"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export interface HeroSlide {
  id:            number;
  image:         string;
  image_mobile?: string;
  gradient:      string;
  accent:        string;
  nom?:          string;
  href?:         string;
  /* legacy text fields — kept for backward compat but no longer rendered */
  eyebrow?:   string;
  title?:     string;
  subtitle?:  string;
  cta_label?: string;
  cta_href?:  string;
}

function SlideWrapper({
  href, className, children,
}: {
  href?: string; className?: string; children: React.ReactNode;
}) {
  if (href) return <a href={href} className={className}>{children}</a>;
  return <div className={className}>{children}</div>;
}

export default function HeroSectionClient({ slides }: { slides: HeroSlide[] }) {
  const [cur,    setCur]   = useState(0);
  const [paused, setPause] = useState(false);
  const total = slides.length;

  const next = useCallback(() => setCur(c => (c + 1) % total), [total]);
  const prev = useCallback(() => setCur(c => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = slides[cur];

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* ── Mobile: rounded card with padding ── */}
      <div className="md:hidden relative w-full px-3 pt-2">
        <div className="relative rounded-[20px] overflow-hidden">
          <SlideWrapper href={slide.href} className="block w-full">
            {(slide.image_mobile || slide.image) ? (
              <img
                src={slide.image_mobile || slide.image}
                alt={slide.nom ?? ""}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-auto block"
              />
            ) : (
              <div className={clsx("w-full aspect-[3/2] bg-gradient-to-br", slide.gradient)} />
            )}
          </SlideWrapper>

          {total > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`}
                  className={clsx("h-1.5 rounded-full transition-all duration-300",
                    i === cur ? "w-6 bg-white shadow" : "w-1.5 bg-white/50")}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: fixed aspect ratio, cross-fade all slides simultaneously ── */}
      <div className="hidden md:block aspect-[1920/700] relative">
        {slides.map((s, i) => (
          <SlideWrapper key={i} href={s.href}
            className={clsx(
              "absolute inset-0 transition-opacity duration-700",
              i === cur ? "opacity-100 z-10" : "opacity-0 z-0",
              s.href ? "cursor-pointer" : ""
            )}
          >
            {/* Neutral dark fallback — no color flash before image loads */}
            <div className="absolute inset-0 bg-slate-900" />
            {s.image && (
              <img
                src={s.image}
                alt={s.nom ?? ""}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </SlideWrapper>
        ))}

        {/* Desktop controls */}
        {total > 1 && (
          <>
            <button onClick={prev} aria-label="Slide précédente"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} aria-label="Slide suivante"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`}
                  className={clsx("h-1.5 rounded-full transition-all duration-400",
                    i === cur ? "w-8 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60")}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
