'use client';
import React, { useEffect, useState, useCallback } from 'react';
import styles from '../Magasin.module.css';

type MvType = 'entree' | 'sortie' | 'vente' | 'ajustement' | 'retrait';

interface Movement {
  id: number;
  produit_id: number;
  nom_produit: string;
  reference?: string;
  type: MvType;
  quantite: number;
  note?: string;
  created_at: string;
}

const MV_LABELS: Record<MvType, string> = {
  entree:      'Entrée',
  sortie:      'Sortie',
  vente:       'Vente',
  ajustement:  'Ajustement',
  retrait:     'Retrait',
};

const MV_CLASS: Record<MvType, string> = {
  entree:     styles.mvEntree,
  sortie:     styles.mvSortie,
  vente:      styles.mvVente,
  ajustement: styles.mvAjust,
  retrait:    styles.mvSortie,
};

const TYPES: { id: string; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'entree', label: 'Entrées' },
  { id: 'sortie', label: 'Sorties' },
  { id: 'vente', label: 'Ventes' },
  { id: 'ajustement', label: 'Ajustements' },
];

export default function MovementsView() {
  const [items, setItems]       = useState<Movement[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('tous');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: String((page - 1) * limit) });
      if (filter !== 'tous') qs.set('type', filter);
      if (search.trim()) qs.set('q', search.trim());
      const r = await fetch(`/api/admin/stock/mouvements?${qs}`).then(r => r.json());
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  function formatDate(s: string) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));
    } catch { return s; }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className={styles.subview}>
      <div className={styles.subviewHead}>
        <div className={styles.subviewTitle}>Mouvements de stock</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className={styles.inlineInput}
            placeholder="Rechercher un produit…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '220px' }}
          />
        </div>
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            className={styles.chip}
            style={filter === t.id ? { background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)' } : {}}
            onClick={() => { setFilter(t.id); setPage(1); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.subviewTable}>
        {loading ? (
          <div className={styles.spinnerWrap}><span className={styles.spinner} /> Chargement…</div>
        ) : items.length === 0 ? (
          <div className={styles.subviewEmpty}><p>Aucun mouvement trouvé.</p></div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.subviewRow} style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '8px 16px' }}>
              {['Date', 'Produit', 'Type', 'Quantité', 'Note'].map(h => (
                <div key={h} style={{ flex: h === 'Produit' ? 2 : 1, fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-2)', fontWeight: 500 }}>
                  {h}
                </div>
              ))}
            </div>

            {items.map(m => (
              <div key={m.id} className={styles.subviewRow}>
                <div style={{ flex: 1, fontSize: '12px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDate(m.created_at)}
                </div>
                <div style={{ flex: 2, minWidth: 0 }}>
                  <div className={styles.subviewRowName} style={{ fontSize: '13px' }}>{m.nom_produit}</div>
                  {m.reference && <div className={styles.subviewRowMeta} style={{ fontFamily: 'monospace', fontSize: '11px' }}>{m.reference}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <span className={`${styles.mvType} ${MV_CLASS[m.type] ?? styles.mvAjust}`}>
                    {MV_LABELS[m.type] ?? m.type}
                  </span>
                </div>
                <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', fontWeight: 500, color: m.type === 'entree' ? 'var(--ok)' : m.type === 'vente' || m.type === 'sortie' || m.type === 'retrait' ? 'var(--warn)' : 'var(--ink)' }}>
                  {m.type === 'entree' ? '+' : m.type === 'ajustement' ? '±' : '−'}{Math.abs(m.quantite)}
                </div>
                <div style={{ flex: 1, fontSize: '12px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.note ?? '—'}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>
                <span>{total} mouvement{total !== 1 ? 's' : ''}</span>
                <div className={styles.pager}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                  <button className={styles.on}>{page}</button>
                  <span style={{ padding: '0 6px' }}>/ {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
