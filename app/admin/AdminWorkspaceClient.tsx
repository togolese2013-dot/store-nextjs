'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WorkspaceSelector, { DEFAULT_WORKSPACES } from '@/components/workspace-selector/WorkspaceSelector';
import type { Workspace, WorkspaceId } from '@/components/workspace-selector/types';

interface WsStats {
  produits: number;
  ventes_today: number;
  commandes: number;
  clients: number;
  equipiers: number;
}

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
  const [stats, setStats] = useState<WsStats | null>(null);

  const [disabled, setDisabled] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/workspace-stats', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStats(d))
      .catch(() => {});
    fetch('/api/admin/workspace-settings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.disabled && setDisabled(d.disabled))
      .catch(() => {});
  }, []);

  const fmt = (n: number) => n.toLocaleString('fr-FR');

  const workspaces = DEFAULT_WORKSPACES
    .filter(w => workspaceIds.includes(w.id) && !disabled.includes(w.id))
    .map(w => {
      if (!stats) return w;
      const counts: Record<WorkspaceId, string> = {
        magasin:  `${fmt(stats.produits)} produit${stats.produits !== 1 ? 's' : ''}`,
        boutique: `${fmt(stats.ventes_today)} vente${stats.ventes_today !== 1 ? 's' : ''} auj.`,
        store:    `${fmt(stats.commandes)} commande${stats.commandes !== 1 ? 's' : ''}`,
        crm:      `${fmt(stats.clients)} client${stats.clients !== 1 ? 's' : ''}`,
        admin:    `${fmt(stats.equipiers)} équipier${stats.equipiers !== 1 ? 's' : ''}`,
      };
      return { ...w, count: counts[w.id as WorkspaceId] ?? w.count };
    });

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
        const trialExpired = shopStatus === 'trial' && shopTrialEndsAt != null && new Date(shopTrialEndsAt) < new Date();
        if (shopStatus === 'suspended' || trialExpired) {
          router.push('/admin/billing');
          return;
        }
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
