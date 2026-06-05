/**
 * Admin · Utilisateurs & rôles — données réelles (démo) + maps de style.
 *
 * Ce sont les données effectivement présentes dans le prototype
 * (Maison Diallo). Pour brancher une API, remplacez `MEMBERS` /
 * `DEFAULT_PERMS` par vos fetchers en respectant les types de `types.ts`.
 */
import type React from 'react';
import type {
  Member, Role, Workspace, RoleName, PermissionGroup, PermMatrix,
} from './users-types';

/** Couleur d'avatar attribuée selon le rôle. */
export const ROLE_COLOR: Record<RoleName, string> = {
  'Propriétaire': '#14110E',
  'Gérant': '#3B6A8F',
  'Vendeur': '#2D6A4F',
  'Comptable': '#5C4A88',
};

/** Style du tag de rôle dans le tableau (s'appuie sur les variables CSS). */
export const ROLE_ST: Record<RoleName, React.CSSProperties> = {
  'Propriétaire': { background: 'var(--accent-bg)', color: 'var(--accent)' },
  'Gérant': { background: 'var(--blue-bg)', color: 'var(--blue)' },
  'Vendeur': { background: 'var(--green-bg)', color: 'var(--green)' },
  'Comptable': { background: 'var(--purple-bg)', color: 'var(--purple)' },
};

/** Membres de l'équipe (données réelles du prototype). */
export const MEMBERS: Member[] = [
  { name: 'Kent Diallo',      init: 'K',  color: '#14110E', email: 'kent@maisondiallo.tg',   role: 'Propriétaire', workspaces: 'Tous',             last: "À l'instant", status: 'Actif' },
  { name: 'Akua Mensah',      init: 'AM', color: '#3B6A8F', email: 'akua@maisondiallo.tg',   role: 'Gérant',       workspaces: 'Magasin · Boutique', last: 'il y a 2h',  status: 'Actif' },
  { name: 'Moussa Koné',      init: 'MK', color: '#2D6A4F', email: 'moussa@maisondiallo.tg', role: 'Vendeur',      workspaces: 'Boutique',          last: 'il y a 5h',   status: 'Actif' },
  { name: 'Fatou Sow',        init: 'FS', color: '#5C4A88', email: 'fatou@maisondiallo.tg',  role: 'Comptable',    workspaces: 'Admin · Store',     last: 'hier',        status: 'Actif' },
  { name: 'Yao Komlan',       init: 'YK', color: '#C9601E', email: 'yao@maisondiallo.tg',    role: 'Vendeur',      workspaces: 'Boutique',          last: 'il y a 3j',   status: 'Inactif' },
  { name: 'invité@gmail.com', init: '?',  color: '#8A8278', email: 'invité@gmail.com',       role: 'Vendeur',      workspaces: 'Boutique',          last: '—',           status: 'Invitation' },
];

/** Cartes de synthèse des rôles. */
export const ROLES: Role[] = [
  { name: 'Propriétaire', color: '#2A2522', count: 1, perms: 'Accès total · facturation · suppression compte' },
  { name: 'Gérant',       color: '#3B6A8F', count: 1, perms: 'Tous les workspaces · pas de facturation' },
  { name: 'Vendeur',      color: '#2D6A4F', count: 2, perms: 'Boutique & Store · ventes uniquement' },
  { name: 'Comptable',    color: '#5C4A88', count: 1, perms: 'Finance · rapports · lecture seule produits' },
];

/** Espaces de travail sélectionnables (sous-ensemble utile : id, nom, pastille). */
export const WORKSPACES: Workspace[] = [
  { id: 'magasin',  name: 'Magasin',  tint: '#3B6A8F' },
  { id: 'boutique', name: 'Boutique', tint: '#C9601E' },
  { id: 'store',    name: 'Store',    tint: '#2D6A4F' },
  { id: 'crm',      name: 'CRM',      tint: '#5C4A88' },
];

/** Permissions détaillées (modale "Gérer les rôles"). */
export const PERM_GROUPS: PermissionGroup[] = [
  { sec: 'Espaces de travail', items: [
    { k: 'ws_magasin',  t: 'Magasin',  d: 'Gestion des stocks' },
    { k: 'ws_boutique', t: 'Boutique', d: 'Ventes & caisse' },
    { k: 'ws_store',    t: 'Store',    d: 'E-commerce' },
    { k: 'ws_crm',      t: 'CRM',      d: 'Relation client' },
  ] },
  { sec: 'Opérations', items: [
    { k: 'sales',  t: 'Ventes & encaissement', d: 'Créer des ventes, ouvrir la caisse' },
    { k: 'stock',  t: 'Produits & stock',      d: 'Ajouter, modifier, réapprovisionner' },
    { k: 'orders', t: 'Commandes e-commerce',  d: 'Traiter et expédier les commandes' },
  ] },
  { sec: 'Administration', items: [
    { k: 'finance',  t: 'Finance & rapports',        d: 'Consulter et exporter les rapports' },
    { k: 'team',     t: "Gestion de l'équipe",       d: 'Inviter des membres, assigner des rôles' },
    { k: 'billing',  t: 'Facturation & abonnement',  d: 'Gérer le plan et les paiements' },
    { k: 'settings', t: 'Paramètres du compte',      d: 'Configuration générale, intégrations' },
  ] },
];

/** Permissions par défaut par rôle. */
export const DEFAULT_PERMS: PermMatrix = {
  'Propriétaire': { ws_magasin: 1, ws_boutique: 1, ws_store: 1, ws_crm: 1, sales: 1, stock: 1, orders: 1, finance: 1, team: 1, billing: 1, settings: 1 },
  'Gérant':       { ws_magasin: 1, ws_boutique: 1, ws_store: 1, ws_crm: 1, sales: 1, stock: 1, orders: 1, finance: 1, team: 1, billing: 0, settings: 1 },
  'Vendeur':      { ws_magasin: 0, ws_boutique: 1, ws_store: 1, ws_crm: 0, sales: 1, stock: 0, orders: 1, finance: 0, team: 0, billing: 0, settings: 0 },
  'Comptable':    { ws_magasin: 1, ws_boutique: 0, ws_store: 1, ws_crm: 0, sales: 0, stock: 0, orders: 0, finance: 1, team: 0, billing: 1, settings: 0 },
};

/** Initiales à partir d'un nom complet. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
