/**
 * Server component — fetches hero slides from DB settings, falls back to defaults.
 * Supports new hero_slides_json format and legacy hero_slide_N_* keys.
 */
import { apiGet } from "@/lib/api";
import HeroSectionClient, { type HeroSlide } from "@/components/HeroSectionClient";

const DEFAULTS: HeroSlide[] = [
  {
    id:        1,
    eyebrow:   "Électronique Premium",
    title:     "Capturez chaque\nmoment parfait",
    subtitle:  "Caméras, drones et accessoires de qualité professionnelle. Livraison rapide à Lomé.",
    cta_label: "Découvrir le catalogue",
    cta_href:  "/products",
    gradient:  "from-[#052e16] via-[#14532d] to-[#166534]",
    accent:    "#22c55e",
    image:     "/hero_1.png",
  },
  {
    id:        2,
    eyebrow:   "Offres exclusives",
    title:     "Les bonnes affaires\nsont ici",
    subtitle:  "Jusqu'à -50% sur des centaines de produits. Profitez de nos promotions exceptionnelles.",
    cta_label: "Voir les promotions",
    cta_href:  "/products?promo=true",
    gradient:  "from-[#052e16] via-[#0f3d1e] to-[#14532d]",
    accent:    "#4ade80",
    image:     "/hero_2.png",
  },
  {
    id:        3,
    eyebrow:   "Audio & Gaming",
    title:     "Son cristallin,\nexpérience ultime",
    subtitle:  "Les meilleurs casques, enceintes et accessoires gaming. Qualité garantie.",
    cta_label: "Explorer l'audio",
    cta_href:  "/products?category=audio",
    gradient:  "from-[#052e16] via-[#14532d] to-[#15803d]",
    accent:    "#f59e0b",
    image:     "/hero_3.png",
  },
];

export default async function HeroSection() {
  const settings: Record<string, string> = await apiGet<{ settings: Record<string, string> }>(
    "/api/settings/public", { noAuth: true }
  ).then(r => r.settings).catch(() => ({}));

  let slides: HeroSlide[];

  // New JSON format
  if (settings.hero_slides_json) {
    try {
      const parsed: Array<Partial<HeroSlide> & { cta_label?: string; cta_href?: string }> =
        JSON.parse(settings.hero_slides_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        slides = parsed.map((s, i) => ({
          id:           i + 1,
          nom:          s.nom          ?? "",
          href:         s.href         ?? "",
          eyebrow:      s.eyebrow      ?? DEFAULTS[i]?.eyebrow   ?? "",
          title:        s.title        ?? DEFAULTS[i]?.title      ?? "",
          subtitle:     s.subtitle     ?? DEFAULTS[i]?.subtitle   ?? "",
          cta_label:    s.cta_label    ?? DEFAULTS[i]?.cta_label  ?? "Voir",
          cta_href:     s.cta_href     ?? DEFAULTS[i]?.cta_href   ?? "/products",
          gradient:     s.gradient     ?? DEFAULTS[i]?.gradient   ?? DEFAULTS[0].gradient,
          accent:       s.accent       ?? DEFAULTS[i]?.accent      ?? DEFAULTS[0].accent,
          image:        s.image        ?? DEFAULTS[i]?.image       ?? "",
          image_mobile: s.image_mobile ?? "",
        }));
      } else {
        slides = DEFAULTS;
      }
    } catch {
      slides = DEFAULTS;
    }
  } else {
    // Legacy fallback — indexed keys
    slides = DEFAULTS.map((def, i) => {
      const n = i + 1;
      return {
        ...def,
        title:     settings[`hero_slide_${n}_title`]    || def.title,
        subtitle:  settings[`hero_slide_${n}_subtitle`] || def.subtitle,
        cta_label: settings[`hero_slide_${n}_cta`]      || def.cta_label,
        image:     settings[`hero_slide_${n}_image`]    || def.image,
        gradient:  settings[`hero_slide_${n}_gradient`] || def.gradient,
      };
    });
  }

  return <HeroSectionClient slides={slides} />;
}
