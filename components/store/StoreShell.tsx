/**
 * StoreShell — multi-page shell for the Store workspace
 * ──────────────────────────────────────────────────────────────────
 * Wraps Sidebar + Topbar and routes between 5 pages:
 *   overview · commandes · coupons · livraisons · paiements
 *
 * Mounted via StoreDataLoader, which fetches real data and passes it down.
 */
'use client';

import React, { useMemo, useState } from 'react';
import type { Order, Coupon, DeliveryZone, Payment, StoreOrderStats } from './types';
import Sidebar, { DEFAULT_NAV_GROUPS } from './Sidebar';
import OverviewPage from './OverviewPage';
import CommandesPage from './CommandesPage';
import CouponsPage from './CouponsPage';
import LivraisonsPage from './LivraisonsPage';
import PaiementsPage from './PaiementsPage';
import ReglagesPage from './ReglagesPage';
import ContenuVitrinePage from './ContenuVitrinePage';
import { SearchIcon, BellIcon, ChevLeftIcon } from './icons';
import { useUI, useConfig } from '@/components/interaction-layer';
import styles from './Store.module.css';

/* ─── Types ─────────────────────────────────────────────────────── */
type PageId = 'overview' | 'commandes' | 'coupons' | 'livraisons' | 'paiements' | 'contenu' | 'settings';

const PAGE_LABELS: Record<PageId, string> = {
  overview:   "Vue d'ensemble",
  commandes:  'Commandes',
  coupons:    'Coupons',
  livraisons: 'Livraisons',
  paiements:  'Paiements',
  contenu:    'Contenu vitrine',
  settings:   'Réglages boutique',
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview:   'Rechercher…',
  commandes:  'Rechercher une commande, client…',
  coupons:    'Rechercher un code promo…',
  livraisons: 'Rechercher une zone de livraison…',
  paiements:  'Rechercher une transaction, client…',
  contenu:    'Rechercher…',
  settings:   'Rechercher un réglage…',
};

const NAV_TO_PAGE: Record<string, PageId> = {
  overview:   'overview',
  commandes:  'commandes',
  coupons:    'coupons',
  livraisons: 'livraisons',
  paiements:  'paiements',
  contenu:    'contenu',
  settings:   'settings',
};

/* ─── Props ─────────────────────────────────────────────────────── */
export interface StoreShellProps {
  defaultPage?: PageId;
  orders?: Order[];
  coupons?: Coupon[];
  zones?: DeliveryZone[];
  payments?: Payment[];
  stats?: StoreOrderStats;
  onSwitchWorkspace?: () => void;
  onOrderChanged?: () => void;
  shopName?: string;
  userName?: string;
  userRole?: string;
}

/* ─── Shell ─────────────────────────────────────────────────────── */
export default function StoreShell({
  defaultPage = 'overview',
  orders      = [],
  coupons     = [],
  zones       = [],
  payments    = [],
  stats,
  onSwitchWorkspace,
  onOrderChanged = () => {},
  shopName = '',
  userName = '',
  userRole = '',
}: StoreShellProps) {
  const ui = useUI();
  const notifCount = useConfig().notifs?.().length ?? 0;
  const [page, setPage] = useState<PageId>(defaultPage);

  const groups = useMemo(() =>
    DEFAULT_NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.map(it => ({ ...it, active: it.id === page })),
    })),
    [page],
  );

  return (
    <div className={styles.page}>
      <Sidebar
        groups={groups}
        onSwitchWorkspace={onSwitchWorkspace}
        onNav={id => { if (NAV_TO_PAGE[id]) setPage(NAV_TO_PAGE[id]); }}
        userName={userName}
        userRole={userRole}
      />

      <main className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button type="button" className={styles.iconBtn} onClick={onSwitchWorkspace} aria-label="Retour aux espaces">
            <ChevLeftIcon size={16} />
          </button>
          <div className={styles.crumbs}>
            <span>{shopName}</span>
            <span className={styles.sep}>/</span>
            <span>Store</span>
            {page !== 'overview' && (
              <><span className={styles.sep}>/</span><span className={styles.here}>{PAGE_LABELS[page]}</span></>
            )}
          </div>
          <div className={styles.search} onClick={() => ui.openPalette()} style={{ cursor: 'pointer' }}>
            <SearchIcon size={14} />
            <input placeholder={SEARCH_PLACEHOLDERS[page]} />
            <span className={styles.kbd}>⌘K</span>
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications" onClick={(e) => ui.notifications(e)}>
            <BellIcon size={16} />
            {notifCount > 0 && <span className={styles.pip} />}
          </button>
        </header>

        {/* Page routing */}
        {page === 'overview'   && <OverviewPage orders={orders} zones={zones} payments={payments} stats={stats} onOrderChanged={onOrderChanged} onViewAllOrders={() => setPage('commandes')} />}
        {page === 'commandes'  && <CommandesPage zones={zones} stats={stats} onOrderChanged={onOrderChanged} />}
        {page === 'coupons'    && <CouponsPage coupons={coupons} />}
        {page === 'livraisons' && <LivraisonsPage zones={zones} />}
        {page === 'paiements'  && <PaiementsPage payments={payments} stats={stats} />}
        {page === 'contenu'    && <ContenuVitrinePage />}
        {page === 'settings'   && <ReglagesPage />}
      </main>
    </div>
  );
}
