'use client';
import React, { useEffect, useState } from 'react';
import type { Kpi } from '../types';
import { DownloadIcon } from '../icons';
import { PageHead, KpiRow, fmt } from '../primitives';
import styles from '../Crm.module.css';

interface Stats {
  total: number;
  en_avance: number;
  debiteurs: number;
  solde_moyen: number;
  segments: { type_client: string; count: number }[];
  acquisitions: { mois: string; count: number }[];
  top_depensiers: { id: number; nom: string; telephone: string | null; type_client: string; total_achats: number }[];
  derniers: { id: number; nom: string; telephone: string | null; type_client: string; solde: number; created_at: string }[];
}

function initials(nom: string): string {
  return nom.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const COLORS = ['#5C4A88','#1F3D6E','#2D6A4F','#C9601E','#B8501A','#C8962A','#7A2C3A','#3A2F25'];
function avatarColor(id: number): string { return COLORS[id % COLORS.length]; }

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    (async () => {
      try {
        const r = await fetch('/api/admin/boutique-clients?stats=1', {
          credentials: 'include',
          signal: ctrl.signal,
        });
        const d = await r.json();
        if (d.success && d.data) setStats(d.data);
      } catch {
        // network error or abort
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const kpis: Kpi[] = stats ? [
    { l: 'Clients totaux',  v: fmt(stats.total),                                    sub: 'boutique',      spark: Array(11).fill(0).map((_, i) => i < 10 ? 0 : stats.total), c: '#5C4A88' },
    { l: 'Créditeurs',      v: fmt(stats.en_avance),                                sub: 'solde positif', spark: Array(11).fill(0).map((_, i) => i < 10 ? 0 : stats.en_avance), c: '#2D6A4F' },
    { l: 'Débiteurs',       v: fmt(stats.debiteurs),                                sub: 'solde négatif', spark: Array(11).fill(0).map((_, i) => i < 10 ? 0 : stats.debiteurs), c: '#C9601E' },
    { l: 'Solde moyen',     v: fmt(Math.abs(Math.round(stats.solde_moyen))), u: 'F', sub: stats.solde_moyen >= 0 ? 'en avance' : 'en dette', c: '#3B6A8F' },
  ] : [];

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>Chargement…</div>
  );

  if (!stats) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>Aucune donnée.</div>
  );

  return (
    <>
      <PageHead
        eyebrow="CRM · Aperçu" title="Relation" serif="client"
        sub={`${fmt(stats.total)} clients · ${fmt(stats.en_avance)} créditeurs · ${fmt(stats.debiteurs)} débiteurs`}
      >
        <button type="button" className={styles.btn}><DownloadIcon /> Rapport</button>
      </PageHead>

      <KpiRow kpis={kpis} />

      <div className={styles.ovGrid}>
        <div className={styles.ovCard}>
          <div className={styles.ovCardH}>Top clients · solde créditeur</div>
          <table className={styles.miniT}>
            <thead><tr><th>Client</th><th>Type</th><th style={{ textAlign: 'right' }}>Solde</th></tr></thead>
            <tbody>
              {stats.top_depensiers.length === 0
                ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted-2)', padding: '16px 0' }}>Aucun client créditeur</td></tr>
                : stats.top_depensiers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.cellName}>
                        <div className={styles.rowAvatar} style={{ background: avatarColor(c.id), width: 30, height: 30, fontSize: 11 }}>
                          {initials(c.nom || c.telephone || '?')}
                        </div>
                        {c.nom || c.telephone || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted-2)' }}>{c.type_client === 'professionnel' ? 'Pro' : 'Part.'}</td>
                    <td style={{ textAlign: 'right', fontFamily: '"Geist Mono",monospace', fontSize: 13, fontWeight: 500, color: '#2D6A4F' }}>+{fmt(c.total_achats)} F</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        <div className={styles.ovCard}>
          <div className={styles.ovCardH}>Derniers inscrits</div>
          <table className={styles.miniT}>
            <thead><tr><th>Client</th><th style={{ textAlign: 'right' }}>Inscrit le</th></tr></thead>
            <tbody>
              {stats.derniers.length === 0
                ? <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted-2)', padding: '16px 0' }}>Aucun client</td></tr>
                : stats.derniers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.cellName}>
                        <div className={styles.rowAvatar} style={{ background: avatarColor(c.id), width: 30, height: 30, fontSize: 11 }}>
                          {initials(c.nom || c.telephone || '?')}
                        </div>
                        {c.nom || c.telephone || '—'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted-2)' }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {stats.segments.length > 0 && (
        <div className={styles.ovBot}>
          <div className={styles.ovCard}>
            <div className={styles.ovCardH}>Segments</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '12px 0' }}>
              {stats.segments.map(s => {
                const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
                return (
                  <div key={s.type_client} style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted-2)', marginBottom: 4 }}>
                      {s.type_client === 'professionnel' ? 'Professionnels' : 'Particuliers'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--ink)' }}>{fmt(s.count)}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{pct}% du total</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
