import { getCategories } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Nouveau produit</h1>
          <p className="text-slate-500 text-sm">Remplissez les informations du produit</p>
        </div>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
