/**
 * VentesPage — sales register content
 * Mount via BoutiqueShell (page id: 'ventes') or standalone.
 * Self-fetching (own period/filters/pagination) — /api/admin/ventes/factures.
 */
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Sale } from './types';
import { PAYMENT_STYLE } from './sample-data';
import { mapFacture, type ApiFacture, type ApiPaymentMode } from './sale-mapping';
import { DownloadIcon, PlusIcon, FilterIcon, PrinterIcon, TrendIcon } from './icons';
import Sparkline from './Sparkline';
import styles from './Boutique.module.css';
import { useBoutiqueConfig, fmtNum, fmtAmount } from './BoutiqueSettingsContext';
import BoutiqueDocPrint, { type PrintItem } from '@/components/admin/BoutiqueDocPrint';

interface ApiFactureItem { nom: string; reference?: string; qty: number; prix: number; total: number; }
interface ApiFactureDetail {
  reference: string; client_nom: string; client_tel: string | null;
  items: string; sous_total: number; remise: number; total: number;
  mode_paiement: string | null; statut_paiement: string | null;
  adresse_livraison: string | null; created_at: string;
}

const LIMIT = 20;
type Period = 'today' | 'week' | 'month' | 'all';
const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui", week: 'Cette semaine', month: 'Ce mois', all: 'Tout',
};
const PAYMENT_OPTIONS: { value: NonNullable<ApiPaymentMode>; label: string }[] = [
  { value: 'especes',           label: 'Espèces' },
  { value: 'moov_money',        label: 'Moov Money' },
  { value: 'tmoney',            label: 'T-Money' },
  { value: 'virement_bancaire', label: 'Virement bancaire' },
  { value: 'wave',              label: 'Wave' },
];

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
  let items: ApiFactureItem[] = [];
  try { items = typeof f.items === 'string' ? JSON.parse(f.items) : (f.items ?? []); }
  catch { items = []; }
  const printItems: PrintItem[] = items.map(i => ({
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
  const [modePaiement, setModePaiement] = useState('');
  const [clientInput, setClientInput]   = useState('');
  const [clientQuery, setClientQuery]   = useState('');
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
  const [printError, setPrintError] = useState('');

  // Debounce the client text filter before it triggers a fetch
  useEffect(() => {
    const t = setTimeout(() => { setClientQuery(clientInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [clientInput]);

  useEffect(() => { setPage(1); }, [period, modePaiement]);

  const fetchAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);

    const params = new URLSearchParams();
    params.set('limit', String(LIMIT));
    params.set('offset', String((page - 1) * LIMIT));
    if (modePaiement) params.set('mode_paiement', modePaiement);
    if (clientQuery)  params.set('client', clientQuery);
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

    return () => controller.abort();
  }, [period, page, modePaiement, clientQuery]);

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

  async function handlePrint(numericId: number) {
    setPrintError('');
    try {
      const res = await fetch(`/api/admin/ventes/factures/${numericId}`);
      if (!res.ok) { setPrintError('Facture introuvable.'); return; }
      const f: ApiFactureDetail = await res.json();
      setPrintDoc(buildPrintProps(f));
    } catch {
      setPrintError('Erreur réseau.');
    }
  }

  const totalAmount = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const hasActiveFilters = !!modePaiement || !!clientInput;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const PERIOD_TABS: { id: Period; label: string; count: number }[] = [
    { id: 'today', label: PERIOD_LABELS.today, count: periodCounts.today },
    { id: 'week',  label: PERIOD_LABELS.week,  count: periodCounts.week },
    { id: 'month', label: PERIOD_LABELS.month, count: periodCounts.month },
    { id: 'all',   label: PERIOD_LABELS.all,   count: periodCounts.all },
  ];

  function dayKpi(label: string, jour: number, hier: number, color: string, sparkBase: number[]) {
    const delta = jour - hier;
    return {
      label, value: fmtNum(jour, cfg), unit: cfg.symbol,
      delta: `${delta >= 0 ? '+' : ''}${fmtNum(delta, cfg)}`,
      deltaColor: delta >= 0 ? '#2D6A4F' : '#9C3A14',
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

      {printError && (
        <p style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>{printError}</p>
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

      <div className={styles.toolbar}>
        {hasActiveFilters ? (
          <button type="button" className={styles.chip} onClick={() => { setModePaiement(''); setClientInput(''); }}>
            × Réinitialiser
          </button>
        ) : (
          <span className={styles.chip} style={{ cursor: 'default' }}><FilterIcon size={12} /> Filtres</span>
        )}
        <select
          className={styles.chip}
          value={modePaiement}
          onChange={e => setModePaiement(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="">Paiement</option>
          {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="text"
          className={styles.chip}
          placeholder="Client…"
          value={clientInput}
          onChange={e => setClientInput(e.target.value)}
          style={{ minWidth: 120 }}
        />
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date &amp; heure</th>
                <th>Client</th>
                <th>Articles</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Paiement</th>
                <th>Vendeur</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Aucune vente pour cette période/ces filtres</td></tr>
              )}
              {items.map(s => (
                <tr key={s.id}>
                  <td><span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12.5, fontWeight: 500 }}>{s.id}</span></td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{s.time}</td>
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
                  <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.items}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>{fmtAmount(s.amount, cfg)}</td>
                  <td><span className={styles.tag} style={PAYMENT_STYLE[s.payment]}>{s.payment}</span></td>
                  <td style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {s.vendeur ?? '—'}
                  </td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu} title="Imprimer le reçu" onClick={() => handlePrint(s.numericId)}>
                      <PrinterIcon size={14} />
                    </button>
                  </td>
                </tr>
              ))}
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
    </>
  );
}
