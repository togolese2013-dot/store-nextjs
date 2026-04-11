"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

export default function AdminProductActions({
  productId, reference,
}: {
  productId: number; reference: string;
}) {
  const [open,    setOpen]    = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Supprimer ce produit ? (Il sera masqué du site)`)) return;
    setDeleting(true);
    await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setDeleting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 w-44">
            <Link href={`/products/${reference}`} target="_blank"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Eye className="w-4 h-4" /> Voir sur le site
            </Link>
            <Link href={`/admin/products/${productId}`}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Pencil className="w-4 h-4" /> Modifier
            </Link>
            <button
              onClick={handleDelete} disabled={deleting}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
