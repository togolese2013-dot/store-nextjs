'use client';

import { useRef, useState, useEffect } from 'react';
import { Shield, Store, CreditCard, LayoutDashboard, ChevronDown } from 'lucide-react';
import s from './SaasShell.module.css';

export type SaasView = 'overview' | 'shops' | 'payments';

interface Props {
  view:         SaasView;
  onNav:        (v: SaasView) => void;
  userName:     string;
  pendingCount: number;
}

const NAV: { icon: React.ElementType; label: string; id: SaasView }[] = [
  { icon: LayoutDashboard, label: 'Tableau de bord', id: 'overview' },
  { icon: Store,           label: 'Boutiques',       id: 'shops'    },
  { icon: CreditCard,      label: 'Paiements',       id: 'payments' },
];

export default function SaasSidebar({ view, onNav, userName, pendingCount }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef   = useRef<HTMLDivElement>(null);
  const initial   = userName.charAt(0).toUpperCase() || 'S';

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  async function logout() {
    setMenuOpen(false);
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <aside className={s.sidebar}>

      {/* ── Workspace badge ──────────────────────────────── */}
      <div className={s.ws}>
        <div className={s.wsIcon}>
          <Shield size={15} />
        </div>
        <div className={s.wsMeta}>
          <div className={s.wsL1}>Super Admin</div>
          <div className={s.wsL2}>Plateforme SaaS</div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className={s.nav}>
        {NAV.map(item => {
          const Icon    = item.icon;
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`${s.navItem} ${isActive ? s.active : ''}`}
              onClick={() => onNav(item.id)}
            >
              <span className={s.icon}><Icon size={15} /></span>
              {item.label}
              {item.id === 'payments' && pendingCount > 0 && (
                <span className={s.navBadge}>{pendingCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer (user menu) ────────────────────────────── */}
      <div className={s.foot}>
        <div ref={menuRef}>
          {menuOpen && (
            <div className={s.userMenu}>
              <div className={s.userMenuHeader}>
                <div className={s.userMenuAvatar}>{initial}</div>
                <div>
                  <div className={s.userMenuName}>{userName}</div>
                  <div className={s.userMenuRole}>Super-Admin</div>
                </div>
              </div>
              <div className={s.userMenuBody}>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className={s.userMenuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  Voir le site
                </a>
                <div className={s.userMenuDivider} />
                <button
                  type="button"
                  className={`${s.userMenuItem} ${s.userMenuItemDanger}`}
                  onClick={logout}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          )}

          <button type="button" className={s.userRow} onClick={() => setMenuOpen(o => !o)}>
            <div className={s.avatar}>{initial}</div>
            <div className={s.userMeta}>
              <div className={s.userName}>{userName}</div>
              <div className={s.userRole}>Super-Admin</div>
            </div>
            <span style={{ display: 'grid', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
              <ChevronDown size={12} />
            </span>
          </button>
        </div>
      </div>

    </aside>
  );
}
