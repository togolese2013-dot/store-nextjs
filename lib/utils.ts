/* Shared types & pure utility functions — safe for client AND server */

export interface Product {
  id: number;
  reference: string;
  nom: string;
  description: string | null;
  categorie_id: number | null;
  categorie_nom: string | null;
  prix_unitaire: number;
  stock_boutique: number;
  stock_magasin:  number;
  remise: number;
  neuf: boolean;
  image_url: string | null;
  images: string[];
  variations: Record<string, string[]> | null;
  date_creation: string;
  marque_id: number | null;
  marque_nom: string | null;
  avg_rating?: number | null;
  review_count?: number | null;
}

export interface Category {
  id: number;
  nom: string;
  description: string | null;
}

export type RelatedProductType = "similaire" | "complementaire" | "upsell";

export const finalPrice = (p: Product): number =>
  p.remise > 0 ? Math.max(0, p.prix_unitaire - p.remise) : p.prix_unitaire;

export const formatPrice = (n: number): string =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " FCFA";
