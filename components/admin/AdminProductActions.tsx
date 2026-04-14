"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye } from "lucide-react";
import ProductQuickViewModal from "./ProductQuickViewModal";

interface Product {
  id:             number;
  reference:      string;
  nom:            string;
  description:    string | null;
  categorie_nom:  string | null;
  prix_unitaire:  number;
  remise:         number;
  stock_boutique: number;
  image_url:      string | null;
}

export default function AdminProductActions({ product }: { product: Product }) {
  const [showModal, setShowModal] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Supprimer ce produit ? (Il sera masqué du site)")) return;
    setDeleting(true);
    await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {/* Quick view */}
        <button
          onClick={() => setShowModal(true)}
          title="Voir les détails"
          className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Edit */}
        <Link
          href={`/admin/products/${product.id}`}
          title="Modifier"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </Link>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Supprimer"
          className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showModal && (
        <ProductQuickViewModal product={product} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
