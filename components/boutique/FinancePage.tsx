'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DownloadIcon, PlusIcon } from './icons';
import { useAdminSSE } from '@/components/admin/useAdminSSE';
import styles from './Boutique.module.css';

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

const fmt = (n: number) => n.toLocaleString('fr-FR');

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
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ─── WalletStrip ───────────────────────────────────────────── */

function WalletStrip({ wallets, loading }: { wallets: Wallet[]; loading: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = wallets.reduce((s, w) => s + w.solde, 0);

  return (
    <div style={{
      display: 'flex',
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border, #E8E1D4)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Total */}
      <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', minWidth: 200, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>
          Total caisse
        </div>
        <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 26, fontWeight: 600, letterSpacing: '-.03em', color: 'var(--ink)', lineHeight: 1 }}>
          {loading ? '—' : fmt(total)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          FCFA · {wallets.length} comptes
        </div>
      </div>

      {/* 4 wallets */}
      {wallets.map((w, i) => (
        <div
          key={w.id}
          onMouseEnter={() => setHovered(w.id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            flex: 1,
            padding: '20px 18px',
            borderRight: i < wallets.length - 1 ? '1px solid var(--border)' : 'none',
            background: hovered === w.id ? 'var(--bg-2, #F4EFE6)' : 'transparent',
            transition: 'background .12s',
            cursor: 'default',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.dot, flexShrink: 0 }} />
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {w.label}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 16, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-.01em' }}>
            {loading ? '—' : fmt(w.solde)}
            <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 3 }}>FCFA</span>
          </div>
          {!loading && (
            <div style={{ fontSize: 10.5, marginTop: 4, fontWeight: 500, color: w.delta >= 0 ? '#2D6A4F' : '#C9601E' }}>
              {w.delta >= 0 ? '+' : ''}{fmt(w.delta)} auj.
            </div>
          )}
        </div>
      ))}
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

function MouvementModal({ onClose, onSaved }: ModalProps) {
  const [type,    setType]    = useState('depense');
  const [mode,    setMode]    = useState('especes');
  const [montant, setMontant] = useState('');
  const [label,   setLabel]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) { setErr('Montant invalide'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, mode_paiement: mode, description: label || null, montant: Number(montant), date_entree: new Date().toISOString().slice(0, 10) }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? 'Erreur'); setSaving(false); return; }
      onSaved(); onClose();
    } catch { setErr('Erreur réseau'); setSaving(false); }
  }

  return <ModalShell title="Mouvement de fonds" onClose={onClose}>
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModalField label="TYPE">
        <div style={{ display: 'flex', gap: 6 }}>
          {TYPES_MVMT.map(t => (
            <button key={t.v} type="button" onClick={() => setType(t.v)}
              style={{ flex: 1, padding: '7px 8px', borderRadius: 8, border: `1.5px solid ${type === t.v ? 'var(--accent)' : 'var(--border)'}`, background: type === t.v ? '#FBE9D6' : 'transparent', fontSize: 12, fontWeight: type === t.v ? 600 : 400, color: type === t.v ? 'var(--accent)' : 'var(--ink)', cursor: 'pointer' }}>
              {t.l}
            </button>
          ))}
        </div>
      </ModalField>
      <ModalField label="MONTANT (FCFA)">
        <input type="number" min="1" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 5000" style={inStyle} />
      </ModalField>
      <ModalField label="COMPTE">
        <select value={mode} onChange={e => setMode(e.target.value)} style={inStyle}>
          {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </ModalField>
      <ModalField label="LIBELLÉ (optionnel)">
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Achat fournitures" style={inStyle} />
      </ModalField>
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
      <ModalActions onClose={onClose} saving={saving} label="Enregistrer" />
    </form>
  </ModalShell>;
}

