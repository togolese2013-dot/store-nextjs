import { listAdminCategories, listAdminMarques } from "@/lib/admin-db";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const metadata = { title: "Catégories & Marques" };

export default async function CategoriesPage() {
  const [categories, marques] = await Promise.all([
    listAdminCategories(),
    listAdminMarques().catch(() => []),
  ]);
  return <CategoriesManager initialCategories={categories} initialMarques={marques} />;
}
