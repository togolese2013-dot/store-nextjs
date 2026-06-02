import type React from 'react';
import type {
  Tenant, Plan, Invoice, Ticket, Service, Incident, AuditEntry, NavGroup, PageId,
} from './types';
import { I } from './icons';

/* ─── Pricing & status colors ─────────────────────────────────────── */
export const PLAN_PRICE: Record<string, number> = { Starter: 9000, Business: 25000, Enterprise: 75000 };
export const PLAN_ST: Record<string, React.CSSProperties> = {
  Starter:    { background: 'var(--blue-bg)', color: 'var(--blue)' },
  Business:   { background: 'var(--accent-bg)', color: 'var(--accent)' },
  Enterprise: { background: 'var(--gold-bg)', color: 'var(--gold)' },
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
  { name: 'Starter', color: '#3B6A8F', price: '9 000', period: '/ mois', count: 26, mrr: 234000, pop: false, feats: ['1 espace de travail (Boutique)', '1 point de vente · 2 équipiers', 'Caisse & gestion de stock', 'Paiement mobile (Wave, Orange)', 'Support par email'] },
  { name: 'Business', color: '#34396B', price: '25 000', period: '/ mois', count: 17, mrr: 425000, pop: true, feats: ['Tous les espaces (Magasin, Store, CRM…)', 'Multi-points de vente · 5 équipiers', 'E-commerce & livraison', 'CRM, fidélité & campagnes', 'Rapports avancés consolidés', 'Support prioritaire'] },
  { name: 'Enterprise', color: '#8B5E2E', price: '75 000', period: '/ mois', count: 4, mrr: 300000, pop: false, feats: ['Espaces & équipiers illimités', 'Multi-boutiques & multi-pays', 'Intégrations sur mesure (API)', 'Gestionnaire de compte dédié', 'SLA 99,9% · support 24/7', 'Formation & onboarding inclus'] },
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
  { name: 'API Gateway',           cat: 'Cœur applicatif', ic: I.server, tint: '#34396B', bg: '#E4E3F0', state: 'Opérationnel', uptime: '99,99%', extra: '142 ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Base de données',       cat: 'Stockage',        ic: I.db,     tint: '#3B6A8F', bg: '#E8F0F7', state: 'Opérationnel', uptime: '99,98%', extra: '18 ms',  bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Paiements Wave',        cat: 'Mobile money',    ic: I.wave,   tint: '#2D6A4F', bg: '#DDEBE2', state: 'Opérationnel', uptime: '99,95%', extra: '320 ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Paiements Orange',      cat: 'Mobile money',    ic: I.coins,  tint: '#C9601E', bg: '#FBE9D6', state: 'Dégradé',      uptime: '98,7%',  extra: '880 ms', bars: [1,1,1,1,1,'warn','warn',1,1,1,'warn',1] },
  { name: 'Notifications WhatsApp',cat: 'Messagerie',      ic: I.msg,    tint: '#2D6A4F', bg: '#DDEBE2', state: 'Opérationnel', uptime: '99,9%',  extra: '210 ms', bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: 'Stockage fichiers',     cat: 'CDN & médias',    ic: I.cloud,  tint: '#5C4A88', bg: '#E6E0F0', state: 'Opérationnel', uptime: '100%',   extra: '45 ms',  bars: [1,1,1,1,1,1,1,1,1,1,1,1] },
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
