/**
 * Admin Sidebar — workspace switcher + navigation.
 * Pass onNav(id) to wire to your router.
 */
import React, { useState } from 'react';
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
  const [activeId, setActiveId] = useState<string | null>(initialActive);

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
        <div className={styles.userRow}>
          <div className={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
          <div className={styles.userMeta}>
            <div className={styles.n}>{userName}</div>
            <div className={styles.r}>{userRole}</div>
          </div>
          <CogIcon size={14} />
        </div>
      </div>
    </aside>
  );
}