function TransfertModal({ onClose, onSaved }: ModalProps) {
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
      // Two entries: sortie from + entrée to
      await Promise.all([
        fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'transfert', mode_paiement: from, description: label || `Transfert → ${COMPTE_LABEL[to]}`, montant: Number(montant), date_entree: new Date().toISOString().slice(0, 10) }) }),
        fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'rentree', mode_paiement: to, description: label || `Transfert ← ${COMPTE_LABEL[from]}`, montant: Number(montant), date_entree: new Date().toISOString().slice(0, 10) }) }),
      ]);
      onSaved(); onClose();
    } catch { setErr('Erreur réseau'); setSaving(false); }
  }

  return <ModalShell title="Transfert entre comptes" onClose={onClose}>
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModalField label="DE">
        <select value={from} onChange={e => setFrom(e.target.value)} style={inStyle}>
          {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </ModalField>
      <ModalField label="VERS">
        <select value={to} onChange={e => setTo(e.target.value)} style={inStyle}>
          {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </ModalField>
      <ModalField label="MONTANT (FCFA)">
        <input type="number" min="1" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 15000" style={inStyle} />
      </ModalField>
      <ModalField label="LIBELLÉ (optionnel)">
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Dépôt mobile money" style={inStyle} />
      </ModalField>
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
      <ModalActions onClose={onClose} saving={saving} label="Transférer" />
    </form>
  </ModalShell>;
}

/* ── Modal primitives ── */
const inStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' };

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function ModalActions({ onClose, saving, label }: { onClose: () => void; saving: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
      <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
      <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Enregistrement…' : label}
      </button>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

const PAGE_SIZE = 20;

type ModalKind = 'mouvement' | 'transfert' | null;

export default function FinancePage() {
  const [day,     setDay]     = useState<DayStats | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<ModalKind>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance/dashboard');
      if (!res.ok) return;
      const data = await res.json();
      setDay(data.day);
      setWallets(data.wallets ?? []);
    } catch { /* silent */ }
  }, []);

  const fetchEntries = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/admin/finance?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`);
      if (!res.ok) return;
      const data = await res.json();
      setEntries(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { /* silent */ }
  }, []);

  const loadAll = useCallback(async (p = 0) => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchEntries(p)]);
    setLoading(false);
  }, [fetchDashboard, fetchEntries]);

  useEffect(() => { loadAll(0); }, [loadAll]);

  const { subscribe } = useAdminSSE();
  useEffect(() => subscribe(e => {
    if (e.type === 'finance' || e.type === 'vente') loadAll(page);
  }), [subscribe, loadAll, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function goPage(p: number) { setPage(p); fetchEntries(p); }

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
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setModal('mouvement')}>
            <PlusIcon size={14} /> Mouvement
          </button>
        </div>
      </div>

      {/* WalletStrip */}
      <WalletStrip wallets={wallets.length ? wallets : [
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
            <div className={styles.kpiValue}>{loading ? '—' : fmt(day?.entrees_jour ?? 0)}</div>
            <div className={styles.kpiUnit}>F</div>
          </div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>ventes encaissées</div></div>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}><div className={styles.kpiLabel}>Sorties du jour</div></div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{loading ? '—' : fmt(day?.sorties_jour ?? 0)}</div>
            <div className={styles.kpiUnit}>F</div>
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
            <div className={styles.kpiValue}>{loading ? '—' : fmt(day?.benefice_jour ?? 0)}</div>
            <div className={styles.kpiUnit}>F</div>
          </div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>vs hier</div></div>
        </div>
      </div>

      {/* Table mouvements */}
      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; heure</th>
                <th>Compte</th>
                <th>Type</th>
                <th>Libellé</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Chargement…</td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Aucun mouvement</td></tr>
              )}
              {!loading && entries.map(m => {
                const sign   = entrySign(m.type);
                const amount = sign * m.montant;
                const mp     = m.mode_paiement ?? '';
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
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13, fontWeight: 600, color: amount >= 0 ? 'var(--ok)' : 'var(--danger)', whiteSpace: 'nowrap' }}>
                      {amount >= 0 ? '+' : ''}{fmt(amount)} F
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

      {modal === 'mouvement'  && <MouvementModal  onClose={() => setModal(null)} onSaved={() => loadAll(page)} />}
      {modal === 'transfert'  && <TransfertModal  onClose={() => setModal(null)} onSaved={() => loadAll(page)} />}
    </>
  );
}
