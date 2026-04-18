import { notFound } from "next/navigation";
import { getCategories } from "@/lib/db";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Modifier un produit" };

async function getProductById(id: number) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT p.*, c.nom AS categorie_nom,
     COALESCE(p.image, '') AS image_url_raw
     FROM produits p LEFT JOIN categories c ON p.categorie_id = c.id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

interface PageProps { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(Number(id)),
    getCategories(),
  ]);
  if (!product) notFound();

  const initial = {
    id:             Number(product.id),
    reference:      product.reference ?? "",
    nom:            product.nom ?? "",
    description:    product.description ?? "",
    categorie_id:   product.categorie_id ? Number(product.categorie_id) : ("" as const),
    prix_unitaire:  Number(product.prix_unitaire),
    stock_magasin:  Number(product.stock_magasin ?? 0),
    remise:         Number(product.remise ?? 0),
    neuf:           Boolean(product.neuf),
    actif:          Boolean(product.actif),
    image_url:      (product.image_url_raw || product.image_url) ?? "",
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
          <p className="text-slate-400 text-sm font-mono">{product.reference}</p>
        </div>
      </div>
      <ProductForm categories={categories} initial={initial} />
    </div>
  );
}
