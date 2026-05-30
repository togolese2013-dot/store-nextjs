/**
 * Admin Sidebar — workspace switcher + navigation.
 * Pass onNav(id) to wire to your router.
 */
import React, { useState, useRef, useEffect } from 'react';
import type { NavGroup } from './types';
import {
  GaugeIcon, UsersIcon, GridIcon, PlugIcon, ChartIcon, HistoryIcon,
  CogIcon, HelpIcon, ChevDownIcon,
} from './icons';
import styles from './Admin.module.css';

export const DEFAULT_NAV_GROUPS: NavGroup[] = [
  {
    section: null,
    items: [
      { icon: GaugeIcon,   label: "Vue d'ensemble",       id: 'overview' },
      { icon: UsersIcon,   label: 'Utilisateurs & rôles',  id: 'users',        count: 6 },
      { icon: GridIcon,    label: 'Workspaces',            id: 'workspaces',   count: 4 },
      { icon: PlugIcon,    label: 'Intégrations',          id: 'integrations', count: 3 },
      { icon: ChartIcon,   label: 'Rapports',              id: 'reports' },
      { icon: HistoryIcon, label: "Journal d'activité",    id: 'logs' },
    ],
  },
  {
    section: 'Système',
    items: [
      { icon: CogIcon,  label: 'Paramètres compte', id: 'settings' },
      { icon: HelpIcon, label: 'Aide & support',    id: 'help' },
    ],
  },
];

interface SidebarProps {
  groups?: NavGroup[];
  onSwitchWorkspace?: () => void;
  onNav?: (id: string) => void;
  userName?: string;
  userRole?: string;
}

export default function Sidebar({
  groups = DEFAULT_NAV_GROUPS,
  onSwitchWorkspace,
  onNav,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
}: SidebarProps) {
  const initialActive = groups.flatMap(g => g.items).find(i => i.active)?.id ?? 'overview';
  const [activeId,  setActiveId]  = useState<string | null>(initialActive);
  const [menuOpen,  setMenuOpen]  = useState(false);
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

  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside className={styles.sidebar}>
      <button type="button" className={styles.workspaceSwitcher} onClick={onSwitchWorkspace}>
        <div className={styles.workspaceIcon}><GaugeIcon size={16} /></div>
        <div className={styles.workspaceMeta}>
          <div className={styles.l1}>Admin</div>
          <div className={styles.l2}>Config &amp; rapports</div>
        </div>
        <ChevDownIcon size={12} />
      </button>

      <nav className={styles.nav}>
        {groups.map((g, gi) => (
          <div key={gi} className={styles.navGroup}>
            {g.section && <div className={styles.navHeading}>{g.section}</div>}
            {g.items.map((it, ii) => {
              const Icon = it.icon;
              const isActive = it.id ? activeId === it.id : !!it.active;
              return (
                <button
                  key={ii} type="button"
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => { if (it.id) { setActiveId(it.id); onNav?.(it.id); } }}
                >
                  <span className={styles.icon}><Icon size={16} /></span>
                  <span>{it.label}</span>
                  {it.count !== undefined && (
                    <span className={`${styles.count} ${it.badge ? styles.badge : ''}`}>{it.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFoot}>
        <div className={styles.userRowWrap} ref={menuRef}>
          {/* Dropdown — opens upward */}
          {menuOpen && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuHeader}>
                <div className={styles.userMenuAvatar}>{initial}</div>
                <div>
                  <div className={styles.userMenuName}>{userName}</div>
                  <div className={styles.userMenuRole}>{userRole}</div>
                </div>
              </div>
              <div className={styles.userMenuBody}>
                <button type="button" className={styles.userMenuItem} onClick={() => { setMenuOpen(false); onNav?.('settings'); }}>
                  <CogIcon size={14} /> Paramètres compte
                </button>
                <a
                  href="/" target="_blank" rel="noreferrer"
                  className={styles.userMenuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  {/* Globe icon inline */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Voir le site
                </a>
                {onSwitchWorkspace && (
                  <button type="button" className={styles.userMenuItem} onClick={() => { setMenuOpen(false); onSwitchWorkspace(); }}>
                    {/* Layers icon inline */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    Changer d'espace
                  </button>
                )}
                <div className={styles.userMenuDivider} />
                <button type="button" className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`} onClick={logout}>
                  {/* LogOut icon inline */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Déconnexion
                </button>
              </div>
            </div>
          )}

          <button type="button" className={styles.userRow} onClick={() => setMenuOpen(o => !o)}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userMeta}>
              <div className={styles.n}>{userName}</div>
              <div className={styles.r}>{userRole}</div>
            </div>
            <span style={{ display: 'grid', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
              <ChevDownIcon size={12} />
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
