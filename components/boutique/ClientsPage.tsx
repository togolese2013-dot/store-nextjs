/**
 * ClientsPage — boutique customers content
 * Mount via BoutiqueShell (page id: 'clients') or standalone.
 * Self-fetching (own pagination) — /api/admin/boutique-clients.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BoutiqueClient, ClientType, KpiItem } from './types';
import { SWATCHES, hashStr, initials } from './sale-mapping';
import { CLIENT_STATUS_CLASS } from './sample-data';
import { DownloadIcon, PlusIcon, StarIcon, TrendIcon, EyeIcon, PencilIcon, TrashIcon } from './icons';
import Sparkline from './Sparkline';
import styles from './Boutique.module.css';
import { formatDate } from '@/lib/format-date';

const sk = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LIMIT = 30;

interface ApiBoutiqueClient {
  id: number;
  nom: string;
  telephone: string | null;
  email: string | null;
  localisation: string | null;
  type_client: 'particulier' | 'professionnel';
  solde: number;
  notes: string | null;
  created_at: string;
  nb_achats?: number;
  ca_reel?: number;
  dernier_achat?: string | null;
}

export interface ClientsMonthlyStats {
  nouveaux_ce_mois: number;
  client_du_mois: { nom: string; ca: number; achats: number } | null;
  panier_moyen: number;
  panier_moyen_precedent: number;
}

function mapBoutiqueClient(c: ApiBoutiqueClient): BoutiqueClient {
  const abs = Math.abs(Number(c.solde));
  let status: BoutiqueClient['status'] = 'Nouveau';
  if (c.type_client === 'professionnel' || abs > 100000) status = 'VIP';
  else if (abs > 50000) status = 'Fidèle';
  else if (abs > 10000) status = 'Régulier';

  return {
    id:           c.id,
    name:         c.nom,
    init:         initials(c.nom),
    color:        SWATCHES[hashStr(c.nom) % SWATCHES.length],
    visits:       Number(c.nb_achats ?? 0),
    last:         c.dernier_achat ? formatDate(c.dernier_achat) : '—',
    total:        Number(c.ca_reel ?? 0),
    status,
    telephone:    c.telephone,
    email:        c.email,
    localisation: c.localisation,
    type_client:  c.type_client,
    solde:        Number(c.solde),
    notes:        c.notes,
  };
}

interface ClientFormState {
  nom: string;
  telephone: string;
  email: string;
  localisation: string;
  type_client: ClientType;
  solde: string;
  notes: string;
}

function emptyForm(): ClientFormState {
  return { nom: '', telephone: '', email: '', localisation: '', type_client: 'particulier', solde: '0', notes: '' };
}

function clientToForm(c: BoutiqueClient): ClientFormState {
  return {
    nom: c.name,
    telephone: c.telephone ?? '',
    email: c.email ?? '',
    localisation: c.localisation ?? '',
    type_client: c.type_client,
    solde: String(c.solde ?? 0),
    notes: c.notes ?? '',
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [modalClient, setModalClient] = useState<BoutiqueClient | 'new' | null>(null);
  const [form,    setForm]    = useState<ClientFormState>(emptyForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [exporting, setExporting] = useState(false);

  const [page,  setPage]  = useState(1);
  const [clients, setClients] = useState<BoutiqueClient[]>([]);
  const [total,   setTotal]   = useState(0);
  const [monthlyStats, setMonthlyStats] = useState<ClientsMonthlyStats>({
    nouveaux_ce_mois: 0, client_du_mois: null, panier_moyen: 0, panier_moyen_precedent: 0,
  });

  const fetchAbortRef = useRef<AbortController | null>(null);
  const fetchClients = useCallback(() => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    fetch(`/api/admin/boutique-clients?page=${page}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.data)) setClients((d.data as ApiBoutiqueClient[]).map(mapBoutiqueClient));
        if (typeof d.total === 'number') setTotal(d.total);
        if (d.monthlyStats) setMonthlyStats(d.monthlyStats as ClientsMonthlyStats);
      })
      .catch(e => { if (e?.name !== 'AbortError') setClients([]); });
  }, [page]);

  useEffect(() => {
    fetchClients();
    return () => fetchAbortRef.current?.abort();
  }, [fetchClients]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/boutique-clients/export');
      if (!res.ok) return;
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : 'clients.csv';
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

  const count = total;
  const vipCount = clients.filter(c => c.status === 'VIP').length;
  const regulierCount = clients.filter(c => c.status === 'Régulier').length;

  const stats = monthlyStats;
  const panierDelta = stats.panier_moyen_precedent !== 0
    ? Math.round(((stats.panier_moyen - stats.panier_moyen_precedent) / stats.panier_moyen_precedent) * 100)
    : (stats.panier_moyen === 0 ? 0 : null);

  const CLIENTS_KPIS: KpiItem[] = [
    {
      label: 'Clients enregistrés', value: String(count),
      delta: `+${stats.nouveaux_ce_mois} ce mois`, deltaColor: '#2D6A4F',
      sub: 'ce mois',
      spark: [18, 20, 19, 22, 21, 25, 24, 26, 25, 28, count % 32 || 30], sparkColor: '#3B6A8F',
    },
    {
      label: 'Client du mois', value: stats.client_du_mois?.nom ?? '—',
      serif: true,
      sub: stats.client_du_mois
        ? `${stats.client_du_mois.achats} achat${stats.client_du_mois.achats > 1 ? 's' : ''} · ${stats.client_du_mois.ca.toLocaleString('fr-FR')} FCFA de CA`
        : 'Aucun achat ce mois',
    },
    {
      label: 'Panier moyen clients', value: stats.panier_moyen.toLocaleString('fr-FR'), unit: 'FCFA',
      delta: panierDelta === null ? '—' : `${panierDelta >= 0 ? '+' : ''}${panierDelta}%`,
      deltaColor: (panierDelta ?? 0) >= 0 ? '#2D6A4F' : '#9C3A14',
      sub: 'clients identifiés',
      spark: [120, 128, 132, 140, 136, 148, 156, 168, 172, 180, 194], sparkColor: '#2D6A4F',
    },
  ];

  function openNew() {
    setForm(emptyForm());
    setError('');
    setModalClient('new');
  }

  function openEdit(c: BoutiqueClient) {
    setForm(clientToForm(c));
    setError('');
    setModalClient(c);
  }

  function viewClient(c: BoutiqueClient) {
    router.push(`/admin/boutique-clients/${c.id}`);
  }

  function closeModal() {
    setModalClient(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) { setError('Nom requis.'); return; }
    const isEdit = modalClient !== 'new' && modalClient !== null;
    if (!isEdit && !form.telephone.trim()) { setError('Téléphone requis.'); return; }
    setSaving(true);
    setError('');
    const url    = isEdit ? `/api/admin/boutique-clients/${(modalClient as BoutiqueClient).id}` : '/api/admin/boutique-clients';
    const method = isEdit ? 'PATCH' : 'POST';
    const body = {
      nom:          form.nom.trim(),
      telephone:    form.telephone.trim() || null,
      email:        form.email.trim() || null,
      localisation: form.localisation.trim() || null,
      type_client:  form.type_client,
      solde:        Number(form.solde) || 0,
      notes:        form.notes.trim() || null,
    };
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur.'); setSaving(false); return; }
      setSaving(false);
      closeModal();
      fetchClients();
    } catch {
      setError('Erreur réseau.');
      setSaving(false);
    }
  }

  async function handleDelete(c: BoutiqueClient) {
    if (!window.confirm(`Supprimer le client "${c.name}" ?`)) return;
    await fetch(`/api/admin/boutique-clients/${c.id}`, { method: 'DELETE' });
    fetchClients();
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Clients</div>
          <h1 className={styles.title}>Clients <span className={styles.serif}>physiques</span></h1>
          <p className={styles.subtitle}>
            {count} client{count !== 1 ? 's' : ''} enregistré{count !== 1 ? 's' : ''} · {stats.panier_moyen.toLocaleString('fr-FR')} F panier moyen · programme de fidélité actif
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={handleExport} disabled={exporting}>
            <DownloadIcon size={14} /> {exporting ? 'Export…' : 'Exporter'}
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={openNew}>
            <PlusIcon size={14} /> Nouveau client
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
        {CLIENTS_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={k.serif ? styles.kpiSerif : styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.sparkColor && <Sparkline data={k.spark} color={k.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Dernier achat</th>
                <th style={{ textAlign: 'right' }}>CA total</th>
                <th>Fidélité</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 99, background: c.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.init}</div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: 'var(--muted)' }}>{c.telephone ?? '—'}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{c.last}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>{c.total.toLocaleString('fr-FR')} FCFA</td>
                  <td>
                    <span className={`${styles.tag} ${styles[CLIENT_STATUS_CLASS[c.status] as keyof typeof styles]}`}>
                      {c.status === 'VIP' && <StarIcon size={10} />}
                      {c.status}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <button type="button" className={styles.rowMenu} title="Voir la fiche complète" onClick={() => viewClient(c)}>
                        <EyeIcon size={14} />
                      </button>
                      <button type="button" className={styles.rowMenu} title="Modifier le client" onClick={() => openEdit(c)}>
                        <PencilIcon size={14} />
                      </button>
                      <button type="button" className={styles.rowMenu} title="Supprimer le client" onClick={() => handleDelete(c)}>
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>Aucun client enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{count} client{count !== 1 ? 's' : ''} · {vipCount} VIP · {regulierCount} réguliers</span>
          <div className={styles.pager}>
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
            <button type="button" className={styles.on}>{page}/{totalPages}</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
          </div>
        </div>
      </div>

      {modalClient !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(20,17,14,.35)', padding: 16,
        }} onClick={closeModal}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(20,17,14,.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{modalClient === 'new' ? 'Nouveau client' : 'Modifier le client'}</h2>
              <button type="button" onClick={closeModal} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
                <CloseIcon size={16} />
              </button>
            </div>
            <form onSubmit={submit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && <p style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 8, margin: 0 }}>{error}</p>}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Nom *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Téléphone {modalClient === 'new' ? '*' : ''}</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Type</label>
                  <select value={form.type_client} onChange={e => setForm(f => ({ ...f, type_client: e.target.value as ClientType }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)' }}>
                    <option value="particulier">Particulier</option>
                    <option value="professionnel">Professionnel</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Localisation</label>
                <input value={form.localisation} onChange={e => setForm(f => ({ ...f, localisation: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Solde (FCFA)</label>
                <input type="number" value={form.solde} onChange={e => setForm(f => ({ ...f, solde: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)' }} />
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Positif = client en avance · Négatif = débiteur</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={closeModal} className={styles.btn} style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
                <button type="submit" disabled={saving} className={`${styles.btn} ${styles.primary}`} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Enregistrement…' : (modalClient === 'new' ? 'Ajouter' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
