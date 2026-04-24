import { apiGet } from "@/lib/api";
import { finalPrice, formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/lib/utils";
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

export const metadata = { title: "Tous les produits" };

type View   = "stock" | "mouvements";
type Statut = "all" | "disponible" | "faible" | "epuise";

type StockMovement = {
  id: number;
  created_at: string;
  nom_produit: string | null;
  type: "entree" | "retrait" | "vente" | "sortie" | "ajustement";
  quantite: number;
  stock_apres: number;
  reference: string | null;
  note: string | null;
};

type AdminMarque = { id: number; nom: string };

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; brand?: string; filter?: string; page?: string; view?: string; statut?: string }>;
}

function buildUrl(base: Record<string, string | undefined>, override: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries({ ...base, ...override }).forEach(([k, v]) => { if (v) p.set(k, v); });
  const qs = p.toString();
  return `/admin/products${qs ? `?${qs}` : ""}`;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp      = await searchParams;
  const q       = sp.q?.trim() || undefined;
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

  const defaultStats = { en_stock: 0, en_rupture: 0, stock_faible: 0, valeur_totale: 0, entrees_jour: 0, sorties_jour: 0 };
  const defaultStatus = { total: 0, disponible: 0, faible: 0, epuise: 0 };
  const defaultMovCounts = { total: 0, entrees: 0, sorties: 0, ajustements: 0 };

  const [categoriesRes, marquesRes, statsRes] = await Promise.all([
    apiGet<{ data: Category[] }>("/api/admin/categories").catch(() => ({ data: [] })),
    apiGet<{ data: AdminMarque[] }>("/api/admin/marques").catch(() => ({ data: [] })),
    apiGet<{ stockStats: typeof defaultStats; statusCounts: typeof defaultStatus }>("/api/admin/products/stats")
      .catch(() => ({ stockStats: defaultStats, statusCounts: defaultStatus })),
  ]);

  const categories   = categoriesRes.data ?? [];
  const marques      = marquesRes.data ?? [];
  const stats        = statsRes.stockStats;
  const statusCounts = statsRes.statusCounts;

  let products: Product[] = [];
  let total = 0;
  let movements: StockMovement[] = [];
  let movTotal = 0;
  let movCounts = defaultMovCounts;
  let fetchError: string | null = null;

  if (isStockView) {
    const statutParam = statut !== "all" ? `&statut=${statut}` : "";
    const catParam    = catId   ? `&category=${catId}`   : "";
    const brandParam  = brandId ? `&brand=${brandId}`    : "";
    const qParam      = q       ? `&q=${encodeURIComponent(q)}` : "";
    const res = await apiGet<{ products: Product[]; total: number }>(
      `/api/admin/products?limit=${limit}&offset=${offset}${qParam}${catParam}${brandParam}${statutParam}`
    ).catch((e: Error) => { fetchError = e.message; return { products: [], total: 0 }; });
    products = res.products;
    total    = res.total;
  } else {
    const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
    const res = await apiGet<{ items: StockMovement[]; total: number; counts: typeof defaultMovCounts }>(
      `/api/admin/stock/mouvements?type=tous&limit=${limit}&offset=${offset}${qParam}`
    ).catch(() => ({ items: [], total: 0, counts: defaultMovCounts }));
    movements  = res.items;
    movTotal   = res.total;
    movCounts  = res.counts;
    total      = movTotal;
  }

  const totalPages = Math.ceil(total / limit);

  const prodTotal = isStockView ? total :
    await apiGet<{ total: number }>("/api/admin/products?limit=1&offset=0")
      .then(r => r.total).catch(() => 0);

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

  function pageUrl(p: number) {
    return buildUrl(base, { page: p > 1 ? String(p) : "" });
  }

  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "(vide)";

  return (
    <div className="space-y-6">

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          <p className="font-bold mb-1">Erreur chargement produits</p>
          <p className="font-mono text-xs">{fetchError}</p>
          <p className="text-xs mt-1 text-red-500">Backend URL: {backendUrl}</p>
        </div>
      )}

      <PageHeader
        title="Tous les produits"
        subtitle="Niveaux de stock actuels"
        accent="brand"
        extra={
          view === "stock" ? (
            <AddProductModal categories={categories} marques={marques} />
          ) : (
            <MouvementModal />
          )
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Produits en stock",    icon: Boxes,         val: stats.en_stock,      money: false, iconCls: "text-slate-400"  },
          { label: "Valeur totale",         icon: DollarSign,    val: stats.valeur_totale,  money: true,  iconCls: "text-slate-400"  },
          { label: "Stock faible",          icon: AlertTriangle, val: stats.stock_faible,   money: false, iconCls: "text-amber-400", badge: stats.stock_faible  > 0 ? { txt: "Action requise", cls: "bg-amber-100 text-amber-700" } : null },
          { label: "Rupture de stock",      icon: XCircle,       val: stats.en_rupture,     money: false, iconCls: "text-red-400",   badge: stats.en_rupture    > 0 ? { txt: "Épuisé",          cls: "bg-red-100 text-red-700"     } : null },
          { label: "Entrées aujourd'hui",   icon: TrendingDown,  val: stats.entrees_jour,   money: false, iconCls: "text-emerald-400" },
          { label: "Sorties aujourd'hui",   icon: TrendingUp,    val: stats.sorties_jour,   money: false, iconCls: "text-red-400"    },
        ].map(({ label, icon: Icon, val, money, iconCls, badge }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 leading-tight">{label}</p>
              <Icon className={`w-7 h-7 opacity-20 shrink-0 ${iconCls}`} />
            </div>
            {money ? (
              <p className="text-xl font-bold text-slate-900 tabular-nums leading-none">
                {val.toLocaleString("fr-FR")}<span className="text-xs font-bold text-emerald-500 ml-1">FCFA</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-slate-900 tabular-nums leading-none">{val}</p>
            )}
            {badge && <span className={`self-start mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>{badge.txt}</span>}
          </div>
        ))}
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
        <div className="flex gap-0 border-b border-slate-100">
          {viewTabs.map(tab => {
            const isActive = view === tab.key;
            const href = buildUrl(
              { q: q || undefined, filter: activeFilter, statut: statut !== "all" ? statut : undefined },
              { view: tab.key !== "stock" ? tab.key : "" }
            );
            return (
              <Link
                key={tab.key}
                href={href}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-brand-900 text-brand-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {isStockView && (
          <form method="GET" className="flex items-center gap-2">
            <input type="hidden" name="view"   value={view !== "stock" ? view : ""} />
            <input type="hidden" name="q"      value={q || ""} />
            <input type="hidden" name="filter" value={activeFilter || ""} />
            <select
              name="statut"
              defaultValue={statut}
              className="px-4 py-2 text-sm bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans font-semibold text-slate-600"
            >
              {statutTabs.map(tab => (
                <option key={tab.key} value={tab.key !== "all" ? tab.key : ""}>
                  {tab.label} ({tab.count})
                </option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 rounded-2xl bg-slate-700 text-white font-bold text-sm hover:bg-slate-600 transition-colors">
              OK
            </button>
          </form>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

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
