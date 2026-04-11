"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  productName: string;
  defaultImage?: string | null;
}

export default function ProductImageGallerySimple({ images, productName, defaultImage }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

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
            <span className="text-2xl">📷</span>
          </div>
          <span className="text-sm font-medium">Photo bientôt disponible</span>
        </div>
      </div>
    );
  }

  const currentImage = allImages[currentIndex];
  const imageSrc = currentImage.startsWith("http")
    ? currentImage
    : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${currentImage.startsWith("/") ? currentImage : `/${currentImage}`}`;

  return (
    <div className="relative">
      {/* Main image */}
      <div className="relative bg-slate-50 rounded-3xl overflow-hidden" style={{ minHeight: "380px" }}>
        <Image
          src={imageSrc}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-8"
          priority
        />
      </div>

      {/* Simple navigation */}
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          {allImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full ${
                idx === currentIndex ? "bg-brand-500" : "bg-slate-300"
              }`}
              aria-label={`Voir image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}