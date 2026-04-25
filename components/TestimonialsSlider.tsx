"use client";

import { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";

interface Review {
  name: string;
  loc: string;
  rating: number;
  text: string;
  avatar: string;
}

interface Props {
  reviews: Review[];
  colors: string[];
}

export default function TestimonialsSlider({ reviews, colors }: Props) {
  const [cur, setCur]         = useState(0);
  const [visible, setVisible] = useState(true);
  const touchStartX           = useRef<number | null>(null);
  const total = reviews.length;

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setCur(c => (c + 1) % total); setVisible(true); }, 280);
    }, 4000);
    return () => clearInterval(t);
  }, [total]);

  const goTo = (i: number) => {
    setVisible(false);
    setTimeout(() => { setCur(i); setVisible(true); }, 280);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      goTo(dx < 0 ? (cur + 1) % total : (cur - 1 + total) % total);
    }
    touchStartX.current = null;
  };

  const r = reviews[cur];

  return (
    <div
      className="select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`transition-all duration-280 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 max-w-2xl mx-auto">
          {/* Stars */}
          <div className="flex gap-0.5 mb-3">
            {[...Array(r.rating)].map((_, j) => (
              <Star key={j} className="w-4 h-4 text-amber-400" fill="currentColor" />
            ))}
          </div>
          {/* Quote */}
          <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">
            &ldquo;{r.text}&rdquo;
          </p>
          {/* Author */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full ${colors[cur % colors.length]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
              {r.avatar}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">{r.name}</p>
              <p className="text-xs text-slate-400">{r.loc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === cur ? "w-7 bg-brand-800" : "w-2 bg-slate-300"
            }`}
            aria-label={`Avis ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
