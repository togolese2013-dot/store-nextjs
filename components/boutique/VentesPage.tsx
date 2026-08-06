/**
 * VentesPage — sales register content
 * Mount via BoutiqueShell (page id: 'ventes') or standalone.
 * Self-fetching (own period/filters/pagination) — /api/admin/ventes/factures.
 */
'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Sale } from './types';
import { mapFacture, type ApiFacture } from './sale-mapping';
import { DownloadIcon, PlusIcon, PrinterIcon, TrendIcon, EyeIcon, PencilIcon, TrashIcon, CloseIcon } from './icons';
import Sparkline from './Sparkline';
import styles from './Boutique.module.css';
import { useBoutiqueConfig, fmtNum, fmtAmount } from './BoutiqueSettingsContext';
import BoutiqueDocPrint, { type PrintItem } from '@/components/admin/BoutiqueDocPrint';
import { useAdminSSE } from '@/components/admin/useAdminSSE';
import { formatDateTime } from '@/lib/format-date';

interface ApiFactureItem { nom: string; reference?: string; qty: number; prix: number; total: number; }
interface ApiFactureDetail {
  id: number;
  reference: string; client_nom: string; client_tel: string | null;
  items: string; sous_total: number; remise: number; total: number;
  mode_paiement: string | null; statut_paiement: string | null; montant_acompte: number | null;
  statut: string; vendeur: string | null;
  adresse_livraison: string | null; created_at: string;
}

function parseFactureItems(items: string): ApiFactureItem[] {
  try { return typeof items === 'string' ? JSON.parse(items) : (items ?? []); }
  catch { return []; }
}

const STATUT_FACTURE = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'valide',    label: 'Validé' },
  { value: 'paye',      label: 'Payé' },
  { value: 'annule',    label: 'Annulé' },
];
const STATUT_PAIEMENT_OPTIONS = [
  { value: 'paye_total', label: 'Payé en totalité' },
  { value: 'acompte',    label: 'Acompte' },
  { value: 'non_paye',   label: 'Non payé' },
];
const MODE_PAIEMENT_OPTIONS = [
  { value: 'especes',           label: 'Espèces' },
  { value: 'mixx_by_yas',       label: 'Mixx by Yas' },
  { value: 'moov_money',        label: 'Moov Money' },
  { value: 'virement_bancaire', label: 'Virement bancaire' },
];

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)' };

function modePaiementLabel(mode: string | null): string {
  return MODE_PAIEMENT_OPTIONS.find(m => m.value === mode)?.label ?? (mode ?? '—');
}

function paiementLabelColor(statutPaiement: string | null): { label: string; color: string; bg: string } {
  if (statutPaiement === 'paye' || statutPaiement === 'paye_total') return { label: 'Payé', color: 'var(--ok)', bg: 'var(--ok-bg)' };
  if (statutPaiement === 'acompte') return { label: 'Acompte', color: 'var(--warn)', bg: 'var(--warn-bg)' };
  return { label: 'Non payé', color: 'var(--danger)', bg: 'var(--danger-bg)' };
}

interface EditState {
  numericId: number;
  reference: string;
  statut: string;
  statutPaiement: string;
  montantAcompte: string;
  modePaiement: string;
  total: number;
  saving: boolean;
  error: string;
}

function toEditState(f: ApiFactureDetail): EditState {
  return {
    numericId:      f.id,
    reference:      f.reference,
    statut:         f.statut,
    statutPaiement: f.statut_paiement ?? 'non_paye',
    montantAcompte: f.montant_acompte != null ? String(f.montant_acompte) : '',
    modePaiement:   f.mode_paiement ?? 'especes',
    total:          f.total,
    saving:         false,
    error:          '',
  };
}

