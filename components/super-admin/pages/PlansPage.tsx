'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Store, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { PageHead } from '../primitives';
import s from '../SuperAdmin.module.css';

// ── Types ──────────────────────────────────────────────────────────────────────

type PlanKey = 'basic' | 'pro' | 'business';

interface PlanLimit {
  produits:  number | null;
  ventes:    number | null;
  commandes: number | null;
  admins:    number | null;
  entrepots: number | null;
}

interface PlanConfig {
  key:            PlanKey;
  prix_mensuel:   number | null;
  prix_annuel:    number | null;
  boutique_count: number;
  limits:         PlanLimit;
}

interface GlobalConfig {
  trial_days:      number;
  yearly_discount: number;
  whatsapp_number: string;
}

interface Stats {
  total_shops:   number;
  active_shops:  number;
  plan_basic:    number;
  plan_pro:      number;
  plan_business: number;
  mrr:           number;
  active_trials: number;
}

type PlanPatch = {
  prix_mensuel?:   number | null;
  prix_annuel?:    number | null;
  boutique_count?: number;
  limits?:         Partial<PlanLimit>;
};

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_PLANS: PlanConfig[] = [
  { key: 'basic',    prix_mensuel: null,  prix_annuel: null,  boutique_count: 0, limits: { produits: 20, ventes: 40, commandes: 15, admins: 1, entrepots: 1 } },
  { key: 'pro',      prix_mensuel: 9900,  prix_annuel: 7920,  boutique_count: 0, limits: { produits: null, ventes: null, commandes: null, admins: 5, entrepots: null } },
  { key: 'business', prix_mensuel: 24900, prix_annuel: 19920, boutique_count: 0, limits: { produits: null, ventes: null, commandes: null, admins: null, entrepots: null } },
];

const DEFAULT_GLOBAL: GlobalConfig = { trial_days: 14, yearly_discount: 20, whatsapp_number: '+228 90 527 912' };
const DEFAULT_STATS:  Stats        = { total_shops: 0, active_shops: 0, plan_basic: 0, plan_pro: 0, plan_business: 0, mrr: 0, active_trials: 0 };

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanKey, string> = { basic: 'Basic', pro: 'Pro', business: 'Business' };

const LIMIT_LABELS: Record<keyof PlanLimit, string> = {
  produits:  'Produits max',
  ventes:    'Ventes / mois',
  commandes: 'Commandes / mois',
  admins:    'Admins max',
  entrepots: 'Entrepôts max',
};

const MONO = 'var(--font-geist-mono), monospace';

// ── LimitRow ───────────────────────────────────────────────────────────────────

function LimitRow({ label, value, onChange, dark }: {
  label: string; value: number | null; onChange: (v: number | null) => void; dark?: boolean;
}) {
  const unlimited = value === null;
  const col       = dark ? 'rgba(255,255,255,.5)' : 'var(--muted)';
  const accent    = dark ? '#F2A765' : 'var(--ink)';
  const sub       = dark ? 'rgba(255,255,255,.3)' : 'var(--muted-2)';
  const badgeBg   = dark ? 'rgba(242,167,101,.14)' : 'var(--bg-2)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12.5, color: col }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          title={unlimited ? 'Passer à une valeur fixe' : 'Passer à illimité'}
          onClick={() => onChange(unlimited ? 0 : null)}
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
            background: unlimited ? badgeBg : 'transparent',
            color: unlimited ? accent : sub,
            transition: 'all .15s',
          }}
        >∞</button>
        {unlimited ? (
          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: accent, minWidth: 64, textAlign: 'right', display: 'inline-block' }}>
            Illimité
          </span>
        ) : (
          <input
            type="number" min={0} value={value ?? 0}
            onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
            style={{ width: 64, textAlign: 'right', fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 8px', background: '#fff', outline: 'none' }}
          />
        )}
      </div>
    </div>
  );
}

// ── PlanCard ───────────────────────────────────────────────────────────────────

