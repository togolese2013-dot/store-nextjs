"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import ProductForm from "./ProductForm";
import type { Category } from "@/lib/utils";

interface Props {
  productId: number;
  productRef: string;
  onClose: () => void;
}

interface ProductData {
  id: number;
  reference: string;
  nom: string;
  description: string;
  categorie_id: number | "";
  prix_unitaire: number | "";
  stock_magasin: number | "";
  stock_minimum: number | "";
  remise: number | "";
  neuf: boolean;
  actif: boolean;
  image_url: string;
  images: string[];
}

type State = "loading" | "ready" | "error";

export default function EditProductModal({ productId, productRef, onClose }: Props) {
  const router = useRouter();
  const [state,      setState]      = useState<State>("loading");
  const [initial,    setInitial]    = useState<Partial<ProductData> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch product + categories on mount
  const load = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products/${productId}`).then(r => r.json()),
        fetch("/api/admin/categories").then(r => r.json()),
      ]);
      const p = prodRes.product as Record<string, unknown>;
      setInitial({
        id:            Number(p.id),
        reference:     (p.reference as string) ?? "",
        nom:           (p.nom as string) ?? "",
        description:   (p.description as string) ?? "",
        categorie_id:  p.categorie_id ? Number(p.categorie_id) : "",
        prix_unitaire: Number(p.prix_unitaire),
        stock_magasin: Number(p.stock_magasin ?? 0),
        stock_minimum: Number(p.stock_minimum ?? 5),
        remise:        Number(p.remise ?? 0),
        neuf:          Boolean(p.neuf),
        actif:         Boolean(p.actif),
        image_url:     ((p.image_url || p.image) as string) ?? "",
        images:        (() => {
          const raw = p.images_json;
          // MySQL JSON columns are returned already parsed (array), not as string
          if (Array.isArray(raw)) return raw as string[];
          try { return JSON.parse((raw as string) || "[]"); } catch { return []; }
        })(),
      });
      setCategories((catRes.data as Category[]) ?? []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [productId]);

  // Load on first render
  useState(() => { load(); });

  function handleSuccess() {
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Modifier le produit</h2>
            <p className="text-xs text-slate-400 font-mono">{productRef}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {state === "loading" && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        {state === "error" && (
          <div className="flex items-center justify-center py-24 text-red-500 text-sm font-semibold">
            Erreur lors du chargement du produit.
          </div>
        )}
        {state === "ready" && initial && (
          <ProductForm
            categories={categories}
            initial={initial}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
