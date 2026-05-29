/**
 * Admin (Config & rapports) — domain types
 */
import type { ComponentType } from 'react';

export type MemberStatus = 'Actif' | 'Inactif' | 'Invitation';
export type RoleName = 'Propriétaire' | 'Gérant' | 'Vendeur' | 'Comptable';

export interface Member {
  name: string;
  init: string;
  color: string;
  email: string;
  role: RoleName;
  workspaces: string;
  last: string;
  status: MemberStatus;
}

export interface Role {
  name: RoleName;
  color: string;
  count: number;
  perms: string;
}

export interface WorkspaceHealth {
  id: string;
  name: string;
  tag: string;
  icon: ComponentType<{ size?: number }>;
  tint: string;
  bg: string;
  count: string;
  activity: string;
  active: boolean;
}

export interface Integration {
  name: string;
  cat: string;
  init: string;
  logoBg: string;
  logoColor: string;
  desc: string;
  connected: boolean;
}

export interface Report {
  name: string;
  desc: string;
  icon: ComponentType<{ size?: number }>;
  tint: string;
  bg: string;
}

export interface ActivityLog {
  date: string;
  who: string;
  init: string;
  color: string;
  action: string;
  ws: string;
  wsColor: string;
}

export interface KpiItem {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaColor?: string;
  sub: string;
  spark?: number[];
  sparkColor?: string;
  serif?: boolean;
}

export interface NavItem {
  icon: ComponentType<{ size?: number }>;
  label: string;
  count?: number;
  badge?: boolean;
  active?: boolean;
  id?: string;
}

export interface NavGroup {
  section: string | null;
  items: NavItem[];
}
