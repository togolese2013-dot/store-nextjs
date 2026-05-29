import type { CSSProperties } from 'react';
import type { Order, Coupon, DeliveryZone, Payment, KpiItem } from './types';

/* ─── Orders ────────────────────────────────────── */
export const SAMPLE_ORDERS: Order[] = [
  { ref: 'CMD-2847', client: 'Adjoa Mensah',  init: 'AM', color: '#1F3D6E', date: '28 mai, 10h14', products: 3, amount: 47500, status: 'En attente', zone: 'Lomé Centre' },
  { ref: 'CMD-2846', client: 'Kofi Asante',   init: 'KA', color: '#2D6A4F', date: '28 mai, 09h02', products: 1, amount: 18000, status: 'Expédiée',   zone: 'Grand Lomé' },
  { ref: 'CMD-2845', client: 'Fatou Diallo',  init: 'FD', color: '#B8501A', date: '27 mai, 15h30', products: 2, amount:  9000, status: 'Livrée',     zone: 'Lomé Centre' },
  { ref: 'CMD-2844', client: 'Ama Koffi',     init: 'AK', color: '#5C4A88', date: '27 mai, 11h48', products: 4, amount: 32000, status: 'Confirmée',  zone: 'Grand Lomé' },
  { ref: 'CMD-2843', client: 'Kwame Boateng', init: 'KB', color: '#C8962A', date: '26 mai, 14h00', products: 1, amount:  4500, status: 'Livrée',     zone: 'Lomé Centre' },
  { ref: 'CMD-2842', client: 'Abena Owusu',   init: 'AO', color: '#7A2C3A', date: '26 mai, 09h15', products: 2, amount: 16500, status: 'Annulée',    zone: 'Kara' },
  { ref: 'CMD-2841', client: 'Yaw Darko',     init: 'YD', color: '#3A2F25', date: '25 mai, 16h22', products: 3, amount: 27000, status: 'Expédiée',   zone: 'International' },
  { ref: 'CMD-2840', client: 'Akua Boateng',  init: 'AB', color: '#3B6A8F', date: '25 mai, 13h05', products: 1, amount:  8500, status: 'Livrée',     zone: 'Grand Lomé' },
];

export const ORDER_STATUS_STYLE: Record<string, CSSProperties> = {
  'En attente': { background: 'var(--warn-bg)',          color: 'var(--warn)' },
  'Confirmée':  { background: 'var(--accent-bg)',        color: 'var(--accent)' },
  'Expédiée':   { background: 'var(--purple-bg)',        color: 'var(--purple)' },
  'Livrée':     { background: 'var(--ok-bg)',            color: 'var(--ok)' },
  'Annulée':    { background: 'rgba(20,17,14,.06)',      color: 'var(--muted)' },
};

/* ─── Coupons ───────────────────────────────────── */
export const SAMPLE_COUPONS: Coupon[] = [
  { code: 'BIENVENUE10', type: '%', value:    10, used:  48, limit: null, expiry: '31 déc. 2026',  status: 'Actif'   },
  { code: 'WAXFEST20',   type: '%', value:    20, used:  32, limit:   50, expiry: '30 juin 2026',  status: 'Actif'   },
  { code: 'KARITE5K',    type: 'F', value:  5000, used:  15, limit:   20, expiry: '15 juin 2026',  status: 'Actif'   },
  { code: 'DAKAR2026',   type: '%', value:    15, used:  20, limit: null, expiry: '31 juil. 2026', status: 'Actif'   },
  { code: 'FIDELITE500', type: 'F', value:   500, used:  67, limit:  100, expiry: '31 déc. 2026',  status: 'Actif'   },
  { code: 'NOEL25',      type: '%', value:    25, used:  89, limit:  100, expiry: '31 janv. 2026', status: 'Expiré'  },
  { code: 'PROMO15',     type: '%', value:    15, used:  45, limit:   50, expiry: '1 mars 2026',   status: 'Expiré'  },
  { code: 'FLASH30',     type: '%', value:    30, used:   5, limit:   30, expiry: '30 juin 2026',  status: 'Inactif' },
];

/* ─── Delivery zones ────────────────────────────── */
export const SAMPLE_ZONES: DeliveryZone[] = [
  { id: 'lc',  name: 'Lomé Centre',   coverage: 'Commune de Lomé',          color: '#2D6A4F', price:  1500, delay: 'Même jour', orders: 245, active: true  },
  { id: 'gl',  name: 'Grand Lomé',    coverage: 'Banlieue de Lomé (30 km)', color: '#3B6A8F', price:  2500, delay: 'J+1',       orders: 318, active: true  },
  { id: 'ka',  name: 'Kara',          coverage: 'Région de la Kara',        color: '#5C4A88', price:  5000, delay: 'J+2',       orders:  87, active: true  },
  { id: 'az',  name: 'Ablodé-Zokli',  coverage: 'Régions intérieures',      color: '#B8501A', price:  6500, delay: 'J+3',       orders:  34, active: true  },
  { id: 'int', name: 'International', coverage: "Afrique de l'Ouest",       color: '#1F3D6E', price: 15000, delay: 'J+5 à J+7', orders:  12, active: false },
];

