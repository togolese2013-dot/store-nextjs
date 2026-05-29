'use client';

import React, { useMemo, useState } from 'react';
import type {
  Product, Category, Brand, KpiCard, TabSpec,
  Variant, Supplier, PurchaseOrder, Warehouse,
  StockAdjustment, StockMovement, StockAlert,
} from './types';
import {
  SAMPLE_PRODUCTS, SAMPLE_KPIS, SAMPLE_CATEGORIES,
  SAMPLE_BRANDS, DEFAULT_TABS,
  SAMPLE_VARIANTS, SAMPLE_SUPPLIERS, SAMPLE_PURCHASE_ORDERS,
  SAMPLE_WAREHOUSES, SAMPLE_ADJUSTMENTS, SAMPLE_MOVEMENTS, SAMPLE_ALERTS,
} from './sample-data';
import Sidebar, { DEFAULT_NAV_GROUPS } from './Sidebar';
import KpiStrip from './KpiStrip';
import ProductTable from './ProductTable';
import OverviewPage from './OverviewPage';
import CategoriesPage from './CategoriesPage';
import BrandsPage from './BrandsPage';
import VariantesPage from './VariantesPage';
import FournisseursPage from './FournisseursPage';
import BonsAchatPage from './BonsAchatPage';
import EntrepotsPage from './EntrepotsPage';
import AjustementsPage from './AjustementsPage';
import MouvementsPage from './MouvementsPage';
import AlertesPage from './AlertesPage';
import {
  SearchIcon, BellIcon, ChevLeftIcon,
  DownloadIcon, UploadIcon, SparklesIcon, PlusIcon,
  FilterIcon, ChevDownIcon,
} from './icons';
import styles from './Magasin.module.css';

/* ─── Types ─────────────────────────────────────────────────────── */
export type PageId =
  | 'overview' | 'products' | 'categories' | 'brands' | 'variantes'
  | 'fournisseurs' | 'bons-achat' | 'entrepots'
  | 'ajustements' | 'mouvements' | 'alertes';

const PAGE_LABELS: Record<PageId, string> = {
  overview:     "Vue d'ensemble",
  products:     'Produits',
  categories:   'Catégories',
  brands:       'Marques',
  variantes:    'Variantes',
  fournisseurs: 'Fournisseurs',
  'bons-achat': "Bons d'achat",
  entrepots:    'Entrepôts',
  ajustements:  'Ajustements',
  mouvements:   'Mouvements',
  alertes:      'Alertes stock',
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview:     'Rechercher…',
  products:     'Rechercher un produit, SKU, marque…',
  categories:   'Rechercher une catégorie…',
  brands:       'Rechercher une marque, pays…',
  variantes:    'Rechercher un groupe de variantes…',
  fournisseurs: 'Rechercher un fournisseur, pays…',
  'bons-achat': 'Rechercher une référence, fournisseur…',
  entrepots:    'Rechercher un entrepôt, ville…',
  ajustements:  'Rechercher un produit, SKU…',
  mouvements:   'Rechercher un produit, type…',
  alertes:      'Rechercher une règle, produit…',
};

const NAV_TO_PAGE: Partial<Record<string, PageId>> = {
  overview:          'overview',
  products:          'products',
  categories:        'categories',
  brands:            'brands',
  variants:          'variantes',
  suppliers:         'fournisseurs',
  'purchase-orders': 'bons-achat',
  warehouses:        'entrepots',
  adjustments:       'ajustements',
  movements:         'mouvements',
  alerts:            'alertes',
};

/** Reverse map — PageId → nav item id (for Sidebar activeId prop) */
const PAGE_TO_NAV: Record<PageId, string> = {
  overview:     'overview',
  products:     'products',
  categories:   'categories',
  brands:       'brands',
  variantes:    'variants',
  fournisseurs: 'suppliers',
  'bons-achat': 'purchase-orders',
  entrepots:    'warehouses',
  ajustements:  'adjustments',
  mouvements:   'movements',
  alertes:      'alerts',
};

