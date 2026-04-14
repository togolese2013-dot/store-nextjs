import { listAdminCategories } from "@/lib/admin-db";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const metadata = { title: "Catégories" };

export default async function CategoriesPage() {
  const categories = await listAdminCategories();
  return <CategoriesManager initialCategories={categories} />;
}
