'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { Kpi } from '../types';
import { DownloadIcon, PlusIcon, FilterIcon, MoreIcon } from '../icons';
import { PageHead, KpiRow, fmt } from '../primitives';
import styles from '../Crm.module.css';

interface BoutiqueClient {
  id: number;
  nom: string;
  telephone: string | null;
  email: string | null;
  localisation: string | null;
  type_client: 'particulier' | 'professionnel';
  solde: number;
  created_at: string;
}

type Filtre = 'tous' | 'debiteurs' | 'dettes';

const COLORS = ['#5C4A88','#1F3D6E','#2D6A4F','#C9601E','#B8501A','#C8962A','#7A2C3A','#3A2F25'];
function avatarColor(id: number): string { return COLORS[id % COLORS.length]; }

function initials(nom: string): string {
  return nom.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ClientsPage() {
  const [clients, setClients] = useState<BoutiqueClient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback((p: number, f: Filtre, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), filtre: f });
    if (q) params.set('q', q);
    fetch(`/api/admin/boutique-clients?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setClients(d.data); setTotal(d.total ?? 0); }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch_(page, filtre, search); }, [page, filtre, search, fetch_]);

  const kpis: Kpi[] = [
    { l: 'Total clients', v: fmt(total), sub: filtre === 'tous' ? 'tous' : filtre, c: '#5C4A88' },
  ];

  const TABS: { id: Filtre; l: string }[] = [
    { id: 'tous',      l: 'Tous' },
    { id: 'debiteurs', l: 'En avance' },
    { id: 'dettes',    l: 'Débiteurs' },
  ];

  const totalPages = Math.ceil(total / 30);

  return (
    <>
      <PageHead
        eyebrow="CRM · Clients" title="Comptes" serif="clients"
        sub={`${fmt(total)} clients · boutique`}
      >
        <button type="button" className={styles.btn}><DownloadIcon /> Exporter</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><PlusIcon /> Nouveau client</button>
      </PageHead>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${filtre === t.id ? styles.active : ''}`}
            onClick={() => { setFiltre(t.id); setPage(1); }}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className={styles.tools}>
        <button type="button" className={styles.chip}><FilterIcon size={12} /> Filtres</button>
        <input
          className={styles.chip}
          placeholder="Rechercher…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ minWidth: 200, cursor: 'text' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>Chargement…</div>
      ) : (
        <div className={styles.twrap}>
          <div className={styles.tscroll}>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Solde</th>
                  <th style={{ textAlign: 'right' }}>Inscrit le</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted-2)', padding: '32px 0' }}>Aucun client</td></tr>
                ) : clients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.cellName}>
                        <div className={styles.rowAvatar} style={{ background: avatarColor(c.id), width: 30, height: 30, fontSize: 11 }}>
                          {initials(c.nom || c.telephone || '?')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nom || '—'}</div>
                          {c.email && <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.dimCell}>{c.telephone || '—'}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: c.type_client === 'professionnel' ? '#E6E0F0' : 'rgba(20,17,14,.06)',
                        color: c.type_client === 'professionnel' ? '#5C4A88' : '#6B635B',
                      }}>
                        {c.type_client === 'professionnel' ? 'Pro' : 'Particulier'}
                      </span>
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontFamily: '"Geist Mono",monospace',
                      fontSize: 13, fontWeight: 500,
                      color: c.solde > 0 ? '#2D6A4F' : c.solde < 0 ? '#C9601E' : 'var(--muted-2)',
                    }}>
                      {c.solde > 0 ? '+' : ''}{fmt(c.solde)} F
                    </td>
                    <td className={styles.dimCell} style={{ textAlign: 'right', fontSize: 12 }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className={styles.actCol}>
                      <button type="button" className={styles.rm}><MoreIcon size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0' }}>
          <button
            type="button" className={styles.btn}
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >← Préc.</button>
          <span style={{ fontSize: 13, color: 'var(--muted-2)', alignSelf: 'center' }}>
            {page} / {totalPages}
          </span>
          <button
            type="button" className={styles.btn}
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >Suiv. →</button>
        </div>
      )}
    </>
  );
}
