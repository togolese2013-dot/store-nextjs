'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DownloadIcon, PlusIcon, TrendIcon } from './icons';
import { useAdminSSE } from '@/components/admin/useAdminSSE';
import styles from './Boutique.module.css';

/* ─── Types ─────────────────────────────────────────────────── */

interface DayStats {
  entrees_jour:  number;
  sorties_jour:  number;
  benefice_jour: number;
  benefice_hier: number;
  solde_caisse:  number;
}

interface WeekDay {
  day:   string;
  ca:    number;
  today: boolean;
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

function typeStyle(type: string): React.CSSProperties {
  switch (type) {
    case 'vente':
    case 'caisse':
    case 'rentree':
      return { background: 'var(--ok-bg)',     color: 'var(--ok)' };
    case 'depense':
      return { background: 'var(--danger-bg)', color: 'var(--danger)' };
    case 'transfert':
      return { background: 'var(--blue-bg)',   color: 'var(--blue)' };
    default:
      return {};
  }
}

function entrySign(type: string): number {
  return (type === 'depense' || type === 'transfert') ? -1 : 1;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Modal Mouvement Manuel ────────────────────────────────── */

interface ManualModalProps {
  onClose:  () => void;
  onSaved:  () => void;
}

const TYPES    = [
  { v: 'depense',  l: 'Dépense / Sortie' },
  { v: 'rentree',  l: 'Entrée de fonds' },
  { v: 'caisse',   l: 'Ouverture caisse' },
  { v: 'transfert',l: 'Transfert de compte' },
];
const MODES    = [
  { v: 'especes',          l: 'Espèces' },
  { v: 'moov_money',       l: 'Moov Money' },
  { v: 'tmoney',           l: 'T-Money' },
  { v: 'virement_bancaire',l: 'Virement bancaire' },
];

function ManualModal({ onClose, onSaved }: ManualModalProps) {
  const [type,    setType]    = useState('depense');
  const [mode,    setMode]    = useState('especes');
  const [montant, setMontant] = useState('');
  const [label,   setLabel]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) { setErr('Montant invalide'); return; }
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          mode_paiement: mode,
          description:   label || null,
          montant:       Number(montant),
          date_entree:   new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? 'Erreur'); setSaving(false); return; }
      onSaved();
      onClose();
    } catch {
      setErr('Erreur réseau');
      setSaving(false);
    }
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div style={{ position:'relative',background:'var(--surface)',borderRadius:14,padding:28,width:400,maxWidth:'90vw',boxShadow:'0 8px 40px rgba(0,0,0,.18)' }}>
        <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>Mouvement manuel</h3>
        <form onSubmit={submit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4 }}>TYPE</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',fontSize:14 }}>
              {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4 }}>MODE DE PAIEMENT</label>
            <select value={mode} onChange={e => setMode(e.target.value)} style={{ width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',fontSize:14 }}>
              {MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4 }}>MONTANT (FCFA)</label>
            <input
              type="number" min="1" value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="Ex: 5000"
              style={{ width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',fontSize:15,boxSizing:'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4 }}>LIBELLÉ (optionnel)</label>
            <input
              type="text" value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex: Achat fournitures"
              style={{ width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',fontSize:14,boxSizing:'border-box' }}
            />
          </div>
          {err && <div style={{ color:'var(--danger)',fontSize:13 }}>{err}</div>}
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid var(--border)',background:'transparent',cursor:'pointer',fontSize:14 }}>Annuler</button>
            <button type="submit" disabled={saving} style={{ padding:'8px 18px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600,opacity:saving?0.7:1 }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

const PAGE_SIZE = 20;

export default function FinancePage() {
  const [day,     setDay]     = useState<DayStats | null>(null);
  const [week,    setWeek]    = useState<WeekDay[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance/dashboard');
      if (!res.ok) return;
      const data = await res.json();
      setDay(data.day);
      setWeek(data.week ?? []);
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

  // SSE auto-refresh on finance or vente events
  const { subscribe } = useAdminSSE();
  useEffect(() => subscribe(e => {
    if (e.type === 'finance' || e.type === 'vente') loadAll(page);
  }), [subscribe, loadAll, page]);

  function goPage(p: number) {
    setPage(p);
    fetchEntries(p);
  }

  const maxCa   = week.length ? Math.max(...week.map(w => w.ca), 1) : 1;
  const weekTotal = week.reduce((s, w) => s + w.ca, 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const deltaColor = day
    ? day.benefice_jour >= day.benefice_hier ? 'var(--ok)' : 'var(--danger)'
    : 'var(--muted)';

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Finance</div>
          <h1 className={styles.title}>Caisse &amp; <span className={styles.serif}>finance</span></h1>
          <p className={styles.subtitle}>Solde actuel · mouvements du jour · CA semaine en cours</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Rapport</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setModal(true)}>
            <PlusIcon size={14} /> Mouvement manuel
          </button>
        </div>
      </div>

      {/* Cash hero */}
      <div className={styles.caisseHero}>
        <div>
          <div className={styles.caisseLabel}>Solde caisse actuel</div>
          <div className={styles.caisseValue}>
            {loading ? '—' : fmt(day?.solde_caisse ?? 0)} F
          </div>
          <div className={styles.caisseSub}>Espèces en caisse</div>
        </div>
        <div>
          <div className={styles.weekHead}>CA semaine en cours</div>
          <div className={styles.weekBars}>
            {week.map(w => (
              <div key={w.day} className={styles.weekBarWrap}>
                <div
                  className={`${styles.weekBar} ${w.today ? styles.today : ''}`}
                  style={{ height: `${maxCa > 0 ? Math.max((w.ca / maxCa) * 80, w.ca > 0 ? 4 : 0) : 4}px` }}
                />
                <div className={styles.weekLabel}>{w.day}</div>
              </div>
            ))}
          </div>
          <div className={styles.weekTotal}>CA sem. : {fmt(weekTotal)} F</div>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiLabel}>Entrées du jour</div>
          </div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{loading ? '—' : fmt(day?.entrees_jour ?? 0)}</div>
            <div className={styles.kpiUnit}>F</div>
          </div>
          <div className={styles.kpiFoot}>
            <div className={styles.kpiSub}>ventes encaissées</div>
          </div>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiLabel}>Sorties du jour</div>
          </div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{loading ? '—' : fmt(day?.sorties_jour ?? 0)}</div>
            <div className={styles.kpiUnit}>F</div>
          </div>
          <div className={styles.kpiFoot}>
            <div className={styles.kpiSub}>dépenses</div>
          </div>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiLabel}>Bénéfice net</div>
            {day && (
              <div className={styles.kpiDelta} style={{ color: deltaColor }}>
                <TrendIcon size={10} />
                {day.benefice_hier > 0
                  ? `${day.benefice_jour >= day.benefice_hier ? '+' : ''}${Math.round((day.benefice_jour - day.benefice_hier) / Math.max(day.benefice_hier, 1) * 100)}%`
                  : '—'}
              </div>
            )}
          </div>
          <div className={styles.kpiValueRow}>
            <div className={styles.kpiValue}>{loading ? '—' : fmt(day?.benefice_jour ?? 0)}</div>
            <div className={styles.kpiUnit}>F</div>
          </div>
          <div className={styles.kpiFoot}>
            <div className={styles.kpiSub}>vs hier</div>
          </div>
        </div>
      </div>

      {/* Table mouvements */}
      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; heure</th>
                <th>Type</th>
                <th>Libellé</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th style={{ textAlign: 'right' }}>Réf.</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>Chargement…</td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>Aucun mouvement</td></tr>
              )}
              {!loading && entries.map(m => {
                const sign = entrySign(m.type);
                const amount = sign * m.montant;
                return (
                  <tr key={m.id}>
                    <td style={{ color:'var(--muted)', fontSize:12.5, whiteSpace:'nowrap' }}>
                      {formatDate(m.date_entree)}
                    </td>
                    <td>
                      <span className={styles.tag} style={typeStyle(m.type)}>
                        {typeLabel(m.type)}
                      </span>
                    </td>
                    <td style={{ fontWeight:500, fontSize:13 }}>
                      {m.description ?? m.categorie ?? m.reference}
                    </td>
                    <td style={{ textAlign:'right', fontFamily:'var(--font-geist-mono),monospace', fontSize:13, fontWeight:600, color: amount >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                      {amount >= 0 ? '+' : ''}{fmt(amount)} F
                    </td>
                    <td style={{ textAlign:'right', color:'var(--muted)', fontSize:11.5 }}>
                      {m.reference}
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
                <button key={i} type="button" className={i === page ? styles.on : ''} onClick={() => goPage(i)}>
                  {i + 1}
                </button>
              ))}
              <button type="button" onClick={() => goPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>›</button>
            </div>
          )}
        </div>
      </div>

      {modal && <ManualModal onClose={() => setModal(false)} onSaved={() => loadAll(page)} />}
    </>
  );
}
