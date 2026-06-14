'use client';
import React, { useEffect, useState } from 'react';
import { PageHead } from '../primitives';
import { I } from '../icons';

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
  max_ventes_jour:    'Ventes/jour max',
  max_ventes_mois:    'Ventes/mois max',
  max_commandes_mois: 'Commandes/mois max',
  max_entrepots:      'Entrepôts max',
  max_users:          'Utilisateurs max',
};

const PLAN_COLORS: Record<string, string> = {
  basic: '#6B635B', pro: '#C9601E', business: '#1F3D6E',
};

function LimitInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="number" min={0} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 72, padding: '6px 10px', border: '1.5px solid #E8E1D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', textAlign: 'right' }}
      />
      {value === 0 && <span style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 600 }}>∞</span>}
    </div>
  );
}

export default function LimitsPage() {
  const [configs,  setConfigs]  = useState<PlanLimits[]>([]);
  const [saving,   setSaving]   = useState<string | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);
  const [drafts,   setDrafts]   = useState<Record<string, PlanLimits>>({});

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

  return (
    <>
      <PageHead eyb="Super Admin · Configuration" title="Limites" serif="des plans" sub="0 = illimité · modifiez les seuils par plan">
        <span style={{ fontSize: 12, color: '#8A8278' }}>0 = illimité</span>
      </PageHead>

      {toast && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: '#E4ECE6', color: '#2D6A4F', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'inline-block' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 900 }}>
        {configs.map(cfg => {
          const draft = drafts[cfg.plan] ?? cfg;
          const color = PLAN_COLORS[cfg.plan] ?? '#6B635B';
          return (
            <div key={cfg.plan} style={{ background: 'white', border: '1px solid #E8E1D4', borderRadius: 16, overflow: 'hidden' }}>
              {/* Plan header */}
              <div style={{ background: color, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>{cfg.plan}</div>
                <button
                  onClick={() => save(cfg.plan)}
                  disabled={saving === cfg.plan}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 14px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {saving === cfg.plan ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>

              {/* Fields */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {fields.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <label style={{ fontSize: 12.5, color: '#6B635B', flex: 1 }}>{FIELD_LABELS[f]}</label>
                    <LimitInput value={draft[f] as number} onChange={v => setField(cfg.plan, f, v)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: '12px 16px', background: '#F4EFE6', borderRadius: 12, fontSize: 12, color: '#8A8278', maxWidth: 640 }}>
        <strong style={{ color: '#14110E' }}>Note :</strong> Les limites s'appliquent aux plans Basic. Pro et Business ont 0 (illimité) par défaut. Les boutiques shop_id=1 (Afrisika) sont toujours exemptées.
      </div>
    </>
  );
}
