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
import AchatsPage from './AchatsPage';
import EntrepotsPage from './EntrepotsPage';
import AjustementsPage from './AjustementsPage';
import MouvementsPage from './MouvementsPage';
import AlertesPage from './AlertesPage';
import ReglagesPage from './ReglagesPage';
import ProductForm from '@/components/admin/ProductForm';
import {
  SearchIcon, BellIcon, ChevLeftIcon,
  DownloadIcon, UploadIcon, SparklesIcon, PlusIcon,
  FilterIcon, ChevDownIcon,
} from './icons';
import { useUI } from '@/components/interaction-layer';
import styles from './Magasin.module.css';

/* ─── Types ─────────────────────────────────────────────────────── */
export type PageId =
  | 'overview' | 'products' | 'categories' | 'brands' | 'variantes'
  | 'fournisseurs' | 'achats' | 'entrepots'
  | 'ajustements' | 'mouvements' | 'alertes'
  | 'reglages';

const PAGE_LABELS: Record<PageId, string> = {
  overview:     "Vue d'ensemble",
  products:     'Produits',
  categories:   'Catégories',
  brands:       'Marques',
  variantes:    'Variantes',
  fournisseurs: 'Fournisseurs',
  achats:       'Achats',
  entrepots:    'Entrepôts',
  ajustements:  'Ajustements',
  mouvements:   'Mouvements',
  alertes:      'Alertes stock',
  reglages:     'Réglages',
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview:     'Rechercher…',
  products:     'Rechercher un produit, SKU, marque…',
  categories:   'Rechercher une catégorie…',
  brands:       'Rechercher une marque, pays…',
  variantes:    'Rechercher un groupe de variantes…',
  fournisseurs: 'Rechercher un fournisseur, pays…',
  achats:       'Rechercher une référence, fournisseur…',
  entrepots:    'Rechercher un entrepôt, ville…',
  ajustements:  'Rechercher un produit, SKU…',
  mouvements:   'Rechercher un produit, type…',
  alertes:      'Rechercher une règle, produit…',
  reglages:     'Rechercher dans les réglages…',
};

const NAV_TO_PAGE: Partial<Record<string, PageId>> = {
  overview:    'overview',
  products:    'products',
  categories:  'categories',
  brands:      'brands',
  variants:    'variantes',
  suppliers:   'fournisseurs',
  achats:      'achats',
  warehouses:  'entrepots',
  adjustments: 'ajustements',
  movements:   'mouvements',
  alerts:      'alertes',
  settings:    'reglages',
};

