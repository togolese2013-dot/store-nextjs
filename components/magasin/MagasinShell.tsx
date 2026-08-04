'use client';

import React, { useMemo, useState } from 'react';
import type {
  Product, Category, Brand, KpiCard, TabSpec,
  Variant, Supplier, PurchaseOrder,
  StockMovement,
} from './types';
import {
  SAMPLE_PRODUCTS, SAMPLE_KPIS, SAMPLE_CATEGORIES,
  SAMPLE_BRANDS, DEFAULT_TABS,
  SAMPLE_VARIANTS, SAMPLE_SUPPLIERS, SAMPLE_PURCHASE_ORDERS,
  SAMPLE_MOVEMENTS,
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
import MouvementsPage from './MouvementsPage';
import ImportProductsModal from './ImportProductsModal';
import {
  SearchIcon, BellIcon, ChevLeftIcon,
  DownloadIcon, UploadIcon, SparklesIcon, PlusIcon,
  FilterIcon, ChevDownIcon,
} from './icons';
import { useUI, Icons } from '@/components/interaction-layer';
import { TransferBanner, PendingBadge } from './TransferBanner';
import type { Forecast } from './forecast';
import { URGENCE_STYLE } from './forecast';
import { injectKeyframes } from './drawerUtils';
import styles from './Magasin.module.css';

/* ─── Types ─────────────────────────────────────────────────────── */
export type PageId =
  | 'overview' | 'products' | 'categories' | 'brands' | 'variantes'
  | 'fournisseurs' | 'achats'
  | 'mouvements';

const PAGE_LABELS: Record<PageId, string> = {
  overview:     "Vue d'ensemble",
  products:     'Produits',
  categories:   'Catégories',
  brands:       'Marques',
  variantes:    'Variantes',
  fournisseurs: 'Fournisseurs',
  achats:       'Achats',
  mouvements:   'Mouvements',
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview:     'Rechercher…',
  products:     'Rechercher un produit, SKU, marque…',
  categories:   'Rechercher une catégorie…',
  brands:       'Rechercher une marque, pays…',
  variantes:    'Rechercher un groupe de variantes…',
  fournisseurs: 'Rechercher un fournisseur, pays…',
  achats:       'Rechercher une référence, fournisseur…',
  mouvements:   'Rechercher un produit, type…',
};

const NAV_TO_PAGE: Partial<Record<string, PageId>> = {
  overview:    'overview',
  products:    'products',
  categories:  'categories',
  brands:      'brands',
  variants:    'variantes',
  suppliers:   'fournisseurs',
  achats:      'achats',
  movements:   'mouvements',
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
  mouvements:   'movements',
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
  movements?:   StockMovement[];

  searchQuery?: string;
  onSearch?:    (q: string) => void;

  onSwitchWorkspace?: () => void;
  onCreateProduct?:   () => void;
  onActivePageChange?: (p: PageId) => void;
  onStockChange?: () => void;

  onDelete?:  (p: Product) => void;
  onArchive?: (p: Product) => void;

  totalCount?:   number;
  page?:         number;
  pageSize?:     number;
  onPageChange?: (p: number) => void;

  onExport?: () => void;
  formatPrice?: (n: number) => string;

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
  movements    = SAMPLE_MOVEMENTS,
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
  formatPrice,
  onActivePageChange,
  onStockChange,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
  shopName = 'Ma boutique',
}: MagasinShellProps) {
  const ui = useUI();
  const [activePage, setActivePage] = useState<PageId>(defaultPage);

  function navigate(p: PageId) {
    setActivePage(p);
    onActivePageChange?.(p);
  }

  const navId = PAGE_TO_NAV[activePage];

  const groups = useMemo(() =>
    DEFAULT_NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.map(it => ({
        ...it,
        active: it.id === navId,
        ...(it.id === 'products' ? { count: totalCount } : {}),
      })),
    })),
    [navId, totalCount],
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
            <PendingBadge pipClass={styles.pip} />
          </button>
        </header>

        <TransferBanner
          onApproved={r => ui.toast(`Transfert ${r.id} approuvé · mouvement créé (−${r.qty} ${r.product})`)}
          onRejected={r => ui.toast(`Demande ${r.id} refusée`)}
          confirmReject={r =>
            new Promise(resolve => {
              ui.confirm({
                tone: 'danger',
                title: 'Refuser la demande ?',
                sub: `La demande ${r.id} (${r.qty} × ${r.product}) sera refusée. Aucun mouvement ne sera créé.`,
                confirmLabel: 'Refuser',
                onConfirm: () => resolve(true),
              });
              // Promise stays pending if user clicks "Annuler" — correct behavior
            })
          }
        />

        {/* Page routing */}
        {activePage === 'overview'     && (
          <OverviewPage products={products} categories={categories} kpis={kpis}
            onCreateProduct={() => ui.openForm('product')} />
        )}
        {activePage === 'products'     && (
          <ProductsContent
            products={products} categories={categories} brands={brands} kpis={kpis} tabs={tabs}
            onCreateProduct={() => ui.openForm('product')}
            onDelete={onDelete} onArchive={onArchive}
            totalCount={totalCount} page={page} pageSize={pageSize}
            onPageChange={onPageChange} onExport={onExport} formatPrice={formatPrice}
            onStockChange={onStockChange}
          />
        )}
        {activePage === 'categories'   && <CategoriesPage categories={categories} />}
        {activePage === 'brands'       && <BrandsPage brands={brands} />}
        {activePage === 'variantes'    && <VariantesPage variants={variants} />}
        {activePage === 'fournisseurs' && <FournisseursPage suppliers={suppliers} />}
        {activePage === 'achats'       && <AchatsPage orders={orders} />}
        {activePage === 'mouvements'   && <MouvementsPage movements={movements} onStockChange={onStockChange} />}
      </main>
    </div>
  );
}