const LIMIT = 20;
type Period = 'today' | 'week' | 'month' | 'all';
const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui", week: 'Cette semaine', month: 'Ce mois', all: 'Tout',
};
function isoPrefix(date: Date, unit: 'day' | 'month') {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  if (unit === 'month') return `${y}-${m}`;
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildPrintProps(f: ApiFactureDetail) {
  const printItems: PrintItem[] = parseFactureItems(f.items).map(i => ({
    nom: i.nom, reference: i.reference, qty: i.qty, prix: i.prix, total: i.total,
  }));
  return {
    type: 'facture' as const,
    format: 'A5' as const,
    reference: f.reference,
    date: f.created_at,
    client_nom: f.client_nom || 'Client anonyme',
    client_tel: f.client_tel,
    items: printItems,
    sous_total: f.sous_total,
    remise: f.remise,
    total: f.total,
    mode_paiement: f.mode_paiement,
    statut_paiement: f.statut_paiement,
    adresse_livraison: f.adresse_livraison,
  };
}

export interface VentesPageProps {
  onNewSale?: () => void;
}

export default function VentesPage({ onNewSale }: VentesPageProps) {
  const cfg = useBoutiqueConfig();
  const [period, setPeriod]   = useState<Period>('today');
  const [page, setPage]       = useState(1);
  const [items, setItems]     = useState<Sale[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [periodCounts, setPeriodCounts] = useState({ today: 0, week: 0, month: 0, all: 0 });
  const [dayStats, setDayStats] = useState({
    solde_jour: 0, solde_hier: 0,
    ventes_jour_montant: 0, ventes_jour_montant_hier: 0,
    rentrees_jour: 0, rentrees_hier: 0,
    depenses_jour: 0, depenses_hier: 0,
  });
  const [exporting, setExporting] = useState(false);
  const [printDoc, setPrintDoc] = useState<ReturnType<typeof buildPrintProps> | null>(null);
  const [actionError, setActionError] = useState('');
  const [detailDoc, setDetailDoc] = useState<ApiFactureDetail | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => { setPage(1); }, [period]);

  const fetchAbortRef = useRef<AbortController | null>(null);
  const fetchList = useCallback(() => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);

    const params = new URLSearchParams();
    params.set('limit', String(LIMIT));
    params.set('offset', String((page - 1) * LIMIT));
    const now = new Date();
    if (period === 'today') {
      params.set('date_from', isoPrefix(now, 'day'));
      params.set('date_to', isoPrefix(now, 'day'));
    } else if (period === 'week') {
      params.set('date_from', isoPrefix(startOfWeek(now), 'day'));
    } else if (period === 'month') {
      params.set('date_from', `${isoPrefix(now, 'month')}-01`);
    }

    fetch(`/api/admin/ventes/factures?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        setItems(Array.isArray(d.items) ? (d.items as ApiFacture[]).map(mapFacture) : []);
        setTotal(Number(d.total ?? 0));
        if (d.period_counts) setPeriodCounts(d.period_counts);
        if (d.stats) setDayStats({
          solde_jour:               Number(d.stats.solde_jour ?? 0),
          solde_hier:               Number(d.stats.solde_hier ?? 0),
          ventes_jour_montant:      Number(d.stats.ventes_jour_montant ?? 0),
          ventes_jour_montant_hier: Number(d.stats.ventes_jour_montant_hier ?? 0),
          rentrees_jour:            Number(d.stats.rentrees_jour ?? 0),
          rentrees_hier:            Number(d.stats.rentrees_hier ?? 0),
          depenses_jour:            Number(d.stats.depenses_jour ?? 0),
          depenses_hier:            Number(d.stats.depenses_hier ?? 0),
        });
      })
      .catch(e => { if (e?.name !== 'AbortError') setItems([]); })
      .finally(() => setLoading(false));
  }, [period, page]);

  useEffect(() => {
    fetchList();
    return () => fetchAbortRef.current?.abort();
  }, [fetchList]);

  const { subscribe } = useAdminSSE();
  useEffect(() => subscribe(e => {
    if (e.type === 'vente') fetchList();
  }), [subscribe, fetchList]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/ventes/factures/export');
      if (!res.ok) return;
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : 'ventes.csv';
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } finally {
      setExporting(false);
    }
  }

  async function fetchFactureDetail(numericId: number): Promise<ApiFactureDetail | null> {
    try {
      const res = await fetch(`/api/admin/ventes/factures/${numericId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function handleViewDetail(numericId: number) {
    setActionError('');
    setBusyId(numericId);
    const f = await fetchFactureDetail(numericId);
    setBusyId(null);
    if (!f) { setActionError('Facture introuvable.'); return; }
    setDetailDoc(f);
  }

  async function handleOpenEdit(numericId: number) {
    setActionError('');
    setBusyId(numericId);
    const f = await fetchFactureDetail(numericId);
    setBusyId(null);
    if (!f) { setActionError('Facture introuvable.'); return; }
    setDetailDoc(null);
    setEditState(toEditState(f));
  }

  async function submitEdit() {
    if (!editState) return;
    if (editState.statutPaiement === 'acompte') {
      const montant = Number(editState.montantAcompte);
      if (!editState.montantAcompte || Number.isNaN(montant) || montant <= 0 || montant >= editState.total) {
        setEditState(s => s ? { ...s, error: 'Montant acompte invalide (entre 0 et le total).' } : s);
        return;
      }
    }
    setEditState(s => s ? { ...s, saving: true, error: '' } : s);
    try {
      const res = await fetch(`/api/admin/ventes/factures/${editState.numericId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut:           editState.statut,
          statut_paiement:  editState.statutPaiement,
          mode_paiement:    editState.modePaiement,
          montant_acompte:  editState.statutPaiement === 'acompte' ? Number(editState.montantAcompte) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setEditState(s => s ? { ...s, saving: false, error: data.error ?? 'Erreur.' } : s); return; }
      setEditState(null);
      fetchList();
    } catch {
      setEditState(s => s ? { ...s, saving: false, error: 'Erreur réseau.' } : s);
    }
  }

  async function handleDelete(s: Sale) {
    if (!window.confirm(`Supprimer la vente ${s.id} ?`)) return;
    setActionError('');
    try {
      const res = await fetch(`/api/admin/ventes/factures/${s.numericId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setActionError(data.error ?? 'Suppression impossible.'); return; }
      fetchList();
    } catch {
      setActionError('Erreur réseau.');
    }
  }

  const totalAmount = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const PERIOD_TABS: { id: Period; label: string; count: number }[] = [
    { id: 'today', label: PERIOD_LABELS.today, count: periodCounts.today },
    { id: 'week',  label: PERIOD_LABELS.week,  count: periodCounts.week },
    { id: 'month', label: PERIOD_LABELS.month, count: periodCounts.month },
    { id: 'all',   label: PERIOD_LABELS.all,   count: periodCounts.all },
  ];

  function dayKpi(label: string, jour: number, hier: number, color: string, sparkBase: number[]) {
    const delta = jour - hier;
    const pct = hier !== 0 ? Math.round((delta / hier) * 100) : (jour === 0 ? 0 : null);
    return {
      label, value: fmtNum(jour, cfg), unit: cfg.symbol,
      delta: pct === null ? '—' : `${pct >= 0 ? '+' : ''}${pct}%`,
      deltaColor: (pct ?? 0) >= 0 ? '#2D6A4F' : '#9C3A14',
      sub: `vs ${fmtNum(hier, cfg)} hier`,
      spark: [...sparkBase, jour],
      color,
    };
  }

  const dayKpis = [
    dayKpi('Solde du jour',       dayStats.solde_jour,          dayStats.solde_hier,          '#3B6A8F', [40,45,48,50,52,55,58,60,62,65]),
    dayKpi('Vente du jour',       dayStats.ventes_jour_montant, dayStats.ventes_jour_montant_hier, '#3B6A8F', [20,22,24,25,26,28,29,30,31,32]),
    dayKpi('Entrées de fonds',    dayStats.rentrees_jour,       dayStats.rentrees_hier,       '#3B6A8F', [10,12,13,14,15,16,17,18,19,20]),
    dayKpi('Sorties / dépenses',  dayStats.depenses_jour,       dayStats.depenses_hier,       '#3B6A8F', [8,9,9,10,10,11,12,12,13,13]),
  ];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Ventes</div>
          <h1 className={styles.title}>Registre des <span className={styles.serif}>ventes</span></h1>
          <p className={styles.subtitle}>{total} vente{total !== 1 ? 's' : ''} · {fmtAmount(totalAmount, cfg)} encaissés</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={handleExport} disabled={exporting}>
            <DownloadIcon size={14} /> {exporting ? 'Export…' : 'Exporter'}
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onNewSale}>
            <PlusIcon size={14} /> Nouvelle vente
          </button>
        </div>
      </div>

      {actionError && (
        <p style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>{actionError}</p>
      )}

      <div className={styles.kpis}>
        {dayKpis.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              <div className={styles.kpiDelta} style={{ color: k.deltaColor }}>
                <TrendIcon size={10} />{k.delta}
              </div>
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              <div className={styles.kpiUnit}>{k.unit}</div>
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              <Sparkline data={k.spark} color={k.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Period tabs */}
      <div className={styles.tabsRow}>
        {PERIOD_TABS.map(t => (
          <button
            key={t.id} type="button"
            className={`${styles.tab} ${period === t.id ? styles.active : ''}`}
            onClick={() => setPeriod(t.id)}
          >
            {t.label}<span className={styles.pill}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; heure</th>
                <th>ID</th>
                <th>Client</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Paiement</th>
                <th>Vendeur</th>
                <th style={{ width: 108 }} />
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Aucune vente pour cette période</td></tr>
              )}
              {items.map(s => {
                const pmt = paiementLabelColor(s.statutPaiement);
                const isPaid = s.statutPaiement === 'paye' || s.statutPaiement === 'paye_total';
                const isDeposit = s.statutPaiement === 'acompte';
                const pct = isDeposit && s.montantAcompte != null && s.amount > 0
                  ? Math.round((s.montantAcompte / s.amount) * 100) : 0;
                return (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{s.time}</td>
                  <td><span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12.5, fontWeight: 500 }}>{s.id}</span></td>
                  <td>
                    {s.client === '—'
                      ? <span style={{ color: 'var(--muted)', fontSize: 13 }}>Anonyme</span>
                      : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 99, background: s.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{s.init}</div>
                          <span style={{ fontWeight: 500 }}>{s.client}</span>
                        </div>
                      )}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>{fmtAmount(s.amount, cfg)}</td>
                  <td>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
                      <span className={styles.tag} style={{ background: pmt.bg, color: pmt.color, alignSelf: 'flex-start' }}>
                        {isDeposit ? `${pmt.label} · ${pct}%` : pmt.label}
                      </span>
                      {!isPaid && (
                        <div className={styles.stockBar} style={{ width: 60 }}>
                          <div style={{ width: `${pct}%`, background: pmt.color }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {s.vendeur ?? '—'}
                  </td>
                  <td className={styles.actionsCell} style={{ width: 108 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2, opacity: busyId === s.numericId ? 0.5 : 1 }}>
                      <button type="button" className={styles.rowMenu} title="Voir les détails" disabled={busyId === s.numericId} onClick={() => handleViewDetail(s.numericId)}>
                        <EyeIcon size={14} />
                      </button>
                      <button type="button" className={styles.rowMenu} title="Modifier la vente" disabled={busyId === s.numericId} onClick={() => handleOpenEdit(s.numericId)}>
                        <PencilIcon size={14} />
                      </button>
                      <button type="button" className={styles.rowMenu} title="Supprimer la vente" onClick={() => handleDelete(s)}>
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{total} vente{total !== 1 ? 's' : ''}</span>
          <div className={styles.pager}>
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
            <button type="button" className={styles.on}>{page}/{totalPages}</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
          </div>
        </div>
      </div>

      {printDoc && (
        <BoutiqueDocPrint {...printDoc} onClose={() => setPrintDoc(null)} />
      )}

      {/* ── Modale détails ── */}
      {detailDoc && (() => {
        const f = detailDoc;
        const pmt = paiementLabelColor(f.statut_paiement);
        const isDeposit = f.statut_paiement === 'acompte';
        const reste = isDeposit ? f.total - (f.montant_acompte ?? 0) : 0;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,17,14,.35)', padding: 16 }}
            onClick={() => setDetailDoc(null)}>
            <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(20,17,14,.2)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Vente {f.reference}</h2>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{formatDateTime(f.created_at)}</p>
                </div>
                <button type="button" onClick={() => setDetailDoc(null)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
                  <CloseIcon size={16} />
                </button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{f.client_nom || 'Client anonyme'}</div>
                  {f.client_tel && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{f.client_tel}</div>}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ color: 'var(--muted-2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Article</th>
                      <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Qté</th>
                      <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseFactureItems(f.items).map((it, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 0' }}>{it.nom}</td>
                        <td style={{ textAlign: 'right', padding: '6px 0' }}>{it.qty}</td>
                        <td style={{ textAlign: 'right', padding: '6px 0', fontFamily: 'Geist Mono, monospace' }}>{fmtAmount(it.total, cfg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span>Sous-total</span><span>{fmtAmount(f.sous_total, cfg)}</span></div>
                  {f.remise > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span>Remise</span><span>−{fmtAmount(f.remise, cfg)}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }}><span>Total</span><span>{fmtAmount(f.total, cfg)}</span></div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{modePaiementLabel(f.mode_paiement)}</span>
                  <span className={styles.tag} style={{ background: pmt.bg, color: pmt.color }}>
                    {isDeposit ? `${pmt.label} · ${fmtAmount(f.montant_acompte ?? 0, cfg)} versé, reste ${fmtAmount(reste, cfg)}` : pmt.label}
                  </span>
                </div>

                {f.adresse_livraison && (
                  <div style={{ fontSize: 12.5 }}>
                    <span style={{ color: 'var(--muted)' }}>Livraison : </span>{f.adresse_livraison}
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Vendeur : {f.vendeur ?? '—'}</div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" className={styles.btn} style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setPrintDoc(buildPrintProps(f)); setDetailDoc(null); }}>
                    <PrinterIcon size={14} /> Imprimer
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.primary}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setEditState(toEditState(f)); setDetailDoc(null); }}>
                    <PencilIcon size={14} /> Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modale modifier ── */}
      {editState && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,17,14,.35)', padding: 16 }}
          onClick={() => setEditState(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(20,17,14,.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Modifier la vente</h2>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Geist Mono, monospace', margin: '2px 0 0' }}>{editState.reference}</p>
              </div>
              <button type="button" onClick={() => setEditState(null)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
                <CloseIcon size={16} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {editState.error && (
                <p style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 8, margin: 0 }}>{editState.error}</p>
              )}
              <div>
                <label style={labelStyle}>Statut de la facture</label>
                <select value={editState.statut} onChange={e => setEditState(s => s ? { ...s, statut: e.target.value } : s)} style={inputStyle}>
                  {STATUT_FACTURE.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Statut du paiement</label>
                <select value={editState.statutPaiement} onChange={e => setEditState(s => s ? { ...s, statutPaiement: e.target.value } : s)} style={inputStyle}>
                  {STATUT_PAIEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {editState.statutPaiement === 'acompte' && (
                <div>
                  <label style={labelStyle}>Montant de l&apos;acompte (FCFA)</label>
                  <input type="number" min={0} max={editState.total} value={editState.montantAcompte}
                    onChange={e => setEditState(s => s ? { ...s, montantAcompte: e.target.value } : s)} style={inputStyle} />
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
                    Total {fmtAmount(editState.total, cfg)} · reste {fmtAmount(Math.max(0, editState.total - (Number(editState.montantAcompte) || 0)), cfg)}
                  </p>
                </div>
              )}
              <div>
                <label style={labelStyle}>Mode de paiement</label>
                <select value={editState.modePaiement} onChange={e => setEditState(s => s ? { ...s, modePaiement: e.target.value } : s)} style={inputStyle}>
                  {MODE_PAIEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setEditState(null)} className={styles.btn} style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
                <button type="button" onClick={submitEdit} disabled={editState.saving} className={`${styles.btn} ${styles.primary}`} style={{ flex: 1, justifyContent: 'center' }}>
                  {editState.saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
