/**
 * Boutique (Ventes & caisse) — domain types
 */

export type PaymentMethod = 'Espèces' | 'Wave' | 'Orange M.' | 'Carte';

export interface Sale {
  id: string;
  /** Numeric facture id — used for detail/print lookups (GET /api/admin/ventes/factures/:id) */
  numericId: number;
  /** Client name, or '—' for anonymous */
  client: string;
  init: string;
  color: string;
  time: string;
  /** ISO datetime string from created_at — used for period filtering */
  isoDate: string;
  products: number;
  amount: number;
  payment: PaymentMethod;
  items: string;
  vendeur?: string | null;
}

export interface BoutiqueStock {
  produit_id: number;
  sku: string;
  name: string;
  cat: string;
  /** Physical stock in the boutique (distinct from warehouse) */
  boutique: number;
  /** Reorder threshold */
  seuil: number;
  swatch: string;
  init: string;
  prix: number;
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
export type ClientType = 'particulier' | 'professionnel';

export interface BoutiqueClient {
  id: number;
  name: string;
  init: string;
  color: string;
  visits: number;
  last: string;
  total: number;
  status: ClientStatus;
  telephone: string | null;
  email: string | null;
  localisation: string | null;
  type_client: ClientType;
  solde: number;
  notes: string | null;
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

export interface PaiementJourStat { mode: PaymentMethod; montant: number; pct: number }
export interface TopProduitJourStat { nom: string; qty: number; ca: number }
export interface StockAlerteStat { nom: string; quantite: number; seuil: number }

export interface OverviewStats {
  ventes_jour_count: number;
  ventes_jour_montant: number;
  ca_total: number;
  factures_payees: number;
  clients_servis_jour: number;
  paiements_jour: PaiementJourStat[];
  top_produits_jour: TopProduitJourStat[];
  stock_alertes: StockAlerteStat[];
}
