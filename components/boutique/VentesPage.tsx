/**
 * VentesPage — sales register content
 * Mount via BoutiqueShell (page id: 'ventes') or standalone.
 */
'use client';
import React, { useMemo, useState } from 'react';
import type { Sale } from './types';
import { PAYMENT_STYLE } from './sample-data';
import { DownloadIcon, PlusIcon, FilterIcon, ChevDownIcon, PrinterIcon } from './icons';
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

function isoPrefix(date: Date, unit: 'day' | 'month') {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  if (unit === 'month') return `${y}-${m}`;
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface VentesPageProps {
  sales?: Sale[];
  onNewSale?: () => void;
}

export default function VentesPage({ sales = [], onNewSale }: VentesPageProps) {
  const cfg = useBoutiqueConfig();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [exporting, setExporting] = useState(false);
  const [printDoc, setPrintDoc] = useState<ReturnType<typeof buildPrintProps> | null>(null);
  const [printError, setPrintError] = useState('');

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

  const now = useMemo(() => new Date(), []);
  const todayPfx  = isoPrefix(now, 'day');
  const monthPfx  = isoPrefix(now, 'month');
  const weekStart = startOfWeek(now);

  const filterSales = (s: Sale) => {
    const d = new Date(s.isoDate);
    if (period === 'today') return s.isoDate.startsWith(todayPfx);
    if (period === 'week')  return d >= weekStart;
    return s.isoDate.startsWith(monthPfx);
  };

  const todaySales  = useMemo(() => sales.filter(s => s.isoDate.startsWith(todayPfx)), [sales, todayPfx]);
  const weekSales   = useMemo(() => sales.filter(s => new Date(s.isoDate) >= weekStart), [sales, weekStart]);
  const monthSales  = useMemo(() => sales.filter(s => s.isoDate.startsWith(monthPfx)), [sales, monthPfx]);
  const filtered    = useMemo(() => sales.filter(filterSales), [sales, period, todayPfx, monthPfx, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const caJour     = todaySales.reduce((s, i) => s + i.amount, 0);
  const nbJour     = todaySales.length;
  const panierMoy  = nbJour > 0 ? Math.round(caJour / nbJour) : null;

  const totalDisplay = filtered.reduce((s, i) => s + i.amount, 0);

  const PERIOD_TABS = [
    { id: 'today' as const, label: "Aujourd'hui",   count: todaySales.length },
    { id: 'week'  as const, label: 'Cette semaine', count: weekSales.length },
    { id: 'month' as const, label: 'Ce mois',       count: monthSales.length },
  ];

  const kpis = [
    {
      label: 'CA du jour',
      value: fmtNum(caJour, cfg),
      unit: cfg.symbol,
      sub: `${nbJour} vente${nbJour !== 1 ? 's' : ''} aujourd'hui`,
    },
    {
      label: 'Ventes',
      value: String(filtered.length),
      unit: null,
      sub: period === 'today' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : 'ce mois',
    },
    {
      label: 'Panier moyen',
      value: panierMoy !== null ? fmtNum(panierMoy, cfg) : '—',
      unit: panierMoy !== null ? cfg.symbol : null,
      sub: "aujourd'hui",
    },
  ];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Ventes</div>
          <h1 className={styles.title}>Registre des <span className={styles.serif}>ventes</span></h1>
          <p className={styles.subtitle}>{filtered.length} vente{filtered.length !== 1 ? 's' : ''} · {fmtAmount(totalDisplay, cfg)} encaissés</p>
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

      <div className={styles.kpis3}>
        {kpis.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
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
        <button type="button" className={styles.chip}><FilterIcon size={12} /> Filtres</button>
        <button type="button" className={styles.chip}>Paiement <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Client <ChevDownIcon size={10} /></button>
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
              {filtered.map(s => (
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
          <span>{filtered.length} vente{filtered.length !== 1 ? 's' : ''}</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>

      {printDoc && (
        <BoutiqueDocPrint {...printDoc} onClose={() => setPrintDoc(null)} />
      )}
    </>
  );
}
