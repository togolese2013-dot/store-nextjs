"use client";

import { useState, useEffect } from "react";
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
  const [cur, setCur]       = useState(0);
  const [visible, setVisible] = useState(true);
  const total = reviews.length;

  useEffect(() => {
    const t = setInterval(() => {
      // fade out → change → fade in
      setVisible(false);
      setTimeout(() => {
        setCur(c => (c + 1) % total);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, [total]);

  const handleDot = (i: number) => {
    setVisible(false);
    setTimeout(() => { setCur(i); setVisible(true); }, 300);
  };

  const r = reviews[cur];

  return (
    <div className="relative">
      {/* Single card with fade transition */}
      <div
        className={`transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm max-w-2xl mx-auto">
          <div className="flex gap-0.5 mb-4">
            {[...Array(r.rating)].map((_, j) => (
              <Star key={j} className="w-4 h-4 text-amber-400" fill="currentColor" />
            ))}
          </div>
          <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 italic">
            &ldquo;{r.text}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${colors[cur % colors.length]} text-white text-sm font-bold flex items-center justify-center shrink-0`}>
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
      <div className="flex items-center justify-center gap-2 mt-6">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDot(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === cur ? "w-8 bg-brand-800" : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Avis ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
