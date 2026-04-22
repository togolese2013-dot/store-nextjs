/**
 * Server component — fetches hero slides from DB settings, falls back to defaults.
 */
import { apiGet } from "@/lib/api";
import HeroSectionClient from "@/components/HeroSectionClient";

const DEFAULTS = [
  {
    id: 1,
    eyebrow:  "Électronique Premium",
    title:    "Capturez chaque\nmoment parfait",
    sub:      "Caméras, drones et accessoires de qualité professionnelle. Livraison rapide à Lomé.",
    cta1:     { label: "Découvrir le catalogue", href: "/products" },
    cta2:     null,
    gradient: "from-[#052e16] via-[#14532d] to-[#166534]",
    accent:   "#22c55e",
    image:    "/hero_1.png",
  },
  {
    id: 2,
    eyebrow:  "Offres exclusives",
    title:    "Les bonnes affaires\nsont ici",
    sub:      "Jusqu'à -50% sur des centaines de produits. Profitez de nos promotions exceptionnelles.",
    cta1:     { label: "Voir les promotions", href: "/products?promo=true" },
    cta2:     null,
    gradient: "from-[#052e16] via-[#0f3d1e] to-[#14532d]",
    accent:   "#4ade80",
    image:    "/hero_2.png",
  },
  {
    id: 3,
    eyebrow:  "Audio & Gaming",
    title:    "Son cristallin,\nexpérience ultime",
    sub:      "Les meilleurs casques, enceintes et accessoires gaming. Qualité garantie.",
    cta1:     { label: "Explorer l'audio", href: "/products?category=audio" },
    cta2:     null,
    gradient: "from-[#052e16] via-[#14532d] to-[#15803d]",
    accent:   "#f59e0b",
    image:    "/hero_3.png",
  },
];

export default async function HeroSection() {
  const settings: Record<string, string> = await apiGet<{ settings: Record<string, string> }>(
    "/api/settings/public", { noAuth: true }
  ).then(r => r.settings).catch(() => ({}));

  const slides = DEFAULTS.map((def, i) => {
    const n = i + 1;
    const title    = settings[`hero_slide_${n}_title`]    || def.title;
    const sub      = settings[`hero_slide_${n}_subtitle`] || def.sub;
    const cta      = settings[`hero_slide_${n}_cta`]      || def.cta1.label;
    const image    = settings[`hero_slide_${n}_image`]    || def.image;
    const gradient = settings[`hero_slide_${n}_gradient`] || def.gradient;

    return {
      ...def,
      title,
      sub,
      cta1:     { ...def.cta1, label: cta },
      image,
      gradient,
    };
  });

  return <HeroSectionClient slides={slides} />;
}
