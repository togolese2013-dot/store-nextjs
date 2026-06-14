'use client';
import React, { useEffect, useState } from 'react';
import type { Kpi } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { KpiRow, PageHead, fmt } from '../primitives';

const KPIS: Kpi[] = [
  { l: 'Plan le plus populaire', v: '—', serif: true, sub: '0 boutique' },
  { l: 'Revenu moyen / boutique', v: '0', u: 'F', sub: 'ARPA mensuel', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#34396B' },
  { l: 'Essais → payant', v: '0', u: '%', sub: 'taux de conversion', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#2D6A4F' },
];

interface PlanLimits {
  plan: string;
  max_produits: number;
  max_ventes_jour: number;
  max_ventes_mois: number;
  max_commandes_mois: number;
  max_entrepots: number;
  max_users: number;
}

const FIELD_LABELS: Record<keyof Omit<PlanLimits, 'plan'>, string> = {
  max_produits:       'Produits max',
  max_ventes_jour:    'Ventes / jour',
  max_ventes_mois:    'Ventes / mois',
  max_commandes_mois: 'Commandes / mois',
  max_entrepots:      'Entrepôts max',
  max_users:          'Utilisateurs max',
};

export default function PlansPage() {
  const ui = useUI();
  const [configs,  setConfigs]  = useState<PlanLimits[]>([]);
  const [drafts,   setDrafts]   = useState<Record<string, PlanLimits>>({});
  const [saving,   setSaving]   = useState<string | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/saas/plan-configs', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.configs) {
          setConfigs(d.configs);
          const init: Record<string, PlanLimits> = {};
          d.configs.forEach((c: PlanLimits) => { init[c.plan] = { ...c }; });
          setDrafts(init);
        }
      }).catch(() => {});
  }, []);

  function setField(plan: string, field: keyof Omit<PlanLimits, 'plan'>, val: number) {
    setDrafts(prev => ({ ...prev, [plan]: { ...prev[plan], [field]: val } }));
  }

  async function save(plan: string) {
    setSaving(plan);
    try {
      const { plan: _, ...body } = drafts[plan];
      await fetch(`/api/admin/saas/plan-configs/${plan}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setToast(`Plan ${plan} mis à jour ✓`);
      setTimeout(() => setToast(null), 2500);
    } catch { setToast('Erreur'); }
    finally { setSaving(null); }
  }

  const fields = Object.keys(FIELD_LABELS) as (keyof Omit<PlanLimits, 'plan'>)[];
  const PLAN_COLORS: Record<string, string> = { basic: '#6B635B', pro: '#C9601E', business: '#1F3D6E' };

  return (
    <>
      <PageHead eyb="Super Admin · Offres" title="Plans &" serif="tarifs" sub="3 formules · Gratuit · 9 900 F · 24 900 F / mois">
      </PageHead>

      <KpiRow kpis={KPIS} cols={3} />

      {/* Plan cards */}
      <div className="plan-grid">{ui.plans.map((p) => (
        <div key={p.name} className={`plan-card ${p.pop ? 'pop' : ''}`}>
          {p.pop && <div className="plan-pop-tag">Le plus choisi</div>}
          <div className="plan-name"><span className="plan-dot" style={{ background: p.color }} />{p.name}</div>
          <div className="plan-price">
            <b>{p.price}{p.price !== 'Gratuit' ? ' F' : ''}</b>
            {p.period && <span>{p.period}</span>}
          </div>
          <div className="plan-feat">{p.feats.map((f, i) => (
            <div key={i} className="f"><span className="ck"><I.check size={14} /></span>{f}</div>
          ))}</div>
          <div className="plan-foot">
            <span className="plan-stat"><b>{p.count}</b> boutiques</span>
            <span className="plan-stat"><b>{fmt(p.mrr)} F</b> / mois</span>
          </div>
        </div>
      ))}</div>

      {/* Répartition table */}
      <div className="ov-bot" style={{ paddingTop: 16 }}>
        <div className="ov-card">
          <div className="ov-card-h">Répartition des boutiques par plan</div>
          <table className="mini-t">
            <thead><tr>
              <th>Plan</th><th>Prix mensuel</th>
              <th style={{ textAlign: 'right' }}>Boutiques</th>
              <th style={{ textAlign: 'right' }}>MRR</th>
              <th style={{ textAlign: 'right' }}>Part du revenu</th>
            </tr></thead>
            <tbody>{ui.plans.map((p) => {
              const totalMrr = ui.plans.reduce((s, x) => s + x.mrr, 0);
              const pct = totalMrr > 0 ? Math.round(p.mrr / totalMrr * 100) : 0;
              return (
                <tr key={p.name}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 99, background: p.color, display: 'inline-block' }} />
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                  </div></td>
                  <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12 }}>
                    {p.price === 'Gratuit' ? 'Gratuit' : `${p.price} F`}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace' }}>{p.count}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 500 }}>{fmt(p.mrr)} F</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12, color: 'var(--muted)' }}>{pct}%</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      {/* ── Limites par plan ── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#14110E', marginBottom: 4 }}>Limites par plan</div>
        <div style={{ fontSize: 13, color: '#8A8278', marginBottom: 20 }}>0 = illimité · les changements s'appliquent immédiatement</div>

        {toast && (
          <div style={{ marginBottom: 16, padding: '10px 16px', background: '#E4ECE6', color: '#2D6A4F', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'inline-block' }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {configs.map(cfg => {
            const draft = drafts[cfg.plan] ?? cfg;
            const color = PLAN_COLORS[cfg.plan] ?? '#6B635B';
            return (
              <div key={cfg.plan} style={{ background: 'white', border: '1px solid #E8E1D4', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ background: color, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{cfg.plan}</div>
                  <button
                    onClick={() => save(cfg.plan)}
                    disabled={saving === cfg.plan}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '5px 12px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {saving === cfg.plan ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fields.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <label style={{ fontSize: 12.5, color: '#6B635B', flex: 1 }}>{FIELD_LABELS[f]}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <input
                          type="number" min={0} value={(draft[f] as number)}
                          onChange={e => setField(cfg.plan, f, Number(e.target.value))}
                          style={{ width: 64, padding: '5px 8px', border: '1.5px solid #E8E1D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', textAlign: 'right' }}
                        />
                        {(draft[f] as number) === 0 && <span style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 600 }}>∞</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
