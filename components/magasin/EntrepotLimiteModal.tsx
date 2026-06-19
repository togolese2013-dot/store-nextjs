/**
 * EntrepotLimiteModal.tsx
 *
 * Modal affiché quand un client en plan Basic (1 entrepôt max) tente de créer
 * un nouvel entrepôt. Propose le passage en Pro ou Business.
 *
 * Tokens CSS attendus (déjà définis globalement dans le projet) :
 *   --surface --border --border-strong --ink --ink-2 --muted --muted-2
 *   --accent --accent-bg --warn --warn-bg --plum --plum-bg
 * Polices : "Geist", "Geist Mono", "Instrument Serif".
 *
 * Usage :
 *   const [showLimite, setShowLimite] = useState(false);
 *   // au clic "Nouvel entrepôt" alors que le quota est atteint :
 *   setShowLimite(true);
 *   ...
 *   {showLimite && (
 *     <EntrepotLimiteModal
 *       onClose={() => setShowLimite(false)}
 *       onUpgrade={() => router.push('/reglages/abonnement')}
 *     />
 *   )}
 */

import React from 'react';

// ─── Icônes inline ───────────────────────────────────────────────────────────

const IcLock = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IcClose = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IcArrow = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlanFeature { ic: string; label: string; }
interface Plan {
  key: 'basic' | 'pro' | 'business';
  name: string;
  tag?: string;
  feats: PlanFeature[];
  price: string;
  period?: string;
}

const PLANS: Plan[] = [
  {
    key: 'basic',
    name: 'Basic · Actuel',
    feats: [
      { ic: '🏭', label: '1 entrepôt' },
      { ic: '📦', label: '20 produits' },
      { ic: '👤', label: '1 utilisateur' },
    ],
    price: 'Gratuit',
  },
  {
    key: 'pro',
    name: 'Pro',
    tag: 'Recommandé',
    feats: [
      { ic: '🏭', label: 'Entrepôts illimités' },
      { ic: '📦', label: 'Produits illimités' },
      { ic: '👥', label: '5 utilisateurs' },
    ],
    price: '9 900 F',
    period: '/ mois',
  },
  {
    key: 'business',
    name: 'Business',
    feats: [
      { ic: '🏢', label: 'Multi‑entrepôts & transferts' },
      { ic: '🔌', label: 'API & webhooks' },
      { ic: '🎧', label: 'Gestionnaire dédié' },
    ],
    price: '24 900 F',
    period: '/ mois',
  },
];

// ─── Styles par plan ──────────────────────────────────────────────────────────

const planSkin: Record<Plan['key'], React.CSSProperties> = {
  basic:    { background: 'var(--bg, #FBF7F1)', borderStyle: 'dashed', borderColor: 'var(--border)' },
  pro:      { background: 'var(--accent-bg)', borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' },
  business: { background: 'var(--plum-bg)', borderColor: 'var(--plum)' },
};
const nameColor: Record<Plan['key'], string> = {
  basic: 'var(--muted)', pro: 'var(--accent)', business: 'var(--plum)',
};

// ─── Composant ────────────────────────────────────────────────────────────────

export interface EntrepotLimiteModalProps {
  /** Ferme le modal (clic sur ✕, sur "Annuler" ou sur le fond). */
  onClose: () => void;
  /** Clic sur le CTA "Voir les plans" → rediriger vers la page d'abonnement. */
  onUpgrade: () => void;
  /** Nom du plan courant affiché dans l'eyebrow. Défaut : "Basic". */
  currentPlan?: string;
  /** Nombre d'entrepôts inclus dans le plan courant. Défaut : 1. */
  includedWarehouses?: number;
}

export const EntrepotLimiteModal: React.FC<EntrepotLimiteModalProps> = ({
  onClose,
  onUpgrade,
  currentPlan = 'Basic',
  includedWarehouses = 1,
}) => {
  // Fermeture au clavier (Échap)
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="entrepot-limite-title"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center',
        padding: 32, background: 'rgba(20,17,14,.36)', backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: 680, maxWidth: '94vw', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 18,
          boxShadow: '0 26px 64px rgba(20,17,14,.24)', overflow: 'hidden',
          fontFamily: '"Geist",system-ui,sans-serif', color: 'var(--ink)',
          animation: 'entLimitePop .22s cubic-bezier(.32,.72,0,1)',
        }}
      >
        <style>{`@keyframes entLimitePop{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '24px 26px 18px' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, background: 'var(--warn-bg)', color: 'var(--warn)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <IcLock />
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--warn)', fontWeight: 600, marginBottom: 5 }}>
              Plan {currentPlan}
            </div>
            <h2 id="entrepot-limite-title" style={{ fontSize: 23, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1.05, margin: 0 }}>
              Limite d'entrepôts{' '}
              <span style={{ fontFamily: '"Instrument Serif",Georgia,serif', fontStyle: 'italic', fontWeight: 400 }}>atteinte</span>
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '7px 0 0', maxWidth: '52ch', lineHeight: 1.5 }}>
              Votre plan <b style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{currentPlan}</b> inclut{' '}
              <b style={{ color: 'var(--ink-2)', fontWeight: 600 }}>
                {includedWarehouses} entrepôt{includedWarehouses > 1 ? 's' : ''}
              </b>. Passez à un plan supérieur pour créer des entrepôts supplémentaires et gérer plusieurs sites de stockage.
            </p>
          </div>
          <button
            aria-label="Fermer"
            onClick={onClose}
            style={{
              marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center',
              color: 'var(--muted)', flexShrink: 0, background: 'transparent', border: 0, cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,17,14,.06)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            <IcClose />
          </button>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '4px 26px 6px' }}>
          {PLANS.map(p => (
            <div
              key={p.key}
              style={{
                position: 'relative', border: '1px solid var(--border)', borderRadius: 14,
                padding: '15px 15px 14px', display: 'flex', flexDirection: 'column', gap: 12,
                ...planSkin[p.key],
              }}
            >
              {p.tag && (
                <span style={{
                  position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                  color: '#fff', background: 'var(--accent)', padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap',
                }}>
                  {p.tag}
                </span>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: nameColor[p.key] }}>
                {p.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                {p.feats.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.2 }}>
                    <span style={{ width: 17, textAlign: 'center', flexShrink: 0, fontSize: 13.5 }}>{f.ic}</span>
                    {f.label}
                  </div>
                ))}
              </div>
              <div style={{
                paddingTop: 11,
                borderTop: `1px solid ${p.key === 'basic' ? 'var(--border)' : 'rgba(20,17,14,.08)'}`,
                fontSize: 12.5, color: 'var(--muted)',
              }}>
                <b style={{ fontFamily: '"Geist Mono",monospace', fontSize: 14, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-.01em' }}>
                  {p.price}
                </b>
                {p.period && <span style={{ fontSize: 11.5 }}> {p.period}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', padding: '18px 26px 22px', marginTop: 8 }}>
          <span style={{ marginRight: 'auto', fontSize: 11.5, color: 'var(--muted-2)', maxWidth: '24ch', lineHeight: 1.35 }}>
            Aucun engagement · changez de plan à tout moment
          </span>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 17px', borderRadius: 10,
              fontSize: 13.5, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--ink)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(20,17,14,.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Annuler
          </button>
          <button
            onClick={onUpgrade}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 17px', borderRadius: 10,
              fontSize: 13.5, fontWeight: 500, border: '1px solid var(--accent)', background: 'var(--accent)',
              color: '#fff', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#335f81'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Voir les plans <IcArrow />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntrepotLimiteModal;
