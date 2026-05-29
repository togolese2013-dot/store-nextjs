import type { ComponentType } from 'react';

export type WorkspaceId = 'magasin' | 'boutique' | 'store' | 'crm' | 'admin';

export interface Workspace {
  id: WorkspaceId;
  name: string;
  tag: string;
  desc: string;
  /** Accent color (icon tile foreground, hover button bg, accent dot) */
  tint: string;
  /** Soft tinted background for the icon tile */
  tintBg: string;
  /** Live counter string — e.g. "248 produits" */
  count: string;
}

export interface WorkspaceWithIcon extends Workspace {
  icon: ComponentType<{ size?: number }>;
}
