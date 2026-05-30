'use client';

import { useState } from 'react';
import SaasSidebar, { type SaasView } from './SaasSidebar';
import SuperAdminDashboard from './SuperAdminDashboard';
import s from './SaasShell.module.css';

export type { SaasView };

interface Props {
  userName: string;
}

export default function SaasShell({ userName }: Props) {
  const [view,         setView]         = useState<SaasView>('overview');
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div className={s.shell}>
      <SaasSidebar
        view={view}
        onNav={setView}
        userName={userName}
        pendingCount={pendingCount}
      />
      <main className={s.main}>
        <SuperAdminDashboard
          view={view}
          onPendingCount={setPendingCount}
        />
      </main>
    </div>
  );
}