/** Reverse map — PageId → nav item id (for Sidebar activeId prop) */
const PAGE_TO_NAV: Record<PageId, string> = {
  overview:     'overview',
  products:     'products',
  categories:   'categories',
  brands:       'brands',
  variantes:    'variants',
  fournisseurs: 'suppliers',
  achats:       'achats',
  entrepots:    'warehouses',
  ajustements:  'adjustments',
  mouvements:   'movements',
  alertes:      'alerts',
  reglages:     'settings',
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
  onActivePageChange?: (p: PageId) => void;

  onDelete?:  (p: Product) => void;
  onArchive?: (p: Product) => void;

  totalCount?:   number;
  page?:         number;
  pageSize?:     number;
  onPageChange?: (p: number) => void;

  onExport?: () => void;

  userName?: string;
  userRole?: string;
  shopName?: string;
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
  onDelete,
  onArchive,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onExport,
  onActivePageChange,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
  shopName = 'Ma boutique',
}: MagasinShellProps) {
  const ui = useUI();
  const [activePage,    setActivePage]    = useState<PageId>(defaultPage);
  const [productDrawer, setProductDrawer] = useState<{ open: boolean; productId?: number }>({ open: false });

  function navigate(p: PageId) {
    setActivePage(p);
    onActivePageChange?.(p);
  }

  function openProductForm(productId?: number) {
    setProductDrawer({ open: true, productId });
  }

  function closeProductForm() {
    setProductDrawer({ open: false });
  }

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
        onNav={id => { const p = NAV_TO_PAGE[id]; if (p) navigate(p); }}
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
            <span>{shopName}</span>
            <span className={styles.sep}>/</span>
            <span>Magasin</span>
            {activePage !== 'overview' && (
              <>
                <span className={styles.sep}>/</span>
                <span className={styles.here}>{PAGE_LABELS[activePage]}</span>
              </>
            )}
          </div>
          <div className={styles.search} onClick={() => ui.openPalette()} style={{ cursor: 'pointer' }}>
            <SearchIcon size={14} />
            <input
              placeholder={SEARCH_PLACEHOLDERS[activePage]}
              value={activePage === 'products' ? (searchQuery ?? '') : undefined}
              onChange={activePage === 'products' ? e => onSearch?.(e.target.value) : undefined}
            />
            <span className={styles.kbd}>⌘K</span>
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications" onClick={(e) => ui.notifications(e)}>
            <BellIcon size={16} />
            <span className={styles.pip} />
          </button>
        </header>

        {/* Page routing */}
        {activePage === 'overview'     && (
          <OverviewPage products={products} categories={categories} kpis={kpis}
            onCreateProduct={() => openProductForm()} />
        )}
        {activePage === 'products'     && (
          <ProductsContent
            products={products} categories={categories} brands={brands} kpis={kpis} tabs={tabs}
            onCreateProduct={() => openProductForm()}
            onEditProduct={(id) => openProductForm(id)}
            onDelete={onDelete} onArchive={onArchive}
            totalCount={totalCount} page={page} pageSize={pageSize}
            onPageChange={onPageChange} onExport={onExport}
          />
        )}
        {activePage === 'categories'   && <CategoriesPage categories={categories} />}
        {activePage === 'brands'       && <BrandsPage brands={brands} />}
        {activePage === 'variantes'    && <VariantesPage variants={variants} />}
        {activePage === 'fournisseurs' && <FournisseursPage suppliers={suppliers} />}
        {activePage === 'achats'       && <AchatsPage orders={orders} />}
        {activePage === 'entrepots'    && <EntrepotsPage warehouses={warehouses} />}
        {activePage === 'ajustements'  && <AjustementsPage adjustments={adjustments} />}
        {activePage === 'mouvements'   && <MouvementsPage movements={movements} />}
        {activePage === 'alertes'      && <AlertesPage alerts={alerts} />}
        {activePage === 'reglages'     && <ReglagesPage />}
      </main>

      {/* ── Product Form Drawer ── */}
      {productDrawer.open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,14,.45)', zIndex: 50 }}
            onClick={closeProductForm}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100vh',
            width: 'min(680px, 96vw)',
            background: 'var(--bg, #fff)',
            boxShadow: '-24px 0 60px rgba(20,17,14,.18)',
            zIndex: 51, overflowY: 'auto',
            animation: 'ux-slide .28s cubic-bezier(.32,.72,0,1)',
          }}>
            <ProductForm
              key={productDrawer.productId ?? 'new'}
              categories={categories.map(c => ({ id: Number(c.id), nom: c.name, description: null }))}
              initial={productDrawer.productId ? { id: productDrawer.productId } : undefined}
              onBack={closeProductForm}
              onSuccess={() => { closeProductForm(); onActivePageChange?.(activePage); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── ProductsContent ───────────────────────────────────────────── */
interface ProductsContentProps {
  products:         Product[];
  categories:       Category[];
  brands:           Brand[];
  kpis:             KpiCard[];
  tabs:             TabSpec[];
  onCreateProduct?: () => void;
  onEditProduct?:   (id: number) => void;
  onDelete?:        (p: Product) => void;
  onArchive?:       (p: Product) => void;
  totalCount?:    number;
  page?:          number;
  pageSize?:      number;
  onPageChange?:  (p: number) => void;
  onExport?:      () => void;
}

function ProductsContent({
  products, categories, brands, kpis, tabs,
  onCreateProduct, onEditProduct, onDelete, onArchive,
  totalCount, page, pageSize, onPageChange, onExport,
}: ProductsContentProps) {
  const ui = useUI();
  const [activeTab,   setActiveTab]   = useState<string>(tabs[0]?.id ?? 'all');
  const [view,        setView]        = useState<'table' | 'grid'>('table');
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [catFilter,   setCatFilter]   = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');

  const visible = useMemo(() => {
    let list = products;
    // Tab filter
    switch (activeTab) {
      case 'active':   list = list.filter(p => p.status === 'Actif'); break;
      case 'draft':    list = list.filter(p => p.status === 'Brouillon'); break;
      case 'low':      list = list.filter(p => p.target > 0 && p.stock / p.target < 0.4); break;
      case 'archived': list = list.filter(p => p.status === 'Archivé'); break;
    }
    // Dropdown filters
    if (catFilter)   list = list.filter(p => p.cat === catFilter);
    if (brandFilter) list = list.filter(p => p.brand === brandFilter);
    if (stockFilter === 'rupture') list = list.filter(p => p.stock === 0);
    if (stockFilter === 'bas')     list = list.filter(p => p.stock > 0 && p.target > 0 && p.stock / p.target < 0.4);
    if (stockFilter === 'ok')      list = list.filter(p => p.stock > 0 && !(p.target > 0 && p.stock / p.target < 0.4));
    return list;
  }, [activeTab, products, catFilter, brandFilter, stockFilter]);

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
            {totalCount ?? products.length} produit{(totalCount ?? products.length) !== 1 ? 's' : ''}
            {products.filter(p => p.stock === 0).length > 0
              ? ` · ${products.filter(p => p.stock === 0).length} en rupture`
              : ''}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={onExport}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={styles.btn} onClick={() => ui.openImport('Produits')}><UploadIcon size={14} /> Importer</button>
          <button type="button" className={styles.btn} onClick={() => ui.openAI()}><SparklesIcon size={14} /> Suggestions IA</button>
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
        <button type="button" className={styles.chip} onClick={() => { setCatFilter(''); setBrandFilter(''); setStockFilter(''); }}>
          <FilterIcon size={12} /> Filtres{(catFilter || brandFilter || stockFilter) ? ' ×' : ''}
        </button>
        <button type="button" className={`${styles.chip} ${catFilter ? styles.active : ''}`}
          onClick={e => ui.menu(e, [
            { label: 'Toutes les catégories', onClick: () => setCatFilter('') },
            ...categories.map(c => ({ label: c.name, onClick: () => setCatFilter(catFilter === c.name ? '' : c.name) })),
          ])}>
          Catégorie : {catFilter || 'Tous'} <ChevDownIcon size={10} />
        </button>
        <button type="button" className={`${styles.chip} ${brandFilter ? styles.active : ''}`}
          onClick={e => ui.menu(e, [
            { label: 'Toutes les marques', onClick: () => setBrandFilter('') },
            ...brands.map(b => ({ label: b.name, onClick: () => setBrandFilter(brandFilter === b.name ? '' : b.name) })),
          ])}>
          Marque : {brandFilter || 'Tous'} <ChevDownIcon size={10} />
        </button>
        <button type="button" className={`${styles.chip} ${stockFilter ? styles.active : ''}`}
          onClick={e => ui.menu(e, [
            { label: 'Tous les niveaux', onClick: () => setStockFilter('') },
            { label: 'En stock', onClick: () => setStockFilter('ok') },
            { label: 'Stock bas', onClick: () => setStockFilter('bas') },
            { label: 'Rupture', onClick: () => setStockFilter('rupture') },
          ])}>
          Stock{stockFilter ? ` : ${stockFilter === 'ok' ? 'En stock' : stockFilter === 'bas' ? 'Stock bas' : 'Rupture'}` : ''} <ChevDownIcon size={10} />
        </button>
        <button type="button" className={`${styles.chip} ${styles.add}`} onClick={() => { setCatFilter(''); setBrandFilter(''); setStockFilter(''); }}>
          {(catFilter || brandFilter || stockFilter) ? '× Réinitialiser' : '+ Ajouter un filtre'}
        </button>
        <div className={styles.viewSwitch}>
          <button type="button" className={view === 'table' ? styles.on : ''} onClick={() => setView('table')}>Tableau</button>
          <button type="button" className={view === 'grid'  ? styles.on : ''} onClick={() => setView('grid')}>Grille</button>
        </div>
      </div>

      <ProductTable
        products={visible}
        view={view}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onEdit={onEditProduct}
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
