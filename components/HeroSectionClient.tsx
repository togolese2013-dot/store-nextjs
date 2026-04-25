"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export interface HeroSlide {
  id:           number;
  image:        string;
  image_mobile?: string;
  gradient:     string;
  accent:       string;
  /* legacy text fields — kept for backward compat but no longer rendered */
  eyebrow?:   string;
  title?:     string;
  subtitle?:  string;
  cta_label?: string;
  cta_href?:  string;
}

export default function HeroSectionClient({ slides }: { slides: HeroSlide[] }) {
  const [cur,    setCur]   = useState(0);
  const [paused, setPause] = useState(false);
  const [errD,   setErrD]  = useState<Record<number, boolean>>({});
  const [errM,   setErrM]  = useState<Record<number, boolean>>({});
  const total = slides.length;

  const next = useCallback(() => setCur(c => (c + 1) % total), [total]);
  const prev = useCallback(() => setCur(c => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = slides[cur];

  const hasDesktop = !!(slide.image && !errD[slide.id]);
  const hasMobile  = !!(slide.image_mobile && !errM[slide.id]);

  return (
    <section
      className="relative overflow-hidden aspect-[3/2] md:aspect-[1920/700]"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* Gradient bg fallback */}
      <div className={clsx("absolute inset-0 bg-gradient-to-br transition-all duration-700", slide.gradient)} />

      {/* Mobile image (shown below md) */}
      {slide.image_mobile && (
        <img
          key={`m-${slide.id}`}
          src={slide.image_mobile}
          alt=""
          loading={cur === 0 ? "eager" : "lazy"}
          onError={() => setErrM(p => ({ ...p, [slide.id]: true }))}
          className={clsx(
            "md:hidden absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
            hasMobile ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
      )}

      {/* Desktop image (shown from md) */}
      {slide.image && (
        <img
          key={`d-${slide.id}`}
          src={slide.image}
          alt=""
          loading={cur === 0 ? "eager" : "lazy"}
          onError={() => setErrD(p => ({ ...p, [slide.id]: true }))}
          className={clsx(
            !slide.image_mobile ? "block" : "hidden md:block",
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
            hasDesktop ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
      )}

      {/* Fallback decorative circles when no image */}
      {!hasDesktop && !hasMobile && (
        <>
          <div className="absolute -right-24 -top-24 w-[380px] h-[380px] rounded-full pointer-events-none"
            style={{ background: `${slide.accent}10` }} />
          <div className="absolute right-[30%] bottom-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: `${slide.accent}08` }} />
        </>
      )}

      {/* Slider controls */}
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
    </section>
  );
}
