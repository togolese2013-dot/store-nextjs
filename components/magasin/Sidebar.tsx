/**
 * Sidebar — workspace switcher + navigation.
 *
 * Self-contained: takes a `groups` array (NavGroup[]) and renders sections.
 * Click handlers are local; lift state to the parent if you wire routing.
 */
import React, { useState } from 'react';
import type { NavGroup } from './types';
import {
  HomeIcon, BoxIcon, FolderIcon, TagIcon, VariantsIcon, TruckIcon,
  ReceiptIcon, WarehouseIcon, AdjustmentsIcon, HistoryIcon,
  CogIcon, HelpIcon, ChevDownIcon,
} from './icons';
import styles from './Magasin.module.css';

export const DEFAULT_NAV_GROUPS: NavGroup[] = [
  {
    section: null,
    items: [
      { icon: HomeIcon,    label: 'Vue d\'ensemble', id: 'overview' },
      { icon: BoxIcon,     label: 'Produits', count: 248, active: true, id: 'products' },
      { icon: FolderIcon,  label: 'Catégories', count: 18, id: 'categories' },
      { icon: TagIcon,     label: 'Marques', count: 12, id: 'brands' },
      { icon: VariantsIcon,label: 'Variantes', count: 86, id: 'variants' },
    ],
  },
  {
    section: 'Approvisionnement',
    items: [
      { icon: TruckIcon,    label: 'Fournisseurs', count: 24, id: 'suppliers' },
      { icon: ReceiptIcon,  label: 'Bons d\'achat', count: 6, id: 'purchase-orders' },
      { icon: WarehouseIcon,label: 'Entrepôts', count: 3, id: 'warehouses' },
    ],
  },
  {
    section: 'Stock',
    items: [
      { icon: AdjustmentsIcon, label: 'Ajustements', id: 'adjustments' },
      { icon: HistoryIcon,     label: 'Mouvements', id: 'movements' },
      { icon: BoxIcon,         label: 'Alertes stock', count: 7, badge: true, id: 'alerts' },
    ],
  },
  {
    section: 'Paramètres',
    items: [
      { icon: CogIcon,  label: 'Réglages magasin', id: 'settings' },
      { icon: HelpIcon, label: 'Aide & support', id: 'help' },
    ],
  },
];

interface SidebarProps {
  groups?: NavGroup[];
  onSwitchWorkspace?: () => void;
  onNav?: (id: string) => void;
  activeId?: string | null;
  userName?: string;
  userRole?: string;
}

export default function Sidebar({
  groups = DEFAULT_NAV_GROUPS,
  onSwitchWorkspace,
  onNav,
  activeId: controlledActiveId,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
}: SidebarProps) {
  // Use controlled activeId if provided, else track locally
  const initialActive = groups.flatMap(g => g.items).find(i => i.active)?.id ?? null;
  const [localActive, setLocalActive] = useState<string | null>(initialActive);
  const activeId = controlledActiveId !== undefined ? controlledActiveId : localActive;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <button type="button" className={styles.workspaceSwitcher} onClick={onSwitchWorkspace}>
          <div className={styles.workspaceIcon}><BoxIcon size={16} /></div>
          <div className={styles.workspaceMeta}>
            <div className={styles.l1}>Magasin</div>
            <div className={styles.l2}>Gestion des stocks</div>
          </div>
          <ChevDownIcon size={12} />
        </button>
      </div>

      <nav className={styles.nav}>
        {groups.map((g, gi) => (
          <div key={gi} className={styles.navGroup}>
            {g.section && <div className={styles.navHeading}>{g.section}</div>}
            {g.items.map((it, ii) => {
              const Icon = it.icon;
              const isActive = it.id ? activeId === it.id : !!it.active;
              return (
                <button
                  key={ii}
                  type="button"
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => {
                    if (it.id) { setLocalActive(it.id); onNav?.(it.id); }
                  }}
                >
                  <span className={styles.icon}><Icon size={16} /></span>
                  <span>{it.label}</span>
                  {it.count !== undefined && (
                    <span className={`${styles.count} ${it.badge ? styles.badge : ''}`}>
                      {it.count}
                    </span>
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