/* ─── Payments ──────────────────────────────────── */
export const SAMPLE_PAYMENTS: Payment[] = [
  { date: '28 mai, 10h14', client: 'Adjoa Mensah',  method: 'Wave',         amount: 47500, ref: 'WAVE-938271', status: 'Réussi'     },
  { date: '28 mai, 09h02', client: 'Kofi Asante',   method: 'Orange Money', amount: 18000, ref: 'OM-847392',   status: 'Réussi'     },
  { date: '27 mai, 16h45', client: 'Fatou Diallo',  method: 'Carte',        amount:  9000, ref: 'CB-293847',   status: 'Réussi'     },
  { date: '27 mai, 11h48', client: 'Ama Koffi',     method: 'Wave',         amount: 32000, ref: 'WAVE-837261', status: 'En attente' },
  { date: '26 mai, 14h00', client: 'Kwame Boateng', method: 'Orange Money', amount:  4500, ref: 'OM-728394',   status: 'Réussi'     },
  { date: '26 mai, 09h15', client: 'Abena Owusu',   method: 'Wave',         amount: 16500, ref: 'WAVE-719283', status: 'Remboursé'  },
  { date: '25 mai, 16h22', client: 'Yaw Darko',     method: 'Wave',         amount: 27000, ref: 'WAVE-609182', status: 'Réussi'     },
  { date: '25 mai, 13h05', client: 'Akua Boateng',  method: 'Orange Money', amount:  8500, ref: 'OM-598271',   status: 'Réussi'     },
];

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
  { label: 'CA du jour',         value: '47 500',  unit: 'F', delta: '+18%',     deltaColor: '#2D6A4F', sub: 'vs hier même heure',     spark: [28,32,35,38,42,44,46,47,48,47,47],                               sparkColor: '#2D6A4F' },
  { label: 'Commandes en cours', value: '3',                  delta: 'à traiter', deltaColor: '#C9601E', sub: 'en attente / confirmées', spark: [1,2,2,3,2,3,3,2,3,3,3],                                          sparkColor: '#C9601E' },
  { label: 'Panier moyen',       value: '18 200',  unit: 'F', delta: '+5%',      deltaColor: '#2D6A4F', sub: 'ce mois',                 spark: [15000,16000,16500,17000,17200,17800,18000,18100,18200,18200,18200], sparkColor: '#5C4A88' },
  { label: 'Taux de livraison',  value: '94',      unit: '%', delta: '+2%',      deltaColor: '#2D6A4F', sub: 'commandes livrées',       spark: [88,89,90,90,91,92,92,93,93,94,94],                               sparkColor: '#3B6A8F' },
];

export const COMMANDES_KPIS: KpiItem[] = [
  { label: 'Commandes ce mois',   value: '32',      delta: '+8',   deltaColor: '#2D6A4F', sub: 'vs 24 mois dernier',   spark: [18,20,22,24,24,26,27,28,29,31,32],               sparkColor: '#3B6A8F' },
  { label: "Chiffre d'affaires",  value: '347 500', unit: 'F', delta: '+22%', deltaColor: '#2D6A4F', sub: 'vs mois dernier', spark: [200,220,240,260,270,290,310,320,335,345,347],     sparkColor: '#2D6A4F' },
  { label: 'En attente',          value: '3',       delta: 'urgent',deltaColor: '#9C3A14', sub: "à traiter aujourd'hui", spark: [1,2,1,2,2,3,2,3,3,3,3],                         sparkColor: '#C9601E' },
  { label: 'Panier moyen',        value: '18 200',  unit: 'F', delta: '+5%', deltaColor: '#2D6A4F', sub: 'ce mois',         spark: [15000,16000,16500,17000,17200,17800,18000,18100,18200,18200,18200], sparkColor: '#5C4A88' },
];

export const COUPONS_KPIS: KpiItem[] = [
  { label: 'Coupons actifs',        value: '5',       sub: 'sur 8 créés',                       spark: [3,3,4,4,4,5,5,5,5,5,5],                                           sparkColor: '#3B6A8F' },
  { label: 'Utilisations ce mois',  value: '145',     delta: '+32', deltaColor: '#2D6A4F',      sub: 'vs mois dernier',  spark: [80,90,95,100,105,110,115,125,130,140,145],         sparkColor: '#2D6A4F' },
  { label: 'CA généré via coupons', value: '124 000', unit: 'F', delta: '+18%', deltaColor: '#2D6A4F', sub: 'avec réductions', spark: [80000,90000,95000,100000,105000,110000,115000,118000,120000,122000,124000], sparkColor: '#5C4A88' },
];

export const LIVRAISONS_KPIS: KpiItem[] = [
  { label: 'Zones actives',      value: '4',   sub: '2 locales · 1 régionale · 1 internationale' },
  { label: 'Livraisons ce mois', value: '890', delta: '+12%', deltaColor: '#2D6A4F', sub: 'vs 795 mois dernier', spark: [700,720,740,760,780,800,820,840,860,878,890], sparkColor: '#3B6A8F' },
  { label: 'Délai moyen',        value: '1,8', unit: 'j', delta: '−0,3j', deltaColor: '#2D6A4F',                sub: 'vs 2,1j mois dernier', spark: [28,26,25,24,23,22,21,20,19,18,18], sparkColor: '#5C4A88' },
];

export const PAIEMENTS_KPIS: KpiItem[] = [
  { label: 'CA total ce mois',   value: '347 500', unit: 'F', delta: '+22%', deltaColor: '#2D6A4F', sub: 'toutes méthodes', spark: [200,220,240,260,270,290,310,320,335,345,347], sparkColor: '#2D6A4F' },
  { label: 'Méthode principale', value: 'Wave',    serif: true,                                     sub: '62% des transactions' },
  { label: 'Taux de succès',     value: '97',      unit: '%',  delta: '+1%', deltaColor: '#2D6A4F', sub: 'paiements réussis', spark: [92,93,93,94,94,95,95,96,96,97,97], sparkColor: '#3B6A8F' },
];
