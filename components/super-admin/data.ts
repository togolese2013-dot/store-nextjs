import type React from 'react';
import type {
  Tenant, Plan, Invoice, Ticket, Service, Incident, AuditEntry, NavGroup, PageId,
} from './types';
import { I } from './icons';

/* ─── Pricing & status colors ─────────────────────────────────────── */
export const PLAN_PRICE: Record<string, number> = { Basic: 9000, Pro: 25000, Business: 75000 };
export const PLAN_ST: Record<string, React.CSSProperties> = {
  Basic:    { background: 'var(--blue-bg)', color: 'var(--blue)' },
  Pro:      { background: 'var(--accent-bg)', color: 'var(--accent)' },
  Business: { background: 'var(--gold-bg)', color: 'var(--gold)' },
};
export const CITIES = ['Lomé', 'Kara', 'Sokodé', 'Atakpamé', 'Kpalimé', 'Aného', 'Dapaong'];
/** Avatar palette for newly invited tenants */
export const PALETTE = ['#34396B', '#3B6A8F', '#2D6A4F', '#C9601E', '#5C4A88', '#9C3A14', '#8B5E2E', '#7A2C3A', '#1F3D6E', '#C8962A'];

/* ─── Tenants (boutiques abonnées) ────────────────────────────────── */
export const TENANTS0: Tenant[] = [];
export const TENANT_TABS = [
  { id: 'all', l: 'Toutes' }, { id: 'Actif', l: 'Actives' }, { id: 'Essai', l: 'Essai' },
  { id: 'Suspendu', l: 'Suspendues' }, { id: 'Impayé', l: 'Impayées' },
] as const;

/* ─── Plans ───────────────────────────────────────────────────────── */
export const PLANS0: Plan[] = [
  { name: 'Basic',    color: '#6B635B', price: 'Gratuit', period: '',        count: 0, mrr: 0, pop: false, feats: ['20 produits max', '40 ventes / mois', '15 commandes en ligne / mois', '1 utilisateur admin', '1 entrepôt max', 'Support par email'] },
  { name: 'Pro',      color: '#C9601E', price: '9 900',  period: '/ mois',  count: 0, mrr: 0, pop: true,  feats: ['Produits illimités', 'Commandes illimitées', '5 utilisateurs admin', 'WhatsApp CRM inclus', 'Finance & rapports avancés', 'Coupons & fidélité', 'Support prioritaire WhatsApp'] },
  { name: 'Business', color: '#1F3D6E', price: '24 900', period: '/ mois',  count: 0, mrr: 0, pop: false, feats: ['Tout du plan Pro', 'Utilisateurs illimités', 'Multi-entrepôts', 'API & webhooks', 'Marque blanche', 'Gestionnaire de compte dédié', 'SLA 99,9%'] },
];

/* ─── Invoices ────────────────────────────────────────────────────── */
export const INVOICES0: Invoice[] = [];
export const INV_ST: Record<string, React.CSSProperties> = {
  'Payée':      { background: 'var(--ok-bg)', color: 'var(--ok)' },
  'En attente': { background: 'var(--warn-bg)', color: 'var(--warn)' },
  'Échouée':    { background: 'var(--danger-bg)', color: 'var(--danger)' },
  'Remboursée': { background: 'rgba(20,17,14,.06)', color: 'var(--muted)' },
};

/* ─── Support tickets ─────────────────────────────────────────────── */
export const TICKETS0: Ticket[] = [];
export const PRIO_ST: Record<string, React.CSSProperties> = {
  'Haute':   { background: 'var(--danger-bg)', color: 'var(--danger)' },
  'Moyenne': { background: 'var(--warn-bg)', color: 'var(--warn)' },
  'Basse':   { background: 'rgba(20,17,14,.06)', color: 'var(--muted)' },
};
export const TKT_ST: Record<string, { cls: string }> = {
  'Ouvert': { cls: 'impaye' }, 'En cours': { cls: 'essai' }, 'Résolu': { cls: 'actif' },
};

/* ─── System services ─────────────────────────────────────────────── */
export const SERVICES: Service[] = [
  { name: 'API Gateway',           cat: 'Cœur applicatif', ic: I.server, tint: '#34396B', bg: '#E4E3F0', state: 'Opérationnel', uptime: '—', extra: '— ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Base de données',       cat: 'Stockage',        ic: I.db,     tint: '#3B6A8F', bg: '#E8F0F7', state: 'Opérationnel', uptime: '—', extra: '— ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Paiements Wave',        cat: 'Mobile money',    ic: I.wave,   tint: '#2D6A4F', bg: '#DDEBE2', state: 'Opérationnel', uptime: '—', extra: '— ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Paiements Orange',      cat: 'Mobile money',    ic: I.coins,  tint: '#C9601E', bg: '#FBE9D6', state: 'Opérationnel', uptime: '—', extra: '— ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Notifications WhatsApp',cat: 'Messagerie',      ic: I.msg,    tint: '#2D6A4F', bg: '#DDEBE2', state: 'Opérationnel', uptime: '—', extra: '— ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Stockage fichiers',     cat: 'CDN & médias',    ic: I.cloud,  tint: '#5C4A88', bg: '#E6E0F0', state: 'Opérationnel', uptime: '—', extra: '— ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
];
export const SYS_ST: Record<string, { color: string; bg: string }> = {
  'Opérationnel': { color: 'var(--ok)', bg: 'var(--ok)' },
  'Dégradé':      { color: 'var(--warn)', bg: 'var(--warn)' },
  'Panne':        { color: 'var(--danger)', bg: 'var(--danger)' },
};
export const INCIDENTS: Incident[] = [];

/* ─── Audit log ───────────────────────────────────────────────────── */
export const AUDIT: AuditEntry[] = [];

/* ─── Navigation ──────────────────────────────────────────────────── */
export const NAV: NavGroup[] = [
  { section: null, items: [
    { ic: I.gauge, l: "Vue d'ensemble", pg: 'overview' },
    { ic: I.store, l: 'Boutiques', pg: 'tenants' },
    { ic: I.card, l: 'Facturation', pg: 'billing' },
    { ic: I.layers, l: 'Plans & tarifs', pg: 'plans' },
    { ic: I.life, l: 'Support', pg: 'support' },
    { ic: I.activity, l: 'Santé système', pg: 'system' },
    { ic: I.history, l: "Journal d'audit", pg: 'logs' },
  ] },
  { section: 'Plateforme', items: [{ ic: I.cog, l: 'Paramètres' }, { ic: I.help, l: 'Aide & docs' }] },
];
export const PAGE_LABELS: Record<PageId, string> = {
  overview: "Vue d'ensemble", tenants: 'Boutiques', billing: 'Facturation',
  plans: 'Plans & tarifs', support: 'Support', system: 'Santé système', logs: "Journal d'audit",
};
export const SEARCH_PH: Record<PageId, string> = {
  overview: 'Rechercher…', tenants: 'Rechercher une boutique, ville, plan…',
  billing: 'Rechercher une facture, boutique…', plans: 'Rechercher…',
  support: 'Rechercher un ticket, boutique…', system: 'Rechercher un service…',
  logs: 'Rechercher une action, membre…',
};