/* ─── Props ─────────────────────────────────────────────────────── */
export interface MagasinShellProps {
  defaultPage?: PageId;

  products?:    Product[];
  categories?:  Category[];
  brands?:      Brand[];
  kpis?:        KpiCard[];
  tabs?:        TabSpec[];
  variants?:    Variant[];
  suppliers?:   Supplier[];
  orders?:      PurchaseOrder[];
  warehouses?:  Warehouse[];
  adjustments?: StockAdjustment[];
  movements?:   StockMovement[];
  alerts?:      StockAlert[];

  searchQuery?: string;
  onSearch?:    (q: string) => void;

  onSwitchWorkspace?: () => void;
  onCreateProduct?:   () => void;

  onEdit?:    (p: Product) => void;
  onDelete?:  (p: Product) => void;
  onArchive?: (p: Product) => void;

  totalCount?:   number;
  page?:         number;
  pageSize?:     number;
  onPageChange?: (p: number) => void;

  onExport?: () => void;

  userName?: string;
  userRole?: string;
}

/* ─── Shell ─────────────────────────────────────────────────────── */
export default function MagasinShell({
  defaultPage  = 'overview',
  products     = SAMPLE_PRODUCTS,
  categories   = SAMPLE_CATEGORIES,
  brands       = SAMPLE_BRANDS,
  kpis         = SAMPLE_KPIS,
  tabs         = DEFAULT_TABS,
  variants     = SAMPLE_VARIANTS,
  suppliers    = SAMPLE_SUPPLIERS,
  orders       = SAMPLE_PURCHASE_ORDERS,
  warehouses   = SAMPLE_WAREHOUSES,
  adjustments  = SAMPLE_ADJUSTMENTS,
  movements    = SAMPLE_MOVEMENTS,
  alerts       = SAMPLE_ALERTS,
  searchQuery,
  onSearch,
  onSwitchWorkspace,
  onCreateProduct,
  onEdit,
  onDelete,
  onArchive,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onExport,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
}: MagasinShellProps) {
  const [activePage, setActivePage] = useState<PageId>(defaultPage);

  const navId = PAGE_TO_NAV[activePage];

  const groups = useMemo(() =>
    DEFAULT_NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.map(it => ({ ...it, active: it.id === navId })),
    })),
    [navId],
  );

  return (
    <div className={styles.page}>
      <Sidebar
        groups={groups}
        onSwitchWorkspace={onSwitchWorkspace}
        onNav={id => { const p = NAV_TO_PAGE[id]; if (p) setActivePage(p); }}
        activeId={navId}
        userName={userName}
        userRole={userRole}
      />

      <main className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button type="button" className={styles.iconBtn} onClick={onSwitchWorkspace} aria-label="Retour aux espaces">
            <ChevLeftIcon size={16} />
          </button>
          <div className={styles.crumbs}>
            <span>Maison Diallo</span>
            <span className={styles.sep}>/</span>
            <span>Magasin</span>
            {activePage !== 'overview' && (
              <>
                <span className={styles.sep}>/</span>
                <span className={styles.here}>{PAGE_LABELS[activePage]}</span>
              </>
            )}
          </div>
          <div className={styles.search}>
            <SearchIcon size={14} />
            <input
              placeholder={SEARCH_PLACEHOLDERS[activePage]}
              value={activePage === 'products' ? (searchQuery ?? '') : undefined}
              onChange={activePage === 'products' ? e => onSearch?.(e.target.value) : undefined}
            />
            <span className={styles.kbd}>⌘K</span>
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications">
            <BellIcon size={16} />
            <span className={styles.pip} />
          </button>
        </header>

        {/* Page routing */}
        {activePage === 'overview'     && (
          <OverviewPage products={products} categories={categories} kpis={kpis} onCreateProduct={onCreateProduct} />
        )}
        {activePage === 'products'     && (
          <ProductsContent
            products={products} kpis={kpis} tabs={tabs}
            onCreateProduct={onCreateProduct}
            onEdit={onEdit} onDelete={onDelete} onArchive={onArchive}
            totalCount={totalCount} page={page} pageSize={pageSize}
            onPageChange={onPageChange} onExport={onExport}
          />
        )}
        {activePage === 'categories'   && <CategoriesPage categories={categories} />}
        {activePage === 'brands'       && <BrandsPage brands={brands} />}
        {activePage === 'variantes'    && <VariantesPage variants={variants} />}
        {activePage === 'fournisseurs' && <FournisseursPage suppliers={suppliers} />}
        {activePage === 'bons-achat'   && <BonsAchatPage orders={orders} />}
        {activePage === 'entrepots'    && <EntrepotsPage warehouses={warehouses} />}
        {activePage === 'ajustements'  && <AjustementsPage adjustments={adjustments} />}
        {activePage === 'mouvements'   && <MouvementsPage movements={movements} />}
        {activePage === 'alertes'      && <AlertesPage alerts={alerts} />}
      </main>
    </div>
  );
}

