import { apiGet } from "@/lib/api";
import type { Category } from "@/lib/utils";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Nouveau produit" };
export const dynamic = "force-dynamic";

interface PageProps { searchParams: Promise<{ entrepot_id?: string }> }

export default async function NewProductPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const entrepotId = sp.entrepot_id ? Number(sp.entrepot_id) : undefined;
  const backHref   = entrepotId ? "/admin/entrepots" : undefined;

  const { categories } = await apiGet<{ categories: Category[] }>("/api/admin/categories").catch(() => ({ categories: [] }));
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={backHref ?? "/admin/products"}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Nouveau produit</h1>
          <p className="text-slate-500 text-sm">
            {entrepotId ? "Produit lié à un entrepôt" : "Remplissez les informations du produit"}
          </p>
        </div>
      </div>
      <ProductForm
        categories={categories}
        initial={entrepotId ? { entrepot_id: entrepotId } : undefined}
        backHref={backHref}
      />
    </div>
  );
}
