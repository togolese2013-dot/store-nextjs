/**
 * Admin · Utilisateurs & rôles — types du domaine
 * Portage fidèle de la section "Utilisateurs & rôles" de admin-preview.html.
 */

export type RoleName = 'Propriétaire' | 'Gérant' | 'Vendeur' | 'Comptable';

export type MemberStatus = 'Actif' | 'Inactif' | 'Invitation';

/** Un membre de l'équipe d'une boutique (tenant). */
export interface Member {
  /** Nom complet (ou l'email tant que l'invitation n'est pas acceptée). */
  name: string;
  /** Initiales affichées dans l'avatar. */
  init: string;
  /** Couleur de fond de l'avatar (hex). */
  color: string;
  /** Identifiant unique de fait — sert de clé de liste. */
  email: string;
  /** Téléphone (optionnel). */
  phone?: string;
  role: RoleName;
  /** Espaces de travail accessibles, joints par " · " ("Tous" / "Aucun"). */
  workspaces: string;
  /** Dernière activité, texte libre ("À l'instant", "il y a 2h", "—"). */
  last: string;
  status: MemberStatus;
}

/** Carte récapitulative d'un rôle (en-tête de la page). */
export interface Role {
  name: RoleName;
  color: string;
  count: number;
  /** Résumé court des permissions. */
  perms: string;
}

/** Espace de travail sélectionnable (sous-ensemble utile à cette feature). */
export interface Workspace {
  id: string;
  name: string;
  /** Couleur de la pastille. */
  tint: string;
}

/** Une permission unitaire dans la modale "Gérer les rôles". */
export interface Permission {
  /** Clé technique (stable). */
  k: string;
  /** Libellé. */
  t: string;
  /** Description. */
  d: string;
}

export interface PermissionGroup {
  sec: string;
  items: Permission[];
}

/** Matrice rôle → (clé permission → 0/1). */
export type PermMatrix = Record<RoleName, Record<string, 0 | 1>>;

/** Actions déclenchables depuis le menu ⋮ d'une ligne. */
export type RowAction =
  | 'edit'
  | 'role'
  | 'reset'
  | 'resend'
  | 'deactivate'
  | 'reactivate'
  | 'delete';
