/**
 * Boutique Sidebar — workspace switcher + navigation.
 * Pass onNav(id) to wire to your router.
 */
import React, { useState } from 'react';
import type { NavGroup } from './types';
import {
  HomeIcon, ReceiptIcon, BoxIcon, WalletIcon, UsersIcon,
  CogIcon, HelpIcon, ChevDownIcon,
} from './icons';
import styles from './Boutique.module.css';

export const DEFAULT_NAV_GROUPS: NavGroup[] = [
  {
    section: null,
    items: [
      { icon: HomeIcon,    label: "Vue d'ensemble", id: 'overview' },
      { icon: ReceiptIcon, label: 'Ventes',          id: 'ventes',  count: 7 },
      { icon: BoxIcon,     label: 'Stock boutique',   id: 'stock',   count: 2, badge: true },
      { icon: WalletIcon,  label: 'Finance',          id: 'finance' },
      { icon: UsersIcon,   label: 'Clients',          id: 'clients', count: 8 },
    ],
  },
  {
    section: 'Paramètres',
    items: [
      { icon: CogIcon,  label: 'Réglages boutique', id: 'settings' },
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
        <div className={styles.workspaceIcon}><ReceiptIcon size={16} /></div>
        <div className={styles.workspaceMeta}>
          <div className={styles.l1}>Boutique</div>
          <div className={styles.l2}>Ventes &amp; caisse</div>
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