/* ─── ProductsContent ───────────────────────────────────────────── */
interface ProductsContentProps {
  products:       Product[];
  kpis:           KpiCard[];
  tabs:           TabSpec[];
  onCreateProduct?: () => void;
  onEdit?:        (p: Product) => void;
  onDelete?:      (p: Product) => void;
  onArchive?:     (p: Product) => void;
  totalCount?:    number;
  page?:          number;
  pageSize?:      number;
  onPageChange?:  (p: number) => void;
  onExport?:      () => void;
}

function ProductsContent({
  products, kpis, tabs,
  onCreateProduct, onEdit, onDelete, onArchive,
  totalCount, page, pageSize, onPageChange, onExport,
}: ProductsContentProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? 'all');
  const [view, setView]           = useState<'table' | 'grid'>('table');
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    switch (activeTab) {
      case 'active':   return products.filter(p => p.status === 'Actif');
      case 'draft':    return products.filter(p => p.status === 'Brouillon');
      case 'low':      return products.filter(p => p.target > 0 && p.stock / p.target < 0.4);
      case 'archived': return products.filter(p => p.status === 'Archivé');
      default:         return products;
    }
  }, [activeTab, products]);

  const toggle = (sku: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n; });
  const toggleAll = () =>
    setSelected(prev => prev.size === visible.length ? new Set() : new Set(visible.map(p => p.sku)));

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Produits</div>
          <h1 className={styles.title}>
            Catalogue <span className={styles.serif}>produits</span>
          </h1>
          <p className={styles.subtitle}>
            {totalCount ?? products.length} produits actifs · dernier import il y a 2 h
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={onExport}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={styles.btn}><UploadIcon size={14} /> Importer</button>
          <button type="button" className={styles.btn}><SparklesIcon size={14} /> Suggestions IA</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onCreateProduct}>
            <PlusIcon size={14} /> Nouveau produit
          </button>
        </div>
      </div>

      <KpiStrip kpis={kpis} />

      <div className={styles.tabsRow}>
        {tabs.map(t => (
          <button
            key={t.id} type="button"
            className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
            onClick={() => { setActiveTab(t.id); setSelected(new Set()); }}
          >
            {t.label}
            <span className={`${styles.pill} ${t.warn ? styles.warn : ''}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.chip}><FilterIcon size={12} /> Filtres</button>
        <button type="button" className={styles.chip}>Catégorie : Tous <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Marque : Tous <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Stock <ChevDownIcon size={10} /></button>
        <button type="button" className={`${styles.chip} ${styles.add}`}>+ Ajouter un filtre</button>
        <div className={styles.viewSwitch}>
          <button type="button" className={view === 'table' ? styles.on : ''} onClick={() => setView('table')}>Tableau</button>
          <button type="button" className={view === 'grid'  ? styles.on : ''} onClick={() => setView('grid')}>Grille</button>
        </div>
      </div>

      <ProductTable
        products={visible}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </>
  );
}
