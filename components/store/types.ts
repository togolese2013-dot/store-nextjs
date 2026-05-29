/**
 * Store (E-commerce) — domain types
 */
import type { ComponentType } from 'react';

export type OrderStatus = 'En attente' | 'Confirmée' | 'Expédiée' | 'Livrée' | 'Annulée';

export interface Order {
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
}

export type CouponStatus = 'Actif' | 'Expiré' | 'Inactif';
export type CouponType = '%' | 'F';

export interface Coupon {
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

export type PaymentMethod = 'Wave' | 'Orange Money' | 'Carte';
export type PaymentStatus = 'Réussi' | 'En attente' | 'Remboursé' | 'Échoué';

export interface Payment {
  date: string;
  client: string;
  method: PaymentMethod;
  amount: number;
  ref: string;
  status: PaymentStatus;
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
