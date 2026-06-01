'use client';
/**
 * WorkspaceSelector
 * ─────────────────────────────────────────────────────────────────────
 * Modern workspace picker — 5 cards (Magasin, Boutique, Store, CRM, Admin)
 * with keyboard nav (1–5 to enter, ⌘K to search), hover lift, and an
 * accent-colored entry overlay.
 *
 * Drop into Next.js / Vite / CRA. Bring your own router for navigation —
 * pass an `onEnter(ws)` handler (e.g. `router.push(`/admin/${ws.id}`)`).
 *
 * Requires:
 *  - React 18+
 *  - The companion `WorkspaceSelector.module.css`
 *  - Optionally Google Fonts: Geist, Geist Mono, Instrument Serif
 *
 * Author note: the `count` field is illustrative (it's just a string the
 * card displays in the footer). Feed it from your live stats — e.g.
 *   { ...w, count: `${productCount} produits` }
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Workspace, WorkspaceWithIcon } from './types';
import {
  PackageIcon, BagIcon, StorefrontIcon, UsersIcon, GaugeIcon,
  ArrowRightIcon, SearchIcon,
} from './icons';
import styles from './WorkspaceSelector.module.css';

/* ─── Default workspaces ─────────────────────────────────────────── */
export const DEFAULT_WORKSPACES: WorkspaceWithIcon[] = [
  { id: 'magasin',  name: 'Magasin',  tag: 'Gestion des stocks', desc: 'Produits, catégories, marques, fournisseurs et achats',          tint: '#3B6A8F', tintBg: '#E8F0F7', count: '248 produits',  icon: PackageIcon },
  { id: 'boutique', name: 'Boutique', tag: 'Ventes & caisse',    desc: 'Ventes du jour, stock boutique, finance, clients physiques',     tint: '#C9601E', tintBg: '#FBE9D6', count: '12 ventes auj.', icon: BagIcon },
  { id: 'store',    name: 'Store',    tag: 'E-commerce',         desc: 'Commandes en ligne, coupons, zones de livraison, paiements',     tint: '#2D6A4F', tintBg: '#DDEBE2', count: '3 commandes',    icon: StorefrontIcon },
  { id: 'crm',      name: 'CRM',      tag: 'Relation client',    desc: 'Comptes clients, fidélité, parrainage, newsletter, WhatsApp',    tint: '#5C4A88', tintBg: '#E6E0F0', count: '1 421 clients',  icon: UsersIcon },
  { id: 'admin',    name: 'Admin',    tag: 'Config & rapports',  desc: 'Utilisateurs, rôles, paramètres, rapports avancés, intégrations', tint: '#2A2522', tintBg: '#EBE4D6', count: '4 équipiers',    icon: GaugeIcon },
];

/* ─── Subscription helpers ───────────────────────────────────────── */
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function planColors(plan: string): { text: string; bg: string } {
  if (plan === 'business') return { text: '#5C4A88', bg: '#E6E0F0' };
  if (plan === 'pro')      return { text: '#3B6A8F', bg: '#E8F0F7' };
  if (plan === 'basic')    return { text: '#6B635B', bg: '#EBE4D6' };
  return { text: '#6B635B', bg: '#EBE4D6' };
}

function planLabel(plan: string): string {
  if (plan === 'business') return 'Business';
  if (plan === 'pro')      return 'Pro';
  if (plan === 'basic')    return 'Basic';
  return 'Basic';
}

/* ─── Plan badge (topbar) ────────────────────────────────────────── */
function PlanBadge({
  plan, status, trialEndsAt, periodEnd,
}: {
  plan: string; status: string;
  trialEndsAt?: string | null; periodEnd?: string | null;
}) {
  const isTrial   = status === 'trial';
  const isExpired = status === 'expired' || status === 'suspended';
  const days      = isTrial ? daysUntil(trialEndsAt) : daysUntil(periodEnd);
  const isWarn    = !isExpired && days !== null && days <= 14;

  let text: string;
  let textColor: string;
  let bgColor: string;
  let border: string;

  if (isExpired) {
    text = 'Expiré'; textColor = '#9C3A14'; bgColor = '#F7DCCB'; border = 'rgba(156,58,20,.2)';
  } else if (isTrial) {
    const d = days ?? 0;
    text = `Essai · ${d > 0 ? d + 'j' : 'terminé'}`;
    textColor = d <= 7 ? '#9C3A14' : '#C9601E';
    bgColor   = d <= 7 ? '#F7DCCB'  : '#FBE9D6';
    border    = d <= 7 ? 'rgba(156,58,20,.2)' : 'rgba(201,96,30,.2)';
  } else if (isWarn) {
    text = `${planLabel(plan)} · ${days}j`;
    textColor = '#C9601E'; bgColor = '#FBE9D6'; border = 'rgba(201,96,30,.2)';
  } else {
    const c = planColors(plan);
    text = planLabel(plan); textColor = c.text; bgColor = c.bg;
    border = `rgba(${plan === 'business' ? '92,74,136' : plan === 'pro' ? '59,106,143' : '107,99,91'},.2)`;
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: '.03em',
      color: textColor, background: bgColor,
      border: `1px solid ${border}`,
      fontFamily: '"Geist Mono", monospace',
      flexShrink: 0,
    }}>
      {text}
    </span>
  );
}

