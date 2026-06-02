import type React from 'react';

/* ─── CRM domain ──────────────────────────────────────────────────── */

export type CrmPageId =
  | 'overview'
  | 'clients'
  | 'loyalty'
  | 'referral'
  | 'campaigns';

export type TierName = 'Or' | 'Argent' | 'Bronze' | 'Nouveau';

export interface Client {
  name: string;
  /** 2-letter initials shown in the avatar */
  init: string;
  /** Avatar background color */
  color: string;
  email: string;
  phone: string;
  orders: number;
  /** Cumulative spend, in francs (CFA) */
  total: number;
  tier: TierName;
  /** Last order date — display string */
  last: string;
}

export interface Tier {
  name: TierName;
  color: string;
  count: number;
  /** Rule summary shown on the loyalty card */
  meta: string;
}

export type ReferralStatus = 'Converti' | 'En attente' | 'Expiré';

export interface Referral {
  parrain: string;
  init: string;
  color: string;
  filleul: string;
  date: string;
  status: ReferralStatus;
  /** Reward string — "2 000 pts" or "—" */
  reward: string;
}

export type CampaignChannel = 'Email' | 'WhatsApp';
export type CampaignStatus = 'Envoyée' | 'Active' | 'Brouillon';

export interface Campaign {
  name: string;
  channel: CampaignChannel;
  /** Icon component for the channel (Email / WhatsApp) */
  icon: React.ComponentType<{ size?: number }>;
  /** Channel tile colors */
  chBg: string;
  chColor: string;
  status: CampaignStatus;
  sent: number;
  /** Open rate, % */
  open: number;
  /** Click rate, % */
  click: number;
  /** Schedule / send date display string */
  date: string;
}

/* ─── Navigation ──────────────────────────────────────────────────── */

export interface NavItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  /** Target page — omit for non-navigating items (Settings, Help) */
  page?: CrmPageId;
  /** Optional counter pill */
  count?: number;
  /** Render the counter as a colored badge instead of a neutral pill */
  badge?: boolean;
}

export interface NavGroup {
  section: string | null;
  items: NavItem[];
}

/* ─── Reusable view-model types ───────────────────────────────────── */

export interface Kpi {
  /** Label */
  l: string;
  /** Value (string, pre-formatted) */
  v: string;
  /** Unit suffix — "%", "F"… */
  u?: string;
  /** Delta pill text — "+86", "+12%" */
  d?: string;
  /** Delta pill color */
  dc?: string;
  /** Footnote */
  sub?: string;
  /** Sparkline series */
  spark?: number[];
  /** Sparkline color */
  c?: string;
  /** Render value in the italic serif face */
  serif?: boolean;
}
