/**
 * Boutique (Ventes & caisse) — domain types
 */

export type PaymentMethod = 'Espèces' | 'Wave' | 'Orange M.' | 'Carte';

export interface Sale {
  id: string;
  /** Client name, or '—' for anonymous */
  client: string;
  init: string;
  color: string;
  time: string;
  products: number;
  amount: number;
  payment: PaymentMethod;
  items: string;
}

export interface BoutiqueStock {
  sku: string;
  name: string;
  cat: string;
  /** Physical stock in the boutique (distinct from warehouse) */
  boutique: number;
  /** Reorder threshold */
  seuil: number;
  swatch: string;
  init: string;
}

export type CashMovementType = 'Vente' | 'Sortie' | 'Ouverture';

export interface CashMovement {
  date: string;
  type: CashMovementType;
  label: string;
  /** Signed amount (+ in, − out) */
  montant: number;
  /** Running cash balance after this movement */
  solde: number;
}

export type ClientStatus = 'VIP' | 'Fidèle' | 'Régulier' | 'Nouveau';

export interface BoutiqueClient {
  name: string;
  init: string;
  color: string;
  visits: number;
  last: string;
  total: number;
  status: ClientStatus;
}

export interface KpiItem {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaColor?: string;
  sub: string;
  spark?: number[];
  sparkColor?: string;
  serif?: boolean;
}

export interface NavItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  count?: number;
  badge?: boolean;
  active?: boolean;
  id?: string;
}

export interface NavGroup {
  section: string | null;
  items: NavItem[];
}
