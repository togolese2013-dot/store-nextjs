import type { CSSProperties } from 'react';
import type { Order, Coupon, DeliveryZone, Payment, KpiItem } from './types';

/* ─── Orders ────────────────────────────────────── */
export const SAMPLE_ORDERS: Order[] = [];

export const ORDER_STATUS_STYLE: Record<string, CSSProperties> = {
  'En attente': { background: 'var(--warn-bg)',          color: 'var(--warn)' },
  'Confirmée':  { background: 'var(--accent-bg)',        color: 'var(--accent)' },
  'Expédiée':   { background: 'var(--purple-bg)',        color: 'var(--purple)' },
  'Livrée':     { background: 'var(--ok-bg)',            color: 'var(--ok)' },
  'Annulée':    { background: 'rgba(20,17,14,.06)',      color: 'var(--muted)' },
};

/* ─── Coupons ───────────────────────────────────── */
export const SAMPLE_COUPONS: Coupon[] = [];

/* ─── Delivery zones ────────────────────────────── */
export const SAMPLE_ZONES: DeliveryZone[] = [];

/* ─── Payments ──────────────────────────────────── */
export const SAMPLE_PAYMENTS: Payment[] = [];

export const PAYMENT_METHOD_STYLE: Record<string, CSSProperties> = {
  Wave:           { background: '#E8F0F7',       color: '#1A73E8' },
  'Orange Money': { background: 'var(--warn-bg)',color: '#E07A2C' },
  Carte:          { background: 'var(--bg-2)',   color: 'var(--ink)' },
};

export const PAYMENT_STATUS_STYLE: Record<string, CSSProperties> = {
  'Réussi':     { background: 'var(--ok-bg)',       color: 'var(--ok)' },
  'En attente': { background: 'var(--warn-bg)',      color: 'var(--warn)' },
  'Remboursé':  { background: 'rgba(20,17,14,.06)', color: 'var(--muted)' },
  'Échoué':     { background: 'var(--danger-bg)',   color: 'var(--danger)' },
};

/* ─── Overview KPIs ─────────────────────────────── */
export const OVERVIEW_KPIS: KpiItem[] = [
  { label: 'CA du jour',         value: '—', unit: 'F', sub: 'vs hier même heure',     sparkColor: '#2D6A4F' },
  { label: 'Commandes en cours', value: '—',             sub: 'en attente / confirmées', sparkColor: '#C9601E' },
  { label: 'Panier moyen',       value: '—', unit: 'F', sub: 'ce mois',                 sparkColor: '#5C4A88' },
  { label: 'Taux de livraison',  value: '—', unit: '%', sub: 'commandes livrées',       sparkColor: '#3B6A8F' },
];

export const COMMANDES_KPIS: KpiItem[] = [
  { label: 'Commandes ce mois',  value: '—',             sub: 'vs mois dernier',   sparkColor: '#3B6A8F' },
  { label: "Chiffre d'affaires", value: '—', unit: 'F', sub: 'vs mois dernier',   sparkColor: '#2D6A4F' },
  { label: 'En attente',         value: '—',             sub: "à traiter aujourd'hui", sparkColor: '#C9601E' },
  { label: 'Panier moyen',       value: '—', unit: 'F', sub: 'ce mois',            sparkColor: '#5C4A88' },
];

export const COUPONS_KPIS: KpiItem[] = [
  { label: 'Coupons actifs',        value: '—', sub: 'sur total créés',   sparkColor: '#3B6A8F' },
  { label: 'Utilisations ce mois',  value: '—', sub: 'vs mois dernier',   sparkColor: '#2D6A4F' },
  { label: 'CA généré via coupons', value: '—', unit: 'F', sub: 'avec réductions', sparkColor: '#5C4A88' },
];

export const LIVRAISONS_KPIS: KpiItem[] = [
  { label: 'Zones actives',      value: '—', sub: 'configurées' },
  { label: 'Livraisons ce mois', value: '—', sub: 'vs mois dernier', sparkColor: '#3B6A8F' },
  { label: 'Délai moyen',        value: '—', unit: 'j', sub: 'vs mois dernier', sparkColor: '#5C4A88' },
];

export const PAIEMENTS_KPIS: KpiItem[] = [
  { label: 'CA total ce mois',   value: '—', unit: 'F', sub: 'toutes méthodes', sparkColor: '#2D6A4F' },
  { label: 'Méthode principale', value: '—', serif: true, sub: 'des transactions' },
  { label: 'Taux de succès',     value: '—', unit: '%',  sub: 'paiements réussis', sparkColor: '#3B6A8F' },
];
