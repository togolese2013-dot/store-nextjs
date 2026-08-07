'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DownloadIcon, PlusIcon, SearchIcon, PencilIcon, TrashIcon, TrendIcon } from './icons';
import { useAdminSSE } from '@/components/admin/useAdminSSE';
import Sparkline from './Sparkline';
import styles from './Boutique.module.css';
import '@/components/admin/sale-modal.css';
import { useBoutiqueConfig, fmtNum, type BoutiqueConfig } from './BoutiqueSettingsContext';
import { formatDateTime as sharedFormatDateTime } from '@/lib/format-date';

/* ─── Types ─────────────────────────────────────────────────── */

interface Wallet {
  id:    'especes' | 'mixx' | 'moov' | 'virement';
  label: string;
  solde: number;
  delta: number;
  dot:   string;
}

interface DayStats {
  entrees_jour:  number;
  sorties_jour:  number;
  benefice_jour: number;
  benefice_hier: number;
  solde_caisse:  number;
}

interface FinanceEntry {
  id:            number;
  reference:     string;
  type:          string;
  mode_paiement: string | null;
  categorie:     string | null;
  description:   string | null;
  montant:       number;
  date_entree:   string;
  admin_nom:     string | null;
  created_at:    string;
}

/* ─── Helpers ───────────────────────────────────────────────── */


function typeLabel(type: string): string {
  switch (type) {
    case 'vente':    return 'Vente';
    case 'depense':  return 'Sortie';
    case 'caisse':   return 'Ouverture';
    case 'rentree':  return 'Entrée';
    case 'transfert':return 'Transfert';
    default:         return type;
  }
}

const TYPE_STYLE: Record<string, React.CSSProperties> = {
  vente:     { background: 'var(--ok-bg)',     color: 'var(--ok)'     },
  rentree:   { background: 'var(--ok-bg)',     color: 'var(--ok)'     },
  caisse:    { background: 'var(--blue-bg)',   color: 'var(--blue)'   },
  depense:   { background: 'var(--danger-bg)', color: 'var(--danger)' },
  transfert: { background: 'var(--purple-bg)', color: 'var(--purple)' },
};

const COMPTE_STYLE: Record<string, { bg: string; color: string }> = {
  especes:           { bg: '#DDEBE2', color: '#2D6A4F' },
  mixx_by_yas:       { bg: '#FBE9D6', color: '#C9601E' },
  moov_money:        { bg: '#E8F0F7', color: '#3B6A8F' },
  virement_bancaire: { bg: '#E6E0F0', color: '#5C4A88' },
};

const COMPTE_LABEL: Record<string, string> = {
  especes:           'Espèces',
  mixx_by_yas:       'Mixx by Yas',
  moov_money:        'Moov Money',
  virement_bancaire: 'Virement bancaire',
};

function entrySign(type: string): number {
  return (type === 'depense' || type === 'transfert') ? -1 : 1;
}

function formatDate(iso: string): string {
  return sharedFormatDateTime(iso);
}

/* ─── WalletCards — 5 cartes séparées (Total + comptes) ───────── */

function walletPct(solde: number, delta: number): number | null {
  const hier = solde - delta;
  if (hier !== 0) return Math.round((delta / hier) * 100);
  return solde === 0 ? 0 : null;
}

