/**
 * Store (E-commerce) — domain types
 */
import type { ComponentType } from 'react';

export type OrderStatus = 'En attente' | 'Confirmée' | 'Expédiée' | 'Livrée' | 'Annulée';

export interface OrderItem {
  id: string;
  nom: string;
  qty: number;
  prix: number;
}

export interface Order {
  id: number;
  ref: string;
  client: string;
  /** 2-letter initials for the avatar */
  init: string;
  /** Avatar background color */
  color: string;
  date: string;
  products: number;
  amount: number;
  status: OrderStatus;
  zone: string;
  items?: OrderItem[];
  /** Delivery fee */
  fraisLivraison?: number;
  telephone?: string;
  adresse?: string;
  /** Raw statut_paiement column (non_paye / paye / paye_total) */
  statutPaiement?: string | null;
  /** Raw payment_mode column (moov_direct / yas_direct / 2x / 3x / 4x / null = comptant) */
  paymentMode?: string | null;
}

export type CouponStatus = 'Actif' | 'Expiré' | 'Inactif';
export type CouponType = '%' | 'F';

export interface Coupon {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  used: number;
  /** null = unlimited */
  limit: number | null;
  expiry: string;
  status: CouponStatus;
}

export interface DeliveryZone {
  id: string;
  name: string;
  coverage: string;
  color: string;
  /** Delivery price in base currency */
  price: number;
  delay: string;
  orders: number;
  active: boolean;
}

/** Dérivé de orders.payment_mode (checkout site) */
export type PaymentMethod = 'Moov Money' | 'Mixx by Yas' | 'Échelonné' | 'Comptant';
export type PaymentStatus = 'Réussi' | 'En attente';

export interface Payment {
  date: string;
  client: string;
  method: PaymentMethod;
  amount: number;
  ref: string;
  status: PaymentStatus;
}

export interface StoreOrderStats {
  ca_jour: number;
  ca_hier: number;
  commandes_en_cours: number;
  commandes_en_attente: number;
  commandes_mois: number;
  commandes_mois_prec: number;
  ca_mois: number;
  ca_mois_prec: number;
  livrees_mois: number;
  paye_mois: number;
  ca_paye_mois: number;
  ca_paye_mois_prec: number;
  /** Comptes globaux par statut (toutes dates confondues) — pour les badges d'onglets */
  total_toutes: number;
  total_pending: number;
  total_confirmed: number;
  total_shipped: number;
  total_delivered: number;
  total_cancelled: number;
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
  icon: ComponentType<{ size?: number }>;
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
