"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye } from "lucide-react";
import ProductQuickViewModal from "./ProductQuickViewModal";
import EditProductModal from "./EditProductModal";

interface Product {
  id:             number;
  reference:      string;
  nom:            string;
  description:    string | null;
  categorie_nom:  string | null;
  prix_unitaire:  number;
  remise:         number;
  stock_boutique: number;
  stock_magasin:  number;
  image_url:      string | null;
  images:         string[];
}

export default function AdminProductActions({ product }: { product: Product }) {
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement "${product.nom}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la suppression.");
        return;
      }
      router.refresh();
    } catch {
      alert("Erreur réseau. Veuillez réessayer.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {/* Quick view */}
        <button
          onClick={() => setShowView(true)}
          title="Voir les détails"
          className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Edit — opens modal */}
        <button
          onClick={() => setShowEdit(true)}
          title="Modifier"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>

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

      {showView && (
        <ProductQuickViewModal product={product} onClose={() => setShowView(false)} />
      )}
      {showEdit && (
        <EditProductModal
          productId={product.id}
          productRef={product.reference}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
