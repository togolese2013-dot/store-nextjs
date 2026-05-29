'use client';

/**
 * MagasinDataLoader — full state manager for the Magasin workspace.
 * Handles: section routing, product fetch/search/pagination, row actions.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MagasinShell from './MagasinShell';
import type { Product as MagasinProduct, KpiCard, TabSpec } from './types';
import { SAMPLE_PRODUCTS, SAMPLE_KPIS, DEFAULT_TABS, ACCENT } from './sample-data';

/* ── Constants ── */
const PAGE_SIZE = 20;

const SWATCHES = [
  '#3B6A8F', '#2D6A4F', '#7A2C3A', '#D4A437', '#B8501A',
  '#5C4A88', '#1F3D6E', '#C9601E', '#5A3520', '#1F1612',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function resolveImage(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('http')) return raw;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return `${site}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

/* ── API types ── */
interface ApiProduct {
  id: number;
  reference: string;
  nom: string;
  categorie_nom?: string | null;
  marque_nom?: string | null;
  prix_unitaire: number;
  stock_boutique?: number | null;
  actif?: number | boolean | null;
  image_url?: string | null;
}

interface StatsResponse {
  stockStats: {
    en_stock: number;
    en_rupture: number;
    stock_faible: number;
    valeur_totale: number;
  };
  statusCounts: {
    total: number;
    disponible: number;
    faible: number;
    epuise: number;
  };
}

/* ── Mapping helpers ── */
function mapProduct(p: ApiProduct, idx: number): MagasinProduct {
  const stock    = Number(p.stock_boutique ?? 0);
  const isActive = p.actif === 1 || p.actif === true;

  let status: MagasinProduct['status'];
  if (!isActive)        status = 'Archivé';
  else if (stock === 0) status = 'Rupture';
  else                  status = 'Actif';

  const catKey = p.categorie_nom ?? p.reference ?? String(idx);
  const swatch = SWATCHES[hashStr(catKey) % SWATCHES.length];

  return {
    id:       p.id,
    sku:      p.reference?.trim() || `PRD-${p.id}`,
    name:     p.nom,
    cat:      p.categorie_nom ?? '—',
    brand:    p.marque_nom ?? '—',
    status,
    stock,
    target:   50,
    price:    Number(p.prix_unitaire ?? 0),
    margin:   0,
    swatch,
    initial:  (p.nom?.[0] ?? 'P').toUpperCase(),
    imageUrl: resolveImage(p.image_url),
  };
}

function formatStockValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000)     return n.toLocaleString('fr-FR');
  return String(n);
}

function buildKpis(stats: StatsResponse): KpiCard[] {
  const { stockStats, statusCounts } = stats;
  const stockBas = (stockStats.stock_faible ?? 0) + (stockStats.en_rupture ?? 0);
  return [
    { label: 'Total produits', value: String(stockStats.en_stock), delta: `${statusCounts.disponible} actifs`, deltaColor: '#2D6A4F', sub: 'en catalogue', spark: [18,20,19,22,21,25,24,26,25,28,stockStats.en_stock % 32 || 30], color: ACCENT },
    { label: 'Valeur stock', value: formatStockValue(stockStats.valeur_totale), unit: 'F', delta: 'stock magasin', deltaColor: '#2D6A4F', sub: 'prix × quantité', spark: [120,128,132,140,136,148,156,168,172,180,194], color: '#2D6A4F' },
    { label: 'Stock bas', value: String(stockBas), delta: stockBas > 0 ? 'urgent' : 'OK', deltaColor: stockBas > 0 ? '#9C3A14' : '#2D6A4F', sub: '≤ 5 unités ou rupture', spark: [3,2,4,5,4,6,5,6,7,6,stockBas%10], color: '#C9601E' },
    { label: 'Ruptures', value: String(statusCounts.epuise ?? 0), delta: (statusCounts.epuise ?? 0) > 0 ? 'urgent' : 'OK', deltaColor: (statusCounts.epuise ?? 0) > 0 ? '#9C3A14' : '#2D6A4F', sub: 'stock = 0', spark: [1,0,2,1,2,3,2,3,2,3,(statusCounts.epuise??0)%8], color: '#9C3A14' },
  ];
}

function buildTabs(products: MagasinProduct[]): TabSpec[] {
  const lowCount      = products.filter(p => p.target > 0 && p.stock / p.target < 0.4).length;
  const archivedCount = products.filter(p => p.status === 'Archivé').length;
  const activeCount   = products.filter(p => p.status === 'Actif').length;
  return [
    { id: 'all',      label: 'Tous',      count: products.length },
    { id: 'active',   label: 'Actifs',    count: activeCount },
    { id: 'low',      label: 'Stock bas', count: lowCount,      warn: lowCount > 0 },
    { id: 'archived', label: 'Archivés',  count: archivedCount },
  ];
}

/* ── Component ── */
interface Props {
  onSwitchWorkspace?: () => void;
  onCreateProduct?: () => void;
  userName?: string;
  userRole?: string;
}

export default function MagasinDataLoader({
  onSwitchWorkspace,
  onCreateProduct,
  userName,
  userRole,
}: Props) {
  const router = useRouter();

  /* Data */
  const [allProducts, setAllProducts] = useState<MagasinProduct[]>(SAMPLE_PRODUCTS);
  const [kpis,        setKpis]        = useState<KpiCard[]>(SAMPLE_KPIS);
  const [tabs,        setTabs]        = useState<TabSpec[]>(DEFAULT_TABS);
  const [totalCount,  setTotalCount]  = useState(0);

  /* UI state */
  const [searchQuery, setSearchQuery] = useState('');
  const [page,        setPage]        = useState(1);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async (q: string, pg: number) => {
    const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((pg - 1) * PAGE_SIZE) });
    if (q.trim()) qs.set('q', q.trim());
    try {
      const r = await fetch(`/api/admin/products?${qs}`).then(r => r.json());
      if (r.products && Array.isArray(r.products)) {
        const mapped = (r.products as ApiProduct[]).map(mapProduct);
        setAllProducts(mapped);
        setTotalCount(Number(r.total ?? mapped.length));
        setTabs(buildTabs(mapped));
      }
    } catch { /* keep current */ }
  }, []);

  /* ── Fetch stats (once on mount) ── */
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const statsRes = await fetch('/api/admin/products/stats').then(r => r.json());
        if (!cancelled) setKpis(buildKpis(statsRes as StatsResponse));
      } catch { /* keep sample kpis */ }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  /* ── Initial load ── */
  useEffect(() => { fetchProducts('', 1); }, [fetchProducts]);

  /* ── Debounced search ── */
  function handleSearch(q: string) {
    setSearchQuery(q);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(q, 1), 350);
  }

  /* ── Page change ── */
  function handlePageChange(p: number) {
    setPage(p);
    fetchProducts(searchQuery, p);
  }

  /* ── Export ── */
  function handleExport() {
    const qs = new URLSearchParams();
    if (searchQuery.trim()) qs.set('q', searchQuery.trim());
    window.location.href = `/api/admin/products/export${qs.toString() ? `?${qs}` : ''}`;
  }

  /* ── Row actions ── */
  function handleEdit(p: MagasinProduct) {
    if (p.id) router.push(`/admin/magasin/${p.id}`);
  }

  async function handleDelete(p: MagasinProduct) {
    if (!p.id) return;
    try {
      const r = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' }).then(r => r.json());
      if (r.ok) fetchProducts(searchQuery, page);
    } catch { /* ignore */ }
  }

  async function handleArchive(p: MagasinProduct) {
    if (!p.id) return;
    const newActif = p.status === 'Archivé' ? 1 : 0;
    try {
      await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: newActif }),
      });
      fetchProducts(searchQuery, page);
    } catch { /* ignore */ }
  }

  return (
    <MagasinShell
      products={allProducts}
      kpis={kpis}
      tabs={tabs}
      searchQuery={searchQuery}
      onSearch={handleSearch}
      onExport={handleExport}
      onSwitchWorkspace={onSwitchWorkspace}
      onCreateProduct={onCreateProduct ?? (() => router.push('/admin/magasin/nouveau'))}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onArchive={handleArchive}
      totalCount={totalCount}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={handlePageChange}
      userName={userName}
      userRole={userRole}
    />
  );
}
