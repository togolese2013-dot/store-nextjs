import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Category } from "@/lib/utils";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Modifier un produit" };

interface PageProps { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [categoriesRes, productRes] = await Promise.all([
    apiGet<{ data: Category[] }>("/api/admin/categories").catch(() => ({ data: [] })),
    apiGet<{ product: Record<string, unknown> }>(`/api/admin/products/${id}`).catch(() => null),
  ]);
  const categories = categoriesRes.data ?? [];

  if (!productRes?.product) notFound();
  const product = productRes.product;

  const initial = {
    id:             Number(product.id),
    reference:      (product.reference as string) ?? "",
    nom:            (product.nom as string) ?? "",
    description:    (product.description as string) ?? "",
    categorie_id:   product.categorie_id ? Number(product.categorie_id) : ("" as const),
    prix_unitaire:  Number(product.prix_unitaire),
    stock_magasin:  Number(product.stock_magasin ?? 0),
    remise:         Number(product.remise ?? 0),
    neuf:           Boolean(product.neuf),
    actif:          Boolean(product.actif),
    image_url:      ((product.image_url || product.image) as string) ?? "",
    images:         (() => { try { return JSON.parse((product.images_json as string) || "[]"); } catch { return []; } })(),
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/products"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Modifier le produit</h1>
          <p className="text-slate-400 text-sm font-mono">{product.reference as string}</p>
        </div>
      </div>
      <ProductForm categories={categories} initial={initial} />
    </div>
  );
}
