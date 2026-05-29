import { Suspense } from "react";
import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import type { Product, Category } from "@/lib/utils";
import ShopProductCard from "@/components/shop/ShopProductCard";
import CatalogueFilters from "@/components/CatalogueFilters";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { getSiteUrl, getSiteName } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [siteUrl, siteName] = await Promise.all([getSiteUrl(), getSiteName()]);
  const title       = `Catalogue — ${siteName}`;
  const description = `Parcourez le catalogue complet de ${siteName} — livraison rapide au Togo.`;
  const canonical   = `${siteUrl}/products`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, siteName, title, description, locale: "fr_TG" },
  };
}

const PER_PAGE = 24;

interface PageProps {
  searchParams: Promise<{
    q?:        string;
    category?: string;
    promo?:    string;
    new?:      string;
    best?:     string;
    page?:     string;
    sort?:     string;
    inStock?:  string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params    = await searchParams;
  const q         = params.q?.trim() || undefined;
  const catId     = params.category ? Number(params.category) : undefined;
  const promoOnly = params.promo   === "true";
  const newOnly   = params.new     === "true";
  const bestOnly  = params.best    === "true";
  const inStock   = params.inStock === "true";
  const minPrice  = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice  = params.maxPrice ? Number(params.maxPrice) : undefined;
  const page      = Math.max(1, Number(params.page) || 1);
  const offset    = (page - 1) * PER_PAGE;

  const qs = new URLSearchParams();
  if (catId)    qs.set("category", String(catId));
  if (q)        qs.set("q", q);
  if (promoOnly) qs.set("promo", "true");
  if (newOnly)   qs.set("new", "true");
  if (bestOnly)  qs.set("best", "true");
  if (inStock)   qs.set("inStock", "true");
  if (minPrice != null) qs.set("minPrice", String(minPrice));
  if (maxPrice != null) qs.set("maxPrice", String(maxPrice));
  qs.set("limit", String(PER_PAGE));
  qs.set("offset", String(offset));

  let categories: Category[] = [];
  let products:   Product[]  = [];
  let total = 0;

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      apiGet<{ data: Category[] }>("/api/categories", { noAuth: true }),
      apiGet<{ data: Product[]; total?: number }>(`/api/products?${qs.toString()}`, { noAuth: true }),
    ]);
    categories = categoriesRes.data ?? [];
    products   = productsRes.data   ?? [];
    total      = productsRes.total  ?? products.length;
  } catch {
    /* backend unreachable */
  }

  const totalPages = Math.ceil(total / PER_PAGE);
  const activeCat  = categories.find(c => c.id === catId);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q)         sp.set("q", q);
    if (catId)     sp.set("category", String(catId));
    if (promoOnly) sp.set("promo", "true");
    if (newOnly)   sp.set("new", "true");
    if (bestOnly)  sp.set("best", "true");
    if (inStock)   sp.set("inStock", "true");
    if (minPrice != null) sp.set("minPrice", String(minPrice));
    if (maxPrice != null) sp.set("maxPrice", String(maxPrice));
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/products${s ? `?${s}` : ""}`;
  }

  function clearFilterUrl(key: string) {
    const sp = new URLSearchParams();
    if (key !== "q"        && q)         sp.set("q", q);
    if (key !== "category" && catId)     sp.set("category", String(catId));
    if (key !== "promo"    && promoOnly) sp.set("promo", "true");
    if (key !== "new"      && newOnly)   sp.set("new", "true");
    if (key !== "best"     && bestOnly)  sp.set("best", "true");
    if (key !== "inStock"  && inStock)   sp.set("inStock", "true");
    if (key !== "price") {
      if (minPrice != null) sp.set("minPrice", String(minPrice));
      if (maxPrice != null) sp.set("maxPrice", String(maxPrice));
    }
    const s = sp.toString();
    return `/products${s ? `?${s}` : ""}`;
  }

  const activeFilters: { label: string; clearKey: string }[] = [];
  if (q)         activeFilters.push({ label: `"${q}"`, clearKey: "q" });
  if (activeCat) activeFilters.push({ label: activeCat.nom, clearKey: "category" });
  if (promoOnly) activeFilters.push({ label: "Promotions", clearKey: "promo" });
  if (newOnly)   activeFilters.push({ label: "Nouveautés", clearKey: "new" });
  if (bestOnly)  activeFilters.push({ label: "Meilleures ventes", clearKey: "best" });
  if (inStock)   activeFilters.push({ label: "En stock", clearKey: "inStock" });
  if (minPrice != null || maxPrice != null) {
    const label =
      minPrice != null && maxPrice != null
        ? `${minPrice.toLocaleString("fr-FR")} – ${maxPrice.toLocaleString("fr-FR")} FCFA`
        : minPrice != null
        ? `≥ ${minPrice.toLocaleString("fr-FR")} FCFA`
        : `≤ ${maxPrice!.toLocaleString("fr-FR")} FCFA`;
    activeFilters.push({ label, clearKey: "price" });
  }

  let pageTitle = "Catalogue";
  if (q)          pageTitle = `"${q}"`;
  else if (activeCat) pageTitle = activeCat.nom;
  else if (bestOnly)  pageTitle = "Meilleures ventes";
  else if (promoOnly) pageTitle = "Promotions";
  else if (newOnly)   pageTitle = "Nouveaux arrivages";

  return (
    <div className="min-h-screen" style={{ background: "#FBF7F1" }}>

      {/* ── Nav header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8E1D4] bg-white/80">
        <Link href="/" className="p-1 text-[#14110E] grid place-items-center" aria-label="Retour">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="flex-1 text-[17px] font-medium text-[#14110E] tracking-[-0.025em]">{pageTitle}</h1>
        <Suspense fallback={null}>
          <CatalogueFilters
            categories={categories}
            currentCategoryId={catId}
            currentSearch={q}
            promoOnly={promoOnly}
            newOnly={newOnly}
            bestOnly={bestOnly}
            inStock={inStock}
            minPrice={minPrice}
            maxPrice={maxPrice}
            mobileOnly
          />
        </Suspense>
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 pt-3 pb-2">
        <Link href="/products" className="flex items-center gap-[10px] bg-white border border-[#E8E1D4] rounded-xl px-[14px] py-[10px]">
          <Search className="w-[17px] h-[17px] text-[#8A8278] shrink-0" strokeWidth={1.85} />
          <span className="text-[13.5px] text-[#8A8278] flex-1">
            {q ? q : "Rechercher un produit…"}
          </span>
        </Link>
      </div>

      {/* ── Category chips ── */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-[7px] px-4 pb-3 pt-1 w-max">
          {[{ id: 0, nom: "Tous" }, ...categories.slice(0, 8)].map((c) => {
            const isActive = c.id === 0 ? !catId && !promoOnly && !newOnly && !bestOnly : c.id === catId;
            const href = c.id === 0 ? "/products" : `/products?category=${c.id}`;
            return (
              <Link
                key={c.id}
                href={href}
                className="px-[13px] py-[6px] rounded-full text-[12px] font-medium whitespace-nowrap border-[1.5px] transition-colors"
                style={{
                  border: `1.5px solid ${isActive ? "#14110E" : "#E8E1D4"}`,
                  background: isActive ? "#14110E" : "transparent",
                  color: isActive ? "#fff" : "#6B635B",
                }}
              >
                {c.nom}
                {c.id === 0 && (
                  <span className="ml-[5px] opacity-70">{total || ""}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Active filters strip ── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          {activeFilters.map((f) => (
            <Link
              key={f.clearKey}
              href={clearFilterUrl(f.clearKey)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: "#FBE9D6", color: "#E07A2C" }}
            >
              {f.label} <span className="font-bold ml-0.5">×</span>
            </Link>
          ))}
          <Link href="/products" className="text-[11px] text-[#8A8278] underline">
            Tout effacer
          </Link>
        </div>
      )}

      {/* ── Results count ── */}
      <p className="px-4 pb-[10px] text-[12px] text-[#8A8278]">
        {total === 0
          ? "Aucun produit trouvé"
          : `${total} produit${total > 1 ? "s" : ""}`}
      </p>

      {/* ── Desktop layout: sidebar + grid ── */}
      <div className="max-w-7xl mx-auto px-4 lg:flex lg:gap-8">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <Suspense fallback={null}>
              <CatalogueFilters
                categories={categories}
                currentCategoryId={catId}
                currentSearch={q}
                promoOnly={promoOnly}
                newOnly={newOnly}
                bestOnly={bestOnly}
                inStock={inStock}
                minPrice={minPrice}
                maxPrice={maxPrice}
              />
            </Suspense>
          </div>
        </aside>

        {/* ── Product grid ── */}
        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "#E8E1D4" }}
              >
                <Search className="w-8 h-8 text-[#8A8278]" />
              </div>
              <h2 className="text-[18px] font-medium text-[#14110E] mb-2">Aucun produit trouvé</h2>
              <p className="text-[#6B635B] text-sm mb-6 max-w-xs">
                {q
                  ? `Aucun résultat pour "${q}". Essayez d'autres mots-clés.`
                  : "Aucun produit correspond à ces filtres."}
              </p>
              <Link
                href="/products"
                className="px-6 py-3 rounded-[14px] text-[14px] font-medium text-white"
                style={{ background: "#14110E" }}
              >
                Voir tous les produits
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-[10px] lg:gap-4 pb-4">
                {products.map((p) => (
                  <ShopProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-8">
                  {page > 1 && (
                    <Link
                      href={pageUrl(page - 1)}
                      className="px-4 py-2.5 rounded-[10px] text-sm font-medium border border-[#E8E1D4] text-[#6B635B] bg-white"
                    >
                      ← Précédent
                    </Link>
                  )}
                  <span className="text-sm text-[#8A8278] px-3">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={pageUrl(page + 1)}
                      className="px-4 py-2.5 rounded-[10px] text-sm font-medium border border-[#E8E1D4] text-[#14110E] bg-white"
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
  );
}
