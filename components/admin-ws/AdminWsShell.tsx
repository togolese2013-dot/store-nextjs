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
  Member, Role, WorkspaceHealth, Report, ActivityLog,
} from './types';
import {
  SAMPLE_MEMBERS, SAMPLE_ROLES, SAMPLE_WORKSPACES,
  SAMPLE_REPORTS, SAMPLE_LOG,
} from './sample-data';
import Sidebar, { DEFAULT_NAV_GROUPS } from './Sidebar';
import OverviewPage from './OverviewPage';
import UsersRolesPage from './UsersRolesPage';
import type { Member as UsersRolesMember } from './users-types';
import WorkspacesPage from './WorkspacesPage';
import IntegrationsPage from './IntegrationsPage';
import ReportsPage from './ReportsPage';
import LogsPage from './LogsPage';
import SettingsPage from './SettingsPage';
import { SearchIcon, BellIcon, ChevLeftIcon } from './icons';
import styles from './Admin.module.css';
import { useT } from '@/lib/i18n/use-admin-ws-lang';
import type { DictKey } from '@/lib/i18n/admin-ws';

/* ─── Types ─────────────────────────────────────────────────────── */
type PageId = 'overview' | 'users' | 'workspaces' | 'integrations' | 'reports' | 'logs' | 'settings';

// Values below are i18n dictionary KEYS, resolved via t() at render time.
const PAGE_LABELS: Record<PageId, DictKey> = {
  overview:     'shell.page.overview',
  users:        'shell.page.users',
  workspaces:   'shell.page.workspaces',
  integrations: 'shell.page.integrations',
  reports:      'shell.page.reports',
  logs:         'shell.page.logs',
  settings:     'shell.page.settings',
};

const SEARCH_PLACEHOLDERS: Record<PageId, DictKey> = {
  overview:     'shell.search.overview',
  users:        'shell.search.users',
  workspaces:   'shell.search.workspaces',
  integrations: 'shell.search.integrations',
  reports:      'shell.search.reports',
  logs:         'shell.search.logs',
  settings:     'shell.search.settings',
};

const NAV_TO_PAGE: Record<string, PageId> = {
  overview:     'overview',
  users:        'users',
  workspaces:   'workspaces',
  integrations: 'integrations',
  reports:      'reports',
  logs:         'logs',
  settings:     'settings',
};

/* ─── Props ─────────────────────────────────────────────────────── */
export interface AdminWsShellProps {
  defaultPage?: PageId;
  members?: Member[];
  roles?: Role[];
  workspaces?: WorkspaceHealth[];
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
  reports      = SAMPLE_REPORTS,
  log          = SAMPLE_LOG,
  onSwitchWorkspace,
  onInvite,
  onToggleWorkspace,
  userName = 'Kent Diallo',
  userRole = 'Propriétaire',
  shopName = 'Ma boutique',
}: AdminWsShellProps) {
  const t = useT();
  const [page, setPage] = useState<PageId>(defaultPage);

  const LIVE_COUNTS: Record<string, number> = {
    users:        members.length,
    workspaces:   workspaces.length,
  };

  const groups = useMemo(() =>
    DEFAULT_NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.map(it => ({
        ...it,
        active: it.id === page,
        ...(it.id && it.id in LIVE_COUNTS ? { count: LIVE_COUNTS[it.id] } : {}),
      })),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, members.length, workspaces.length],
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
          <button type="button" className={styles.iconBtn} onClick={onSwitchWorkspace} aria-label={t('shell.aria.back')}>
            <ChevLeftIcon size={16} />
          </button>
          <div className={styles.crumbs}>
            <span>{shopName}</span>
            <span className={styles.sep}>/</span>
            <span>Admin</span>
            {page !== 'overview' && (
              <><span className={styles.sep}>/</span><span className={styles.here}>{t(PAGE_LABELS[page])}</span></>
            )}
          </div>
          <div className={styles.search}>
            <SearchIcon size={14} />
            <input placeholder={t(SEARCH_PLACEHOLDERS[page])} />
            <span className={styles.kbd}>⌘K</span>
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications">
            <BellIcon size={16} />
            <span className={styles.pip} />
          </button>
        </header>

        {/* Page routing */}
        {page === 'overview'     && <OverviewPage onInvite={onInvite} shopName={shopName} members={members} workspaces={workspaces} log={log} />}
        {page === 'users'        && <UsersRolesPage initialMembers={members as unknown as UsersRolesMember[]} />}
        {page === 'workspaces'   && <WorkspacesPage workspaces={workspaces} onToggle={onToggleWorkspace} />}
        {page === 'integrations' && <IntegrationsPage />}
        {page === 'reports'      && <ReportsPage reports={reports} />}
        {page === 'logs'         && <LogsPage />}
        {page === 'settings'     && <SettingsPage />}
      </main>
    </div>
  );
}
