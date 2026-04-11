"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface Props {
  images: string[];
  productName: string;
  defaultImage?: string | null;
}

export default function ProductImageGallery({ images, productName, defaultImage }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Combine images: gallery images + default image if provided
  const allImages = [...images];
  if (defaultImage && !images.includes(defaultImage)) {
    allImages.unshift(defaultImage);
  }

  if (allImages.length === 0) {
    return (
      <div className="relative bg-slate-50 rounded-3xl overflow-hidden" style={{ minHeight: "380px" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
          <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
            <ZoomIn className="w-10 h-10" strokeWidth={1} />
          </div>
          <span className="text-sm font-medium">Photo bientôt disponible</span>
        </div>
      </div>
    );
  }

  const currentImage = allImages[currentIndex];
  const imageSrc = currentImage.startsWith("http") 
    ? currentImage 
    : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${currentImage}`;

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative">
      {/* Main image */}
      <div className="relative bg-slate-50 rounded-3xl overflow-hidden" style={{ minHeight: "380px" }}>
        <Image
          src={imageSrc}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`object-contain p-8 cursor-zoom-in transition-transform duration-300 ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
          priority
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom indicator */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
          aria-label={isZoomed ? "Réduire" : "Zoomer"}
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Image counter */}
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {allImages.length}
        </div>
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {allImages.map((img, idx) => {
            const thumbSrc = img.startsWith("http") 
              ? img 
              : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${img}`;
            
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? "border-brand-500 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                aria-label={`Voir image ${idx + 1}`}
              >
                <div className="relative w-full h-full bg-slate-100">
                  <Image
                    src={thumbSrc}
                    alt={`Miniature ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}