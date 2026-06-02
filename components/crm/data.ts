import type { Client, Tier, Referral, Campaign, NavGroup, CrmPageId } from './types';
import {
  HomeIcon, UsersIcon, AwardIcon, GiftIcon, SendIcon, CogIcon, HelpIcon,
  MailIcon, WhatsAppIcon,
} from './icons';
import type React from 'react';

/* ─── Status → color maps ─────────────────────────────────────────── */
export const TIER_STYLE: Record<string, React.CSSProperties> = {
  Or:      { background: '#F5E6D0', color: '#8B5E2E' },
  Argent:  { background: '#ECECEC', color: '#6B6B6B' },
  Bronze:  { background: '#F0E0D2', color: '#9C6233' },
  Nouveau: { background: 'rgba(20,17,14,.06)', color: '#6B635B' },
};

export const REFERRAL_STYLE: Record<string, React.CSSProperties> = {
  Converti:      { background: '#DDEBE2', color: '#2D6A4F' },
  'En attente':  { background: '#FBE9D6', color: '#C9601E' },
  Expiré:        { background: 'rgba(20,17,14,.06)', color: '#6B635B' },
};

export const CAMPAIGN_STYLE: Record<string, React.CSSProperties> = {
  Envoyée:   { background: '#DDEBE2', color: '#2D6A4F' },
  Active:    { background: '#E6E0F0', color: '#5C4A88' },
  Brouillon: { background: 'rgba(20,17,14,.06)', color: '#6B635B' },
};

/* ─── Clients ─────────────────────────────────────────────────────── */
export const CLIENTS: Client[] = [
  { name: 'Akua Boateng',  init: 'AB', color: '#5C4A88', email: 'akua.b@gmail.com',  phone: '+228 90 12 34 56', orders: 34, total: 1240000, tier: 'Or',      last: '28 mai 2026' },
  { name: 'Adjoa Mensah',  init: 'AM', color: '#1F3D6E', email: 'adjoa.m@gmail.com', phone: '+228 91 23 45 67', orders: 22, total: 685000,  tier: 'Argent',  last: '28 mai 2026' },
  { name: 'Kofi Asante',   init: 'KA', color: '#2D6A4F', email: 'kofi.a@gmail.com',  phone: '+228 92 34 56 78', orders: 18, total: 512000,  tier: 'Argent',  last: '27 mai 2026' },
  { name: 'Ama Koffi',     init: 'AK', color: '#C9601E', email: 'ama.k@gmail.com',   phone: '+228 93 45 67 89', orders: 15, total: 478000,  tier: 'Or',      last: '26 mai 2026' },
  { name: 'Fatou Diallo',  init: 'FD', color: '#B8501A', email: 'fatou.d@gmail.com', phone: '+228 94 56 78 90', orders: 9,  total: 198000,  tier: 'Bronze',  last: '25 mai 2026' },
  { name: 'Kwame Boateng', init: 'KB', color: '#C8962A', email: 'kwame.b@gmail.com', phone: '+228 95 67 89 01', orders: 6,  total: 142000,  tier: 'Bronze',  last: '24 mai 2026' },
  { name: 'Abena Owusu',   init: 'AO', color: '#7A2C3A', email: 'abena.o@gmail.com', phone: '+228 96 78 90 12', orders: 3,  total: 67000,   tier: 'Nouveau', last: '20 mai 2026' },
  { name: 'Yaw Darko',     init: 'YD', color: '#3A2F25', email: 'yaw.d@gmail.com',   phone: '+228 97 89 01 23', orders: 2,  total: 38000,   tier: 'Nouveau', last: '15 mai 2026' },
];

/* ─── Loyalty tiers ───────────────────────────────────────────────── */
export const TIERS: Tier[] = [
  { name: 'Or',      color: '#C8962A', count: 142, meta: '≥ 500 000 F cumulés · −15% permanent · livraison offerte' },
  { name: 'Argent',  color: '#9A9A9A', count: 386, meta: '≥ 150 000 F cumulés · −10% · accès ventes privées' },
  { name: 'Bronze',  color: '#B07B47', count: 512, meta: '≥ 50 000 F cumulés · −5% · points doublés le week-end' },
  { name: 'Nouveau', color: '#8A8278', count: 381, meta: 'Inscription récente · 500 pts de bienvenue' },
];