function WalletCards({ wallets, loading }: { wallets: Wallet[]; loading: boolean }) {
  const cfg = useBoutiqueConfig();
  const total      = wallets.reduce((s, w) => s + w.solde, 0);
  const totalDelta = wallets.reduce((s, w) => s + w.delta, 0);
  const totalPct   = walletPct(total, totalDelta);

  return (
    <div className={styles.kpis5}>
      <div className={styles.kpi}>
        <div className={styles.kpiHead}>
          <div className={styles.kpiLabel}>Total caisse</div>
          {!loading && totalPct !== null && (
            <div className={styles.kpiDelta} style={{ color: totalPct >= 0 ? '#2D6A4F' : '#C9601E' }}>
              <TrendIcon size={10} />{totalPct >= 0 ? '+' : ''}{totalPct}%
            </div>
          )}
        </div>
        <div className={styles.kpiValueRow}>
          <div className={styles.kpiValue}>{loading ? '—' : fmtNum(total, cfg)}</div>
          <div className={styles.kpiUnit}>{cfg.symbol}</div>
        </div>
        <div className={styles.kpiFoot}>
          <div className={styles.kpiSub}>{wallets.length} comptes</div>
          {!loading && <Sparkline data={[30, 34, 33, 37, 40, 42, 45, 44, 48, Math.abs(total) % 60 || 50]} color="#3B6A8F" />}
        </div>
      </div>

      {wallets.map(w => {
        const pct = walletPct(w.solde, w.delta);
        return (
          <div key={w.id} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: w.dot, flexShrink: 0 }} />
                {w.label}
              </div>
              {!loading && pct !== null && (
                <div className={styles.kpiDelta} style={{ color: pct >= 0 ? '#2D6A4F' : '#C9601E' }}>
                  <TrendIcon size={10} />{pct >= 0 ? '+' : ''}{pct}%
                </div>
              )}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{loading ? '—' : fmtNum(w.solde, cfg)}</div>
              <div className={styles.kpiUnit}>{cfg.symbol}</div>
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub} style={{ color: loading ? undefined : (w.delta >= 0 ? '#2D6A4F' : '#C9601E') }}>
                {loading ? '—' : `${w.delta >= 0 ? '+' : ''}${fmtNum(w.delta, cfg)} auj.`}
              </div>
              {!loading && <Sparkline data={[8, 10, 9, 12, 14, 13, 16, 18, 17, Math.abs(w.solde) % 30 || 20]} color={w.dot} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Modals ────────────────────────────────────────────────── */

const TYPES_MVMT = [
  { v: 'depense',  l: 'Sortie / Dépense' },
  { v: 'rentree',  l: 'Entrée de fonds' },
  { v: 'caisse',   l: 'Ouverture caisse' },
];
const TYPES_XFER = [
  { v: 'transfert', l: 'Transfert entre comptes' },
];
const MODES = [
  { v: 'especes',           l: 'Espèces' },
  { v: 'mixx_by_yas',       l: 'Mixx by Yas' },
  { v: 'moov_money',        l: 'Moov Money' },
  { v: 'virement_bancaire', l: 'Virement bancaire' },
];

interface ModalProps { onClose: () => void; onSaved: () => void; }
interface MouvementModalProps extends ModalProps { entry?: FinanceEntry | null; }

const ChevronIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function MouvementModal({ entry, onClose, onSaved }: MouvementModalProps) {
  const cfg = useBoutiqueConfig();
  const isEdit = !!entry;
  const [type,    setType]    = useState(entry?.type ?? 'depense');
  const [mode,    setMode]    = useState(entry?.mode_paiement ?? 'especes');
  const [montant, setMontant] = useState(entry ? String(entry.montant) : '');
  const [label,   setLabel]   = useState(entry?.description ?? '');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) { setErr('Montant invalide'); return; }
    setSaving(true); setErr('');
    try {
      const body = { type, mode_paiement: mode, description: label || null, montant: Number(montant), date_entree: new Date().toISOString().slice(0, 10) };
      const res = isEdit
        ? await fetch(`/api/admin/finance/${entry!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? 'Erreur'); setSaving(false); return; }
      onSaved(); onClose();
    } catch { setErr('Erreur réseau'); setSaving(false); }
  }

  return (
    <>
      <div className="sm-backdrop" onMouseDown={onClose} />
      <div className="sm-drawer" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>
        <div className="sm-head">
          <div>
            <div className="sm-eyb">Boutique · Finance</div>
            <div className="sm-title">{isEdit ? 'Modifier le' : 'Mouvement de'} <span className="sm-serif">{isEdit ? 'mouvement' : 'fonds'}</span></div>
          </div>
          <button className="sm-x" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'contents' }}>
          <div className="sm-body">
            {!isEdit && (
              <div className="sm-field">
                <label className="sm-label">Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {TYPES_MVMT.map(t => (
                    <button key={t.v} type="button" onClick={() => setType(t.v)}
                      style={{ flex: 1, padding: '8px 6px', borderRadius: 9, border: `1.5px solid ${type === t.v ? 'var(--accent)' : 'var(--border)'}`, background: type === t.v ? '#FBE9D6' : 'var(--surface)', fontSize: 12, fontWeight: type === t.v ? 600 : 400, color: type === t.v ? 'var(--accent)' : 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="sm-field">
              <label className="sm-label">Montant</label>
              <div className="sm-price-wrap">
                <input className="sm-in mono" type="number" min="1" value={montant}
                  onChange={e => setMontant(e.target.value)} placeholder="0" />
                <span className="sm-suffix">{cfg.symbol}</span>
              </div>
            </div>

            <div className="sm-field">
              <label className="sm-label">Compte</label>
              <div className="sm-select-wrap">
                <select className="sm-in" value={mode} onChange={e => setMode(e.target.value)}>
                  {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
                <span className="sm-caret"><ChevronIcon /></span>
              </div>
            </div>

            <div className="sm-field">
              <label className="sm-label">Libellé <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span></label>
              <input className="sm-in" type="text" value={label}
                onChange={e => setLabel(e.target.value)} placeholder="Ex: Achat fournitures" />
            </div>

            {err && <div className="sm-err">{err}</div>}
          </div>

          <div className="sm-foot">
            <button type="button" className="sm-btn" onClick={onClose}>Annuler</button>
            <button type="submit" className="sm-btn sm-pri" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function TransfertModal({ onClose, onSaved }: ModalProps) {
  const cfg = useBoutiqueConfig();
  const [from,    setFrom]    = useState('especes');
  const [to,      setTo]      = useState('mixx_by_yas');
  const [montant, setMontant] = useState('');
  const [label,   setLabel]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) { setErr('Montant invalide'); return; }
    if (from === to) { setErr('Comptes identiques'); return; }
    setSaving(true); setErr('');
    try {
      await Promise.all([
        fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'transfert', mode_paiement: from, description: label || `Transfert → ${COMPTE_LABEL[to]}`, montant: Number(montant), date_entree: new Date().toISOString().slice(0, 10) }) }),
        fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'rentree', mode_paiement: to, description: label || `Transfert ← ${COMPTE_LABEL[from]}`, montant: Number(montant), date_entree: new Date().toISOString().slice(0, 10) }) }),
      ]);
      onSaved(); onClose();
    } catch { setErr('Erreur réseau'); setSaving(false); }
  }

  return (
    <>
      <div className="sm-backdrop" onMouseDown={onClose} />
      <div className="sm-drawer" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>
        <div className="sm-head">
          <div>
            <div className="sm-eyb">Boutique · Finance</div>
            <div className="sm-title">Transfert entre <span className="sm-serif">comptes</span></div>
          </div>
          <button className="sm-x" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'contents' }}>
          <div className="sm-body">
            <div className="sm-field">
              <label className="sm-label">De</label>
              <div className="sm-select-wrap">
                <select className="sm-in" value={from} onChange={e => setFrom(e.target.value)}>
                  {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
                <span className="sm-caret"><ChevronIcon /></span>
              </div>
            </div>

            <div className="sm-field">
              <label className="sm-label">Vers</label>
              <div className="sm-select-wrap">
                <select className="sm-in" value={to} onChange={e => setTo(e.target.value)}>
                  {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
                <span className="sm-caret"><ChevronIcon /></span>
              </div>
            </div>

            <div className="sm-field">
              <label className="sm-label">Montant</label>
              <div className="sm-price-wrap">
                <input className="sm-in mono" type="number" min="1" value={montant}
                  onChange={e => setMontant(e.target.value)} placeholder="0" />
                <span className="sm-suffix">{cfg.symbol}</span>
              </div>
            </div>

            <div className="sm-field">
              <label className="sm-label">Libellé <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span></label>
              <input className="sm-in" type="text" value={label}
                onChange={e => setLabel(e.target.value)} placeholder="Ex: Dépôt mobile money" />
            </div>

            {err && <div className="sm-err">{err}</div>}
          </div>

          <div className="sm-foot">
            <button type="button" className="sm-btn" onClick={onClose}>Annuler</button>
            <button type="submit" className="sm-btn sm-pri" disabled={saving}>
              {saving ? 'Transfert…' : 'Transférer'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

const PAGE_SIZE = 20;

type ModalKind = 'mouvement' | 'transfert' | null;
type Tab = 'tous' | 'depense' | 'rentree' | 'transfert';

const TABS: { id: Tab; label: string }[] = [
  { id: 'tous',      label: 'Tout' },
  { id: 'depense',   label: 'Dépenses' },
  { id: 'rentree',   label: 'Rentrées' },
  { id: 'transfert', label: 'Transferts' },
];

export default function FinancePage() {
  const cfg = useBoutiqueConfig();
  const [day,     setDay]     = useState<DayStats | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [tab,     setTab]     = useState<Tab>('tous');
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<ModalKind>(null);
  const [editEntry, setEditEntry] = useState<FinanceEntry | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance/dashboard');
      if (!res.ok) return;
      const data = await res.json();
      setDay(data.day);
      setWallets(data.wallets ?? []);
    } catch { /* silent */ }
  }, []);

  const fetchEntries = useCallback(async (p: number, t: Tab, q: string) => {
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(p * PAGE_SIZE) });
      if (t !== 'tous') params.set('type', t);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/admin/finance?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setEntries(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { /* silent */ }
  }, []);

  const loadAll = useCallback(async (p = 0, t: Tab = 'tous', q = '') => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchEntries(p, t, q)]);
    setLoading(false);
  }, [fetchDashboard, fetchEntries]);

  useEffect(() => { loadAll(0, tab, search); }, [loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const { subscribe } = useAdminSSE();
  useEffect(() => subscribe(e => {
    if (e.type === 'finance' || e.type === 'vente') loadAll(page, tab, search);
  }), [subscribe, loadAll, page, tab, search]);

  function goPage(p: number) { setPage(p); fetchEntries(p, tab, search); }
  function changeTab(t: Tab) { setTab(t); setPage(0); fetchEntries(0, t, search); }
  function changeSearch(q: string) { setSearch(q); setPage(0); fetchEntries(0, tab, q); }

  async function handleDelete(entry: FinanceEntry) {
    if (!window.confirm(`Supprimer "${entry.description ?? entry.reference}" (${fmtNum(entry.montant, cfg)} ${cfg.symbol}) ?`)) return;
    await fetch(`/api/admin/finance/${entry.id}`, { method: 'DELETE' });
    loadAll(page, tab, search);
  }

  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const deltaColor  = day ? (day.benefice_jour >= day.benefice_hier ? 'var(--ok)' : 'var(--danger)') : 'var(--muted)';
  const deltaLabel  = day && day.benefice_hier > 0
    ? `${day.benefice_jour >= day.benefice_hier ? '+' : ''}${Math.round((day.benefice_jour - day.benefice_hier) / Math.max(day.benefice_hier, 1) * 100)}%`
    : null;

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Finance</div>
          <h1 className={styles.title}>Caisse &amp; <span className={styles.serif}>finance</span></h1>
          <p className={styles.subtitle}>Trésorerie répartie en 4 comptes · mouvements du jour</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Rapport</button>
          <button type="button" className={styles.btn} onClick={() => setModal('transfert')}>
            ⇄ Transfert
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => { setEditEntry(null); setModal('mouvement'); }}>
            <PlusIcon size={14} /> Mouvement
          </button>
        </div>
      </div>

      {/* WalletCards */}
      <WalletCards wallets={wallets.length ? wallets : [
        { id: 'especes',  label: 'Espèces',           solde: 0, delta: 0, dot: '#2D6A4F' },
        { id: 'mixx',     label: 'Mixx by Yas',       solde: 0, delta: 0, dot: '#C9601E' },
        { id: 'moov',     label: 'Moov Money',        solde: 0, delta: 0, dot: '#3B6A8F' },
        { id: 'virement', label: 'Virement bancaire', solde: 0, delta: 0, dot: '#5C4A88' },
      ]} loading={loading} />

      {/* KPIs */}
      <div className={styles.kpis3}>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}><div className={styles.kpiLabel}>Entrées du jour</div></div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{loading ? '—' : fmtNum(day?.entrees_jour ?? 0, cfg)}</div>
            <div className={styles.kpiUnit}>{cfg.symbol}</div>
          </div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>ventes encaissées</div></div>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}><div className={styles.kpiLabel}>Sorties du jour</div></div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{loading ? '—' : fmtNum(day?.sorties_jour ?? 0, cfg)}</div>
            <div className={styles.kpiUnit}>{cfg.symbol}</div>
          </div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>dépenses</div></div>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiLabel}>Bénéfice net</div>
            {deltaLabel && (
              <div className={styles.kpiDelta} style={{ color: deltaColor }}>{deltaLabel}</div>
            )}
          </div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{loading ? '—' : fmtNum(day?.benefice_jour ?? 0, cfg)}</div>
            <div className={styles.kpiUnit}>{cfg.symbol}</div>
          </div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>vs hier</div></div>
        </div>
      </div>

      {/* Tabs + recherche */}
      <div className={styles.tabsRow}>
        {TABS.map(t => (
          <button key={t.id} type="button" className={`${styles.tab} ${tab === t.id ? styles.active : ''}`} onClick={() => changeTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '12px 28px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ position: 'relative', width: 220 }}>
          <input
            value={search}
            onChange={e => changeSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg-2,#f9f9f7)', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
            <SearchIcon size={13} />
          </span>
        </div>
      </div>

      {/* Table mouvements */}
      <div className={styles.tableWrap} style={{ marginTop: 12 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; heure</th>
                <th>Compte</th>
                <th>Type</th>
                <th>Libellé</th>
                <th>Utilisateur</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Chargement…</td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Aucun mouvement</td></tr>
              )}
              {!loading && entries.map(m => {
                const sign   = entrySign(m.type);
                const amount = sign * m.montant;
                const mp     = m.mode_paiement === 'mix_by_yas' ? 'mixx_by_yas' : (m.mode_paiement ?? '');
                const cs     = COMPTE_STYLE[mp];
                const ts     = TYPE_STYLE[m.type] ?? {};
                return (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                      {formatDate(m.date_entree)}
                    </td>
                    <td>
                      {cs ? (
                        <span className={styles.tag} style={{ background: cs.bg, color: cs.color }}>
                          {COMPTE_LABEL[mp] ?? mp}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.tag} style={ts}>{typeLabel(m.type)}</span>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>
                      {m.description ?? m.categorie ?? m.reference}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                      {m.admin_nom ?? '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13, fontWeight: 600, color: amount >= 0 ? 'var(--ok)' : 'var(--danger)', whiteSpace: 'nowrap' }}>
                      {amount >= 0 ? '+' : ''}{fmtNum(amount, cfg)} {cfg.symbol}
                    </td>
                    <td className={styles.actionsCell}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        {m.type !== 'transfert' && (
                          <button type="button" className={styles.rowMenu} title="Modifier" onClick={() => { setEditEntry(m); setModal('mouvement'); }}>
                            <PencilIcon size={14} />
                          </button>
                        )}
                        <button type="button" className={styles.rowMenu} title="Supprimer" onClick={() => handleDelete(m)}>
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
          <span>{total} mouvement{total !== 1 ? 's' : ''}</span>
          {totalPages > 1 && (
            <div className={styles.pager}>
              <button type="button" onClick={() => goPage(Math.max(0, page - 1))} disabled={page === 0}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} type="button" className={i === page ? styles.on : ''} onClick={() => goPage(i)}>{i + 1}</button>
              ))}
              <button type="button" onClick={() => goPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>›</button>
            </div>
          )}
        </div>
      </div>

      {modal === 'mouvement'  && <MouvementModal  entry={editEntry} onClose={() => { setModal(null); setEditEntry(null); }} onSaved={() => loadAll(page, tab, search)} />}
      {modal === 'transfert'  && <TransfertModal  onClose={() => setModal(null)} onSaved={() => loadAll(page, tab, search)} />}
    </>
  );
}
