"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface Slide {
  id:       number;
  eyebrow:  string;
  title:    string;
  sub:      string;
  cta1:     { label: string; href: string };
  cta2:     { label: string; href: string } | null;
  gradient: string;
  accent:   string;
  image:    string;
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.054 1.47 5.764L0 24l6.396-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

export default function HeroSectionClient({ slides }: { slides: Slide[] }) {
  const [cur,    setCur]    = useState(0);
  const [paused, setPause]  = useState(false);
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
      style={{ minHeight: "clamp(420px, 56vw, 600px)" }}
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <div className={clsx("absolute inset-0 bg-gradient-to-br transition-all duration-700", slide.gradient)} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-32 -top-32 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />
        <div className="absolute right-16 bottom-0 w-96 h-96 rounded-full bg-white/[0.04]" />
        <div className="absolute left-1/3 top-1/4 w-48 h-48 rounded-full"
          style={{ background: `${slide.accent}18` }} />
      </div>

      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {slide.image && (
        <div className="absolute right-0 bottom-0 h-full w-1/2 pointer-events-none hidden md:block">
          <img src={slide.image} alt="" loading={cur === 0 ? "eager" : "lazy"}
            className="absolute right-0 bottom-0 h-full w-full object-contain object-right-bottom opacity-90" aria-hidden />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center"
        style={{ minHeight: "inherit" }}
      >
        <div className="py-16 max-w-lg animate-fade-up" key={slide.id}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: `${slide.accent}25`, border: `1px solid ${slide.accent}40` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: slide.accent }} />
            <span className="text-white/90 text-xs font-bold tracking-widest uppercase">{slide.eyebrow}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-800 text-white leading-none mb-4 whitespace-pre-line"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,.3)" }}
          >
            {slide.title}
          </h1>
          <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-8 max-w-md">{slide.sub}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={slide.cta1.href}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: slide.accent, color: "#fff", boxShadow: `0 8px 24px ${slide.accent}50` }}
            >
              {slide.cta1.label} <ArrowRight className="w-5 h-5" />
            </Link>
            {slide.cta2 && (
              <a href={slide.cta2.href} target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-base bg-[#25D366] text-white transition-all duration-200 hover:bg-[#1da851] hover:-translate-y-0.5 hover:shadow-lg"
              >
                <WaIcon /> {slide.cta2.label}
              </a>
            )}
          </div>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-2">
              {["KA", "AM", "EK", "DS"].map((av, i) => (
                <div key={i}
                  className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: ["#1E3A8A", "#F4623A", "#1E3A8A", "#F59E0B"][i] }}
                >{av}</div>
              ))}
            </div>
            <p className="text-white/70 text-sm"><span className="text-white font-bold">+500</span> clients satisfaits</p>
          </div>
        </div>
      </div>

      {total > 1 && (
        <>
          <button onClick={prev} aria-label="Slide précédente"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} aria-label="Slide suivante"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`}
                className={clsx("h-2 rounded-full transition-all duration-400",
                  i === cur ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60")}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
