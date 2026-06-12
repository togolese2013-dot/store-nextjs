/**
 * Products table — selectable rows, status pills, stock bars, row actions.
 */
'use client';
import React from 'react';
import type { Product } from './types';
import { MoreIcon, ChevDownIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

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

/* ── Row menu (interaction-layer) ── */
function RowMenuUI({ product, onDelete, onArchive }: {
  product: Product;
  onDelete?: (p: Product) => void;
  onArchive?: (p: Product) => void;
}) {
  const ui = useUI();
  return (
    <button
      type="button"
      className={styles.rowMenu}
      aria-label="Actions"
      onClick={(e) => {
        e.stopPropagation();
        ui.menu(e, [
          { label: 'Voir les détails', icon: 'eye',     onClick: () => ui.openDetail('product', product) },
          { label: 'Modifier',         icon: 'edit',    onClick: () => ui.openForm('product', 'edit', product) },
          { sep: true },
          { label: product.status === 'Archivé' ? 'Réactiver' : 'Archiver', icon: 'archive',
            onClick: () => ui.confirmArchive('le produit', product.name, {
              onConfirm: () => onArchive?.(product),
            }) },
          { label: 'Supprimer', icon: 'trash', danger: true,
            onClick: () => ui.confirmDelete('le produit', product.name, {
              onConfirm: () => onDelete?.(product),
            }) },
        ], 'right');
      }}
    >
      <MoreIcon size={16} />
    </button>
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
}: ProductTableProps) {
  const allSelected = products.length > 0 && selected.size === products.length;
  const realTotal = totalCount ?? products.length;
  const totalPages = Math.ceil(realTotal / pageSize);

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
                <th style={{ textAlign: 'right' }}>Prix HT</th>
                <th style={{ textAlign: 'right' }}>Marge</th>
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
                        {p.stock} <span className="of">/ {p.target}</span>
                      </div>
                      <div className={styles.stockBar}>
                        <div style={{ width: `${pct * 100}%`, background: stockColor(pct) }} />
                      </div>
                    </td>
                    <td className={styles.priceCell}>{formatPrice(p.price)}</td>
                    <td className={styles.marginCell}>{p.margin > 0 ? `${p.margin}%` : '—'}</td>
                    <td className={styles.actionsCell}>
                      <RowMenuUI product={p} onDelete={onDelete} onArchive={onArchive} />
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-2)', fontSize: '13px' }}>
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

