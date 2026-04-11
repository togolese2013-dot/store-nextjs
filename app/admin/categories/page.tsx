import { listAdminCategories } from "@/lib/admin-db";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const metadata = { title: "Catégories" };

export default async function CategoriesPage() {
  const categories = await listAdminCategories();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Catégories</h1>
        <p className="text-slate-400 text-sm mt-1">
          Gérez les catégories de produits. Chaque catégorie peut regrouper plusieurs produits.
        </p>
      </div>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
