import type { Sale, BoutiqueStock, CashMovement, BoutiqueClient, KpiItem } from './types';

/* ─── Sales ─────────────────────────────────────── */
export const SAMPLE_SALES: Sale[] = [];

export const PAYMENT_STYLE: Record<string, React.CSSProperties> = {
  'Espèces':    { background: 'var(--bg-2)',     color: 'var(--ink)' },
  Wave:         { background: '#E8F0F7',         color: '#1A73E8' },
  'Orange M.':  { background: 'var(--warn-bg)',  color: 'var(--warn)' },
  Carte:        { background: 'var(--accent-bg)',color: 'var(--accent)' },
};

/* ─── Boutique stock ────────────────────────────── */
export const SAMPLE_STOCK: BoutiqueStock[] = [];

/* ─── Cash movements (Finance) ──────────────────── */
export const SAMPLE_CASH: CashMovement[] = [];

export const CASH_CURRENT_BALANCE = 0;

export const WEEK_REVENUE = [
  { day: 'Lun', ca: 0 },
  { day: 'Mar', ca: 0 },
  { day: 'Mer', ca: 0 },
  { day: 'Jeu', ca: 0 },
  { day: 'Ven', ca: 0, today: true },
  { day: 'Sam', ca: 0 },
  { day: 'Dim', ca: 0 },
];

/* ─── Clients ───────────────────────────────────── */
export const SAMPLE_CLIENTS: BoutiqueClient[] = [];

export const CLIENT_STATUS_CLASS: Record<string, string> = {
  VIP: 'cliVip', 'Fidèle': 'cliFidele', 'Régulier': 'cliReg', Nouveau: 'cliNew',
};

/* ─── Top products sold today (overview) ────────── */
export const TOP_PRODUCTS_TODAY: { name: string; swatch: string; init: string; qty: number; ca: number }[] = [];

/* ─── Payment breakdown (overview) ──────────────── */
export const PAY_BREAKDOWN: { name: string; color: string; pct: number; amount: number }[] = [];

/* ─── KPI sets ──────────────────────────────────── */
export const OVERVIEW_KPIS: KpiItem[] = [
  { label: 'CA du jour',     value: '—', unit: 'F', sub: 'vs hier même heure', sparkColor: '#C9601E' },
  { label: 'Ventes du jour', value: '—',             sub: 'vs hier',             sparkColor: '#3B6A8F' },
  { label: 'Clients servis', value: '—',             sub: "aujourd'hui",          sparkColor: '#5C4A88' },
  { label: 'Panier moyen',   value: '—', unit: 'F', sub: 'ce jour',              sparkColor: '#2D6A4F' },
];

export const VENTES_KPIS: KpiItem[] = [
  { label: 'CA du jour',   value: '—', unit: 'F', sub: 'vs hier',      sparkColor: '#C9601E' },
  { label: 'Ventes',       value: '—',             sub: "aujourd'hui", sparkColor: '#3B6A8F' },
  { label: 'Panier moyen', value: '—', unit: 'F', sub: "aujourd'hui", sparkColor: '#5C4A88' },
];

export const STOCK_KPIS: KpiItem[] = [
  { label: 'Références en boutique', value: '—', sub: 'du catalogue',                   sparkColor: '#3B6A8F' },
  { label: 'Alertes stock',          value: '—', sub: '< seuil de réapprovisionnement', sparkColor: '#C9601E' },
  { label: 'Transferts en cours',    value: '—', sub: 'depuis entrepôt' },
];

export const FINANCE_KPIS: KpiItem[] = [
  { label: 'Entrées du jour', value: '—', unit: 'F', sub: 'ventes encaissées',  sparkColor: '#2D6A4F' },
  { label: 'Sorties du jour', value: '—', unit: 'F', sub: 'dépenses',           sparkColor: '#C9601E' },
  { label: 'Bénéfice net',    value: '—', unit: 'F', sub: 'vs hier',            sparkColor: '#5C4A88' },
];

export const CLIENTS_KPIS: KpiItem[] = [
  { label: 'Clients enregistrés',  value: '—',           sub: 'ce mois',          sparkColor: '#3B6A8F' },
  { label: 'Client du mois',       value: '—', serif: true, sub: '—' },
  { label: 'Panier moyen clients', value: '—', unit: 'F', sub: 'clients identifiés', sparkColor: '#5C4A88' },
];
