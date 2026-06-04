import React from 'react';
import type { Member, Role, WorkspaceHealth, Integration, Report, ActivityLog, KpiItem } from './types';
import {
  PackageIcon, ReceiptIcon, StoreIcon, HeartIcon,
  ChartIcon, UsersIcon, CardIcon, FileTextIcon,
} from './icons';

/* ─── Team members ──────────────────────────────── */
export const SAMPLE_MEMBERS: Member[] = [];

export const ROLE_STYLE: Record<string, React.CSSProperties> = {
  'Propriétaire': { background: 'var(--accent-bg)', color: 'var(--accent)' },
  'Gérant':       { background: 'var(--blue-bg)',   color: 'var(--blue)' },
  'Vendeur':      { background: 'var(--green-bg)',  color: 'var(--green)' },
  'Comptable':    { background: 'var(--purple-bg)', color: 'var(--purple)' },
};

/* ─── Roles ─────────────────────────────────────── */
export const SAMPLE_ROLES: Role[] = [
  { name: 'Propriétaire', color: '#2A2522', count: 1, perms: 'Accès total · facturation · suppression compte' },
  { name: 'Gérant',       color: '#3B6A8F', count: 1, perms: 'Tous les workspaces · pas de facturation' },
  { name: 'Vendeur',      color: '#2D6A4F', count: 2, perms: 'Boutique & Store · ventes uniquement' },
  { name: 'Comptable',    color: '#5C4A88', count: 1, perms: 'Finance · rapports · lecture seule produits' },
];

/* ─── Workspaces health ─────────────────────────── */
export const SAMPLE_WORKSPACES: WorkspaceHealth[] = [
  { id: 'magasin',  name: 'Magasin',  tag: 'Gestion des stocks', icon: PackageIcon, tint: '#3B6A8F', bg: '#E8F0F7', count: '—', activity: '—', active: true  },
  { id: 'boutique', name: 'Boutique', tag: 'Ventes & caisse',    icon: ReceiptIcon, tint: '#C9601E', bg: '#FBE9D6', count: '—', activity: '—', active: true  },
  { id: 'store',    name: 'Store',    tag: 'E-commerce',         icon: StoreIcon,   tint: '#2D6A4F', bg: '#DDEBE2', count: '—', activity: '—', active: true  },
  { id: 'crm',      name: 'CRM',      tag: 'Relation client',    icon: HeartIcon,   tint: '#5C4A88', bg: '#E6E0F0', count: '—', activity: '—', active: true  },
];

/* ─── Integrations ──────────────────────────────── */
export const SAMPLE_INTEGRATIONS: Integration[] = [
  { name: 'Wave',             cat: 'Paiement',     init: 'W', logoBg: '#E8F0F7', logoColor: '#1A73E8', desc: 'Encaissement mobile money via Wave Sénégal & Togo',       connected: true  },
  { name: 'Orange Money',     cat: 'Paiement',     init: 'O', logoBg: '#FBE9D6', logoColor: '#E07A2C', desc: "Paiement Orange Money multi-pays Afrique de l'Ouest",     connected: true  },
  { name: 'WhatsApp Business',cat: 'Messagerie',   init: 'W', logoBg: '#DDEBE2', logoColor: '#2D6A4F', desc: 'Notifications commandes & support client via WhatsApp',   connected: true  },
  { name: 'DHL Express',      cat: 'Livraison',    init: 'D', logoBg: '#FBE9D6', logoColor: '#C9601E', desc: 'Expédition internationale et suivi de colis',             connected: false },
  { name: 'Mailchimp',        cat: 'Marketing',    init: 'M', logoBg: '#EBE4D6', logoColor: '#2A2522', desc: 'Campagnes email et newsletters automatisées',             connected: false },
  { name: 'QuickBooks',       cat: 'Comptabilité', init: 'Q', logoBg: '#DDEBE2', logoColor: '#2D6A4F', desc: 'Synchronisation comptable et export des écritures',       connected: false },
];

/* ─── Reports ───────────────────────────────────── */
export const SAMPLE_REPORTS: Report[] = [
  { name: 'Rapport de ventes consolidé', desc: 'CA, marges et volumes — tous workspaces confondus',  icon: ChartIcon,    tint: '#3B6A8F', bg: '#E8F0F7' },
  { name: 'État des stocks',             desc: "Valeur d'inventaire Magasin + Boutique, alertes",     icon: PackageIcon,  tint: '#C9601E', bg: '#FBE9D6' },
  { name: 'Performance par équipier',    desc: 'Ventes, commandes traitées et activité par membre',   icon: UsersIcon,    tint: '#2D6A4F', bg: '#DDEBE2' },
  { name: 'Rapport financier mensuel',   desc: 'Entrées, sorties, bénéfice net et trésorerie',        icon: CardIcon,     tint: '#5C4A88', bg: '#E6E0F0' },
  { name: 'Rapport fiscal',              desc: 'TVA collectée, base imposable, export comptable',     icon: FileTextIcon, tint: '#2A2522', bg: '#EBE4D6' },
  { name: 'Analyse clients',             desc: 'Acquisition, rétention, panier moyen et fidélité',    icon: HeartIcon,    tint: '#9C3A14', bg: '#F7DCCB' },
];

/* ─── Activity log ──────────────────────────────── */
export const SAMPLE_LOG: ActivityLog[] = [];

/* ─── CA breakdown (overview) ───────────────────── */
export const CA_BREAKDOWN = [
  { name: 'Store',    ca: 0, pct: 0, tint: '#2D6A4F' },
  { name: 'Boutique', ca: 0, pct: 0, tint: '#C9601E' },
  { name: 'Magasin',  ca: 0, pct: 0, tint: '#3B6A8F' },
];

const activeWorkspaces = SAMPLE_WORKSPACES.filter(w => w.active).length;
const connectedIntegrations = SAMPLE_INTEGRATIONS.filter(i => i.connected).length;

/* ─── KPI sets ──────────────────────────────────── */
export const OVERVIEW_KPIS: KpiItem[] = [
  { label: 'CA consolidé · mois', value: '—',                                                        sub: 'tous workspaces' },
  { label: 'Équipiers actifs',    value: '—',                                                        sub: 'membres actifs' },
  { label: 'Workspaces actifs',   value: String(activeWorkspaces), unit: `/ ${SAMPLE_WORKSPACES.length}`, sub: 'espaces configurés' },
  { label: 'Abonnement',          value: '—',        serif: true,                                    sub: '—' },
];

export const INTEGRATIONS_KPIS: KpiItem[] = [
  { label: 'Intégrations actives', value: String(connectedIntegrations),                              sub: `sur ${SAMPLE_INTEGRATIONS.length} disponibles` },
  { label: 'Catégorie principale', value: '—',       serif: true,                                    sub: '—' },
  { label: 'Appels API · mois',    value: '—',                                                       sub: 'toutes intégrations' },
];
