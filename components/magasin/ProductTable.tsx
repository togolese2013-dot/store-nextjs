/**
 * Products table — selectable rows, status pills, stock bars, row actions.
 */
'use client';
import React, { useRef, useEffect, useState } from 'react';
import type { Product } from './types';
import { MoreIcon, ChevDownIcon } from './icons';
import styles from './Magasin.module.css';

interface ProductTableProps {
  products: Product[];
  selected: Set<string>;
  onToggle: (sku: string) => void;
  onToggleAll: () => void;
  onEdit?: (p: Product) => void;
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

/* ── Row menu ── */
function RowMenu({ product, onEdit, onDelete, onArchive }: {
  product: Product;
  onEdit?: (p: Product) => void;
  onDelete?: (p: Product) => void;
  onArchive?: (p: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const isArchived = product.status === 'Archivé';

  return (
    <div className={styles.menuWrap} ref={ref}>
      <button
        type="button"
        className={styles.rowMenu}
        onClick={() => setOpen(v => !v)}
        aria-label="Actions"
      >
        <MoreIcon size={16} />
      </button>
      {open && (
        <div className={styles.dropdown} onClick={() => setOpen(false)}>
          {onEdit && (
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => onEdit(product)}
            >
              <EditIcon /> Modifier
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => onArchive(product)}
            >
              <ArchiveIcon /> {isArchived ? 'Réactiver' : 'Archiver'}
            </button>
          )}
          {(onEdit || onArchive) && onDelete && (
            <div className={styles.dropdownSep} />
          )}
          {onDelete && (
            <button
              type="button"
              className={`${styles.dropdownItem} ${styles.danger}`}
              onClick={() => onDelete(product)}
            >
              <TrashIcon /> Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Confirm delete overlay ── */
function ConfirmDelete({ product, onConfirm, onCancel }: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
        <h3>Supprimer ce produit ?</h3>
        <p>
          <strong>{product.name}</strong> ({product.sku}) sera définitivement supprimé.
          Cette action est irréversible.
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.btn} onClick={onCancel}>Annuler</button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={onConfirm}
          >
            Supprimer
          </button>
        </div>
      </div>
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
  onEdit,
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

  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  function handleDeleteRequest(p: Product) {
    setPendingDelete(p);
  }
  function handleDeleteConfirm() {
    if (pendingDelete) { onDelete?.(pendingDelete); setPendingDelete(null); }
  }

  return (
    <>
      {pendingDelete && (
        <ConfirmDelete
          product={pendingDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}

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
                      <RowMenu
                        product={p}
                        onEdit={onEdit}
                        onDelete={onDelete ? handleDeleteRequest : undefined}
                        onArchive={onArchive}
                      />
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

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="5" rx="2"/>
      <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/>
      <path d="M10 13h4"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </svg>
  );
}
