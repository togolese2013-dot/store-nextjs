/**
 * Crm
 * ─────────────────────────────────────────────────────────────────────
 * Self-contained CRM workspace for ShopSaaS — sidebar + topbar shell with
 * five pages (Vue d'ensemble, Comptes clients, Fidélité, Parrainage,
 * Campagnes). Pages are switched by internal state by default; pass
 * `page` + `onPageChange` to drive it from your router instead.
 *
 * Drop into Next.js / Vite / CRA. Requires:
 *  - React 18+
 *  - The companion `Crm.module.css`
 *  - Optionally Google Fonts: Geist, Geist Mono, Instrument Serif
 *
 * The data in `data.ts` is illustrative — replace the exported arrays with
 * your API results (the shapes are typed in `types.ts`).
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { CrmPageId } from './types';
import { NAV, PAGE_LABELS, SEARCH_PLACEHOLDER } from './data';
import {
  HeartIcon, SearchIcon, BellIcon, ChevronDownIcon, ChevronLeftIcon, CogIcon,
} from './icons';
import { fmt } from './primitives';
import OverviewPage from './pages/OverviewPage';
import ClientsPage from './pages/ClientsPage';
import LoyaltyPage from './pages/LoyaltyPage';
import ReferralPage from './pages/ReferralPage';
import CampaignsPage from './pages/CampaignsPage';
import { UIProvider, useUI, useConfig } from '@/components/interaction-layer';
import type { AppConfig, NotifItem } from '@/components/interaction-layer';
import { formatDateTime } from '@/lib/format-date';
import styles from './Crm.module.css';

interface WaThread {
  telephone:    string;
  contact_name: string | null;
  dernier_message: string | null;
  unread:       number;
  last_at:      string;
}

const PAGES: Record<CrmPageId, React.ComponentType> = {
  overview:  OverviewPage,
  clients:   ClientsPage,
  loyalty:   LoyaltyPage,
  referral:  ReferralPage,
  campaigns: CampaignsPage,
};

export interface CrmProps {
  /** Shop name shown in the breadcrumb */
  shopName?: string;
  /** Current user — name + role for the sidebar footer */
  userName?: string;
  userRole?: string;
  /** Controlled mode: current page (omit to let the component manage it) */
  page?: CrmPageId;
  /** Controlled mode: called when the user navigates */
  onPageChange?: (page: CrmPageId) => void;
  /** Called when the back chevron in the topbar is clicked */
  onBack?: () => void;
}

export default function Crm({
  shopName = 'Maison Diallo',
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
  page: controlledPage,
  onPageChange,
  onBack,
}: CrmProps) {
  const [internalPage, setInternalPage] = useState<CrmPageId>('overview');
  const page = controlledPage ?? internalPage;

  const go = (p: CrmPageId) => {
    setInternalPage(p);
    onPageChange?.(p);
  };

  const Page = PAGES[page];
  const userInitial = userName.charAt(0).toUpperCase();

  /* ── Messages WhatsApp non lus — vraie source, /api/admin/whatsapp/threads ── */
  const [threads, setThreads] = useState<WaThread[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/whatsapp/threads', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!cancelled && Array.isArray(d.threads)) setThreads(d.threads); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const config = useMemo<AppConfig>(() => ({
    name: 'CRM',
    notifs: (): NotifItem[] =>
      threads
        .filter(t => Number(t.unread) > 0)
        .map(t => ({
          dot:  'var(--accent)',
          t:    `Message — ${t.contact_name || t.telephone}`,
          d:    t.dernier_message ?? '',
          time: t.last_at ? formatDateTime(t.last_at) : '',
        })),
  }), [threads]);

  return (
    <UIProvider config={config} onNavigate={() => {}}>
      <CrmBody
        shopName={shopName} userName={userName} userRole={userRole}
        page={page} go={go} onBack={onBack} Page={Page} userInitial={userInitial}
      />
    </UIProvider>
  );
}

interface CrmBodyProps {
  shopName: string;
  userName: string;
  userRole: string;
  page: CrmPageId;
  go: (p: CrmPageId) => void;
  onBack?: () => void;
  Page: React.ComponentType;
  userInitial: string;
}

function CrmBody({ shopName, userName, userRole, page, go, onBack, Page, userInitial }: CrmBodyProps) {
  const ui = useUI();
  const notifCount = useConfig().notifs?.().length ?? 0;

  return (
    <div className={styles.page}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <button type="button" className={styles.wsSwitch}>
          <div className={styles.wsIcon}><HeartIcon size={16} /></div>
          <div className={styles.wsMeta}>
            <div className={styles.wsL1}>CRM</div>
            <div className={styles.wsL2}>Relation client</div>
          </div>
          <ChevronDownIcon size={12} />
        </button>

        <nav className={styles.nav}>
          {NAV.map((group, gi) => (
            <div key={gi} className={styles.navGroup}>
              {group.section && <div className={styles.navHead}>{group.section}</div>}
              {group.items.map((it, ii) => {
                const Icon = it.icon;
                const isActive = it.page === page;
                return (
                  <button
                    key={ii}
                    type="button"
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    onClick={() => it.page && go(it.page)}
                  >
                    <span className={styles.navIc}><Icon size={16} /></span>
                    <span>{it.label}</span>
                    {it.count !== undefined && (
                      <span className={`${styles.navCount} ${it.badge ? styles.badge : ''}`}>
                        {fmt(it.count)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sbFoot}>
          <div className={styles.usr}>
            <div className={styles.avatar}>{userInitial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={styles.usrName}>{userName}</div>
              <div className={styles.usrRole}>{userRole}</div>
            </div>
            <CogIcon size={14} />
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className={styles.main}>
        <header className={styles.top}>
          <button type="button" className={styles.ibtn} onClick={onBack}>
            <ChevronLeftIcon size={16} />
          </button>
          <div className={styles.crumb}>
            <span>{shopName}</span>
            <span className={styles.sep}>/</span>
            <span>CRM</span>
            {page !== 'overview' && (
              <>
                <span className={styles.sep}>/</span>
                <span className={styles.here}>{PAGE_LABELS[page]}</span>
              </>
            )}
          </div>
          <div className={styles.srch}>
            <SearchIcon size={14} />
            <input placeholder={SEARCH_PLACEHOLDER[page]} />
            <span className={styles.k}>⌘K</span>
          </div>
          <button type="button" className={styles.ibtn} aria-label="Notifications" onClick={(e) => ui.notifications(e)}>
            <BellIcon size={16} />
            {notifCount > 0 && <span className={styles.pip} />}
          </button>
        </header>

        <Page />
      </main>
    </div>
  );
}
