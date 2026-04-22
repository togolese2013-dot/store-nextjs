import { Suspense } from "react";
import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import type { Product, Category } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import CatalogueFilters from "@/components/CatalogueFilters";
import Link from "next/link";
import { SlidersHorizontal, Search, Tag, Sparkles, LayoutGrid } from "lucide-react";

export const metadata: Metadata = {
  title: "Catalogue — Tous les produits",
  description: "Parcourez notre catalogue complet : électronique, accessoires, audio, gaming et plus encore. Livraison rapide au Togo.",
};

const PER_PAGE = 24;

interface PageProps {
  searchParams: Promise<{
    q?:        string;
    category?: string;
    promo?:    string;
    new?:      string;
    page?:     string;
    sort?:     string;
  }>;
}

function ActiveFilter({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold hover:bg-brand-200 transition-colors"
    >
      {label}
      <span className="text-brand-500 font-bold ml-0.5">×</span>
    </Link>
  );
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params   = await searchParams;
  const q        = params.q?.trim() || undefined;
  const catId    = params.category ? Number(params.category) : undefined;
  const promoOnly = params.promo === "true";
  const newOnly   = params.new   === "true";
  const page      = Math.max(1, Number(params.page) || 1);
  const offset    = (page - 1) * PER_PAGE;

  const qs = new URLSearchParams();
  if (catId)    qs.set("category", String(catId));
  if (q)        qs.set("q", q);
  if (promoOnly) qs.set("promo", "true");
  if (newOnly)   qs.set("new", "true");
  qs.set("limit", String(PER_PAGE));
  qs.set("offset", String(offset));

  const [categoriesRes, productsRes] = await Promise.all([
    apiGet<{ data: Category[] }>("/api/categories", { noAuth: true }),
    apiGet<{ data: Product[]; total?: number }>(`/api/admin/products?${qs.toString()}`).catch(() =>
      apiGet<{ data: Product[]; total?: number }>(`/api/products?${qs.toString()}`)
    ),
  ]);
  const categories = categoriesRes.data;
  const products   = productsRes.data ?? [];
  const total      = (productsRes as { total?: number }).total ?? products.length;

  const totalPages = Math.ceil(total / PER_PAGE);
  const activeCat  = categories.find(c => c.id === catId);

  /* Build URL helper for pagination (preserving other params) */
  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q)       sp.set("q", q);
    if (catId)   sp.set("category", String(catId));
    if (promoOnly) sp.set("promo", "true");
    if (newOnly)   sp.set("new", "true");
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  /* Active filters strip */
  const activeFilters: { label: string; clearKey: string }[] = [];
  if (q)       activeFilters.push({ label: `"${q}"`, clearKey: "q" });
  if (activeCat) activeFilters.push({ label: activeCat.nom, clearKey: "category" });
  if (promoOnly) activeFilters.push({ label: "Promotions", clearKey: "promo" });
  if (newOnly)   activeFilters.push({ label: "Nouveautés", clearKey: "new" });

  function clearFilterUrl(key: string) {
    const sp = new URLSearchParams();
    if (key !== "q"        && q)        sp.set("q", q);
    if (key !== "category" && catId)    sp.set("category", String(catId));
    if (key !== "promo"    && promoOnly) sp.set("promo", "true");
    if (key !== "new"      && newOnly)   sp.set("new", "true");
    const qs = sp.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  /* Page title */
  let pageTitle = "Tous les produits";
  if (q)       pageTitle = `Résultats pour "${q}"`;
  else if (activeCat) pageTitle = activeCat.nom;
  else if (promoOnly) pageTitle = "Promotions";
  else if (newOnly)   pageTitle = "Nouveaux arrivages";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{pageTitle}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ── Sidebar filters (desktop) ── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <CatalogueFilters
                categories={categories}
                currentCategoryId={catId}
                currentSearch={q}
                promoOnly={promoOnly}
                newOnly={newOnly}
              />
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-2xl font-800 text-slate-900">{pageTitle}</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {total === 0
                    ? "Aucun produit trouvé"
                    : `${total} produit${total > 1 ? "s" : ""}`
                  }
                </p>
              </div>

              {/* Mobile filter button */}
              <CatalogueFilters
                categories={categories}
                currentCategoryId={catId}
                currentSearch={q}
                promoOnly={promoOnly}
                newOnly={newOnly}
                mobileOnly
              />
            </div>

            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-xs text-slate-400 font-medium">Filtres actifs :</span>
                {activeFilters.map(f => (
                  <ActiveFilter key={f.clearKey} label={f.label} href={clearFilterUrl(f.clearKey)} />
                ))}
                <Link href="/products" className="text-xs text-slate-400 hover:text-slate-700 transition-colors ml-1">
                  Tout effacer
                </Link>
              </div>
            )}

            {/* Quick filter pills (mobile-friendly) */}
            {!promoOnly && !newOnly && !q && !catId && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none lg:hidden">
                <Link href="/products?promo=true"
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent-50 text-accent-700 text-sm font-semibold border border-accent-200 hover:bg-accent-100 transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" /> Promos
                </Link>
                <Link href="/products?new=true"
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold border border-brand-200 hover:bg-brand-100 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Nouveautés
                </Link>
                {categories.slice(0, 6).map(cat => (
                  <Link key={cat.id} href={`/products?category=${cat.id}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-700 text-sm font-semibold border border-slate-200 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    {cat.nom}
                  </Link>
                ))}
              </div>
            )}

            {/* Grid */}
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="font-display text-xl font-700 text-slate-700 mb-2">Aucun produit trouvé</h2>
                <p className="text-slate-500 text-sm mb-6 max-w-xs">
                  {q ? `Aucun résultat pour "${q}". Essayez d'autres mots-clés.` : "Aucun produit correspond à ces filtres."}
                </p>
                <Link href="/products"
                  className="px-6 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
                >
                  Voir tous les produits
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {page > 1 && (
                      <Link href={pageUrl(page - 1)}
                        className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700 transition-all"
                      >
                        ← Précédent
                      </Link>
                    )}

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                        .reduce<(number | "…")[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i-1] as number) > 1) acc.push("…");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === "…" ? (
                            <span key={`e${i}`} className="px-2 text-slate-400">…</span>
                          ) : (
                            <Link key={p} href={pageUrl(p as number)}
                              className={`w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-bold transition-all ${
                                p === page
                                  ? "bg-brand-900 text-white shadow-brand"
                                  : "border-2 border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-700"
                              }`}
                            >
                              {p}
                            </Link>
                          )
                        )
                      }
                    </div>

                    {page < totalPages && (
                      <Link href={pageUrl(page + 1)}
                        className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700 transition-all"
                      >
                        Suivant →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