/* ─── Referrals ───────────────────────────────────────────────────── */
export const REFERRALS: Referral[] = [
  { parrain: 'Akua Boateng', init: 'AB', color: '#5C4A88', filleul: 'Esi Mensah',    date: '28 mai 2026', status: 'Converti',   reward: '2 000 pts' },
  { parrain: 'Adjoa Mensah', init: 'AM', color: '#1F3D6E', filleul: 'Yao Komlan',    date: '27 mai 2026', status: 'Converti',   reward: '2 000 pts' },
  { parrain: 'Ama Koffi',    init: 'AK', color: '#C9601E', filleul: 'Kwabena Osei',  date: '26 mai 2026', status: 'En attente', reward: '—' },
  { parrain: 'Kofi Asante',  init: 'KA', color: '#2D6A4F', filleul: 'Afia Boateng',  date: '24 mai 2026', status: 'Converti',   reward: '2 000 pts' },
  { parrain: 'Fatou Diallo', init: 'FD', color: '#B8501A', filleul: 'Yaa Asantewaa', date: '22 mai 2026', status: 'Expiré',     reward: '—' },
  { parrain: 'Akua Boateng', init: 'AB', color: '#5C4A88', filleul: 'Kojo Mensah',   date: '20 mai 2026', status: 'Converti',   reward: '2 000 pts' },
];

/* ─── Campaigns ───────────────────────────────────────────────────── */
export const CAMPAIGNS: Campaign[] = [
  { name: 'Newsletter de mai',       channel: 'Email',    icon: MailIcon,     chBg: '#E8F0F7', chColor: '#3B6A8F', status: 'Envoyée',   sent: 1421, open: 62, click: 18, date: '15 mai 2026' },
  { name: 'Promo Wax Festival',      channel: 'WhatsApp', icon: WhatsAppIcon, chBg: '#DDEBE2', chColor: '#2D6A4F', status: 'Envoyée',   sent: 980,  open: 88, click: 34, date: '10 mai 2026' },
  { name: 'Bienvenue nouveaux',      channel: 'Email',    icon: MailIcon,     chBg: '#E8F0F7', chColor: '#3B6A8F', status: 'Active',    sent: 381,  open: 71, click: 25, date: 'auto' },
  { name: 'Relance panier abandonné',channel: 'WhatsApp', icon: WhatsAppIcon, chBg: '#DDEBE2', chColor: '#2D6A4F', status: 'Active',    sent: 142,  open: 91, click: 42, date: 'auto' },
  { name: 'Fête des mères',          channel: 'Email',    icon: MailIcon,     chBg: '#E8F0F7', chColor: '#3B6A8F', status: 'Brouillon', sent: 0,    open: 0,  click: 0,  date: 'prévue 30 mai' },
  { name: 'Offre clients Or',        channel: 'WhatsApp', icon: WhatsAppIcon, chBg: '#DDEBE2', chColor: '#2D6A4F', status: 'Brouillon', sent: 0,    open: 0,  click: 0,  date: 'prévue 1 juin' },
];

/* ─── Navigation ──────────────────────────────────────────────────── */
export const NAV: NavGroup[] = [
  {
    section: null,
    items: [
      { icon: HomeIcon,  label: "Vue d'ensemble", page: 'overview' },
      { icon: UsersIcon, label: 'Comptes clients', page: 'clients', count: 1421 },
      { icon: AwardIcon, label: 'Fidélité', page: 'loyalty' },
      { icon: GiftIcon,  label: 'Parrainage', page: 'referral', count: 6 },
      { icon: SendIcon,  label: 'Campagnes', page: 'campaigns', count: 2, badge: true },
    ],
  },
  {
    section: 'Paramètres',
    items: [
      { icon: CogIcon,  label: 'Réglages CRM' },
      { icon: HelpIcon, label: 'Aide & support' },
    ],
  },
];

export const PAGE_LABELS: Record<CrmPageId, string> = {
  overview:  "Vue d'ensemble",
  clients:   'Comptes clients',
  loyalty:   'Fidélité',
  referral:  'Parrainage',
  campaigns: 'Campagnes',
};

export const SEARCH_PLACEHOLDER: Record<CrmPageId, string> = {
  overview:  'Rechercher…',
  clients:   'Rechercher un client, email, téléphone…',
  loyalty:   'Rechercher un client…',
  referral:  'Rechercher un parrain, filleul…',
  campaigns: 'Rechercher une campagne…',
};
