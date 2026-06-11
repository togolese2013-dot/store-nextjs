import type { CSSProperties } from 'react';
import type { Order, Coupon, DeliveryZone, Payment, KpiItem } from './types';

/* ─── Orders ────────────────────────────────────── */
export const SAMPLE_ORDERS: Order[] = [
  {
    ref: 'CMD-2026-001', client: 'Amara Diallo', init: 'AD', color: '#2D6A4F',
    date: '11 juin 2026', products: 3, amount: 87500, status: 'En attente', zone: 'Lomé centre',
    telephone: '+228 90 12 34 56', adresse: '12 Rue du Commerce, Lomé',
    items: [
      { id: 'p1', nom: 'Casque Bluetooth JBL', qty: 1, prix: 45000 },
      { id: 'p2', nom: 'Chargeur USB-C 65W',   qty: 2, prix: 12500 },
      { id: 'p3', nom: 'Câble HDMI 2m',         qty: 2, prix: 8750  },
    ],
    fraisLivraison: 500,
  },
  {
    ref: 'CMD-2026-002', client: 'Kofi Mensah', init: 'KM', color: '#5C4A88',
    date: '10 juin 2026', products: 1, amount: 125000, status: 'Confirmée', zone: 'Agoè',
    telephone: '+228 91 23 45 67', adresse: 'Quartier Agoè-Nyivé',
    items: [
      { id: 'p4', nom: 'Téléviseur 43" Samsung', qty: 1, prix: 124500 },
    ],
    fraisLivraison: 500,
  },
  {
    ref: 'CMD-2026-003', client: 'Fatou Traoré', init: 'FT', color: '#C9601E',
    date: '9 juin 2026', products: 4, amount: 34200, status: 'Expédiée', zone: 'Bè',
    telephone: '+228 92 34 56 78', adresse: 'Bè Kpota',
    items: [
      { id: 'p5', nom: 'Ventilateur de table',  qty: 1, prix: 14500 },
      { id: 'p6', nom: 'Ampoule LED 12W (×10)', qty: 2, prix: 5500  },
      { id: 'p7', nom: 'Multiprise 5 prises',   qty: 1, prix: 8700  },
    ],
    fraisLivraison: 0,
    couponCode: 'PROMO10',
    couponRemise: 2800,
  },
  {
    ref: 'CMD-2026-004', client: 'Yves Agbodjan', init: 'YA', color: '#3B6A8F',
    date: '8 juin 2026', products: 2, amount: 56000, status: 'Livrée', zone: 'Tokoin',
    telephone: '+228 93 45 67 89', adresse: 'Tokoin Forever',
    items: [
      { id: 'p8', nom: 'Tondeuse Philips',  qty: 1, prix: 32000 },
      { id: 'p9', nom: 'Brosse à dents élec.', qty: 2, prix: 12000 },
    ],
    fraisLivraison: 0,
  },
  {
    ref: 'CMD-2026-005', client: 'Séna Kpodo', init: 'SK', color: '#A0522D',
    date: '7 juin 2026', products: 1, amount: 0, status: 'Annulée', zone: 'Adidogomé',
    telephone: '+228 94 56 78 90', adresse: 'Adidogomé Carrefour',
    items: [
      { id: 'p10', nom: 'Aspirateur sans fil', qty: 1, prix: 89000 },
    ],
    fraisLivraison: 500,
  },
];

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
