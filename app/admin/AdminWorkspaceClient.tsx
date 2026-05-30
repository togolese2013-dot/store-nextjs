'use client';
import { useRouter } from 'next/navigation';
import WorkspaceSelector, { DEFAULT_WORKSPACES } from '@/components/workspace-selector/WorkspaceSelector';
import type { Workspace, WorkspaceId } from '@/components/workspace-selector/types';

export default function AdminWorkspaceClient({
  workspaceIds,
  shopName,
  shopLocation,
  userName,
  shopPlan,
  shopStatus,
  shopTrialEndsAt,
  shopPeriodEnd,
}: {
  workspaceIds: WorkspaceId[];
  shopName: string;
  shopLocation: string;
  userName: string;
  shopPlan?: string;
  shopStatus?: string;
  shopTrialEndsAt?: string | null;
  shopPeriodEnd?: string | null;
}) {
  const router = useRouter();
  const workspaces = DEFAULT_WORKSPACES.filter(w => workspaceIds.includes(w.id));

  return (
    <WorkspaceSelector
      workspaces={workspaces}
      shopName={shopName}
      shopLocation={shopLocation}
      userName={userName}
      shopPlan={shopPlan}
      shopStatus={shopStatus}
      shopTrialEndsAt={shopTrialEndsAt}
      shopPeriodEnd={shopPeriodEnd}
      onEnter={(ws: Workspace) => {
        const routes: Record<string, string> = {
          magasin:  '/admin/magasin',
          boutique: '/admin/boutique',
          store:    '/admin/store',
          crm:      '/admin/crm',
          admin:    '/admin/admin-ws',
        };
        router.push(routes[ws.id] ?? `/admin/${ws.id}`);
      }}
    />
  );
}
