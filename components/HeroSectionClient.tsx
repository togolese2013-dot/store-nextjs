"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export interface HeroSlide {
  id:        number;
  eyebrow:   string;
  title:     string;
  subtitle:  string;
  cta_label: string;
  cta_href:  string;
  gradient:  string;
  accent:    string;
  image:     string;
}

export default function HeroSectionClient({ slides }: { slides: HeroSlide[] }) {
  const [cur,      setCur]   = useState(0);
  const [paused,   setPause] = useState(false);
  const [imgError, setImgErr] = useState<Record<number, boolean>>({});
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
      className="relative overflow-hidden aspect-[16/5] md:aspect-auto md:min-h-[400px] lg:min-h-[460px]"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* Gradient bg */}
      <div className={clsx("absolute inset-0 bg-gradient-to-br transition-all duration-700", slide.gradient)} />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Hero image — full cover */}
      {slide.image && !imgError[slide.id] && (
        <img
          src={slide.image}
          alt=""
          loading={cur === 0 ? "eager" : "lazy"}
          onError={() => setImgErr(prev => ({ ...prev, [slide.id]: true }))}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          aria-hidden
        />
      )}

      {/* Overlay — gradient sombre pour lisibilité du texte, plus dense quand image présente */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: slide.image && !imgError[slide.id]
            ? "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.10) 100%)"
            : undefined,
        }}
      />

      {/* Accent circles (visible uniquement sans image) */}
      {(!slide.image || imgError[slide.id]) && (
        <>
          <div className="absolute -right-24 -top-24 w-[380px] h-[380px] rounded-full pointer-events-none"
            style={{ background: `${slide.accent}10` }} />
          <div className="absolute right-[30%] bottom-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: `${slide.accent}08` }} />
        </>
      )}

      {/* Text content — absolute so it fills full section height for true vertical center */}
      <div className="absolute inset-0 z-10 flex items-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-lg w-full">
          {/* Eyebrow */}
          {slide.eyebrow && (
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: slide.accent }}>
              {slide.eyebrow}
            </p>
          )}

          {/* Title */}
          <h1 className="font-display font-800 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight whitespace-pre-line mb-3 sm:mb-4">
            {slide.title}
          </h1>

          {/* Subtitle */}
          {slide.subtitle && (
            <p className="text-white/65 text-sm sm:text-base leading-relaxed mb-5 sm:mb-7 max-w-sm">
              {slide.subtitle}
            </p>
          )}

          {/* CTA */}
          {slide.cta_label && (
            <Link
              href={slide.cta_href || "/products"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200"
              style={{ background: slide.accent }}
            >
              {slide.cta_label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

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
