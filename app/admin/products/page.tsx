import { getProducts, getProductCount, getCategories } from "@/lib/db";
import { getStockStats } from "@/lib/admin-db";
import { finalPrice, formatPrice } from "@/lib/utils";
import Link from "next/link";
import AdminProductActions from "@/components/admin/AdminProductActions";
import Image from "next/image";
import {
  Plus, Search, Package,
  PackagePlus, PackageMinus, ArrowLeftRight,
  Boxes, AlertTriangle, XCircle, TrendingDown, TrendingUp, DollarSign,
} from "lucide-react";

export const metadata = { title: "Tous les produits" };

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp     = await searchParams;
  const q      = sp.q?.trim() || undefined;
  const catId  = sp.category ? Number(sp.category) : undefined;
  const page   = Math.max(1, Number(sp.page) || 1);
  const limit  = 20;
  const offset = (page - 1) * limit;

  const [products, total, categories, stats] = await Promise.all([
    getProducts({ search: q, categoryId: catId, limit, offset }),
    getProductCount({ search: q, categoryId: catId }),
    getCategories(),
    getStockStats(),
  ]);

  const totalPages = Math.ceil(total / limit);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q)     params.set("q", q);
    if (catId) params.set("category", String(catId));
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Tous les produits</h1>
          <p className="text-slate-500 text-sm mt-0.5">Niveaux de stock actuels</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter un produit
          </Link>
          <Link href="/admin/stock"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
          >
            <PackagePlus className="w-4 h-4" /> Nouvelle Entrée
          </Link>
          <Link href="/admin/stock"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
          >
            <PackageMinus className="w-4 h-4" /> Nouvelle Sortie
          </Link>
          <Link href="/admin/stock"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" /> Ajustement
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Produits en stock */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Produits en stock</p>
            <Boxes className="w-5 h-5 text-slate-300" />
          </div>
          <p className="font-display font-800 text-3xl text-slate-900">{stats.en_stock}</p>
        </div>

        {/* Valeur totale */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Valeur totale du stock</p>
            <DollarSign className="w-5 h-5 text-slate-300" />
          </div>
          <p className="font-display font-800 text-3xl text-slate-900">{formatPrice(stats.valeur_totale)}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide">FCFA</span>
        </div>

        {/* Stock faible */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Articles stock faible</p>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="font-display font-800 text-3xl text-slate-900">{stats.stock_faible}</p>
          {stats.stock_faible > 0 && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Action requise</span>
          )}
        </div>

        {/* En rupture */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Articles en rupture</p>
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="font-display font-800 text-3xl text-slate-900">{stats.en_rupture}</p>
          {stats.en_rupture > 0 && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">Épuisé</span>
          )}
        </div>

        {/* Entrées aujourd'hui */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Entrées aujourd&apos;hui</p>
            <TrendingDown className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="font-display font-800 text-3xl text-slate-900">{stats.entrees_jour}</p>
        </div>

        {/* Sorties aujourd'hui */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sorties aujourd&apos;hui</p>
            <TrendingUp className="w-5 h-5 text-red-400" />
          </div>
          <p className="font-display font-800 text-3xl text-slate-900">{stats.sorties_jour}</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <form method="GET" className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" name="q" defaultValue={q}
            placeholder="Rechercher un produit…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all font-sans"
          />
        </div>
        <select name="category" defaultValue={catId ?? ""}
          className="px-4 py-2.5 text-sm bg-white rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all font-sans"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <button type="submit"
          className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
        >
          Filtrer
        </button>
        {(q || catId) && (
          <Link href="/admin/products"
            className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {/* ── Table ── */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {products.length === 0 ? (
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
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => {
                    const price   = finalPrice(p);
                    const isPromo = p.remise > 0;
                    const imgSrc  = p.image_url
                      ? p.image_url.startsWith("http") ? p.image_url : `/uploads/${p.image_url}`
                      : null;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative shrink-0">
                              {imgSrc ? (
                                <Image src={imgSrc} alt={p.nom} fill className="object-contain p-1" sizes="40px" />
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
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {p.categorie_nom ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-display font-700 ${isPromo ? "text-accent-500" : "text-slate-900"}`}>
                            {formatPrice(price)}
                          </span>
                          {isPromo && (
                            <p className="text-xs text-slate-400 line-through">{formatPrice(p.prix_unitaire)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className={`font-semibold ${p.stock_boutique === 0 ? "text-red-500" : p.stock_boutique <= 5 ? "text-amber-500" : "text-green-600"}`}>
                            {p.stock_boutique}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.stock_boutique === 0
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {p.stock_boutique === 0 ? "Rupture" : "En stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <AdminProductActions productId={p.id} reference={p.reference} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Page {page} sur {totalPages} · {total} résultats
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={pageUrl(page - 1)}
                      className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 transition-colors"
                    >
                      ← Précédent
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={pageUrl(page + 1)}
                      className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 transition-colors"
                    >
                      Suivant →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
