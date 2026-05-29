/**
 * Magasin — Products page
 * Layout shell: sidebar + topbar + dynamic content area.
 * Pass `section` to switch between product list and sub-views.
 */
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { Product, KpiCard, TabSpec } from './types';
import { SAMPLE_PRODUCTS, SAMPLE_KPIS, DEFAULT_TABS } from './sample-data';
import {
  SearchIcon, BellIcon, PlusIcon, FilterIcon, ChevDownIcon,
  ChevLeftIcon, UploadIcon, DownloadIcon, SparklesIcon,
} from './icons';
import Sidebar from './Sidebar';
import KpiStrip from './KpiStrip';
import ProductTable from './ProductTable';
import styles from './Magasin.module.css';

export interface MagasinPageProps {
  products?: Product[];
  kpis?: KpiCard[];
  tabs?: TabSpec[];
  section?: string;
  searchQuery?: string;
  onSearch?: (q: string) => void;
  onSection?: (id: string) => void;
  onExport?: () => void;
  onCreateProduct?: () => void;
  onSwitchWorkspace?: () => void;
  onEdit?: (p: Product) => void;
  onDelete?: (p: Product) => void;
  onArchive?: (p: Product) => void;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  subView?: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export default function MagasinPage({
  products = SAMPLE_PRODUCTS,
  kpis = SAMPLE_KPIS,
  tabs = DEFAULT_TABS,
  section = 'products',
  searchQuery = '',
  onSearch,
  onSection,
  onExport,
  onCreateProduct,
  onSwitchWorkspace,
  onEdit,
  onDelete,
  onArchive,
  totalCount,
  page = 1,
  pageSize = 20,
  onPageChange,
  subView,
  userName = 'Admin',
  userRole = 'Propriétaire',
}: MagasinPageProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? 'all');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset tab when tabs change (section switch)
  useEffect(() => {
    setActiveTab(tabs[0]?.id ?? 'all');
  }, [tabs]);

  // ⌘K hook
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        (document.querySelector(`.${styles.search} input`) as HTMLInputElement)?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleProducts = useMemo(() => {
    switch (activeTab) {
      case 'active':   return products.filter(p => p.status === 'Actif');
      case 'draft':    return products.filter(p => p.status === 'Brouillon');
      case 'low':      return products.filter(p => p.target > 0 && p.stock / p.target < 0.4);
      case 'archived': return products.filter(p => p.status === 'Archivé');
      case 'alerts':   return products.filter(p => p.stock === 0 || (p.target > 0 && p.stock / p.target < 0.15));
      default:         return products;
    }
  }, [activeTab, products]);

  const toggle = (sku: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(prev =>
      prev.size === visibleProducts.length
        ? new Set()
        : new Set(visibleProducts.map(p => p.sku))
    );
  };

  const isProductSection = section === 'products' || section === 'alerts';

  // Section label for breadcrumb
  const sectionLabel: Record<string, string> = {
    products:    'Produits',
    categories:  'Catégories',
    brands:      'Marques',
    variants:    'Variantes',
    movements:   'Mouvements',
    adjustments: 'Ajustements',
    alerts:      'Alertes stock',
    overview:    'Vue d\'ensemble',
    settings:    'Réglages',
  };

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <Sidebar
        onSwitchWorkspace={onSwitchWorkspace}
        onNav={onSection}
        activeId={section}
        userName={userName}
        userRole={userRole}
      />

      {/* Main */}
      <main className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onSwitchWorkspace}
            aria-label="Retour aux espaces"
          >
            <ChevLeftIcon size={16} />
          </button>
          <div className={styles.crumbs}>
            <span>Magasin</span>
            <span className={styles.sep}>/</span>
            <span className={styles.here}>{sectionLabel[section] ?? section}</span>
          </div>
          <div className={styles.search}>
            <SearchIcon size={14} />
            <input
              placeholder={isProductSection ? 'Rechercher un produit, SKU, marque…' : 'Rechercher…'}
              value={searchQuery}
              onChange={e => onSearch?.(e.target.value)}
            />
            <span className={styles.kbd}>⌘K</span>
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications">
            <BellIcon size={16} />
            <span className={styles.pip} />
          </button>
        </header>

        {/* ─── Products section ─── */}
        {isProductSection && (
          <>
            {/* Page header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.eyebrow}>Magasin · Produits</div>
                <h1 className={styles.title}>
                  Catalogue <span className={styles.serif}>produits</span>
                </h1>
                <p className={styles.subtitle}>
                  {totalCount ?? products.length} produits
                  {products.filter(p => p.stock === 0).length > 0
                    ? ` · ${products.filter(p => p.stock === 0).length} en rupture`
                    : ''}
                </p>
              </div>
              <div className={styles.headerActions}>
                <button type="button" className={styles.btn} onClick={onExport}>
                  <DownloadIcon size={14} /> Exporter CSV
                </button>
                <button type="button" className={styles.btn}>
                  <UploadIcon size={14} /> Importer
                </button>
                <button type="button" className={styles.btn}>
                  <SparklesIcon size={14} /> Suggestions IA
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.primary}`}
                  onClick={onCreateProduct}
                >
                  <PlusIcon size={14} /> Nouveau produit
                </button>
              </div>
            </div>

            {/* KPIs */}
            <KpiStrip kpis={kpis} />

            {/* Tabs */}
            <div className={styles.tabsRow}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
                  onClick={() => { setActiveTab(t.id); setSelected(new Set()); }}
                >
                  {t.label}
                  <span className={`${styles.pill} ${t.warn ? styles.warn : ''}`}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <button type="button" className={styles.chip}><FilterIcon size={12} /> Filtres</button>
              <button type="button" className={styles.chip}>Catégorie : Tous <ChevDownIcon size={10} /></button>
              <button type="button" className={styles.chip}>Marque : Tous <ChevDownIcon size={10} /></button>
              <button type="button" className={styles.chip}>Stock <ChevDownIcon size={10} /></button>
              <button type="button" className={`${styles.chip} ${styles.add}`}>+ Ajouter un filtre</button>
              <div className={styles.viewSwitch}>
                <button className={view === 'table' ? styles.on : ''} onClick={() => setView('table')}>Tableau</button>
                <button className={view === 'grid' ? styles.on : ''} onClick={() => setView('grid')}>Grille</button>
              </div>
            </div>

            {/* Table */}
            <ProductTable
              products={visibleProducts}
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
        )}

        {/* ─── Sub-views (categories, brands, movements, etc.) ─── */}
        {!isProductSection && subView}
      </main>
    </div>
  );
}
