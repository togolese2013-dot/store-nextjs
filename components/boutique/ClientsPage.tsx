/**
 * ClientsPage — boutique customers content
 * Mount via BoutiqueShell (page id: 'clients') or standalone.
 */
import React, { useState } from 'react';
import type { BoutiqueClient, ClientType } from './types';
import { SAMPLE_CLIENTS, CLIENT_STATUS_CLASS } from './sample-data';
import { DownloadIcon, PlusIcon, MoreIcon, StarIcon } from './icons';
import styles from './Boutique.module.css';

const sk = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...sk}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface ClientsPageProps {
  clients?: BoutiqueClient[];
  total?: number;
  onRefresh?: () => void;
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

export default function ClientsPage({ clients = SAMPLE_CLIENTS, total, onRefresh }: ClientsPageProps) {
  const [modalClient, setModalClient] = useState<BoutiqueClient | 'new' | null>(null);
  const [form,    setForm]    = useState<ClientFormState>(emptyForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

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

  const count = total ?? clients.length;
  const vipCount = clients.filter(c => c.status === 'VIP').length;
  const regulierCount = clients.filter(c => c.status === 'Régulier').length;

  const topSpender = [...clients].sort((a, b) => b.total - a.total)[0];
  const withBalance = clients.filter(c => c.total > 0);
  const avgBasket = withBalance.length
    ? Math.round(withBalance.reduce((s, c) => s + c.total, 0) / withBalance.length)
    : 0;

  function openNew() {
    setForm(emptyForm());
    setError('');
    setModalClient('new');
  }

  function openEdit(c: BoutiqueClient) {
    setForm(clientToForm(c));
    setError('');
    setModalClient(c);
    setOpenMenu(null);
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
      onRefresh?.();
    } catch {
      setError('Erreur réseau.');
      setSaving(false);
    }
  }

  async function handleDelete(c: BoutiqueClient) {
    setOpenMenu(null);
    if (!window.confirm(`Supprimer le client "${c.name}" ?`)) return;
    await fetch(`/api/admin/boutique-clients/${c.id}`, { method: 'DELETE' });
    onRefresh?.();
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Boutique · Clients</div>
          <h1 className={styles.title}>Clients <span className={styles.serif}>physiques</span></h1>
          <p className={styles.subtitle}>{count} client{count !== 1 ? 's' : ''} enregistré{count !== 1 ? 's' : ''}</p>
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
        <div className={styles.kpi}>
          <div className={styles.kpiHead}><div className={styles.kpiLabel}>Clients enregistrés</div></div>
          <div className={styles.kpiValueRow}><div className={styles.kpiValue}>{count}</div></div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>au total</div></div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}><div className={styles.kpiLabel}>Meilleur client</div></div>
          <div className={styles.kpiValueRow}><div className={styles.kpiSerif}>{topSpender?.name ?? '—'}</div></div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>{topSpender ? `${topSpender.total.toLocaleString('fr-FR')} FCFA` : '—'}</div></div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}><div className={styles.kpiLabel}>Solde moyen clients</div></div>
          <div className={styles.kpiValueRow}><div className={styles.kpiValue}>{avgBasket.toLocaleString('fr-FR')}</div><div className={styles.kpiUnit}>FCFA</div></div>
          <div className={styles.kpiFoot}><div className={styles.kpiSub}>clients identifiés</div></div>
        </div>
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th style={{ textAlign: 'right' }}>Visites</th>
                <th>Dernière visite</th>
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
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{c.visits}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{c.last}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>{c.total.toLocaleString('fr-FR')} FCFA</td>
                  <td>
                    <span className={`${styles.tag} ${styles[CLIENT_STATUS_CLASS[c.status] as keyof typeof styles]}`}>
                      {c.status === 'VIP' && <StarIcon size={10} />}
                      {c.status}
                    </span>
                  </td>
                  <td className={styles.actionsCell} style={{ position: 'relative' }}>
                    <button type="button" className={styles.rowMenu} onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}>
                      <MoreIcon size={16} />
                    </button>
                    {openMenu === c.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', zIndex: 20, minWidth: 140,
                        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(20,17,14,.12)', overflow: 'hidden',
                      }}>
                        <button type="button" onClick={() => openEdit(c)} style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
                          fontSize: 13, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink)',
                        }}>Modifier</button>
                        <button type="button" onClick={() => handleDelete(c)} style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
                          fontSize: 13, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--danger)',
                        }}>Supprimer</button>
                      </div>
                    )}
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
