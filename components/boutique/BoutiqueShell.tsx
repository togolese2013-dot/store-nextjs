'use client';

import React, { useMemo, useState } from 'react';
import type { Sale, BoutiqueStock, CashMovement, BoutiqueClient, OverviewStats } from './types';
import {
  SAMPLE_SALES, SAMPLE_STOCK, SAMPLE_CASH, SAMPLE_CLIENTS,
} from './sample-data';
import Sidebar, { DEFAULT_NAV_GROUPS } from './Sidebar';
import OverviewPage from './OverviewPage';
import VentesPage from './VentesPage';
import StockPage from './StockPage';
import FinancePage from './FinancePage';
import ClientsPage from './ClientsPage';
import SettingsPage from './SettingsPage';
import { SearchIcon, BellIcon, ChevLeftIcon } from './icons';
import styles from './Boutique.module.css';

type PageId = 'overview' | 'ventes' | 'stock' | 'finance' | 'clients' | 'settings';

const PAGE_LABELS: Record<PageId, string> = {
  overview: "Vue d'ensemble",
  ventes:   'Ventes',
  stock:    'Stock boutique',
  finance:  'Finance',
  clients:  'Clients',
  settings: 'Réglages boutique',
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview: 'Rechercher…',
  ventes:   'Rechercher une vente, client…',
  stock:    'Rechercher un produit, SKU…',
  finance:  'Rechercher un mouvement…',
  clients:  'Rechercher un client…',
  settings: 'Rechercher un paramètre…',
};

const NAV_TO_PAGE: Record<string, PageId> = {
  overview: 'overview',
  ventes:   'ventes',
  stock:    'stock',
  finance:  'finance',
  clients:  'clients',
  settings: 'settings',
};

export interface BoutiqueShellProps {
  defaultPage?: PageId;
  sales?: Sale[];
  stock?: BoutiqueStock[];
  movements?: CashMovement[];
  clients?: BoutiqueClient[];
  overviewStats?: OverviewStats;
  onSwitchWorkspace?: () => void;
  onNewSale?: () => void;
  onRequestTransfer?: (sku: string) => void;
  onRefreshStock?: () => void;
  userName?: string;
  userRole?: string;
  shopName?: string;
}

export default function BoutiqueShell({
  defaultPage = 'overview',
  sales       = SAMPLE_SALES,
  stock       = SAMPLE_STOCK,
  movements   = SAMPLE_CASH,
  clients     = SAMPLE_CLIENTS,
  overviewStats,
  onSwitchWorkspace,
  onNewSale,
  onRequestTransfer,
  onRefreshStock,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
  shopName = 'Ma boutique',
}: BoutiqueShellProps) {
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
            <span>Boutique</span>
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
        {page === 'overview'  && <OverviewPage sales={sales} overviewStats={overviewStats} onNewSale={onNewSale} />}
        {page === 'ventes'    && <VentesPage sales={sales} onNewSale={onNewSale} />}
        {page === 'stock'     && <StockPage stock={stock} onRequestTransfer={onRequestTransfer} onRefresh={onRefreshStock} />}
        {page === 'finance'   && <FinancePage />}
        {page === 'clients'   && <ClientsPage clients={clients} />}
        {page === 'settings'  && <SettingsPage shopName={shopName} />}
      </main>
    </div>
  );
}