/* ─── Export CSV d'une sélection (client-side, mêmes colonnes que l'export complet) ─── */
function exportSelectionCsv(rows: Product[]) {
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['Référence', 'Nom', 'Catégorie', 'Marque', 'Prix', 'Stock magasin', 'Statut'];
  const lines = [headers.map(escape).join(',')];
  for (const p of rows) {
    lines.push([p.sku, p.name, p.cat, p.brand, p.price, p.stock, p.status].map(escape).join(','));
  }
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `produits-selection-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── ProductsContent ───────────────────────────────────────────── */
interface ProductsContentProps {
  products:         Product[];
  categories:       Category[];
  brands:           Brand[];
  kpis:             KpiCard[];
  tabs:             TabSpec[];
  onCreateProduct?: () => void;
  onDelete?:        (p: Product) => void;
  onArchive?:       (p: Product) => void;
  totalCount?:    number;
  page?:          number;
  pageSize?:      number;
  onPageChange?:  (p: number) => void;
  onExport?:      () => void;
  formatPrice?:   (n: number) => string;
  onStockChange?: () => void;
}

function ProductsContent({
  products, categories, brands, kpis, tabs,
  onCreateProduct, onDelete, onArchive, formatPrice,
  totalCount, page, pageSize, onPageChange, onExport, onStockChange,
}: ProductsContentProps) {
  injectKeyframes();
  const ui = useUI();
  const [activeTab,   setActiveTab]   = useState<string>(tabs[0]?.id ?? 'all');
  const [view,        setView]        = useState<'table' | 'grid'>('table');
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [catFilter,   setCatFilter]   = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [showImport,  setShowImport]  = useState(false);
  const [forecasts,       setForecasts]       = useState<Forecast[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError,   setForecastError]   = useState('');
  const [forecastMsg,     setForecastMsg]     = useState('');
  const [showForecast,    setShowForecast]    = useState(false);

  const loadForecast = async () => {
    setForecastLoading(true);
    setForecastError('');
    setForecastMsg('');
    setShowForecast(true);
    try {
      const res  = await fetch('/api/admin/ai/stock-forecast', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setForecastError(data.error ?? 'Erreur serveur'); return; }
      if (data.message) { setForecastMsg(data.message); setForecasts([]); return; }
      setForecasts(Array.isArray(data.forecasts) ? data.forecasts : []);
    } catch { setForecastError('Erreur réseau'); }
    finally { setForecastLoading(false); }
  };

  const visible = useMemo(() => {
    let list = products;
    // Tab filter
    switch (activeTab) {
      case 'active':   list = list.filter(p => p.status === 'Actif'); break;
      case 'draft':    list = list.filter(p => p.status === 'Brouillon'); break;
      case 'low':      list = list.filter(p => p.stock > 0 && p.target > 0 && p.stock / p.target < 0.4); break;
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
          <button type="button" className={styles.btn} onClick={() => setShowImport(true)}><UploadIcon size={14} /> Importer</button>
          <button type="button" className={styles.btn} onClick={() => ui.openAI()}><SparklesIcon size={14} /> Suggestions IA</button>
          <button type="button" className={styles.btn} onClick={loadForecast} disabled={forecastLoading}
            title="Analyse IA des prévisions de rupture de stock">
            <SparklesIcon size={14} /> {forecastLoading ? 'Analyse…' : 'Prévisions IA'}
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onCreateProduct}>
            <PlusIcon size={14} /> Nouveau produit
          </button>
        </div>
      </div>

      {showForecast && (
        <div style={{ margin: '16px 0 0', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SparklesIcon size={15} />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Prévisions IA — Risques de rupture</span>
            </div>
            <button className={styles.btn} style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setShowForecast(false)}>Fermer</button>
          </div>

          {forecastLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--bg-2)', opacity: 0.6 + i * 0.1,
                  backgroundImage: 'linear-gradient(90deg, var(--bg-2) 0%, var(--border) 50%, var(--bg-2) 100%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          )}

          {forecastError && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 9, fontSize: 13 }}>
              {forecastError}
            </div>
          )}

          {forecastMsg && (
            <div style={{ padding: '10px 14px', background: 'var(--ok-bg)', color: 'var(--ok)', borderRadius: 9, fontSize: 13, fontWeight: 500 }}>
              ✓ {forecastMsg}
            </div>
          )}

          {!forecastLoading && forecasts.length > 0 && (
            <div className={styles.tableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th style={{ textAlign: 'right' }}>Stock</th>
                      <th style={{ textAlign: 'right' }}>Ventes 30j</th>
                      <th style={{ textAlign: 'right' }}>Jours restants</th>
                      <th>Urgence</th>
                      <th>Recommandation</th>
                      <th style={{ textAlign: 'right' }}>Qté à commander</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((f, i) => {
                      const urg = URGENCE_STYLE[f.urgence] ?? URGENCE_STYLE.ok;
                      return (
                        <tr key={i}>
                          <td><div className={styles.productName}>{f.nom}</div></td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 600 }}>{f.stock}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13 }}>{f.ventes_30j}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 600, color: f.jours_restants !== null && f.jours_restants < 7 ? 'var(--danger)' : f.jours_restants !== null && f.jours_restants < 20 ? 'var(--warn)' : 'var(--ink)' }}>
                            {f.jours_restants !== null ? `${f.jours_restants}j` : '—'}
                          </td>
                          <td>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: urg.bg, color: urg.color }}>
                              {urg.label}
                            </span>
                          </td>
                          <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 200 }}>{f.recommandation}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                            {f.qte_a_commander > 0 ? `+${f.qte_a_commander}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <KpiStrip kpis={kpis} onKpiClick={(label) => {
        if (label === 'Stock bas') setStockFilter('bas');
        else if (label === 'Ruptures') setStockFilter('rupture');
      }} />

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
        <span className={styles.chip}>
          <FilterIcon size={12} /> Filtres{(catFilter || brandFilter || stockFilter) ? ' actifs' : ''}
        </span>
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
        {(catFilter || brandFilter || stockFilter) && (
          <button type="button" className={`${styles.chip} ${styles.add}`} onClick={() => { setCatFilter(''); setBrandFilter(''); setStockFilter(''); }}>
            × Réinitialiser
          </button>
        )}
        <div className={styles.viewSwitch}>
          <button type="button" className={view === 'table' ? styles.on : ''} onClick={() => setView('table')}>Tableau</button>
          <button type="button" className={view === 'grid'  ? styles.on : ''} onClick={() => setView('grid')}>Grille</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span>{selected.size} produit{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}</span>
          <div className={styles.bulkActions}>
            <button type="button" className={styles.btn}
              onClick={() => exportSelectionCsv(products.filter(p => selected.has(p.sku)))}>
              <DownloadIcon size={14} /> Exporter
            </button>
            <button type="button" className={styles.btn}
              onClick={() => {
                const items = products.filter(p => selected.has(p.sku));
                ui.confirm({
                  title: `Archiver ${items.length} produit${items.length > 1 ? 's' : ''} ?`,
                  sub: 'Ces produits seront déplacés vers les archives. Vous pourrez les restaurer.',
                  confirmLabel: 'Archiver',
                  onConfirm: () => {
                    items.forEach(p => ui.config.onArchiveRow?.('product', p));
                    setSelected(new Set());
                  },
                });
              }}>
              <Icons.archive size={14} /> Archiver
            </button>
            <button type="button" className={`${styles.btn} ${styles.danger}`}
              onClick={() => {
                const items = products.filter(p => selected.has(p.sku));
                ui.confirm({
                  tone: 'danger',
                  title: `Supprimer ${items.length} produit${items.length > 1 ? 's' : ''} ?`,
                  sub: 'Cette action est irréversible.',
                  confirmLabel: 'Supprimer',
                  onConfirm: () => {
                    items.forEach(p => ui.config.onDeleteRow?.('product', p));
                    setSelected(new Set());
                  },
                });
              }}>
              <Icons.trash size={14} /> Supprimer
            </button>
          </div>
        </div>
      )}

      <ProductTable
        products={visible}
        view={view}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onDelete={onDelete}
        onArchive={onArchive}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        formatPrice={formatPrice}
      />

      {showImport && (
        <ImportProductsModal
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); onStockChange?.(); }}
        />
      )}
    </>
  );
}