/* ─── Expiry banner (B) ──────────────────────────────────────────── */
function ExpiryBanner({
  plan, status, trialEndsAt, periodEnd,
}: {
  plan: string; status: string;
  trialEndsAt?: string | null; periodEnd?: string | null;
}) {
  const isTrial   = status === 'trial';
  const isExpired = status === 'expired' || status === 'suspended';
  const isSuspended = status === 'suspended';
  const days      = isTrial ? daysUntil(trialEndsAt) : daysUntil(periodEnd);
  const isWarn    = !isExpired && days !== null && days <= 14;

  if (!isExpired && !isWarn) return null;

  let icon: string;
  let text: React.ReactNode;
  let bg: string;
  let border: string;
  let textColor: string;
  let ctaLabel: string;

  if (isSuspended) {
    icon = '🔒'; bg = '#F7DCCB'; border = 'rgba(156,58,20,.25)'; textColor = '#7D2D0E';
    ctaLabel = 'Contacter le support';
    text = <><strong>Boutique suspendue.</strong> L'accès public est bloqué.</>;
  } else if (isExpired) {
    icon = '⚠'; bg = '#FBE9D6'; border = 'rgba(201,96,30,.25)'; textColor = '#7D3B0E';
    ctaLabel = 'Renouveler';
    text = <><strong>Abonnement expiré.</strong> Renouvelez pour maintenir l'accès.</>;
  } else if (isTrial) {
    const d = days ?? 0;
    const isDanger = d <= 3;
    bg = isDanger ? '#F7DCCB' : '#FBE9D6';
    border = isDanger ? 'rgba(156,58,20,.25)' : 'rgba(201,96,30,.25)';
    textColor = isDanger ? '#7D2D0E' : '#7D3B0E';
    icon = isDanger ? '⏳' : '⏱';
    ctaLabel = 'Choisir un plan';
    text = d > 0
      ? <><strong>Essai gratuit — {d} jour{d > 1 ? 's' : ''} restant{d > 1 ? 's' : ''}.</strong> Choisissez un plan avant expiration.</>
      : <><strong>Essai terminé.</strong> Choisissez un plan pour continuer.</>;
  } else {
    const d = days ?? 0;
    bg = '#FBE9D6'; border = 'rgba(201,96,30,.25)'; textColor = '#7D3B0E';
    icon = '⏱'; ctaLabel = 'Renouveler';
    text = <><strong>Plan {planLabel(plan)} — expire dans {d} jour{d > 1 ? 's' : ''}.</strong> Renouvelez pour éviter l'interruption.</>;
  }

  return (
    <div style={{
      maxWidth: 1180, margin: '0 auto 20px', padding: '0 36px', width: '100%',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: bg, border: `1px solid ${border}`,
        borderRadius: 12, color: textColor,
        fontSize: 13.5,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, lineHeight: 1.4 }}>{text}</span>
        <a
          href="/admin/billing"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(0,0,0,.08)', color: textColor,
            fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
            flexShrink: 0, whiteSpace: 'nowrap',
            border: `1px solid ${border}`,
            transition: 'background .15s',
          }}
        >
          {ctaLabel} →
        </a>
      </div>
    </div>
  );
}

