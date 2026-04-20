import { getProducts, getProductCount, getCategories, getProductStatusCounts } from "@/lib/db";
import { getStockStats, getStockMovements, getStockMovementCounts, listAdminMarques } from "@/lib/admin-db";
import { finalPrice, formatPrice } from "@/lib/utils";
import Link from "next/link";
import AdminProductActions from "@/components/admin/AdminProductActions";
import MouvementModal from "@/components/admin/MouvementModal";
import AddProductModal from "@/components/admin/AddProductModal";
import Image from "next/image";
import {
  Search, Package,
  Boxes, AlertTriangle, XCircle, TrendingDown, TrendingUp, DollarSign,
  Activity,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import ProductsViewTabs from "@/components/admin/ProductsViewTabs";

export const metadata = { title: "Tous les produits" };

type View   = "stock" | "mouvements";
type Statut = "all" | "disponible" | "faible" | "epuise";

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; brand?: string; filter?: string; page?: string; view?: string; statut?: string }>;
}

// ─── Filter buttons ────────────────────────────────────────────────────────────

function buildUrl(base: Record<string, string | undefined>, override: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries({ ...base, ...override }).forEach(([k, v]) => { if (v) p.set(k, v); });
  const qs = p.toString();
  return `/admin/products${qs ? `?${qs}` : ""}`;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp      = await searchParams;
  const q       = sp.q?.trim() || undefined;
  // filter param: "cat:N" or "brand:N" from the unified select
  const filterVal = sp.filter || "";
  const catId   = filterVal.startsWith("cat:")   ? Number(filterVal.slice(4))   :
                  sp.category                     ? Number(sp.category)          : undefined;
  const brandId = filterVal.startsWith("brand:") ? Number(filterVal.slice(6))   :
                  sp.brand                        ? Number(sp.brand)             : undefined;
  const page    = Math.max(1, Number(sp.page) || 1);
  const view   = (sp.view as View)     || "stock";
  const statut = (sp.statut as Statut) || "all";
  const limit  = 20;
  const offset = (page - 1) * limit;

  const activeFilter = catId   ? `cat:${catId}`     :
                       brandId ? `brand:${brandId}` : undefined;
  const base = {
    q:      q || undefined,
    filter: activeFilter,
    view:   view !== "stock" ? view : undefined,
    statut: statut !== "all" ? statut : undefined,
  };

  const isStockView = view === "stock";

  const [categories, marques, stats, movCounts, statusCounts] = await Promise.all([
    getCategories().catch(() => []),
    listAdminMarques().catch(() => []),
    getStockStats().catch(() => ({ en_stock: 0, en_rupture: 0, stock_faible: 0, valeur_totale: 0, entrees_jour: 0, sorties_jour: 0 })),
    getStockMovementCounts().catch(() => ({ total: 0, entrees: 0, sorties: 0, ajustements: 0 })),
    getProductStatusCounts().catch(() => ({ total: 0, disponible: 0, faible: 0, epuise: 0 })),
  ]);

  // Load data based on view
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let total = 0;
  let movements: Awaited<ReturnType<typeof getStockMovements>>["items"] = [];
  let movTotal = 0;

  if (isStockView) {
    const statutFilter = statut !== "all" ? statut as "disponible" | "faible" | "epuise" : undefined;
    [products, total] = await Promise.all([
      getProducts({ search: q, categoryId: catId, marqueId: brandId, limit, offset, statut: statutFilter, includeInactive: true }).catch(() => []),
      getProductCount({ search: q, categoryId: catId, marqueId: brandId, statut: statutFilter, includeInactive: true }).catch(() => 0),
    ]);
  } else {
    const res = await getStockMovements({ type: "tous", search: q, limit, offset }).catch(() => ({ items: [], total: 0 }));
    movements = res.items;
    movTotal  = res.total;
    total     = movTotal;
  }

  const totalPages = Math.ceil(total / limit);

  function pageUrl(p: number) {
    return buildUrl(base, { page: p > 1 ? String(p) : "" });
  }

  const prodTotal = isStockView ? total : await getProductCount({ includeInactive: true }).catch(() => 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewTabs: { key: View; label: string; icon: any; count: number }[] = [
    { key: "stock",      label: "Produits",   icon: Package,  count: prodTotal },
    { key: "mouvements", label: "Mouvements", icon: Activity, count: movCounts.total },
  ];

  const statutTabs: { key: Statut; label: string; count: number }[] = [
    { key: "all",        label: "Tous",       count: statusCounts.total      },
    { key: "disponible", label: "Disponible", count: statusCounts.disponible },
    { key: "faible",     label: "Faible",     count: statusCounts.faible     },
    { key: "epuise",     label: "Épuisé",     count: statusCounts.epuise     },
  ];

  return (
    <div className="space-y-6">

      <PageHeader
        title="Tous les produits"
        subtitle="Niveaux de stock actuels"
        accent="brand"
        extra={
          view === "stock" ? (
            <AddProductModal categories={categories} />
          ) : (
            <MouvementModal />
          )
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Produits en stock</p>
            <Boxes className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.en_stock}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Valeur totale</p>
            <DollarSign className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatPrice(stats.valeur_totale)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Articles stock faible</p>
            <AlertTriangle className="w-8 h-8 text-amber-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.stock_faible}</p>
          {stats.stock_faible > 0 && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Action requise</span>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Articles en rupture</p>
            <XCircle className="w-8 h-8 text-red-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.en_rupture}</p>
          {stats.en_rupture > 0 && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">Épuisé</span>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Entrées aujourd&apos;hui</p>
            <TrendingDown className="w-8 h-8 text-emerald-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.entrees_jour}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sorties aujourd&apos;hui</p>
            <TrendingUp className="w-8 h-8 text-red-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.sorties_jour}</p>
        </div>
      </div>

      {/* ── Search ── */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input type="hidden" name="view"   value={view !== "stock" ? view : ""} />
        <input type="hidden" name="statut" value={statut !== "all" ? statut : ""} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" name="q" defaultValue={q}
            placeholder="Rechercher un produit…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans"
          />
        </div>
        {isStockView && (
          <select
            name="filter"
            defaultValue={activeFilter ?? ""}
            className="px-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans"
          >
            <option value="">Toutes les catégories & marques</option>
            {categories.length > 0 && (
              <optgroup label="Catégories">
                {categories.map(c => <option key={`cat-${c.id}`} value={`cat:${c.id}`}>{c.nom}</option>)}
              </optgroup>
            )}
            {marques.length > 0 && (
              <optgroup label="Marques">
                {marques.map(m => <option key={`brand-${m.id}`} value={`brand:${m.id}`}>{m.nom}</option>)}
              </optgroup>
            )}
          </select>
        )}
        <button type="submit"
          className="px-5 py-2.5 rounded-2xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
        >
          Filtrer
        </button>
        {(q || activeFilter) && (
          <Link href={buildUrl({ view: view !== "stock" ? view : undefined, statut: statut !== "all" ? statut : undefined }, {})}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: tab bar */}
        <ProductsViewTabs tabs={viewTabs} active={view} />

        {/* Right: statut tabs (only for stock view) */}
        {isStockView && (
          <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-1">
            {statutTabs.map(tab => {
              const isActive = statut === tab.key;
              const activeColor =
                tab.key === "disponible" ? "bg-green-500 text-white shadow-sm" :
                tab.key === "faible"     ? "bg-amber-400 text-white shadow-sm" :
                tab.key === "epuise"     ? "bg-red-500 text-white shadow-sm"   :
                                           "bg-slate-600 text-white shadow-sm";
              return (
                <Link
                  key={tab.key}
                  href={buildUrl({ ...base, statut: tab.key !== "all" ? tab.key : undefined, page: undefined }, {})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? activeColor : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

        {/* ── Stock view ── */}
        {isStockView && (
          products.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-slate-400">
              <Package className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold">Aucun produit trouvé</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Produit</th>
                      <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden md:table-cell">Catégorie</th>
                      <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Prix</th>
                      <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden sm:table-cell">Stock</th>
                      <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden lg:table-cell">Statut</th>
                      <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => {
                      const price   = finalPrice(p);
                      const isPromo = p.remise > 0;
                      // Normalize image URL: handle legacy filenames (no prefix) and full paths
                      const imgSrc = p.image_url
                        ? (p.image_url.startsWith("http") || p.image_url.startsWith("/"))
                          ? p.image_url
                          : `/api/uploads/${p.image_url}`
                        : null;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative shrink-0">
                                {imgSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={imgSrc} alt={p.nom} className="absolute inset-0 w-full h-full object-contain p-1" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                    <Package className="w-5 h-5" strokeWidth={1} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 line-clamp-1">{p.nom}</p>
                                <p className="text-xs text-slate-400 font-mono">{p.reference}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {p.categorie_nom
                              ? <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{p.categorie_nom.toUpperCase()}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold text-sm ${isPromo ? "text-emerald-700" : "text-slate-900"}`}>
                              {formatPrice(price)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className={`font-semibold ${p.stock_magasin === 0 ? "text-red-500" : p.stock_magasin <= 5 ? "text-amber-500" : "text-green-600"}`}>
                              {p.stock_magasin}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              p.stock_magasin === 0
                                ? "bg-red-100 text-red-700"
                                : p.stock_magasin <= 5
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {p.stock_magasin === 0 ? "Épuisé" : p.stock_magasin <= 5 ? "Faible" : "Disponible"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <AdminProductActions product={p} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* ── Movements view ── */}
        {!isStockView && (
          movements.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-slate-400">
              <Package className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold">Aucun mouvement trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Date</th>
                    <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Produit</th>
                    <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Type</th>
                    <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Quantité</th>
                    <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden sm:table-cell">Stock après</th>
                    <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden lg:table-cell">Référence / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {new Date(m.created_at).toLocaleDateString("fr-FR")}
                        <span className="block text-slate-300">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{m.nom_produit ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          m.type === "entree"    ? "bg-green-100 text-green-700" :
                          m.type === "vente"     ? "bg-blue-100 text-blue-700"  :
                          m.type === "retrait"   ? "bg-red-100 text-red-700"    :
                                                   "bg-amber-100 text-amber-700"
                        }`}>
                          {m.type === "entree"  ? "Entrée"     :
                           m.type === "vente"   ? "Vente"      :
                           m.type === "retrait" ? "Retrait"    : "Ajustement"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${m.type === "entree" ? "text-green-600" : "text-red-500"}`}>
                          {m.type === "entree" ? "+" : "-"}{m.quantite}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{m.stock_apres}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                        {m.reference && <span className="font-mono text-slate-600">{m.reference}</span>}
                        {m.note && <span className="block text-slate-400">{m.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {page} sur {totalPages} · {total} résultats
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={pageUrl(page - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-400 transition-colors"
                >
                  ← Précédent
                </Link>
              )}
              {page < totalPages && (
                <Link href={pageUrl(page + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-400 transition-colors"
                >
                  Suivant →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
