"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { FilterIcon, DownloadIcon, ChevDownIcon } from './icons';
import styles from './Admin.module.css';
import { formatDateTime, formatDateLong } from '@/lib/format-date';
import { useT } from '@/lib/i18n/use-admin-ws-lang';
import type { DictKey } from '@/lib/i18n/admin-ws';

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

// Values below are i18n dictionary KEYS, resolved via t() at render time.
const ACTION_LABELS: Record<string, DictKey> = {
  vente_créée:       'logs.action.vente_creee',
  vente_modifiée:    'logs.action.vente_modifiee',
  vente_supprimée:   'logs.action.vente_supprimee',
  paiement_ajouté:   'logs.action.paiement_ajoute',
  produit_créé:      'logs.action.produit_cree',
  produit_modifié:   'logs.action.produit_modifie',
  produit_supprimé:  'logs.action.produit_supprime',
  'commande_confirmée':  'logs.action.commande_confirmee',
  'commande_expédiée':   'logs.action.commande_expediee',
  'commande_livrée':     'logs.action.commande_livree',
  'commande_annulée':    'logs.action.commande_annulee',
  stock_mouvement:   'logs.action.stock_mouvement',
  client_créé:       'logs.action.client_cree',
  client_modifié:    'logs.action.client_modifie',
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
  return formatDateTime(ts);
}

function todayStr(): string {
  return formatDateLong(new Date());
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const t = useT();
  const [logs, setLogs]           = useState<RawLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
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
        if (data.error) { setError(data.error); setLogs([]); setTotal(0); return; }
        setError(null);
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setTotal(Number(data.total ?? 0));
      })
      .catch(e => setError(String(e)))
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
          <div className={styles.eyebrow}>{t('logs.eyebrow')}</div>
          <h1 className={styles.title}>{t('logs.title.main')}<span className={styles.serif}>{t('logs.title.serif')}</span></h1>
          <p className={styles.subtitle}>{t('logs.subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          {hasFilter && (
            <button type="button" className={styles.btn} onClick={resetFilters}>
              {t('logs.reset_btn')}
            </button>
          )}
          <button type="button" className={styles.btn} onClick={fetchLogs}>
            <FilterIcon size={14} /> {t('logs.refresh_btn')}
          </button>
          <button type="button" className={styles.btn}>
            <DownloadIcon size={14} /> {t('common.export')}
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
            {wsFilter || t('logs.filter.workspace_placeholder')} <ChevDownIcon size={10} />
          </button>
          {wsOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 0', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
              onClick={e => e.stopPropagation()}>
              <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: 'none', border: 0, cursor: 'pointer', color: 'var(--muted)' }}
                onClick={() => { setWsFilter(''); setWsOpen(false); setPage(1); }}>{t('logs.filter.all')}</button>
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
            {actFilter ? t(ACTION_LABELS[actFilter] ?? actFilter as DictKey) : t('logs.filter.action_type_placeholder')} <ChevDownIcon size={10} />
          </button>
          {actOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 0', minWidth: 200, maxHeight: 300, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
              onClick={e => e.stopPropagation()}>
              <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: 'none', border: 0, cursor: 'pointer', color: 'var(--muted)' }}
                onClick={() => { setActFilter(''); setActOpen(false); setPage(1); }}>{t('logs.filter.all')}</button>
              {ACTION_TYPES.map(a => (
                <button key={a} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: actFilter === a ? 'var(--accent-bg)' : 'none', border: 0, cursor: 'pointer', color: actFilter === a ? 'var(--accent)' : 'var(--fg)' }}
                  onClick={() => { setActFilter(a); setActOpen(false); setPage(1); }}>{t(ACTION_LABELS[a])}</button>
              ))}
            </div>
          )}
        </div>

        {/* Member search */}
        <input
          type="text"
          placeholder={t('logs.filter.member_placeholder')}
          value={memberFilter}
          onChange={e => { setMemberFilter(e.target.value); setPage(1); }}
          style={{ fontSize: 13, padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 20, background: 'var(--surface)', color: 'var(--fg)', outline: 'none', width: 180 }}
        />

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-2)', alignSelf: 'center' }}>
          {t('logs.period_label')} {todayStr()}
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('logs.table.datetime')}</th>
                <th>{t('logs.table.member')}</th>
                <th>{t('logs.table.action')}</th>
                <th>{t('logs.table.detail')}</th>
                <th>{t('logs.table.workspace')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : error ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--danger)', padding: '2rem', fontSize: 13 }}>{t('logs.api_error_prefix')} {error}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>{hasFilter ? t('logs.empty_filtered') : t('logs.empty')}</td></tr>
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
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{ACTION_LABELS[l.action_type] ? t(ACTION_LABELS[l.action_type]) : l.action_type}</td>
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
          <span>{total} {t('common.word.event')}{total > 1 ? 's' : ''} · {t('logs.page_word')} {page}/{totalPages}</span>
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