function PlanCard({ config, onUpdate }: { config: PlanConfig; onUpdate: (p: PlanPatch) => void }) {
  const dark = config.key === 'pro';
  const bg        = dark ? '#14110E' : '#fff';
  const border    = dark ? '1px solid #14110E' : '1px solid var(--border)';
  const divider   = dark ? 'rgba(255,255,255,.08)' : 'var(--border)';
  const sectionBg = dark ? 'rgba(255,255,255,.03)' : 'var(--bg)';
  const secLabel  = dark ? 'rgba(255,255,255,.3)' : 'var(--muted-2)';
  const priceCol  = dark ? 'rgba(255,255,255,.5)' : 'var(--muted)';

  const badgeStyle: Record<PlanKey, React.CSSProperties> = {
    basic:    { background: 'var(--bg-2)',   color: 'var(--muted)' },
    pro:      { background: '#E8F0F7',        color: 'var(--blue)'  },
    business: { background: 'var(--purple-bg, #E6E0F0)', color: 'var(--purple, #5C4A88)' },
  };
  const checkColor: Record<PlanKey, string> = {
    basic: 'var(--ok)', pro: '#F2A765', business: 'var(--purple, #5C4A88)',
  };
  const dotColor: Record<PlanKey, string> = {
    basic: 'var(--ok)', pro: '#F2A765', business: 'var(--purple, #5C4A88)',
  };

  function setLimit(key: keyof PlanLimit, val: number | null) {
    onUpdate({ limits: { [key]: val } as Partial<PlanLimit> });
  }

  const freeValue = (
    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: dark ? '#F2A765' : 'var(--ok)', padding: '4px 8px' }}>
      Gratuit
    </span>
  );

  return (
    <div style={{ background: bg, border, borderRadius: 14, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      {config.key === 'pro' && (
        <div style={{ position: 'absolute', top: 12, right: 12, padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', background: 'rgba(242,167,101,.15)', color: '#F2A765' }}>
          Le plus choisi
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ ...badgeStyle[config.key], padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {PLAN_LABELS[config.key]}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: dotColor[config.key], fontWeight: 500 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor[config.key], display: 'inline-block', flexShrink: 0 }} />
            {config.boutique_count} boutique{config.boutique_count !== 1 ? 's' : ''}
          </span>
        </div>
        <p style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,.45)' : 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
          {config.key === 'basic'    && 'Pour tester et démarrer — plan gratuit permanent.'}
          {config.key === 'pro'      && 'La plupart de nos commerçants commencent ici.'}
          {config.key === 'business' && 'Pour chaînes, grossistes & revendeurs multi-sites.'}
        </p>
      </div>

      {/* Tarification */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${divider}`, background: sectionBg }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: secLabel, marginBottom: 8, fontWeight: 600 }}>Tarification</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(['prix_mensuel', 'prix_annuel'] as const).map(field => (
            <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: priceCol }}>{field === 'prix_mensuel' ? 'Mensuel (FCFA)' : 'Annuel (FCFA)'}</span>
              {config[field] === null ? freeValue : (
                <input
                  type="number" min={0} value={config[field] ?? 0}
                  onChange={e => onUpdate({ [field]: Number(e.target.value) || 0 })}
                  style={{ width: 80, textAlign: 'right', fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 8px', background: '#fff', outline: 'none' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Limites */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${divider}` }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: secLabel, marginBottom: 8, fontWeight: 600 }}>Limites</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {(Object.keys(LIMIT_LABELS) as (keyof PlanLimit)[]).map(key => (
            <LimitRow key={key} label={LIMIT_LABELS[key]} value={config.limits[key]} onChange={v => setLimit(key, v)} dark={dark} />
          ))}
        </div>
      </div>

      {/* Fonctionnalités */}
      <div style={{ padding: '12px 18px' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: secLabel, marginBottom: 8, fontWeight: 600 }}>Fonctionnalités</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(config.key === 'basic' ? [
            { label: 'Boutique en ligne',  on: true  },
            { label: 'Gestion des stocks', on: true  },
            { label: 'Commandes WhatsApp', on: true  },
            { label: 'Support par email',  on: true  },
            { label: 'Finance & rapports', on: false },
            { label: 'CRM WhatsApp',       on: false },
          ] : config.key === 'pro' ? [
            { label: 'Tout du plan Basic',           on: true  },
            { label: 'WhatsApp CRM inclus',          on: true  },
            { label: 'Finance & rapports',           on: true  },
            { label: 'Coupons & fidélité',           on: true  },
            { label: 'Support prioritaire WhatsApp', on: true  },
            { label: 'API & webhooks',               on: false },
          ] : [
            { label: 'Tout du plan Pro',   on: true },
            { label: 'Multi-entrepôts',    on: true },
            { label: 'API & webhooks',     on: true },
            { label: 'Marque blanche',     on: true },
            { label: 'Gestionnaire dédié', on: true },
            { label: 'SLA 99,9%',          on: true },
          ]).map(({ label, on }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={on ? checkColor[config.key] : (dark ? 'rgba(255,255,255,.2)' : 'var(--border)')}
                strokeWidth={on ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"
              >
                {on ? <polyline points="20 6 9 17 4 12" /> : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
              </svg>
              <span style={{ fontSize: 12, color: on ? (dark ? 'rgba(255,255,255,.8)' : 'var(--ink-2)') : (dark ? 'rgba(255,255,255,.25)' : 'var(--muted-2)') }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SaveIcon ───────────────────────────────────────────────────────────────────

function SaveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [plans,   setPlans]   = useState<PlanConfig[]>(DEFAULT_PLANS);
  const [global,  setGlobal]  = useState<GlobalConfig>(DEFAULT_GLOBAL);
  const [stats,   setStats]   = useState<Stats>(DEFAULT_STATS);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/saas/plans', { credentials: 'include' });
      const data = await res.json();
      if (data.plans)  setPlans(data.plans);
      if (data.global) setGlobal(data.global);
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/saas/stats', { credentials: 'include' });
      const data = await res.json();
      setStats(prev => ({
        ...prev,
        total_shops:   Number(data.total_shops   ?? 0),
        active_shops:  Number(data.active_shops  ?? 0),
        plan_basic:    Number(data.plan_basic    ?? 0),
        plan_pro:      Number(data.plan_pro      ?? 0),
        plan_business: Number(data.plan_business ?? 0),
      }));
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => { fetchConfig(); fetchStats(); }, [fetchConfig, fetchStats]);

  useEffect(() => {
    const pro = plans.find(p => p.key === 'pro');
    const biz = plans.find(p => p.key === 'business');
    const mrr = (stats.plan_pro * (pro?.prix_mensuel ?? 9900)) + (stats.plan_business * (biz?.prix_mensuel ?? 24900));
    setStats(prev => ({ ...prev, mrr }));
  }, [plans, stats.plan_pro, stats.plan_business]);

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch('/api/admin/saas/plans', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans, global }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  }

  function updatePlan(key: PlanKey, patch: PlanPatch) {
    setPlans(prev => prev.map(p => p.key !== key ? p : {
      ...p, ...patch,
      limits: patch.limits ? { ...p.limits, ...patch.limits } : p.limits,
    }));
  }

  const total       = Math.max(stats.total_shops, 1);
  const basicPct    = Math.round((stats.plan_basic    / total) * 100);
  const proPct      = Math.round((stats.plan_pro      / total) * 100);
  const businessPct = Math.round((stats.plan_business / total) * 100);

  return (
    <>
      {/* ── Header — identique aux autres pages super-admin ── */}
      <PageHead eyb="Super Admin · Plans" title="Plans &" serif="Tarifs" sub="Configurez les offres, prix et limites de la plateforme">
        <button className="btn" onClick={() => { fetchConfig(); fetchStats(); }} disabled={loading}>
          <RefreshCw size={14} className={loading ? s.spin : undefined} />
          Actualiser
        </button>
        <button className="btn pri" onClick={saveConfig} disabled={saving} style={{ minWidth: 120 }}>
          {saving ? <RefreshCw size={14} className={s.spin} /> : <SaveIcon />}
          {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </PageHead>

      {/* ── KPIs — classes globales SuperAdmin.css ── */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-h">
            <span className="kpi-l">Boutiques actives</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)', display: 'inline-block', flexShrink: 0 }} />
          </div>
          <div className="kpi-v"><div className="kpi-vn">{stats.active_shops}</div></div>
          <div className="kpi-f">
            <span className="kpi-s">{stats.total_shops} total</span>
            <Store size={14} style={{ color: 'var(--ok)', opacity: .6 }} />
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-h">
            <span className="kpi-l">Plans payants</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)', display: 'inline-block', flexShrink: 0 }} />
          </div>
          <div className="kpi-v"><div className="kpi-vn">{stats.plan_pro + stats.plan_business}</div></div>
          <div className="kpi-f">
            <span className="kpi-s">{stats.plan_basic} Basic gratuit</span>
            <TrendingUp size={14} style={{ color: 'var(--warn)', opacity: .6 }} />
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-h">
            <span className="kpi-l">MRR estimé</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block', flexShrink: 0 }} />
          </div>
          <div className="kpi-v">
            <div className="kpi-vn" style={{ fontSize: 20 }}>{stats.mrr.toLocaleString('fr-FR')}</div>
            <div className="kpi-u">FCFA</div>
          </div>
          <div className="kpi-f">
            <span className="kpi-s">mensuel récurrent</span>
            <DollarSign size={14} style={{ color: 'var(--blue)', opacity: .6 }} />
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-h">
            <span className="kpi-l">Essais actifs</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple, #5C4A88)', display: 'inline-block', flexShrink: 0 }} />
          </div>
          <div className="kpi-v"><div className="kpi-vn">{stats.active_trials}</div></div>
          <div className="kpi-f">
            <span className="kpi-s">{global.trial_days} jours gratuits</span>
            <Clock size={14} style={{ color: 'var(--purple, #5C4A88)', opacity: .6 }} />
          </div>
        </div>
      </div>

      {/* ── Distribution des plans ── */}
      <div className="ov-bot" style={{ paddingTop: 16 }}>
        <div className="ov-card">
          <div className="ov-card-h">Distribution des plans</div>
          <div className={s.planItems}>
            {([
              { label: 'Basic',    pct: basicPct,    count: stats.plan_basic,    fillCls: s.planBarFree,  color: 'var(--muted)'  },
              { label: 'Pro',      pct: proPct,      count: stats.plan_pro,      fillCls: s.planBarBasic, color: 'var(--blue)'   },
              { label: 'Business', pct: businessPct, count: stats.plan_business, fillCls: s.planBarPro,   color: 'var(--purple, #5C4A88)' },
            ] as const).map(item => (
              <div key={item.label} className={s.planItem}>
                <div className={s.planBar}>
                  <div className={s.planBarTrack}>
                    <div className={`${s.planBarFill} ${item.fillCls}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
                <span className={s.planItemCount} style={{ color: item.color }}>{item.count}</span>
                <span className={s.planItemLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Configuration des plans ── */}
      <div className="ov-bot" style={{ paddingTop: 20, paddingBottom: 0 }}>
        <h2 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.01em', margin: '0 0 3px' }}>
          Configuration des plans
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>
          Modifiez les prix, limites et fonctionnalités — cliquez sur ∞ pour basculer illimité / valeur fixe
        </p>
      </div>

      <div className="ov-bot" style={{ paddingTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {plans.map(config => (
            <PlanCard key={config.key} config={config} onUpdate={patch => updatePlan(config.key, patch)} />
          ))}
        </div>
      </div>

      {/* ── Paramètres globaux ── */}
      <div className="ov-bot" style={{ paddingTop: 12 }}>
        <div className="ov-card">
          <div className="ov-card-h">Paramètres globaux</div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: -8, marginBottom: 16 }}>
            Durée d&apos;essai et remise annuelle appliquées à tous les plans payants
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {([
              { key: 'trial_days',      label: "Durée d'essai (jours)", type: 'number', min: 0,   max: undefined },
              { key: 'yearly_discount', label: "Remise annuelle (%)",   type: 'number', min: 0,   max: 100 },
              { key: 'whatsapp_number', label: "WhatsApp Business",     type: 'text',   min: undefined, max: undefined },
            ] as const).map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  min={field.min}
                  max={field.max}
                  value={global[field.key]}
                  onChange={e => setGlobal(g => ({ ...g, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  style={{ width: '100%', fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 11px', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

    </>
  );
}
