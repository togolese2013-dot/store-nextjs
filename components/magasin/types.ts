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
  /** Margin in % */
  margin: number;
  /** Color used as thumbnail background */
  swatch: string;
  /** Single character/letter shown in the thumbnail */
  initial: string;
  /** Optional image URL — when present, replaces the swatch+initial thumbnail */
  imageUrl?: string;
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

export type PurchaseOrderStatus = 'En attente' | 'Confirmé' | 'Expédié' | 'Reçu' | 'Annulé';

export interface PurchaseOrder {
  id?: number;
  ref: string;
  supplier: string;
  date: string;
  products: number;
  amount: number;
  status: PurchaseOrderStatus;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  /** Hex accent color */
  color: string;
  capacity: number;
  occupied: number;
  products: number;
}

export interface StockAdjustment {
  date: string;
  product: string;
  sku: string;
  /** Positive = added, negative = removed */
  delta: number;
  reason: string;
  author: string;
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

export type AlertChannel = 'Email' | 'SMS' | 'WhatsApp';

export interface StockAlert {
  name: string;
  target: string;
  targetType: 'Produit' | 'Catégorie';
  threshold: number;
  channels: AlertChannel[];
  active: boolean;
  triggered: boolean;
}
