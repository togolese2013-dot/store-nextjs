"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { FilterIcon, DownloadIcon, ChevDownIcon } from './icons';
import styles from './Admin.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawLog {
  id: number;
  username: string;
  action_type: string;
  entity: string;
  entity_id: number | null;
  label: string | null;
  workspace: string;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WS_COLORS: Record<string, string> = {
  Boutique: '#C9601E',
  Magasin:  '#3B6A8F',
  Store:    '#2D6A4F',
  CRM:      '#5C4A88',
  Admin:    '#8A8278',
};

const ACTION_LABELS: Record<string, string> = {
  vente_créée:       'Nouvelle vente',
  vente_modifiée:    'Vente modifiée',
  vente_supprimée:   'Vente supprimée',
  paiement_ajouté:   'Paiement enregistré',
  produit_créé:      'Produit créé',
  produit_modifié:   'Produit modifié',
  produit_supprimé:  'Produit supprimé',
  'commande_confirmée':  'Commande confirmée',
  'commande_expédiée':   'Commande expédiée',
  'commande_livrée':     'Commande livrée',
  'commande_annulée':    'Commande annulée',
  stock_mouvement:   'Mouvement stock',
  client_créé:       'Nouveau client',
  client_modifié:    'Client modifié',
};

const WORKSPACES   = ['Boutique', 'Magasin', 'Store', 'CRM', 'Admin'];
const ACTION_TYPES = Object.keys(ACTION_LABELS);

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarColor(username: string): string {
  const palette = ['#C9601E','#3B6A8F','#2D6A4F','#5C4A88','#14110E','#8A3A2F','#1E6B5E'];
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initials(username: string): string {
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function todayStr(): string {
  return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [logs, setLogs]           = useState<RawLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [wsFilter, setWsFilter]   = useState('');
  const [actFilter, setActFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [wsOpen, setWsOpen]       = useState(false);
  const [actOpen, setActOpen]     = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit:  String(PAGE_SIZE),
      offset: String((page - 1) * PAGE_SIZE),
    });
    if (wsFilter)     params.set('workspace', wsFilter);
    if (actFilter)    params.set('action',    actFilter);
    if (memberFilter) params.set('member',    memberFilter);

    fetch(`/api/admin/activity-logs?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setTotal(Number(data.total ?? 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, wsFilter, actFilter, memberFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!wsOpen && !actOpen) return;
    const close = () => { setWsOpen(false); setActOpen(false); };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [wsOpen, actOpen]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetFilters = () => {
    setWsFilter('');
    setActFilter('');
    setMemberFilter('');
    setPage(1);
  };

  const hasFilter = wsFilter || actFilter || memberFilter;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Admin · Audit</div>
          <h1 className={styles.title}>Journal d&apos;<span className={styles.serif}>activité</span></h1>
          <p className={styles.subtitle}>Traçabilité complète des actions · qui a fait quoi, quand, où</p>
        </div>
        <div className={styles.headerActions}>
          {hasFilter && (
            <button type="button" className={styles.btn} onClick={resetFilters}>
              Réinitialiser ×
            </button>
          )}
          <button type="button" className={styles.btn} onClick={fetchLogs}>
            <FilterIcon size={14} /> Actualiser
          </button>
          <button type="button" className={styles.btn}>
            <DownloadIcon size={14} /> Exporter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.toolbar} style={{ flexWrap: 'wrap', gap: 8 }}>
        {/* Workspace filter */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.chip}
            style={wsFilter ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : undefined}
            onClick={(e) => { e.stopPropagation(); setWsOpen(v => !v); setActOpen(false); }}
          >
            {wsFilter || 'Workspace'} <ChevDownIcon size={10} />
          </button>
          {wsOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 0', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
              onClick={e => e.stopPropagation()}>
              <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: 'none', border: 0, cursor: 'pointer', color: 'var(--muted)' }}
                onClick={() => { setWsFilter(''); setWsOpen(false); setPage(1); }}>Tous</button>
              {WORKSPACES.map(w => (
                <button key={w} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: wsFilter === w ? 'var(--accent-bg)' : 'none', border: 0, cursor: 'pointer', color: wsFilter === w ? 'var(--accent)' : 'var(--fg)' }}
                  onClick={() => { setWsFilter(w); setWsOpen(false); setPage(1); }}>{w}</button>
              ))}
            </div>
          )}
        </div>

        {/* Action type filter */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.chip}
            style={actFilter ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : undefined}
            onClick={(e) => { e.stopPropagation(); setActOpen(v => !v); setWsOpen(false); }}
          >
            {actFilter ? (ACTION_LABELS[actFilter] ?? actFilter) : "Type d'action"} <ChevDownIcon size={10} />
          </button>
          {actOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 0', minWidth: 200, maxHeight: 300, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
              onClick={e => e.stopPropagation()}>
              <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: 'none', border: 0, cursor: 'pointer', color: 'var(--muted)' }}
                onClick={() => { setActFilter(''); setActOpen(false); setPage(1); }}>Tous</button>
              {ACTION_TYPES.map(a => (
                <button key={a} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: actFilter === a ? 'var(--accent-bg)' : 'none', border: 0, cursor: 'pointer', color: actFilter === a ? 'var(--accent)' : 'var(--fg)' }}
                  onClick={() => { setActFilter(a); setActOpen(false); setPage(1); }}>{ACTION_LABELS[a]}</button>
              ))}
            </div>
          )}
        </div>

        {/* Member search */}
        <input
          type="text"
          placeholder="Filtrer par membre…"
          value={memberFilter}
          onChange={e => { setMemberFilter(e.target.value); setPage(1); }}
          style={{ fontSize: 13, padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 20, background: 'var(--surface)', color: 'var(--fg)', outline: 'none', width: 180 }}
        />

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-2)', alignSelf: 'center' }}>
          Période : {todayStr()}
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; heure</th>
                <th>Membre</th>
                <th>Action</th>
                <th>Détail</th>
                <th>Workspace</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Chargement…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Aucun événement{hasFilter ? ' pour ces filtres' : ''}.</td></tr>
              ) : logs.map(l => {
                const color   = avatarColor(l.username);
                const wsColor = WS_COLORS[l.workspace] ?? '#8A8278';
                return (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(l.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 99, background: color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                          {initials(l.username)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{l.username}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{ACTION_LABELS[l.action_type] ?? l.action_type}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.label ?? '—'}
                    </td>
                    <td>
                      <span className={styles.tag} style={{ background: `${wsColor}1A`, color: wsColor }}>{l.workspace}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{total} événement{total > 1 ? 's' : ''} · page {page}/{totalPages}</span>
          <div className={styles.pager}>
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} type="button" className={p === page ? styles.on : undefined} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            {totalPages > 5 && page < totalPages - 2 && <button type="button">…</button>}
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      </div>
    </>
  );
}
