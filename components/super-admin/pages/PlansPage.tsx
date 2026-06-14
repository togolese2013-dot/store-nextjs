'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Store, TrendingUp, Clock, DollarSign } from 'lucide-react';
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

// ── Default state ──────────────────────────────────────────────────────────────

const DEFAULT_PLANS: PlanConfig[] = [
  {
    key: 'basic', prix_mensuel: null, prix_annuel: null, boutique_count: 0,
    limits: { produits: 20, ventes: 40, commandes: 15, admins: 1, entrepots: 1 },
  },
  {
    key: 'pro', prix_mensuel: 9900, prix_annuel: 7920, boutique_count: 0,
    limits: { produits: null, ventes: null, commandes: null, admins: 5, entrepots: null },
  },
  {
    key: 'business', prix_mensuel: 24900, prix_annuel: 19920, boutique_count: 0,
    limits: { produits: null, ventes: null, commandes: null, admins: null, entrepots: null },
  },
];

const DEFAULT_GLOBAL: GlobalConfig = {
  trial_days: 14, yearly_discount: 20, whatsapp_number: '+228 90 527 912',
};

const DEFAULT_STATS: Stats = {
  total_shops: 0, active_shops: 0,
  plan_basic: 0, plan_pro: 0, plan_business: 0,
  mrr: 0, active_trials: 0,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanKey, string> = { basic: 'Basic', pro: 'Pro', business: 'Business' };

const LIMIT_LABELS: Record<keyof PlanLimit, string> = {
  produits:  'Produits max',
  ventes:    'Ventes / mois',
  commandes: 'Commandes en ligne / mois',
  admins:    'Admins',
  entrepots: 'Entrepôts',
};

function fmtPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

// ── LimitRow — champ éditable avec toggle illimité ────────────────────────────

function LimitRow({
  label, value, onChange, dark,
}: {
  label:    string;
  value:    number | null;
  onChange: (v: number | null) => void;
  dark?:    boolean;
}) {
  const isUnlimited = value === null;
  const textMuted   = dark ? 'rgba(255,255,255,.5)'  : '#6B635B';
  const accentCol   = dark ? '#F2A765'               : '#14110E';
  const subCol      = dark ? 'rgba(255,255,255,.35)' : '#8A8278';
  const badgeBg     = dark ? 'rgba(242,167,101,.14)' : '#F4EFE6';
  const inactiveBg  = dark ? 'rgba(255,255,255,.07)' : '#F4EFE6';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12.5, color: textMuted }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          title={isUnlimited ? 'Passer à une valeur fixe' : 'Passer à illimité'}
          onClick={() => onChange(isUnlimited ? 0 : null)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
            background: isUnlimited ? badgeBg : inactiveBg,
            color: isUnlimited ? accentCol : subCol,
            transition: 'all .15s',
          }}
        >
          ∞
        </button>
        {isUnlimited ? (
          <span style={{
            fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600,
            color: accentCol, padding: '5px 9px', minWidth: 72, textAlign: 'right',
          }}>
            Illimité
          </span>
        ) : (
          <input
            type="number"
            min={0}
            value={value ?? 0}
            onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
            style={{
              width: 72, textAlign: 'right',
              fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600,
              color: '#14110E', border: '1px solid #E8E1D4', borderRadius: 7,
              padding: '5px 9px', background: '#FFFFFF', outline: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}

type PlanPatch = {
  prix_mensuel?:   number | null;
  prix_annuel?:    number | null;
  boutique_count?: number;
  limits?:         Partial<PlanLimit>;
};

// ── PlanCard ───────────────────────────────────────────────────────────────────

function PlanCard({
  config, onUpdate,
}: {
  config:   PlanConfig;
  onUpdate: (updated: PlanPatch) => void;
}) {
  const dark    = config.key === 'pro';
  const bg      = dark ? '#14110E' : '#FFFFFF';
  const border  = dark ? '1px solid #14110E' : '1px solid #E8E1D4';
  const divider  = dark ? 'rgba(255,255,255,.08)' : '#F0EBE0';
  const sectionBg = dark ? 'rgba(255,255,255,.03)' : '#FEFCF9';
  const labelColor = dark ? 'rgba(255,255,255,.3)' : '#8A8278';
  const priceLabel = dark ? 'rgba(255,255,255,.5)' : '#6B635B';

  const badgeStyles: Record<PlanKey, React.CSSProperties> = {
    basic:    { background: '#F4EFE6', color: '#6B635B' },
    pro:      { background: '#E8F0F7', color: '#3B6A8F' },
    business: { background: '#E6E0F0', color: '#5C4A88' },
  };
  const checkColors: Record<PlanKey, string> = {
    basic: '#2D6A4F', pro: '#F2A765', business: '#5C4A88',
  };
  const countColors: Record<PlanKey, string> = {
    basic: '#2D6A4F', pro: '#F2A765', business: '#5C4A88',
  };

  function setLimit(key: keyof PlanLimit, val: number | null) {
    onUpdate({ limits: { [key]: val } as Partial<PlanLimit> });
  }

  return (
    <div style={{ background: bg, border, borderRadius: 16, overflow: 'hidden', position: 'relative' }}>

      {config.key === 'pro' && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          padding: '3px 9px', borderRadius: 6,
          fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em',
          background: 'rgba(242,167,101,.15)', color: '#F2A765',
        }}>
          Le plus choisi
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ ...badgeStyles[config.key], padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {PLAN_LABELS[config.key]}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: countColors[config.key], fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: countColors[config.key], flexShrink: 0, display: 'inline-block' }} />
            {config.boutique_count} boutique{config.boutique_count !== 1 ? 's' : ''}
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: dark ? 'rgba(255,255,255,.5)' : '#8A8278', lineHeight: 1.5, margin: 0 }}>
          {config.key === 'basic'    && 'Pour tester et démarrer — plan gratuit permanent.'}
          {config.key === 'pro'      && "La plupart de nos commerçants commencent ici."}
          {config.key === 'business' && 'Pour chaînes, grossistes & revendeurs multi-sites.'}
        </p>
      </div>

      {/* Tarification */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${divider}`, background: sectionBg }}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.07em', color: labelColor, marginBottom: 10, fontWeight: 500 }}>
          Tarification
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12.5, color: priceLabel }}>Prix mensuel (FCFA)</span>
            {config.prix_mensuel === null ? (
              <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600, color: dark ? '#F2A765' : '#2D6A4F', padding: '5px 9px' }}>Gratuit</span>
            ) : (
              <input
                type="number"
                min={0}
                value={config.prix_mensuel}
                onChange={e => onUpdate({ prix_mensuel: Number(e.target.value) || 0 })}
                style={{ width: 90, textAlign: 'right', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600, color: '#14110E', border: '1px solid #E8E1D4', borderRadius: 7, padding: '5px 9px', background: '#FFFFFF', outline: 'none' }}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12.5, color: priceLabel }}>Prix annuel (FCFA)</span>
            {config.prix_annuel === null ? (
              <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600, color: dark ? '#F2A765' : '#2D6A4F', padding: '5px 9px' }}>Gratuit</span>
            ) : (
              <input
                type="number"
                min={0}
                value={config.prix_annuel}
                onChange={e => onUpdate({ prix_annuel: Number(e.target.value) || 0 })}
                style={{ width: 90, textAlign: 'right', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600, color: '#14110E', border: '1px solid #E8E1D4', borderRadius: 7, padding: '5px 9px', background: '#FFFFFF', outline: 'none' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Limites */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${divider}` }}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.07em', color: labelColor, marginBottom: 10, fontWeight: 500 }}>
          Limites
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {(Object.keys(LIMIT_LABELS) as (keyof PlanLimit)[]).map(key => (
            <LimitRow
              key={key}
              label={LIMIT_LABELS[key]}
              value={config.limits[key]}
              onChange={v => setLimit(key, v)}
              dark={dark}
            />
          ))}
        </div>
      </div>

      {/* Fonctionnalités */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.07em', color: labelColor, marginBottom: 10, fontWeight: 500 }}>
          Fonctionnalités incluses
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={on ? checkColors[config.key] : (dark ? 'rgba(255,255,255,.2)' : '#D6CCBA')}
                strokeWidth={on ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"
              >
                {on
                  ? <polyline points="20 6 9 17 4 12" />
                  : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                }
              </svg>
              <span style={{ fontSize: 12.5, color: on ? (dark ? 'rgba(255,255,255,.8)' : '#2A2522') : (dark ? 'rgba(255,255,255,.25)' : '#B0A898') }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

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
        total_shops:  Number(data.total_shops  ?? 0),
        active_shops: Number(data.active_shops ?? 0),
        plan_basic:   Number(data.plan_basic   ?? 0),
        plan_pro:     Number(data.plan_pro     ?? 0),
        plan_business:Number(data.plan_business?? 0),
      }));
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [fetchConfig, fetchStats]);

  // Compute MRR from real plan counts + loaded prices
  useEffect(() => {
    const pro = plans.find(p => p.key === 'pro');
    const biz = plans.find(p => p.key === 'business');
    const mrr =
      (stats.plan_pro      * (pro?.prix_mensuel ?? 9900)) +
      (stats.plan_business * (biz?.prix_mensuel ?? 24900));
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
    setPlans(prev => prev.map(p => {
      if (p.key !== key) return p;
      return {
        ...p,
        ...patch,
        limits: patch.limits ? { ...p.limits, ...patch.limits } : p.limits,
      };
    }));
  }

  const total       = Math.max(stats.total_shops, 1);
  const basicPct    = Math.round((stats.plan_basic    / total) * 100);
  const proPct      = Math.round((stats.plan_pro      / total) * 100);
  const businessPct = Math.round((stats.plan_business / total) * 100);

  return (
    <div className={s.wrap}>

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.eyebrow}>Plateforme SaaS</span>
          <h1 className={s.title}>Plans &amp; Tarifs</h1>
          <p className={s.subtitle}>Configurez les offres, prix et limites de la plateforme</p>
        </div>
        <div className={s.headerActions}>
          <button className={s.btn} onClick={() => { fetchConfig(); fetchStats(); }} disabled={loading}>
            <RefreshCw size={14} className={loading ? s.spin : undefined} />
            Actualiser
          </button>
          <button
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={saveConfig}
            disabled={saving}
            style={{ minWidth: 130 }}
          >
            {saving ? (
              <RefreshCw size={14} className={s.spin} />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            )}
            {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={s.kpis}>
        <div className={s.kpi}>
          <div className={s.kpiHead}><span className={s.kpiLabel}>Boutiques actives</span><span className={s.kpiDot} style={{ background: 'var(--ok)' }} /></div>
          <div className={s.kpiValue}>{stats.active_shops}</div>
          <div className={s.kpiFoot}><span className={s.kpiSub}>{stats.total_shops} total</span><Store size={14} style={{ color: 'var(--ok)', opacity: .6 }} /></div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiHead}><span className={s.kpiLabel}>Plans payants</span><span className={s.kpiDot} style={{ background: 'var(--warn)' }} /></div>
          <div className={s.kpiValue}>{stats.plan_pro + stats.plan_business}</div>
          <div className={s.kpiFoot}><span className={s.kpiSub}>{stats.plan_basic} Basic gratuit</span><TrendingUp size={14} style={{ color: 'var(--warn)', opacity: .6 }} /></div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiHead}><span className={s.kpiLabel}>MRR estimé</span><span className={s.kpiDot} style={{ background: 'var(--blue)' }} /></div>
          <div className={s.kpiValue} style={{ fontSize: 20 }}>{fmtPrice(stats.mrr)}</div>
          <div className={s.kpiFoot}><span className={s.kpiSub}>mensuel récurrent</span><DollarSign size={14} style={{ color: 'var(--blue)', opacity: .6 }} /></div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiHead}><span className={s.kpiLabel}>Essais actifs</span><span className={s.kpiDot} style={{ background: 'var(--purple)' }} /></div>
          <div className={s.kpiValue}>{stats.active_trials}</div>
          <div className={s.kpiFoot}><span className={s.kpiSub}>{global.trial_days} jours gratuits</span><Clock size={14} style={{ color: 'var(--purple)', opacity: .6 }} /></div>
        </div>
      </div>

      {/* Distribution */}
      <div className={s.planSection}>
        <div className={s.planCard}>
          <span className={s.planCardLabel}>Distribution des plans</span>
          <div className={s.planItems}>
            {([
              { label: 'Basic',    pct: basicPct,    count: stats.plan_basic,    fillCls: s.planBarFree,  color: 'var(--muted)'  },
              { label: 'Pro',      pct: proPct,      count: stats.plan_pro,      fillCls: s.planBarBasic, color: 'var(--blue)'   },
              { label: 'Business', pct: businessPct, count: stats.plan_business, fillCls: s.planBarPro,   color: 'var(--purple)' },
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

      {/* Section titre */}
      <div style={{ padding: '24px 28px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-.01em', margin: 0 }}>
            Configuration des plans
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 3, marginBottom: 0 }}>
            Modifiez les prix, limites et fonctionnalités — cliquez sur ∞ pour basculer illimité / valeur fixe
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {plans.map(config => (
          <PlanCard
            key={config.key}
            config={config}
            onUpdate={patch => updatePlan(config.key, patch)}
          />
        ))}
      </div>

      {/* Paramètres globaux */}
      <div style={{ margin: '0 28px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', margin: 0 }}>Paramètres globaux</h3>
          <p style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 2, marginBottom: 0 }}>
            Durée d&apos;essai et remise annuelle appliquées à tous les plans payants
          </p>
        </div>
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 7, fontWeight: 500 }}>
              Durée d&apos;essai (jours)
            </label>
            <input
              type="number" min={0} value={global.trial_days}
              onChange={e => setGlobal(g => ({ ...g, trial_days: Number(e.target.value) }))}
              style={{ width: '100%', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 14, fontWeight: 600, color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 7, fontWeight: 500 }}>
              Remise annuelle (%)
            </label>
            <input
              type="number" min={0} max={100} value={global.yearly_discount}
              onChange={e => setGlobal(g => ({ ...g, yearly_discount: Number(e.target.value) }))}
              style={{ width: '100%', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 14, fontWeight: 600, color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 7, fontWeight: 500 }}>
              WhatsApp Business
            </label>
            <input
              type="text" value={global.whatsapp_number}
              onChange={e => setGlobal(g => ({ ...g, whatsapp_number: e.target.value }))}
              style={{ width: '100%', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 14, fontWeight: 600, color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
