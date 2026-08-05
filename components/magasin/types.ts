/**
 * Magasin (Stock management) — domain types
 */

import type { ComponentType } from 'react';

export type ProductStatus = 'Actif' | 'Brouillon' | 'Archivé' | 'Rupture';

export interface Product {
  /** Database id — needed for edit/delete API calls */
  id?: number;
  /** Stock-keeping unit, e.g. "PWX-001" */
  sku: string;
  name: string;
  /** Category label */
  cat: string;
  /** Brand label */
  brand: string;
  status: ProductStatus;
  /** Current stock count */
  stock: number;
  /** Target / reorder threshold — used to compute the % bar */
  target: number;
  /** Price HT in cents of base currency (or major units; format with toLocaleString) */
  price: number;
  /** Purchase / cost price */
  cost?: number;
  /** Discount in FCFA — > 0 shows the promo badge and lists the product under Promotions on the storefront */
  discount?: number;
  /** Shows the "Nouveau" badge on the storefront (for 30 days after creation) */
  isNew?: boolean;
  /** Margin in % */
  margin: number;
  /** Color used as thumbnail background */
  swatch: string;
  /** Single character/letter shown in the thumbnail */
  initial: string;
  /** Optional image URL — when present, replaces the swatch+initial thumbnail */
  imageUrl?: string;
  /** Secondary photos (beyond the main imageUrl) */
  images?: string[];
  /** Description shown on the storefront product page */
  description?: string;
  /** URL slug — used to build the public storefront link (/products/[slug]) */
  slug?: string | null;
}

export interface KpiCard {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  /** Hex of the delta pill — green for positive, orange for warning, red for danger */
  deltaColor: string;
  /** Short context line under the value */
  sub: string;
  /** Sparkline data points */
  spark: number[];
  /** Accent color of the sparkline */
  color: string;
}

export interface TabSpec {
  id: string;
  label: string;
  count: number;
  /** When true the count pill is rendered in the danger color */
  warn?: boolean;
}

export interface NavItem {
  icon: ComponentType<{ size?: number }>;
  label: string;
  /** Optional count shown right-aligned */
  count?: number;
  /** When true the count is rendered in the danger color */
  badge?: boolean;
  active?: boolean;
  /** Optional href / id you can use for routing */
  id?: string;
}

export interface NavGroup {
  /** Section heading, or null for the top group */
  section: string | null;
  items: NavItem[];
}

export interface Category {
  id: string;
  name: string;
  /** Hex accent color — used for card top stripe and distribution bars */
  color: string;
  products: number;
  /** Total stock value in base currency */
  revenue: number;
  subcats: number;
}

export interface Brand {
  id?: number;
  name: string;
  /** 2-letter initials shown in the thumbnail */
  init: string;
  /** Hex color for the thumbnail background */
  color: string;
  products: number;
  /** Total stock value in base currency */
  revenue: number;
  /** Average margin in % */
  margin: number;
  country: string;
  status: 'Actif' | 'Inactif';
  /** Logo URL from Cloudinary */
  logo?: string;
}

export interface Variant {
  id: string;
  name: string;
  type: string;
  values: string[];
  products: number;
}

export interface Supplier {
  id?: number;
  name: string;
  /** 2-letter initials */
  init: string;
  /** Hex thumbnail color */
  color: string;
  country: string;
  products: number;
  /** Total purchases in base currency */
  total: number;
  /** Average delivery delay in days */
  delay: number;
  status: 'Actif' | 'Inactif';
}

export type PurchaseOrderStatus =
  | 'En attente' | 'En transit' | 'Livré' | 'Partiel' | 'Retard' | 'Annulé';

export interface ArticleLigne {
  id?: number;
  produit_id?: number | null;
  name: string;
  sku: string;
  qty: number;
  prix: number;
}

export interface PurchaseOrder {
  id?: number;
  ref: string;
  supplier: string;
  supplier_id?: number | null;
  date: string;
  transport?: 'Avion' | 'Bateau' | 'Camion' | null;
  arrival?: string | null;
  products: number;
  amount: number;
  status: PurchaseOrderStatus;
  articles?: ArticleLigne[];
}



export type MovementType = 'Entrée' | 'Sortie' | 'Transfert' | 'Ajustement';

export interface StockMovement {
  date: string;
  product: string;
  sku: string;
  type: MovementType;
  /** Positive for inbound, negative for outbound */
  qty: number;
  from: string;
  to: string;
}

