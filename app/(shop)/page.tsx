export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { finalPrice, formatPrice } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import type { Product } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import Newsletter from "@/components/Newsletter";
import TestimonialsSlider from "@/components/TestimonialsSlider";
import Link from "next/link";
import {
  Truck, CreditCard, RefreshCw, ShieldCheck,
  ArrowRight, Star, TrendingUp, Sparkles, Tag,
} from "lucide-react";

/* ─── Trust bar ─── */
function TrustBar() {
  const items = [
    { icon: Truck,       label: "Livraison rapide",        sub: "Lomé & tout le Togo" },
    { icon: CreditCard,  label: "Paiement à la livraison", sub: "Vous payez à la réception" },
    { icon: RefreshCw,   label: "Retours acceptés",        sub: "7 jours après réception" },
    { icon: ShieldCheck, label: "100% authentique",        sub: "Produits vérifiés" },
  ];
  return (
    <div className="bg-white border-b border-slate-100">
      {/* Hidden on mobile, 4-col grid on sm+ */}
      <div className="hidden sm:grid grid-cols-4 divide-x divide-slate-100 max-w-7xl mx-auto px-6 lg:px-8">
        {items.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-4 lg:py-5">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-brand-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-sm font-bold text-slate-900 leading-tight">{label}</p>
              <p className="text-[10px] lg:text-xs text-slate-500 leading-tight">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({
  title, subtitle, icon: Icon, viewAll, children, bg = "bg-white",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  viewAll?: { label: string; href: string };
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <section className={`py-10 lg:py-16 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5 lg:mb-8">
          <div>
            {Icon && subtitle && (
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-4 h-4 text-accent-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
                  {subtitle}
                </span>
              </div>
            )}
            <h2 className="font-display text-xl sm:text-3xl font-800 text-slate-900 leading-tight">
              {title}
            </h2>
          </div>
          {viewAll && (
            <Link
              href={viewAll.href}
              className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900 group transition-colors shrink-0 ml-4"
            >
              <span className="hidden sm:inline">{viewAll.label}</span>
              <span className="sm:hidden">Voir tout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

/* ─── Products grid ─── */
function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="font-display text-lg">Aucun produit disponible pour l'instant</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

/* ─── Promo banner ─── */
function PromoBanner() {
  return (
    <section className="py-5 lg:py-8 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-brand-950 px-6 py-8 sm:px-12 sm:py-12">
          {/* Subtle decorative shape */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/[0.04]" />
          <div className="absolute right-8 -bottom-16 w-56 h-56 rounded-full bg-accent-500/10" />

          <div className="relative z-10 max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold mb-4 border border-white/15">
              <Tag className="w-3 h-3 text-accent-300" /> OFFRE SPÉCIALE DU MOMENT
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-800 text-white mb-3 leading-tight">
              Jusqu'à <span className="text-accent-300">-50%</span><br className="hidden sm:block" />
              {" "}sur les articles sélectionnés
            </h2>
            <p className="text-white/60 mb-7 text-sm sm:text-base">
              Promotions valables tant que le stock dure.
            </p>
            <Link
              href="/products?promo=true"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 text-white font-bold text-sm sm:text-base hover:bg-accent-400 transition-all active:scale-95"
            >
              Voir les promotions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function Testimonials() {
  const reviews = [
    { name: "Kossi A.",   loc: "Lomé",       rating: 5, text: "Livraison le jour même, produit exactement comme décrit. Service client disponible sur WhatsApp, super réactif !", avatar: "KA" },
    { name: "Afia M.",    loc: "Kpalimé",    rating: 5, text: "J'ai commandé un casque audio, qualité top et prix très correct. Je recommande à 100%.", avatar: "AM" },
    { name: "Edem K.",    loc: "Atakpamé",   rating: 5, text: "Paiement à la livraison, c'est ce qui m'a convaincu. Produit reçu en parfait état.", avatar: "EK" },
    { name: "Délali S.",  loc: "Lomé",       rating: 4, text: "Bonne expérience globale. Le site est facile à naviguer et la livraison est ponctuelle.", avatar: "DS" },
  ];
  const colors = ["bg-brand-800", "bg-accent-500", "bg-brand-600", "bg-amber-500"];

  return (
    <section className="py-10 lg:py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">Avis clients</span>
          </div>
          <h2 className="font-display text-xl sm:text-3xl font-800 text-slate-900">
            Ce que disent nos clients
          </h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
            ))}
            <span className="ml-2 text-xs font-semibold text-slate-500">4.9 / 5 · 120+ avis</span>
          </div>
        </div>

        {/* Mobile: auto-sliding single card */}
        <div className="md:hidden">
          <TestimonialsSlider reviews={reviews} colors={colors} />
        </div>

        {/* Desktop: static grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((r, i) => (
            <div key={r.name} className="bg-white rounded-2xl p-5 border border-slate-100 flex flex-col">
              <div className="flex gap-0.5 mb-3">
                {[...Array(r.rating)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-5 italic flex-1">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full ${colors[i % colors.length]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                  {r.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.loc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PAGE ─── */
export default async function HomePage() {
  let bestsellers: Product[] = [];
  let promos:      Product[] = [];
  let newItems:    Product[] = [];

  try {
    [bestsellers, promos, newItems] = await Promise.all([
      apiGet<{ data: Product[] }>("/api/products/bestsellers?limit=8").then(r => r.data),
      apiGet<{ data: Product[] }>("/api/products?promo=true&limit=8").then(r => r.data),
      apiGet<{ data: Product[] }>("/api/products?new=true&limit=8").then(r => r.data),
    ]);
  } catch (err) {
    console.error("[HomePage] API fetch failed:", err);
  }

  return (
    <>
      <HeroSection />
      <TrustBar />

      <Section
        title="Meilleures ventes"
        subtitle="Populaires"
        icon={TrendingUp}
        viewAll={{ label: "Voir tous les produits", href: "/products" }}
        bg="bg-white"
      >
        <ProductGrid products={bestsellers} />
      </Section>

      <PromoBanner />

      {promos.length > 0 && (
        <Section
          title="Promotions du moment"
          subtitle="Soldes"
          icon={Tag}
          viewAll={{ label: "Toutes les promos", href: "/products?promo=true" }}
          bg="bg-white"
        >
          <ProductGrid products={promos} />
        </Section>
      )}

      {newItems.length > 0 && (
        <Section
          title="Nouveaux arrivages"
          subtitle="Nouveautés"
          icon={Sparkles}
          viewAll={{ label: "Voir les nouveautés", href: "/products?new=true" }}
          bg="bg-slate-50/60"
        >
          <ProductGrid products={newItems} />
        </Section>
      )}

      <Testimonials />
      <Newsletter />
    </>
  );
}
