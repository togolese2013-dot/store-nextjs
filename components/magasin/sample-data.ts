import type {
  Product, KpiCard, TabSpec, Category, Brand,
  Variant, Supplier, PurchaseOrder, Warehouse,
  StockAdjustment, StockMovement, StockAlert,
} from './types';

export const ACCENT = '#3B6A8F';
export const ACCENT_BG = '#E8F0F7';

/**
 * Sample products — swap for real data once your inventory API is wired.
 * West-African inventory theme (Maison Diallo).
 */
export const SAMPLE_PRODUCTS: Product[] = [
  { sku: 'PWX-001', name: 'Pagne wax — Indigo Royal',      cat: 'Textile',      brand: 'Studio Wax',     status: 'Actif',     stock: 42,  target: 80,  price: 18000, margin: 42, swatch: '#1F3D6E', initial: 'P' },
  { sku: 'BGL-014', name: 'Bogolan brodé — Édition Mopti', cat: 'Textile',      brand: 'Atelier Bamako', status: 'Actif',     stock: 8,   target: 30,  price: 12000, margin: 38, swatch: '#3A2F25', initial: 'B' },
  { sku: 'KAR-220', name: 'Beurre de karité brut · 250g',  cat: 'Cosmétique',   brand: 'Karité Pure',    status: 'Actif',     stock: 156, target: 200, price: 4500,  margin: 56, swatch: '#E8C988', initial: 'K' },
  { sku: 'BSP-500', name: 'Bissap séché premium · 500g',   cat: 'Alimentation', brand: 'Maison Diallo',  status: 'Actif',     stock: 4,   target: 60,  price: 1500,  margin: 51, swatch: '#7A2C3A', initial: 'B' },
  { sku: 'KTE-009', name: 'Kente royal — 6 yards',         cat: 'Textile',      brand: 'Ashanti Crafts', status: 'Brouillon', stock: 12,  target: 24,  price: 45000, margin: 35, swatch: '#D4A437', initial: 'K' },
  { sku: 'SAV-118', name: 'Savon noir africain · 200g',    cat: 'Cosmétique',   brand: 'Karité Pure',    status: 'Actif',     stock: 0,   target: 100, price: 2500,  margin: 60, swatch: '#1F1612', initial: 'S' },
  { sku: 'BJL-307', name: 'Collier perles wax · doré',     cat: 'Accessoire',   brand: 'Maison Diallo',  status: 'Actif',     stock: 24,  target: 40,  price: 8500,  margin: 48, swatch: '#B8501A', initial: 'C' },
  { sku: 'CFE-450', name: 'Café Robusta torréfié · 450g',  cat: 'Alimentation', brand: 'Maison Diallo',  status: 'Actif',     stock: 67,  target: 100, price: 6800,  margin: 44, swatch: '#5A3520', initial: 'C' },
];

/**
 * KPI cards — populate from your stats API.
 * `deltaColor` palette:
 *   green  #2D6A4F (positive)
 *   orange #C9601E (warning)
 *   red    #9C3A14 (danger)
 *   purple #5C4A88 (neutral metric)
 */
export const SAMPLE_KPIS: KpiCard[] = [
  { label: 'Total produits',  value: '248',       delta: '+12',      deltaColor: '#2D6A4F', sub: 'ce mois',           spark: [14, 16, 15, 18, 17, 22, 21, 24, 23, 28, 30], color: ACCENT },
  { label: 'Valeur stock',    value: '4 286 700', unit: 'F', delta: '+8,2%', deltaColor: '#2D6A4F', sub: 'vs mois dernier',   spark: [120, 128, 132, 140, 136, 148, 156, 168, 172, 180, 194], color: '#2D6A4F' },
  { label: 'Stock bas',       value: '7',         delta: 'urgent',   deltaColor: '#9C3A14', sub: '< seuil critique',  spark: [3, 2, 4, 5, 4, 6, 5, 6, 7, 6, 7], color: '#C9601E' },
  { label: 'Marge moyenne',   value: '38',        unit: '%', delta: '+1,4 pts', deltaColor: '#2D6A4F', sub: 'sur 30 j',         spark: [34, 35, 36, 35, 37, 36, 38, 37, 38, 38, 38], color: '#5C4A88' },
];

export const DEFAULT_TABS: TabSpec[] = [
  { id: 'all',      label: 'Tous',       count: 248 },
  { id: 'active',   label: 'Actifs',     count: 231 },
  { id: 'draft',    label: 'Brouillons', count: 12 },
  { id: 'low',      label: 'Stock bas',  count: 7, warn: true },
  { id: 'archived', label: 'Archivés',   count: 18 },
];

