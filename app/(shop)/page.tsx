import { Suspense } from "react";
import { getProducts, getCategories, finalPrice, formatPrice } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import Newsletter from "@/components/Newsletter";
import Link from "next/link";
import {
  Truck, CreditCard, RefreshCw, ShieldCheck,
  ArrowRight, Star, TrendingUp, Sparkles, Tag,
} from "lucide-react";
// Note: Sparkles is also used in Newsletter (client component) — kept here for Section icons

/* ─── Trust bar ─── */
function TrustBar() {
  const items = [
    { icon: Truck,       label: "Livraison rapide",     sub: "Lomé & tout le Togo" },
    { icon: CreditCard,  label: "Paiement à la livraison", sub: "Vous payez à la réception" },
    { icon: RefreshCw,   label: "Retours acceptés",     sub: "7 jours après réception" },
    { icon: ShieldCheck, label: "100% authentique",     sub: "Produits vérifiés" },
  ];
  return (
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {items.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-4 lg:py-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-brand-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">{label}</p>
                <p className="text-xs text-slate-500 leading-tight">{sub}</p>
              </div>
            </div>
          ))}
        </div>
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
    <section className={`py-12 lg:py-16 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            {Icon && (
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-accent-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-accent-500">
                  {subtitle}
                </span>
              </div>
            )}
            <h2 className="font-display text-2xl sm:text-3xl font-800 text-slate-900">
              {title}
            </h2>
            <div className="mt-2 w-12 h-1 rounded-full bg-accent-500" />
          </div>
          {viewAll && (
            <Link href={viewAll.href}
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 group transition-colors"
            >
              {viewAll.label}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
        {children}
        {viewAll && (
          <div className="mt-8 sm:hidden">
            <Link href={viewAll.href}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-brand-200 text-brand-700 font-bold text-sm hover:bg-brand-50 transition-colors"
            >
              {viewAll.label} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Products grid — server component, no event handlers ─── */
function ProductGrid({ products }: { products: Awaited<ReturnType<typeof getProducts>> }) {
  if (!products.length) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="font-display text-lg">Aucun produit disponible pour l'instant</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* No onAddToCart — ProductCard handles cart internally via localStorage */}
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

/* ─── Categories strip ─── */
const CAT_ICONS: Record<string, string> = {
  default: "📦",
  "électronique": "⚡", "electronique": "⚡",
  "audio": "🎧", "casque": "🎧",
  "photo": "📷", "caméra": "📷", "camera": "📷",
  "drone": "🚁",
  "gaming": "🎮", "jeux": "🎮",
  "accessoires": "🔌",
  "téléphone": "📱", "telephone": "📱", "mobile": "📱",
  "informatique": "💻", "ordinateur": "💻",
};

function CategoriesStrip({ categories }: { categories: Awaited<ReturnType<typeof getCategories>> }) {
  if (!categories.length) return null;

  const getIcon = (nom: string) => {
    const key = nom.toLowerCase();
    return Object.keys(CAT_ICONS).find(k => key.includes(k)) ? CAT_ICONS[Object.keys(CAT_ICONS).find(k => key.includes(k))!] : CAT_ICONS.default;
  };

  return (
    <section className="py-10 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Parcourir par catégorie
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
          <Link href="/products"
            className="snap-start shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl bg-brand-900 text-white min-w-[88px] hover:bg-brand-800 transition-colors"
          >
            <span className="text-2xl">🛍️</span>
            <span className="text-xs font-semibold text-center leading-tight">Tout voir</span>
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} href={`/products?category=${cat.id}`}
              className="snap-start shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md min-w-[88px] transition-all group"
            >
              <span className="text-2xl">{getIcon(cat.nom)}</span>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-800 text-center leading-tight">
                {cat.nom}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Promo banner ─── */
function PromoBanner() {
  return (
    <section className="py-6 lg:py-8 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-accent-700 p-8 sm:p-12">
          {/* Decorative circles */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute right-20 -bottom-20 w-80 h-80 rounded-full bg-accent-500/10" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.02]" />

          <div className="relative z-10 max-w-lg">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold mb-4 border border-white/20">
              <Tag className="w-3.5 h-3.5 text-accent-300" /> OFFRE SPÉCIALE DU MOMENT
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-800 text-white mb-3 leading-tight">
              Jusqu'à <span className="text-accent-300">-50%</span><br />
              sur les articles sélectionnés
            </h2>
            <p className="text-white/75 mb-8 text-base">
              Promotions valables tant que le stock dure. Ne ratez pas ces offres exclusives !
            </p>
            <Link href="/products?promo=true"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-accent-500 text-white font-bold text-base hover:bg-accent-400 transition-all hover:shadow-accent hover:-translate-y-0.5"
            >
              Voir les promotions <ArrowRight className="w-5 h-5" />
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
    { name: "Kossi A.",   loc: "Lomé",       rating: 5, text: "Livraison en 2 jours, produit exactement comme décrit. Service client disponible sur WhatsApp, super réactif !", avatar: "KA" },
    { name: "Afia M.",    loc: "Kpalimé",    rating: 5, text: "J'ai commandé un casque audio, qualité top et prix très correct. Je recommande à 100%.", avatar: "AM" },
    { name: "Edem K.",    loc: "Atakpamé",   rating: 5, text: "Paiement à la livraison, c'est ce qui m'a convaincu. Produit reçu en parfait état.", avatar: "EK" },
    { name: "Délali S.",  loc: "Lomé",       rating: 4, text: "Bonne expérience globale. Le site est facile à naviguer et la livraison est ponctuelle.", avatar: "DS" },
  ];
  const colors = ["bg-brand-800", "bg-accent-500", "bg-brand-600", "bg-amber-500"];

  return (
    <section className="py-12 lg:py-16 bg-brand-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star className="w-5 h-5 text-accent-500" fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent-500">Avis clients</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-800 text-slate-900">
            Ce que disent nos clients
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400" fill="currentColor" />
            ))}
            <span className="ml-2 text-sm font-semibold text-slate-600">4.9 / 5 · 120+ avis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((r, i) => (
            <div key={i}
              className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(r.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400" fill="currentColor" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${colors[i]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
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
  // Server-side data fetching — wrapped to prevent crash if DB is unreachable
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let bestsellers: Awaited<ReturnType<typeof getProducts>> = [];
  let promos: Awaited<ReturnType<typeof getProducts>> = [];
  let newItems: Awaited<ReturnType<typeof getProducts>> = [];

  try {
    [categories, bestsellers, promos, newItems] = await Promise.all([
      getCategories(),
      getProducts({ limit: 8 }),
      getProducts({ promoOnly: true, limit: 8 }),
      getProducts({ newOnly: true, limit: 8 }),
    ]);
  } catch (err) {
    console.error("[HomePage] DB fetch failed:", err);
    // Page renders with empty data rather than crashing
  }

  return (
    <>
      <HeroSection />
      <TrustBar />
      <CategoriesStrip categories={categories} />

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
          bg="bg-slate-50"
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
          bg="bg-white"
        >
          <ProductGrid products={newItems} />
        </Section>
      )}


      <Testimonials />
      <Newsletter />
    </>
  );
}
