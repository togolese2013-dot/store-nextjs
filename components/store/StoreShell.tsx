/**
 * StoreShell — multi-page shell for the Store workspace
 * ──────────────────────────────────────────────────────────────────
 * Wraps Sidebar + Topbar and routes between 5 pages:
 *   overview · commandes · coupons · livraisons · paiements
 *
 * Usage — Next.js App Router:
 *
 *   // app/admin/store/page.tsx
 *   'use client';
 *   import StoreShell from '@/components/store/StoreShell';
 *   import { useRouter } from 'next/navigation';
 *
 *   export default function Page() {
 *     const router = useRouter();
 *     return (
 *       <StoreShell
 *         onSwitchWorkspace={() => router.push('/admin')}
 *         onCreateOrder={() => router.push('/admin/store/commandes/new')}
 *       />
 *     );
 *   }
 *
 * Live data:
 *   const { data: orders }   = useSWR<Order[]>('/api/orders', fetcher);
 *   const { data: coupons }  = useSWR<Coupon[]>('/api/coupons', fetcher);
 *   <StoreShell orders={orders ?? []} coupons={coupons ?? []} ... />
 */
'use client';

import React, { useMemo, useState } from 'react';
import type { Order, Coupon, DeliveryZone, Payment } from './types';
import {
  SAMPLE_ORDERS, SAMPLE_COUPONS, SAMPLE_ZONES, SAMPLE_PAYMENTS,
} from './sample-data';
import Sidebar, { DEFAULT_NAV_GROUPS } from './Sidebar';
import OverviewPage from './OverviewPage';
import CommandesPage from './CommandesPage';
import CouponsPage from './CouponsPage';
import LivraisonsPage from './LivraisonsPage';
import PaiementsPage from './PaiementsPage';
import { SearchIcon, BellIcon, ChevLeftIcon } from './icons';
import styles from './Store.module.css';

/* ─── Types ─────────────────────────────────────────────────────── */
type PageId = 'overview' | 'commandes' | 'coupons' | 'livraisons' | 'paiements';

const PAGE_LABELS: Record<PageId, string> = {
  overview:   "Vue d'ensemble",
  commandes:  'Commandes',
  coupons:    'Coupons',
  livraisons: 'Livraisons',
  paiements:  'Paiements',
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview:   'Rechercher…',
  commandes:  'Rechercher une commande, client…',
  coupons:    'Rechercher un code promo…',
  livraisons: 'Rechercher une zone de livraison…',
  paiements:  'Rechercher une transaction, client…',
};

const NAV_TO_PAGE: Record<string, PageId> = {
  overview:   'overview',
  commandes:  'commandes',
  coupons:    'coupons',
  livraisons: 'livraisons',
  paiements:  'paiements',
};

/* ─── Props ─────────────────────────────────────────────────────── */
export interface StoreShellProps {
  defaultPage?: PageId;
  orders?: Order[];
  coupons?: Coupon[];
  zones?: DeliveryZone[];
  payments?: Payment[];
  onSwitchWorkspace?: () => void;
  onCreateOrder?: () => void;
  userName?: string;
  userRole?: string;
}

/* ─── Shell ─────────────────────────────────────────────────────── */
export default function StoreShell({
  defaultPage = 'overview',
  orders      = SAMPLE_ORDERS,
  coupons     = SAMPLE_COUPONS,
  zones       = SAMPLE_ZONES,
  payments    = SAMPLE_PAYMENTS,
  onSwitchWorkspace,
  onCreateOrder,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
}: StoreShellProps) {
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
            <span>Maison Diallo</span>
            <span className={styles.sep}>/</span>
            <span>Store</span>
            {page !== 'overview' && (
              <><span className={styles.sep}>/</span><span className={styles.here}>{PAGE_LABELS[page]}</span></>
            )}
          </div>
          <div className={styles.search}>
            <SearchIcon size={14} />
            <input placeholder={SEARCH_PLACEHOLDERS[page]} />
            <span className={styles.kbd}>⌘K</span>
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications">
            <BellIcon size={16} />
            <span className={styles.pip} />
          </button>
        </header>

        {/* Page routing */}
        {page === 'overview'   && <OverviewPage orders={orders} onCreateOrder={onCreateOrder} />}
        {page === 'commandes'  && <CommandesPage orders={orders} onCreateOrder={onCreateOrder} />}
        {page === 'coupons'    && <CouponsPage coupons={coupons} />}
        {page === 'livraisons' && <LivraisonsPage zones={zones} />}
        {page === 'paiements'  && <PaiementsPage payments={payments} />}
      </main>
    </div>
  );
}
