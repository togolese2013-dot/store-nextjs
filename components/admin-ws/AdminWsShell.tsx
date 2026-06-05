/**
 * AdminWsShell — multi-page shell for the Admin workspace
 * ──────────────────────────────────────────────────────────────────
 * Wraps Sidebar + Topbar and routes between 6 pages:
 *   overview · users · workspaces · integrations · reports · logs
 *
 * Usage — Next.js App Router:
 *
 *   // app/admin/config/page.tsx
 *   'use client';
 *   import AdminWsShell from '@/components/admin-ws/AdminWsShell';
 *   import { useRouter } from 'next/navigation';
 *
 *   export default function Page() {
 *     const router = useRouter();
 *     return (
 *       <AdminWsShell
 *         onSwitchWorkspace={() => router.push('/admin')}
 *       />
 *     );
 *   }
 */
'use client';

import React, { useMemo, useState } from 'react';
import type {
  Member, Role, WorkspaceHealth, Integration, Report, ActivityLog,
} from './types';
import {
  SAMPLE_MEMBERS, SAMPLE_ROLES, SAMPLE_WORKSPACES,
  SAMPLE_INTEGRATIONS, SAMPLE_REPORTS, SAMPLE_LOG,
} from './sample-data';
import Sidebar, { DEFAULT_NAV_GROUPS } from './Sidebar';
import OverviewPage from './OverviewPage';
import UsersPage from './UsersPage';
import WorkspacesPage from './WorkspacesPage';
import IntegrationsPage from './IntegrationsPage';
import ReportsPage from './ReportsPage';
import LogsPage from './LogsPage';
import { SearchIcon, BellIcon, ChevLeftIcon } from './icons';
import styles from './Admin.module.css';

/* ─── Types ─────────────────────────────────────────────────────── */
type PageId = 'overview' | 'users' | 'workspaces' | 'integrations' | 'reports' | 'logs';

const PAGE_LABELS: Record<PageId, string> = {
  overview:     "Vue d'ensemble",
  users:        'Utilisateurs & rôles',
  workspaces:   'Workspaces',
  integrations: 'Intégrations',
  reports:      'Rapports',
  logs:         "Journal d'activité",
};

const SEARCH_PLACEHOLDERS: Record<PageId, string> = {
  overview:     'Rechercher membre, action, workspace…',
  users:        'Rechercher un membre, email, rôle…',
  workspaces:   'Rechercher un workspace…',
  integrations: 'Rechercher une intégration…',
  reports:      'Rechercher un rapport…',
  logs:         'Rechercher dans le journal…',
};

const NAV_TO_PAGE: Record<string, PageId> = {
  overview:     'overview',
  users:        'users',
  workspaces:   'workspaces',
  integrations: 'integrations',
  reports:      'reports',
  logs:         'logs',
};

/* ─── Props ─────────────────────────────────────────────────────── */
export interface AdminWsShellProps {
  defaultPage?: PageId;
  members?: Member[];
  roles?: Role[];
  workspaces?: WorkspaceHealth[];
  integrations?: Integration[];
  reports?: Report[];
  log?: ActivityLog[];
  onSwitchWorkspace?: () => void;
  onInvite?: () => void;
  onToggleWorkspace?: (id: string, active: boolean) => void;
  userName?: string;
  userRole?: string;
  shopName?: string;
}

/* ─── Shell ─────────────────────────────────────────────────────── */
export default function AdminWsShell({
  defaultPage  = 'overview',
  members      = SAMPLE_MEMBERS,
  roles        = SAMPLE_ROLES,
  workspaces   = SAMPLE_WORKSPACES,
  integrations = SAMPLE_INTEGRATIONS,
  reports      = SAMPLE_REPORTS,
  log          = SAMPLE_LOG,
  onSwitchWorkspace,
  onInvite,
  onToggleWorkspace,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
  shopName = 'Ma boutique',
}: AdminWsShellProps) {
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
            <span>Admin</span>
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
        {page === 'overview'     && <OverviewPage onInvite={onInvite} shopName={shopName} members={members} workspaces={workspaces} log={log} />}
        {page === 'users'        && <UsersPage members={members} roles={roles} onInvite={onInvite} />}
        {page === 'workspaces'   && <WorkspacesPage workspaces={workspaces} onToggle={onToggleWorkspace} />}
        {page === 'integrations' && <IntegrationsPage integrations={integrations} />}
        {page === 'reports'      && <ReportsPage reports={reports} />}
        {page === 'logs'         && <LogsPage log={log} />}
      </main>
    </div>
  );
}
