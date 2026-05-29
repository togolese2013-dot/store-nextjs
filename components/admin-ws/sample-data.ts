import React from 'react';
import type { Member, Role, WorkspaceHealth, Integration, Report, ActivityLog, KpiItem } from './types';
import {
  PackageIcon, ReceiptIcon, StoreIcon, HeartIcon,
  ChartIcon, UsersIcon, CardIcon, FileTextIcon,
} from './icons';

/* ─── Team members ──────────────────────────────── */
export const SAMPLE_MEMBERS: Member[] = [
  { name: 'Kent Diallo',      init: 'K',  color: '#14110E', email: 'kent@maisondiallo.tg',   role: 'Propriétaire', workspaces: 'Tous',             last: "À l'instant", status: 'Actif' },
  { name: 'Akua Mensah',      init: 'AM', color: '#3B6A8F', email: 'akua@maisondiallo.tg',   role: 'Gérant',       workspaces: 'Magasin · Boutique', last: 'il y a 2h',   status: 'Actif' },
  { name: 'Moussa Koné',      init: 'MK', color: '#2D6A4F', email: 'moussa@maisondiallo.tg', role: 'Vendeur',      workspaces: 'Boutique',          last: 'il y a 5h',   status: 'Actif' },
  { name: 'Fatou Sow',        init: 'FS', color: '#5C4A88', email: 'fatou@maisondiallo.tg',  role: 'Comptable',    workspaces: 'Admin · Store',      last: 'hier',        status: 'Actif' },
  { name: 'Yao Komlan',       init: 'YK', color: '#C9601E', email: 'yao@maisondiallo.tg',    role: 'Vendeur',      workspaces: 'Boutique',          last: 'il y a 3j',   status: 'Inactif' },
  { name: 'invité@gmail.com', init: '?',  color: '#8A8278', email: 'invité@gmail.com',       role: 'Vendeur',      workspaces: 'Boutique',          last: '—',           status: 'Invitation' },
];

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
  { id: 'magasin',  name: 'Magasin',  tag: 'Gestion des stocks', icon: PackageIcon, tint: '#3B6A8F', bg: '#E8F0F7', count: '248 produits',  activity: 'il y a 2h',    active: true  },
  { id: 'boutique', name: 'Boutique', tag: 'Ventes & caisse',    icon: ReceiptIcon, tint: '#C9601E', bg: '#FBE9D6', count: '12 ventes/j',   activity: "À l'instant",  active: true  },
  { id: 'store',    name: 'Store',    tag: 'E-commerce',         icon: StoreIcon,   tint: '#2D6A4F', bg: '#DDEBE2', count: '32 commandes',  activity: 'il y a 5 min', active: true  },
  { id: 'crm',      name: 'CRM',      tag: 'Relation client',    icon: HeartIcon,   tint: '#5C4A88', bg: '#E6E0F0', count: '1 421 clients', activity: 'il y a 1j',    active: false },
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
export const SAMPLE_LOG: ActivityLog[] = [
  { date: '28 mai, 14h32', who: 'Moussa Koné', init: 'MK', color: '#2D6A4F', action: 'a enregistré la vente V-0891',                  ws: 'Boutique', wsColor: '#C9601E' },
  { date: '28 mai, 13h05', who: 'Kent Diallo', init: 'K',  color: '#14110E', action: 'a modifié le rôle de Fatou Sow → Comptable',   ws: 'Admin',    wsColor: '#2A2522' },
  { date: '28 mai, 11h20', who: 'Akua Mensah', init: 'AM', color: '#3B6A8F', action: 'a importé 156 unités de stock',                ws: 'Magasin',  wsColor: '#3B6A8F' },
  { date: '28 mai, 10h14', who: 'Système',     init: 'S',  color: '#8A8278', action: 'paiement Wave reçu · CMD-2847',                ws: 'Store',    wsColor: '#2D6A4F' },
  { date: '28 mai, 09h00', who: 'Kent Diallo', init: 'K',  color: '#14110E', action: 'a ouvert la caisse (fonds 30 000 F)',          ws: 'Boutique', wsColor: '#C9601E' },
  { date: '27 mai, 18h45', who: 'Fatou Sow',   init: 'FS', color: '#5C4A88', action: 'a exporté le rapport financier mensuel',       ws: 'Admin',    wsColor: '#2A2522' },
  { date: '27 mai, 16h30', who: 'Kent Diallo', init: 'K',  color: '#14110E', action: 'a invité invité@gmail.com (Vendeur)',          ws: 'Admin',    wsColor: '#2A2522' },
  { date: '27 mai, 14h12', who: 'Akua Mensah', init: 'AM', color: '#3B6A8F', action: 'a créé le coupon WAXFEST20',                   ws: 'Store',    wsColor: '#2D6A4F' },
];

/* ─── CA breakdown (overview) ───────────────────── */
export const CA_BREAKDOWN = [
  { name: 'Store',    ca: 2340000, pct: 45, tint: '#2D6A4F' },
  { name: 'Boutique', ca: 1820000, pct: 35, tint: '#C9601E' },
  { name: 'Magasin',  ca: 1040000, pct: 20, tint: '#3B6A8F' },
];

/* ─── KPI sets ──────────────────────────────────── */
export const OVERVIEW_KPIS: KpiItem[] = [
  { label: 'CA consolidé · mois', value: '5,2', unit: 'M F', delta: '+16%', deltaColor: '#2D6A4F', sub: 'tous workspaces',   spark: [3.2,3.5,3.8,4.0,4.2,4.5,4.7,4.9,5.0,5.1,5.2], sparkColor: '#2A2522' },
  { label: 'Équipiers actifs',    value: '5',                 delta: '+1',   deltaColor: '#2D6A4F', sub: 'sur 6 membres',     spark: [3,3,4,4,4,5,5,5,5,5,5], sparkColor: '#3B6A8F' },
  { label: 'Workspaces actifs',   value: '3', unit: '/ 4',                                          sub: 'CRM désactivé' },
  { label: 'Abonnement',          value: 'Business', serif: true,                                   sub: 'renouvellement 15 juin' },
];

export const INTEGRATIONS_KPIS: KpiItem[] = [
  { label: 'Intégrations actives', value: '3',                                              sub: 'sur 6 disponibles',     spark: [1,1,2,2,2,3,3,3,3,3,3], sparkColor: '#2A2522' },
  { label: 'Catégorie principale', value: 'Paiement', serif: true,                          sub: 'Wave · Orange Money' },
  { label: 'Appels API · mois',    value: '48 200',   delta: '+12%', deltaColor: '#2D6A4F', sub: 'toutes intégrations',   spark: [30,33,36,38,40,42,44,45,46,47,48], sparkColor: '#3B6A8F' },
];