export const SAMPLE_CATEGORIES: Category[] = [
  { id: 'textile',    name: 'Textile',         color: '#1F3D6E', products: 89, revenue: 1845000, subcats: 4 },
  { id: 'cosmetique', name: 'Cosmétique',      color: '#6B9E3A', products: 64, revenue: 523000,  subcats: 3 },
  { id: 'alim',       name: 'Alimentation',    color: '#2D6A4F', products: 47, revenue: 312000,  subcats: 5 },
  { id: 'access',     name: 'Accessoires',     color: '#B8501A', products: 38, revenue: 768000,  subcats: 2 },
  { id: 'maison',     name: 'Maison & Déco',   color: '#5C4A88', products: 22, revenue: 195000,  subcats: 3 },
  { id: 'art',        name: 'Art & Artisanat', color: '#3B6A8F', products: 18, revenue: 445000,  subcats: 2 },
];

export const SAMPLE_VARIANTS: Variant[] = [
  { id: 'taille',   name: 'Taille',          type: 'Taille',   values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],          products: 45 },
  { id: 'couleur',  name: 'Couleur',          type: 'Couleur',  values: ['Indigo', 'Noir', 'Blanc', 'Rouge', 'Ocre'], products: 38 },
  { id: 'matiere',  name: 'Matière',          type: 'Matière',  values: ['Coton', 'Lin', 'Soie', 'Wax', 'Bogolan'],  products: 22 },
  { id: 'poids',    name: 'Poids / Grammage', type: 'Poids',    values: ['100g', '200g', '250g', '500g', '1kg'],     products: 18 },
  { id: 'longueur', name: 'Longueur',         type: 'Longueur', values: ['1m', '2,5m', '5m', '10m', 'Pièce'],        products: 12 },
  { id: 'cond',     name: 'Conditionnement',  type: 'Autre',    values: ['Unité', 'Lot ×3', 'Lot ×6', 'Vrac'],       products:  9 },
  { id: 'pays',     name: "Pays d'origine",   type: 'Autre',    values: ['Togo', 'Sénégal', 'Mali', 'Ghana'],        products: 78 },
];

export const SAMPLE_SUPPLIERS: Supplier[] = [
  { name: 'Wax Distributions',  init: 'WD', color: '#1F3D6E', country: "Côte d'Ivoire", products: 58, total: 2450000, delay: 12, status: 'Actif'   },
  { name: 'Karité Export Mali', init: 'KE', color: '#C8962A', country: 'Mali',           products: 34, total:  890000, delay: 21, status: 'Actif'   },
  { name: 'Akosua Crafts',      init: 'AC', color: '#D4A437', country: 'Ghana',          products: 29, total: 1230000, delay: 18, status: 'Actif'   },
  { name: 'Sahel Bio SARL',     init: 'SB', color: '#2D6A4F', country: 'Burkina Faso',   products: 22, total:  445000, delay:  9, status: 'Actif'   },
  { name: 'Lomé Négoce',        init: 'LN', color: '#5C4A88', country: 'Togo',           products: 15, total:  310000, delay:  3, status: 'Actif'   },
  { name: 'Dakar Textiles',     init: 'DT', color: '#7A2C3A', country: 'Sénégal',        products:  8, total:  120000, delay: 24, status: 'Inactif' },
];

export const SAMPLE_PURCHASE_ORDERS: PurchaseOrder[] = [
  { ref: 'BC-2026-041', supplier: 'Wax Distributions',  date: '28 mai 2026', products: 12, amount: 485000, status: 'Expédié'    },
  { ref: 'BC-2026-040', supplier: 'Karité Export Mali', date: '25 mai 2026', products:  6, amount: 178000, status: 'Confirmé'   },
  { ref: 'BC-2026-039', supplier: 'Akosua Crafts',      date: '22 mai 2026', products:  9, amount: 312000, status: 'Reçu'       },
  { ref: 'BC-2026-038', supplier: 'Sahel Bio SARL',     date: '20 mai 2026', products:  4, amount:  95000, status: 'En attente' },
  { ref: 'BC-2026-037', supplier: 'Lomé Négoce',        date: '15 mai 2026', products:  7, amount: 224000, status: 'Reçu'       },
  { ref: 'BC-2026-036', supplier: 'Wax Distributions',  date: '10 mai 2026', products:  3, amount:  89000, status: 'Annulé'     },
];

export const SAMPLE_WAREHOUSES: Warehouse[] = [
  { id: 'lome-1', name: 'Lomé Central',  location: 'Adidogomé, Lomé', color: '#3B6A8F', capacity: 1200, occupied: 1045, products: 148 },
  { id: 'lome-2', name: 'Lomé Nord',     location: 'Cacaveli, Lomé',  color: '#2D6A4F', capacity:  600, occupied:  312, products:  72 },
  { id: 'kara-1', name: 'Kara Entrepôt', location: 'Kara Centre',     color: '#5C4A88', capacity:  400, occupied:  156, products:  28 },
];

