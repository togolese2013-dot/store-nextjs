/**
 * Products table — selectable rows, status pills, stock bars, row actions.
 */
'use client';
import React, { useState } from 'react';
import type { Product } from './types';
import { ChevDownIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI, Icons } from '@/components/interaction-layer';

interface ProductTableProps {
  products: Product[];
  selected: Set<string>;
  onToggle: (sku: string) => void;
  onToggleAll: () => void;
  onDelete?: (p: Product) => void;
  onArchive?: (p: Product) => void;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  formatPrice?: (cents: number) => string;
  view?: 'table' | 'grid';
}

const defaultFormatPrice = (n: number) =>
  `${n.toLocaleString('fr-FR').replace(/,/g, ' ')} F`;

const statusToClass: Record<Product['status'], string> = {
  Actif: styles.actif,
  Brouillon: styles.brouillon,
  Archivé: styles.archive,
  Rupture: styles.rupture,
};

function stockColor(pct: number): string {
  if (pct < 0.15) return '#9C3A14';
  if (pct < 0.4)  return '#C9601E';
  if (pct < 0.7)  return '#5C4A88';
  return '#2D6A4F';
}

/* ── Row actions (inline icons) ── */
function RowActions({ product, formatPrice, onDelete, onArchive }: {
  product: Product;
  formatPrice: (n: number) => string;
  onDelete?: (p: Product) => void;
  onArchive?: (p: Product) => void;
}) {
  const ui = useUI();
  const [qrBusy, setQrBusy] = useState(false);

  async function handleShareQR(e: React.MouseEvent) {
    e.stopPropagation();
    if (!product.id || qrBusy) return;
    setQrBusy(true);
    try {
      let slug = product.slug;
      if (!slug) {
        // Slug manquant (produit créé avant l'ajout de la colonne) — génération auto silencieuse.
        await fetch('/api/admin/products/generate-slugs', { method: 'POST', credentials: 'include' }).catch(() => {});
        const res  = await fetch(`/api/admin/products/${product.id}`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        slug = data.product?.slug ?? null;
      }
      if (!slug) return;

      let base = typeof window !== 'undefined' ? window.location.origin : '';
      const domainRes = await fetch('/api/admin/settings/domain', { credentials: 'include' }).catch(() => null);
      if (domainRes?.ok) {
        const d = await domainRes.json();
        base = d.custom_domain ? `https://${d.custom_domain}` : d.slug ? `https://${d.slug}.afrisika.com` : base;
      }

      ui.openShareQR({ title: product.name, subtitle: formatPrice(product.price), url: `${base}/products/${slug}` });
    } finally {
      setQrBusy(false);
    }
  }

  return (
    <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
      <button type="button" className={styles.rowMenu} aria-label="Voir les détails"
        onClick={() => ui.openDetail('product', product)}>
        <Icons.eye size={15} />
      </button>
      <button type="button" className={styles.rowMenu} aria-label="Modifier"
        onClick={() => ui.openForm('product', 'edit', product)}>
        <Icons.edit size={15} />
      </button>
      <button type="button" className={styles.rowMenu} aria-label="Code QR" disabled={qrBusy}
        onClick={handleShareQR}>
        <Icons.qrcode size={15} />
      </button>
      <button type="button" className={`${styles.rowMenu} ${styles.rowMenuMore}`}
        aria-label={product.status === 'Archivé' ? 'Réactiver' : 'Archiver'}
        onClick={() => ui.confirmArchive('le produit', product.name, {
          onConfirm: () => onArchive?.(product),
        })}>
        <Icons.archive size={14} />
      </button>
      <button type="button" className={`${styles.rowMenu} ${styles.rowMenuDanger}`} aria-label="Supprimer"
        onClick={() => ui.confirmDelete('le produit', product.name, {
          onConfirm: () => onDelete?.(product),
        })}>
        <Icons.trash size={15} />
      </button>
    </div>
  );
}

/* ── Pagination ── */
function Pagination({ page, totalPages, onChange }: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className={styles.pager}>
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {pages.map((p, i) =>
        p === '…' ? (
          <button key={`e${i}`} disabled style={{ cursor: 'default' }}>…</button>
        ) : (
          <button
            key={p}
            className={p === page ? styles.on : ''}
            onClick={() => onChange(p as number)}
          >
            {p}
          </button>
        )
      )}
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}>›</button>
    </div>
  );
}

