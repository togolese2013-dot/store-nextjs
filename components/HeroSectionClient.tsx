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

export default function HeroSectionClient({ slides }: { slides: Slide[] }) {
  const [cur,      setCur]     = useState(0);
  const [paused,   setPause]   = useState(false);
  const [imgError, setImgErr]  = useState<Record<number, boolean>>({});
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
      style={{ minHeight: "clamp(300px, 40vw, 440px)" }}
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <div className={clsx("absolute inset-0 bg-gradient-to-br transition-all duration-700", slide.gradient)} />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Decorative accent circle */}
      <div className="absolute -right-24 -top-24 w-[380px] h-[380px] rounded-full"
        style={{ background: `${slide.accent}10` }} />
      <div className="absolute right-[30%] bottom-0 w-64 h-64 rounded-full"
        style={{ background: `${slide.accent}08` }} />

      {/* Hero image — reduced ~30% vs original, hidden on broken load */}
      {slide.image && !imgError[slide.id] && (
        <div className="absolute right-0 bottom-0 h-[75%] w-[32%] pointer-events-none hidden md:block">
          <img
            src={slide.image} alt=""
            loading={cur === 0 ? "eager" : "lazy"}
            onError={() => setImgErr(prev => ({ ...prev, [slide.id]: true }))}
            className="absolute right-0 bottom-0 h-full w-full object-contain object-right-bottom opacity-85"
            aria-hidden
          />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center"
        style={{ minHeight: "inherit" }}
      >
        <div className="py-12 max-w-xl animate-fade-up" key={slide.id}>

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: `${slide.accent}22`, border: `1px solid ${slide.accent}40` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: slide.accent }} />
            <span className="text-white/90 text-xs font-bold tracking-widest uppercase">{slide.eyebrow}</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-800 text-white leading-none mb-4 whitespace-pre-line"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,.25)" }}
          >
            {slide.title}
          </h1>

          <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-md">{slide.sub}</p>

          {/* CTA */}
          <Link href={slide.cta1.href}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            style={{ background: slide.accent, color: "#fff", boxShadow: `0 8px 24px ${slide.accent}45` }}
          >
            {slide.cta1.label} <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Social proof */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-2">
              {["KA", "AM", "EK", "DS"].map((av, i) => (
                <div key={i}
                  className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: ["#14532d", "#f59e0b", "#166534", "#15803d"][i] }}
                >{av}</div>
              ))}
            </div>
            <p className="text-white/70 text-sm"><span className="text-white font-bold">+500</span> clients satisfaits</p>
          </div>
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
