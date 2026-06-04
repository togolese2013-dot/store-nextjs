import type { NavGroup, CrmPageId } from './types';
import type React from 'react';
import {
  HomeIcon, UsersIcon, AwardIcon, GiftIcon, SendIcon, CogIcon, HelpIcon,
} from './icons';

/* ─── Status → color maps ─────────────────────────────────────────── */
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

/* ─── Navigation ──────────────────────────────────────────────────── */
export const NAV: NavGroup[] = [
  {
    section: null,
    items: [
      { icon: HomeIcon,  label: "Vue d'ensemble", page: 'overview' },
      { icon: UsersIcon, label: 'Comptes clients', page: 'clients' },
      { icon: AwardIcon, label: 'Fidélité', page: 'loyalty' },
      { icon: GiftIcon,  label: 'Parrainage', page: 'referral' },
      { icon: SendIcon,  label: 'Campagnes', page: 'campaigns' },
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