export default function ProductTable({
  products,
  selected,
  onToggle,
  onToggleAll,
  onDelete,
  onArchive,
  totalCount,
  page = 1,
  pageSize = 20,
  onPageChange,
  formatPrice = defaultFormatPrice,
  view = 'table',
}: ProductTableProps) {
  const allSelected = products.length > 0 && selected.size === products.length;
  const realTotal = totalCount ?? products.length;
  const totalPages = Math.ceil(realTotal / pageSize);

  if (view === 'grid') {
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: '4px 0' }}>
          {products.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--muted-2)', fontSize: 13 }}>
              Aucun produit
            </div>
          ) : products.map(p => {
            const pct = p.target > 0 ? p.stock / p.target : 1;
            const color = stockColor(pct);
            return (
              <div key={p.sku} onClick={() => onToggle(p.sku)}
                style={{
                  background: selected.has(p.sku) ? 'rgba(201,96,30,.06)' : 'var(--surface)',
                  border: `1px solid ${selected.has(p.sku) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  transition: 'border-color .15s',
                }}>
                <div style={{ aspectRatio: '4/3', background: p.imageUrl ? 'none' : p.swatch, overflow: 'hidden', position: 'relative' }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff', opacity: .7 }}>{p.initial}</div>
                  }
                  <span style={{
                    position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 600,
                    padding: '2px 7px', borderRadius: 99, background: 'rgba(0,0,0,.55)', color: '#fff',
                  }}>{p.status}</span>
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginBottom: 8 }}>{p.sku}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--fg)' }}>{formatPrice(p.price)}</span>
                    <span style={{ fontSize: 11, color, fontWeight: 600 }}>{p.stock} u.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pgBtn} disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>←</button>
            <span className={styles.pgInfo}>{page} / {totalPages}</span>
            <button className={styles.pgBtn} disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>→</button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.check}>
                  <div
                    className={`${styles.checkbox} ${allSelected ? styles.on : ''}`}
                    onClick={onToggleAll}
                    role="checkbox"
                    aria-checked={allSelected}
                  >
                    {allSelected && <CheckMark />}
                  </div>
                </th>
                <th>Produit <ChevDownIcon size={10} /></th>
                <th>Statut</th>
                <th>Catégorie</th>
                <th>Marque</th>
                <th>Stock</th>
                <th style={{ textAlign: 'right' }}>Prix unitaire</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const pct = p.target > 0 ? Math.min(1, p.stock / p.target) : 0;
                const isSel = selected.has(p.sku);
                return (
                  <tr key={p.sku} className={isSel ? styles.selected : ''}>
                    <td className={styles.check}>
                      <div
                        className={`${styles.checkbox} ${isSel ? styles.on : ''}`}
                        onClick={() => onToggle(p.sku)}
                      >
                        {isSel && <CheckMark />}
                      </div>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <div
                          className={styles.thumb}
                          style={
                            p.imageUrl
                              ? { backgroundImage: `url(${p.imageUrl})` }
                              : { background: p.swatch }
                          }
                        >
                          {!p.imageUrl && p.initial}
                        </div>
                        <div>
                          <div className={styles.productName}>{p.name}</div>
                          <div className={styles.productSku}>{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.status} ${statusToClass[p.status]}`}>
                        <span className="d" />
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <span className={styles.tag}>{p.cat}</span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{p.brand}</td>
                    <td className={styles.stockCell}>
                      <div className={styles.stockNum}>
                        {p.stock}
                      </div>
                      <div className={styles.stockBar}>
                        <div style={{ width: `${pct * 100}%`, background: stockColor(pct) }} />
                      </div>
                    </td>
                    <td className={styles.priceCell}>{formatPrice(p.price)}</td>
                    <td className={styles.actionsCell}>
                      <RowActions product={p} formatPrice={formatPrice} onDelete={onDelete} onArchive={onArchive} />
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-2)', fontSize: '13px' }}>
                    Aucun produit dans cette vue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFoot}>
          <span>
            {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''} · ` : ''}
            {products.length} affiché{products.length > 1 ? 's' : ''} sur {realTotal}
          </span>
          {onPageChange && (
            <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
          )}
        </div>
      </div>
    </>
  );
}

function CheckMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

