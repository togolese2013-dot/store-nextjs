import type {
  Product, KpiCard, TabSpec, Category, Brand,
  Variant, Supplier, PurchaseOrder, Warehouse,
  StockAdjustment, StockMovement, StockAlert,
} from './types';

export const ACCENT = '#3B6A8F';
export const ACCENT_BG = '#E8F0F7';

export const SAMPLE_PRODUCTS: Product[] = [];

export const SAMPLE_KPIS: KpiCard[] = [
  { label: 'Total produits',  value: '0',   delta: '',     deltaColor: '#2D6A4F', sub: 'ce mois',          spark: [], color: ACCENT },
  { label: 'Valeur stock',    value: '0',   unit: 'F',     delta: '',             deltaColor: '#2D6A4F', sub: 'vs mois dernier',  spark: [], color: '#2D6A4F' },
  { label: 'Stock bas',       value: '0',   delta: '',     deltaColor: '#9C3A14', sub: '< seuil critique', spark: [], color: '#C9601E' },
  { label: 'Marge moyenne',   value: '0',   unit: '%',     delta: '',             deltaColor: '#2D6A4F', sub: 'sur 30 j',         spark: [], color: '#5C4A88' },
];

export const DEFAULT_TABS: TabSpec[] = [
  { id: 'all',      label: 'Tous',       count: 0 },
  { id: 'active',   label: 'Actifs',     count: 0 },
  { id: 'draft',    label: 'Brouillons', count: 0 },
  { id: 'low',      label: 'Stock bas',  count: 0, warn: true },
  { id: 'archived', label: 'Archivés',   count: 0 },
];

export const SAMPLE_CATEGORIES: Category[] = [];
export const SAMPLE_VARIANTS: Variant[] = [];
export const SAMPLE_SUPPLIERS: Supplier[] = [];
export const SAMPLE_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const SAMPLE_WAREHOUSES: Warehouse[] = [];
export const SAMPLE_ADJUSTMENTS: StockAdjustment[] = [];
export const SAMPLE_MOVEMENTS: StockMovement[] = [];
export const SAMPLE_ALERTS: StockAlert[] = [];
export const SAMPLE_BRANDS: Brand[] = [];
