'use client';

import React, { useMemo, useState } from 'react';
import type { Sale, BoutiqueStock, CashMovement, BoutiqueClient } from './types';
import {
  SAMPLE_SALES, SAMPLE_STOCK, SAMPLE_CASH, SAMPLE_CLIENTS,
} from './sample-data';
import Sidebar, { DEFAULT_NAV_GROUPS } from './Sidebar';
import OverviewPage from './OverviewPage';
import VentesPage from './VentesPage';
import StockPage from './StockPage';
import FinancePage from './FinancePage';
import ClientsPage from './ClientsPage';
import { SearchIcon, BellIcon, ChevLeftIcon } from './icons';
import styles from './Boutique.module.css';

type PageId = 'overview' | 'ventes' | 'stock' | 'finance' | 'clients';

const PAGE_LABELS: Record<PageId, string> = {
  overview: "Vue d'ensemble",
  ventes:   'Ventes',
  stock:    'Stock boutique',
  finance:  'Finance',
  clients:  'Clients',
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview: 'Rechercher…',
  ventes:   'Rechercher une vente, client…',
  stock:    'Rechercher un produit, SKU…',
  finance:  'Rechercher un mouvement…',
  clients:  'Rechercher un client…',
};

const NAV_TO_PAGE: Record<string, PageId> = {
  overview: 'overview',
  ventes:   'ventes',
  stock:    'stock',
  finance:  'finance',
  clients:  'clients',
};

export interface BoutiqueShellProps {
  defaultPage?: PageId;
  sales?: Sale[];
  stock?: BoutiqueStock[];
  movements?: CashMovement[];
  clients?: BoutiqueClient[];
  onSwitchWorkspace?: () => void;
  onNewSale?: () => void;
  userName?: string;
  userRole?: string;
}

export default function BoutiqueShell({
  defaultPage = 'overview',
  sales       = SAMPLE_SALES,
  stock       = SAMPLE_STOCK,
  movements   = SAMPLE_CASH,
  clients     = SAMPLE_CLIENTS,
  onSwitchWorkspace,
  onNewSale,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
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
            <span>Maison Diallo</span>
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
        {page === 'overview' && <OverviewPage sales={sales} onNewSale={onNewSale} />}
        {page === 'ventes'   && <VentesPage sales={sales} onNewSale={onNewSale} />}
        {page === 'stock'    && <StockPage stock={stock} />}
        {page === 'finance'  && <FinancePage movements={movements} />}
        {page === 'clients'  && <ClientsPage clients={clients} />}
      </main>
    </div>
  );
}