/* ─── Subscription card (grid) ───────────────────────────────────── */
function SubscriptionCard({
  plan, status, trialEndsAt, periodEnd,
}: {
  plan: string; status: string;
  trialEndsAt?: string | null; periodEnd?: string | null;
}) {
  const isTrial   = status === 'trial';
  const isExpired = status === 'expired' || status === 'suspended';
  const days      = isTrial ? daysUntil(trialEndsAt) : daysUntil(periodEnd);
  const isWarn    = !isExpired && days !== null && days <= 14;
  const colors    = planColors(plan);

  let accentText: string;
  let accentBg: string;
  let statusLine: React.ReactNode;

  if (isExpired) {
    accentText = '#9C3A14'; accentBg = '#F7DCCB';
    statusLine = <span style={{ color: '#9C3A14', fontWeight: 600 }}>Expiré — accès restreint</span>;
  } else if (isTrial) {
    accentText = '#C9601E'; accentBg = '#FBE9D6';
    const d = days ?? 0;
    statusLine = trialEndsAt == null ? (
      <span style={{ color: '#6B635B' }}>Essai en cours</span>
    ) : (
      <span>
        <span style={{ color: d <= 7 ? '#9C3A14' : '#C9601E', fontWeight: 600 }}>
          {d > 0 ? `${d} jour${d > 1 ? 's' : ''} d'essai restant${d > 1 ? 's' : ''}` : "Essai terminé"}
        </span>
        {d > 0 && (
          <span style={{ color: '#8A8278', fontSize: 12, display: 'block', marginTop: 2 }}>
            Jusqu'au {fmtDate(trialEndsAt)}
          </span>
        )}
      </span>
    );
  } else if (isWarn && periodEnd) {
    accentText = '#C9601E'; accentBg = '#FBE9D6';
    statusLine = (
      <span>
        <span style={{ color: '#C9601E', fontWeight: 600 }}>Expire dans {days} jour{(days ?? 0) > 1 ? 's' : ''}</span>
        <span style={{ color: '#8A8278', fontSize: 12, display: 'block', marginTop: 2 }}>
          Le {fmtDate(periodEnd)}
        </span>
      </span>
    );
  } else {
    accentText = colors.text; accentBg = colors.bg;
    statusLine = periodEnd ? (
      <span style={{ color: '#6B635B' }}>Expire le {fmtDate(periodEnd)}</span>
    ) : (
      <span style={{ color: '#6B635B' }}>Actif</span>
    );
  }

  const ctaLabel = isExpired ? 'Renouveler' : isTrial ? 'Choisir un plan' : isWarn ? 'Renouveler' : 'Gérer';

  return (
    <a
      href="/admin/billing"
      style={{
        position: 'relative',
        background: 'white',
        border: `1px solid ${isExpired || isWarn ? 'rgba(201,96,30,.35)' : '#E8E1D4'}`,
        borderRadius: 18,
        padding: '22px 22px 18px',
        display: 'flex', flexDirection: 'column',
        minHeight: 220,
        textDecoration: 'none', color: 'inherit',
        transition: 'transform .18s ease, border-color .18s ease, box-shadow .25s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 18px 40px -22px rgba(20,17,14,0.25)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = '';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: accentBg, color: accentText,
          display: 'grid', placeItems: 'center',
        }}>
          {/* Credit card icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <span style={{
          fontFamily: '"Geist Mono", monospace',
          fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
          color: '#6B635B', fontWeight: 500,
          padding: '4px 9px', border: '1px solid #E8E1D4',
          background: '#FBF7F1', borderRadius: 999,
        }}>
          Abonnement
        </span>
      </div>

      {/* Plan name */}
      <h3 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.022em', lineHeight: 1.1, margin: '0 0 6px' }}>
        Plan&nbsp;
        <span style={{ color: accentText }}>{planLabel(plan)}</span>
      </h3>

      {/* Status line */}
      <p style={{ fontSize: 13.5, lineHeight: 1.5, color: '#6B635B', margin: '0 0 18px' }}>
        {statusLine}
      </p>

      {/* Footer */}
      <div style={{
        marginTop: 'auto', paddingTop: 14,
        borderTop: '1px dashed #E8E1D4',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: '"Geist Mono", monospace', fontSize: 12, color: '#14110E',
          display: 'inline-flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: accentText, display: 'inline-block', flexShrink: 0 }} />
          {ctaLabel}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: 999,
          background: '#FBF7F1', color: '#14110E',
          border: '1px solid #E8E1D4',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ArrowRightIcon size={15} />
        </div>
      </div>
    </a>
  );
}

/* ─── Component props ────────────────────────────────────────────── */
export interface WorkspaceSelectorProps {
  workspaces?: WorkspaceWithIcon[];
  /** Shown in the topbar next to the brand: "Maison Diallo · Lomé" */
  shopName?: string;
  shopLocation?: string;
  /** User name + initial for the avatar pill */
  userName?: string;
  userRole?: string;
  /** Subscription info */
  shopPlan?: string;
  shopStatus?: string;
  shopTrialEndsAt?: string | null;
  shopPeriodEnd?: string | null;
  /** Called when a card / palette row is selected. Wire to your router. */
  onEnter: (workspace: Workspace) => void;
}

/* ─── Card ───────────────────────────────────────────────────────── */
function WorkspaceCard({
  ws, index, onEnter,
}: { ws: WorkspaceWithIcon; index: number; onEnter: (ws: Workspace) => void }) {
  const Icon = ws.icon;
  return (
    <button
      type="button"
      className={styles.ws}
      style={{ ['--accent' as any]: ws.tint, ['--tint-bg' as any]: ws.tintBg }}
      onClick={() => onEnter(ws)}
      aria-label={`Ouvrir l'espace ${ws.name}`}
    >
      <span className={styles.wsKey}>{index + 1}</span>
      <div className={styles.wsTop}>
        <div className={styles.wsIcon}><Icon size={20} /></div>
        <div className={styles.wsTag}>{ws.tag}</div>
      </div>
      <h3 className={styles.wsName}>{ws.name}</h3>
      <p className={styles.wsDesc}>{ws.desc}</p>
      <div className={styles.wsFoot}>
        <div className={styles.wsCount}>
          <span className="dot" /> <span>{ws.count}</span>
        </div>
        <div className={styles.wsCta} aria-hidden="true">
          <ArrowRightIcon size={15} />
        </div>
      </div>
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function WorkspaceSelector({
  workspaces = DEFAULT_WORKSPACES,
  shopName = 'Maison Diallo',
  shopLocation = '',
  userName = 'Kent',
  userRole = 'Propriétaire',
  shopPlan,
  shopStatus,
  shopTrialEndsAt,
  shopPeriodEnd,
  onEnter,
}: WorkspaceSelectorProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [entering,    setEntering]    = useState<Workspace | null>(null);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  async function logout() {
    setMenuOpen(false);
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const enter = useCallback((ws: Workspace) => {
    setPaletteOpen(false);
    setEntering(ws);
    // small delay lets the overlay paint before route change
    window.setTimeout(() => {
      setEntering(null);
      onEnter(ws);
    }, 450);
  }, [onEnter]);

  // ⌘K + 1–5 shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setPaletteOpen(o => !o); return;
      }
      if (!paletteOpen && !entering && /^[1-5]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const ws = workspaces[parseInt(e.key, 10) - 1];
        if (ws) enter(ws);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [paletteOpen, entering, workspaces, enter]);

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14110E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9h18l-1.5-4.5A1 1 0 0 0 18.55 4H5.45a1 1 0 0 0-.95.7L3 9z" />
              <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
              <path d="M9 13h6" />
            </svg>
          </span>
          <span className={styles.brandName}>Afrisika</span>
          <span className={styles.brandDivider} />
          <span className={styles.brandShop}><b>{shopName}</b>{shopLocation ? ` · ${shopLocation}` : ''}</span>
          {shopPlan && shopStatus && (
            <PlanBadge
              plan={shopPlan}
              status={shopStatus}
              trialEndsAt={shopTrialEndsAt}
              periodEnd={shopPeriodEnd}
            />
          )}
        </div>

        <div className={styles.topActions}>
          <button type="button" className={styles.searchBtn} onClick={() => setPaletteOpen(true)}>
            <SearchIcon size={13} />
            Rechercher un espace
            <span className={styles.kbd}>⌘K</span>
          </button>
          <div className={styles.userPillWrap} ref={menuRef}>
            <button type="button" className={styles.userPill} onClick={() => setMenuOpen(o => !o)}>
              <div className={styles.avatar}>{userInitial}</div>
              {userName}
              <svg
                width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="#8A8278" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginLeft: 2, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {menuOpen && (
              <div className={styles.userMenu}>
                <div className={styles.userMenuHeader}>
                  <div className={styles.userMenuAvatar}>{userInitial}</div>
                  <div>
                    <div className={styles.userMenuName}>{userName}</div>
                    <div className={styles.userMenuRole}>{userRole}</div>
                  </div>
                </div>
                <div className={styles.userMenuBody}>
                  <a href="/admin/settings" className={styles.userMenuItem} onClick={() => setMenuOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Paramètres
                  </a>
                  <a href="/" target="_blank" rel="noreferrer" className={styles.userMenuItem} onClick={() => setMenuOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Voir le site
                  </a>
                  <div className={styles.userMenuDivider} />
                  <button type="button" className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`} onClick={logout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Heading */}
      <div className={styles.headingWrap}>
        <div className={styles.eyebrow}>Espaces de travail</div>
        <h1 className={styles.h1}>Que souhaitez-vous <span className={styles.serif}>gérer&nbsp;?</span></h1>
        <p className={styles.lede}>Sélectionnez un espace pour continuer — vos accès se synchronisent en temps réel.</p>
      </div>

      {/* Expiry banner (B) — only renders when relevant */}
      {shopPlan && shopStatus && (
        <ExpiryBanner
          plan={shopPlan}
          status={shopStatus}
          trialEndsAt={shopTrialEndsAt}
          periodEnd={shopPeriodEnd}
        />
      )}

      {/* Grid */}
      <div className={styles.gridWrap}>
        <div className={styles.grid}>
          {workspaces.map((ws, i) => (
            <WorkspaceCard key={ws.id} ws={ws} index={i} onEnter={enter} />
          ))}
          {shopPlan && shopStatus && (
            <SubscriptionCard
              plan={shopPlan}
              status={shopStatus}
              trialEndsAt={shopTrialEndsAt}
              periodEnd={shopPeriodEnd}
            />
          )}
        </div>
      </div>

      {/* Footer hints */}
      <div className={styles.pageFoot}>
        <span className={styles.mono} style={{ fontSize: 11 }}>{workspaces.length} espaces · synchronisés</span>
        <span>
          <span className={styles.kbd}>1</span>–<span className={styles.kbd}>{workspaces.length}</span> pour ouvrir directement &nbsp;·&nbsp;
          <span className={styles.kbd}>⌘</span><span className={styles.kbd}>K</span> pour rechercher
        </span>
      </div>

      {/* Palette */}
      <CommandPalette
        open={paletteOpen}
        workspaces={workspaces}
        onClose={() => setPaletteOpen(false)}
        onPick={enter}
      />

      {/* Entry overlay */}
      <EnterOverlay workspace={entering} />
    </div>
  );
}

/* ─── Command palette (extracted) ────────────────────────────────── */
function CommandPalette({
  open, workspaces, onClose, onPick,
}: {
  open: boolean;
  workspaces: WorkspaceWithIcon[];
  onClose: () => void;
  onPick: (ws: Workspace) => void;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!q) return workspaces;
    const k = q.toLowerCase();
    return workspaces.filter(w =>
      w.name.toLowerCase().includes(k) ||
      w.tag.toLowerCase().includes(k) ||
      w.desc.toLowerCase().includes(k)
    );
  }, [q, workspaces]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 30);
      setQ(''); setActive(0);
    }
  }, [open]);

  useEffect(() => { setActive(0); }, [q]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) onPick(filtered[active]); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,17,14,0.4)', backdropFilter: 'blur(6px)',
        display: open ? 'grid' : 'none',
        placeItems: 'flex-start center', paddingTop: '18vh', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)',
          background: 'white', borderRadius: 16,
          boxShadow: '0 30px 80px -20px rgba(20,17,14,0.45)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid #E8E1D4' }}>
          <SearchIcon size={16} />
          <input
            ref={inputRef} value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Rechercher un espace — Magasin, Boutique, CRM…"
            style={{ flex: 1, border: 0, background: 'transparent', font: 'inherit', outline: 0, fontSize: 15 }}
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#8A8278' }}>
              Aucun espace trouvé pour « {q} »
            </div>
          )}
          {filtered.map((w, i) => {
            const Icon = w.icon;
            return (
              <div
                key={w.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => onPick(w)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: i === active ? '#F4EFE6' : 'transparent',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: w.tintBg, color: w.tint,
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: '#6B635B' }}>{w.tag}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Enter overlay ──────────────────────────────────────────────── */
function EnterOverlay({ workspace }: { workspace: Workspace | null }) {
  if (!workspace) return null;
  const bg = workspace.id === 'admin' ? '#14110E' : workspace.tint;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: bg, color: 'white',
      display: 'grid', placeItems: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.03em', marginBottom: 8 }}>
          {workspace.name}
        </div>
        <div style={{
          fontSize: 14, opacity: 0.7,
          fontFamily: '"Geist Mono", monospace',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {workspace.tag}
        </div>
      </div>
    </div>
  );
}