export const SAMPLE_ADJUSTMENTS: StockAdjustment[] = [
  { date: '28 mai 2026', product: 'Beurre de karité brut · 250g',   sku: 'KAR-220', delta: +24, reason: 'Réception fournisseur', author: 'K. Diallo' },
  { date: '27 mai 2026', product: 'Pagne wax — Indigo Royal',        sku: 'PWX-001', delta:  -5, reason: 'Casse / détérioré',     author: 'A. Mensah' },
  { date: '26 mai 2026', product: 'Savon noir africain · 200g',      sku: 'SAV-118', delta: +80, reason: 'Réception fournisseur', author: 'K. Diallo' },
  { date: '25 mai 2026', product: 'Bissap séché premium · 500g',     sku: 'BSP-500', delta: -10, reason: 'Ajustement inventaire', author: 'M. Koné'   },
  { date: '24 mai 2026', product: 'Café Robusta torréfié · 450g',    sku: 'CFE-450', delta: +40, reason: 'Réception fournisseur', author: 'K. Diallo' },
  { date: '23 mai 2026', product: 'Bogolan brodé — Édition Mopti',   sku: 'BGL-014', delta: +15, reason: 'Transfert entrepôt',    author: 'A. Mensah' },
];

export const SAMPLE_MOVEMENTS: StockMovement[] = [
  { date: '28 mai, 10h14', product: 'Beurre de karité · 250g',   sku: 'KAR-220', type: 'Entrée',     qty: +24, from: 'Karité Export Mali', to: 'Lomé Central'   },
  { date: '28 mai, 09h02', product: 'Kente royal — 6 yards',     sku: 'KTE-009', type: 'Sortie',     qty:  -2, from: 'Lomé Central',       to: 'Boutique'       },
  { date: '27 mai, 15h30', product: 'Pagne wax — Indigo Royal',  sku: 'PWX-001', type: 'Ajustement', qty:  -5, from: 'Lomé Central',       to: '—'              },
  { date: '27 mai, 11h48', product: 'Collier perles wax · doré', sku: 'BJL-307', type: 'Transfert',  qty:  +8, from: 'Lomé Nord',          to: 'Lomé Central'   },
  { date: '26 mai, 14h00', product: 'Savon noir africain · 200g',sku: 'SAV-118', type: 'Entrée',     qty: +80, from: 'Sahel Bio SARL',     to: 'Kara Entrepôt'  },
  { date: '25 mai, 09h15', product: 'Bissap séché · 500g',       sku: 'BSP-500', type: 'Ajustement', qty: -10, from: 'Lomé Nord',          to: '—'              },
];

export const SAMPLE_ALERTS: StockAlert[] = [
  { name: 'Stock critique Bissap', target: 'Bissap séché · 500g',       targetType: 'Produit',   threshold: 10, channels: ['Email', 'WhatsApp'], active: true,  triggered: true  },
  { name: 'Stock bas Textile',     target: 'Textile',                    targetType: 'Catégorie', threshold: 15, channels: ['Email'],             active: true,  triggered: false },
  { name: 'Rupture Savon noir',    target: 'Savon noir africain · 200g', targetType: 'Produit',   threshold:  5, channels: ['SMS', 'WhatsApp'],   active: true,  triggered: true  },
  { name: 'Stock bas Bogolan',     target: 'Bogolan brodé · Mopti',      targetType: 'Produit',   threshold: 10, channels: ['Email'],             active: false, triggered: false },
  { name: 'Alerte Cosmétiques',    target: 'Cosmétique',                 targetType: 'Catégorie', threshold: 20, channels: ['Email', 'SMS'],      active: true,  triggered: false },
  { name: 'Alerte Accessoires',    target: 'Accessoires',                targetType: 'Catégorie', threshold: 10, channels: ['Email'],             active: true,  triggered: true  },
  { name: 'Kente stock critique',  target: 'Kente royal — 6 yards',      targetType: 'Produit',   threshold:  5, channels: ['WhatsApp'],          active: true,  triggered: false },
];

export const SAMPLE_BRANDS: Brand[] = [
  { name: 'Maison Diallo',  init: 'MD', color: '#1F3D6E', products: 78, revenue: 1240000, margin: 51, country: 'Sénégal',       status: 'Actif' },
  { name: 'Studio Wax',     init: 'SW', color: '#3A2F25', products: 34, revenue: 890000,  margin: 42, country: "Côte d'Ivoire", status: 'Actif' },
  { name: 'Karité Pure',    init: 'KP', color: '#C8962A', products: 28, revenue: 345000,  margin: 58, country: 'Burkina Faso',  status: 'Actif' },
  { name: 'Atelier Bamako', init: 'AB', color: '#7A2C3A', products: 22, revenue: 420000,  margin: 38, country: 'Mali',          status: 'Actif' },
  { name: 'Ashanti Crafts', init: 'AC', color: '#D4A437', products: 19, revenue: 680000,  margin: 35, country: 'Ghana',         status: 'Actif' },
  { name: 'Dakar Roots',    init: 'DR', color: '#2D6A4F', products: 14, revenue: 178000,  margin: 46, country: 'Sénégal',       status: 'Inactif' },
  { name: 'Kente House',    init: 'KH', color: '#B8501A', products: 11, revenue: 295000,  margin: 44, country: 'Ghana',         status: 'Actif' },
  { name: 'Savane Bio',     init: 'SB', color: '#5C4A88', products:  8, revenue: 92000,   margin: 62, country: 'Togo',          status: 'Actif' },
];
