export const dynamic = "force-dynamic";

import { apiGet } from "@/lib/api";
import type { Product } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import Newsletter from "@/components/Newsletter";
import TestimonialsSlider from "@/components/TestimonialsSlider";
import Link from "next/link";
import {
  ArrowRight, Star, TrendingUp, Sparkles, Tag,
  MessageCircle, Truck, CreditCard, RefreshCw, ShieldCheck,
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
    <div className="hidden sm:block bg-white border-b border-[rgba(20,83,45,0.07)]">
      {/* Mobile — horizontal scroll */}
      <div className="flex sm:hidden gap-0 overflow-x-auto scrollbar-none divide-x divide-slate-100">
        {items.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 px-5 py-3.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-brand-700" />
            </div>
            <p className="text-[10px] font-bold text-slate-800 leading-tight text-center whitespace-nowrap">{label}</p>
          </div>
        ))}
      </div>
      {/* Desktop */}
      <div className="hidden sm:grid grid-cols-4 divide-x divide-[rgba(20,83,45,0.06)] max-w-7xl mx-auto px-6 lg:px-8">
        {items.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-4 lg:py-5">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-brand-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-sm font-bold text-slate-900 leading-tight">{label}</p>
              <p className="text-[10px] lg:text-xs text-slate-500 leading-tight mt-0.5">{sub}</p>
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
    <section className={`py-10 lg:py-14 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 lg:mb-8">
          <div>
            {Icon && subtitle && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-accent-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-600">
                  {subtitle}
                </span>
              </div>
            )}
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

/* ─── Promo banner ─── */
function PromoBanner() {
  return (
    <section className="py-5 lg:py-8 bg-[#f8fafb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl lg:rounded-[24px] bg-brand-950 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          {/* Decorative halos */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-accent-500/[0.18] blur-2xl pointer-events-none" />
          <div className="absolute right-10 -bottom-20 w-72 h-72 rounded-full bg-brand-800/40 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-[11px] font-bold mb-5 border border-white/15">
              <Tag className="w-3 h-3 text-accent-300" /> OFFRE SPÉCIALE DU MOMENT
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.05]">
              Jusqu'à <span className="text-accent-300">-50%</span>
              <br className="hidden sm:block" />{" "}sur les articles sélectionnés
            </h2>
            <p className="text-white/55 mb-7 text-sm sm:text-base">
              Promotions valables tant que le stock dure.
            </p>
            <Link
              href="/products?promo=true"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 text-white font-bold text-sm sm:text-base hover:bg-accent-400 transition-all active:scale-95 shadow-[0_6px_20px_rgba(245,158,11,0.30)]"
            >
              Voir les promotions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── WhatsApp CTA ─── */
function WhatsAppCTA() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "22890527912";
  return (
    <section className="py-8 bg-white border-t border-[rgba(20,83,45,0.06)]">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#25D366]/10 mb-4">
          <MessageCircle className="w-6 h-6 text-[#25D366]" />
        </div>
        <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-2">
          Besoin d'aide pour choisir ?
        </h3>
        <p className="text-slate-500 text-sm mb-5">
          Notre équipe répond sur WhatsApp · Lun–Sam 8h–18h30
        </p>
        <a
          href={`https://wa.me/${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20b858] transition-colors shadow-[0_4px_16px_rgba(37,211,102,0.28)]"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1s-1.2-.4-2.3-1.4c-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2.1 3.2 5 4.4.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 00-8.6 15l-1.4 5 5.1-1.3A10 10 0 1012 2z"/>
          </svg>
          Contactez-nous sur WhatsApp
        </a>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function Testimonials() {
  const reviews = [
    { name: "Kossi A.",   loc: "Lomé",     rating: 5, text: "Livraison le jour même, produit exactement comme décrit. Service client disponible sur WhatsApp, super réactif !", avatar: "KA" },
    { name: "Afia M.",    loc: "Kpalimé",  rating: 5, text: "J'ai commandé un casque audio, qualité top et prix très correct. Je recommande à 100%.", avatar: "AM" },
    { name: "Edem K.",    loc: "Atakpamé", rating: 5, text: "Paiement à la livraison, c'est ce qui m'a convaincu. Produit reçu en parfait état.", avatar: "EK" },
    { name: "Délali S.",  loc: "Lomé",     rating: 4, text: "Bonne expérience globale. Le site est facile à naviguer et la livraison est ponctuelle.", avatar: "DS" },
  ];
  const colors = ["bg-brand-800", "bg-accent-500", "bg-brand-600", "bg-amber-500"];

  return (
    <section className="py-10 lg:py-14 bg-[#f8fafb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-600">Avis clients</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
            Ce que disent nos clients
          </h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
            ))}
            <span className="ml-2 text-xs font-semibold text-slate-500">4.9 / 5 · 120+ avis</span>
          </div>
        </div>

        {/* Mobile slider */}
        <div className="md:hidden">
          <TestimonialsSlider reviews={reviews} colors={colors} />
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((r, i) => (
            <div key={r.name} className="bg-white rounded-2xl p-5 border border-[rgba(20,83,45,0.06)] shadow-[0_1px_4px_rgba(20,83,45,0.05)] flex flex-col">
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

  const [bsRes, promoRes, newRes] = await Promise.allSettled([
    apiGet<{ data: Product[] }>("/api/products/bestsellers?limit=8").then(r => r.data),
    apiGet<{ data: Product[] }>("/api/products?promo=true&limit=8").then(r => r.data),
    apiGet<{ data: Product[] }>("/api/products?new=true&limit=8").then(r => r.data),
  ]);
  if (bsRes.status    === "fulfilled") bestsellers = bsRes.value;
  if (promoRes.status === "fulfilled") promos      = promoRes.value;
  if (newRes.status   === "fulfilled") newItems    = newRes.value;
  if (bsRes.status    === "rejected")  console.error("[HomePage] bestsellers:", bsRes.reason);
  if (promoRes.status === "rejected")  console.error("[HomePage] promos:",      promoRes.reason);
  if (newRes.status   === "rejected")  console.error("[HomePage] new:",         newRes.reason);

  return (
    <>
      <HeroSection />
      <TrustBar />

      <Section
        title="Meilleures ventes"
        subtitle="Populaires"
        icon={TrendingUp}
        viewAll={{ label: "Voir tout", href: "/products?best=true" }}
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
          bg="bg-[#f8fafb]"
        >
          <ProductGrid products={newItems} />
        </Section>
      )}

      <Testimonials />
      <WhatsAppCTA />
      <Newsletter />
    </>
  );
}
