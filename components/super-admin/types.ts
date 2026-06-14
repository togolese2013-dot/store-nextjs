import type React from 'react';

export type PageId =
  | 'overview' | 'tenants' | 'billing' | 'plans' | 'limits' | 'support' | 'system' | 'logs';

export type PlanName = 'Basic' | 'Pro' | 'Business' | string;
export type TenantStatus = 'Actif' | 'Essai' | 'Suspendu' | 'Impayé' | 'Inactif';

export interface Tenant {
  id: number;
  name: string;
  email: string;
  init: string;
  color: string;
  plan: PlanName;
  /** Monthly recurring revenue, F CFA */
  mrr: number;
  city: string;
  joined: string;
  last: string;
  status: TenantStatus;
}

export interface Plan {
  name: PlanName;
  color: string;
  /** Pre-formatted price, e.g. "25 000" */
  price: string;
  period: string;
  count: number;
  mrr: number;
  pop: boolean;
  feats: string[];
}

export type InvoiceStatus = 'Payée' | 'En attente' | 'Échouée' | 'Remboursée';
export interface Invoice {
  id: string;
  tenant: string;
  plan: PlanName;
  amount: number;
  date: string;
  method: string;
  status: InvoiceStatus;
}

export type TicketPriority = 'Haute' | 'Moyenne' | 'Basse';
export type TicketStatus = 'Ouvert' | 'En cours' | 'Résolu';
export interface Ticket {
  id: string;
  subject: string;
  tenant: string;
  prio: TicketPriority;
  status: TicketStatus;
  agent: string;
  upd: string;
  msg: string;
}

export type ServiceState = 'Opérationnel' | 'Dégradé' | 'Panne';
export interface Service {
  name: string;
  cat: string;
  ic: React.ComponentType<{ size?: number }>;
  tint: string;
  bg: string;
  state: ServiceState;
  uptime: string;
  extra: string;
  /** uptime mini-bars: 1 (ok) | 'warn' | 'down' */
  bars: (number | 'warn' | 'down')[];
}

export interface Incident {
  sev: string;
  color: string;
  title: string;
  time: string;
  desc: string;
  timeline: [string, string][];
}

export interface AuditEntry {
  date: string;
  who: string;
  init: string;
  color: string;
  action: string;
  cat: string;
  catColor: string;
}

export interface NavItem {
  ic: React.ComponentType<{ size?: number }>;
  l: string;
  pg?: PageId;
  c?: number;
  bdg?: boolean;
}
export interface NavGroup { section: string | null; items: NavItem[]; }

export interface Kpi {
  l: string; v: string; u?: string; d?: string; dc?: string;
  di?: React.ReactNode; sub?: string; spark?: number[]; c?: string; serif?: boolean;
}

/* ─── Modal routing ───────────────────────────────────────────────── */
export type ModalType =
  | 'invite' | 'changePlan' | 'suspend' | 'deleteTenant' | 'tenantDetail'
  | 'invoice' | 'refund' | 'plan' | 'newTicket' | 'ticket' | 'incident';

export interface ModalState { type: ModalType; data?: any; }

/* ─── Store contract (useUI) ──────────────────────────────────────── */
export interface UIStore {
  page: PageId;
  goto: (p: PageId) => void;
  modal: ModalState | null;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  notify: (msg: string) => void;
  tenants: Tenant[];
  invoices: Invoice[];
  tickets: Ticket[];
  plans: Plan[];
  audit: AuditEntry[];
  inviteTenant: (t: { name: string; email: string; city: string; plan: PlanName; username?: string; password?: string }) => void;
  changePlan: (name: string, plan: PlanName) => void;
  setStatus: (name: string, status: TenantStatus, verb: string) => void;
  bulkStatus: (names: string[], status: TenantStatus) => void;
  removeTenant: (name: string) => void;
  markInvoice: (id: string, status: InvoiceStatus, verb?: string) => void;
  savePlan: (orig: string | null, p: { name: string; price: string }) => void;
  addTicket: (t: { tenant: string; subject: string; prio: TicketPriority; msg: string }) => void;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  assignTicket: (id: string) => void;
}
