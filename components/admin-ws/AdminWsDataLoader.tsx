'use client';

import { useEffect, useState } from 'react';
import AdminWsShell from './AdminWsShell';
import type { Member, ActivityLog } from './types';
import { SAMPLE_WORKSPACES, SAMPLE_INTEGRATIONS, SAMPLE_REPORTS, SAMPLE_ROLES } from './sample-data';

const SWATCHES = [
  '#14110E', '#3B6A8F', '#2D6A4F', '#5C4A88',
  '#B8501A', '#C9601E', '#1F3D6E', '#C8962A',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

function mapRole(role: string): Member['role'] {
  const map: Record<string, Member['role']> = {
    super_admin: 'Propriétaire',
    admin:       'Gérant',
    manager:     'Gérant',
    comptable:   'Comptable',
    staff:       'Vendeur',
    livreur:     'Vendeur',
  };
  return map[role] ?? 'Vendeur';
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1)  return "À l'instant";
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'hier' : `il y a ${d}j`;
  } catch { return '—'; }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
      ', ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch { return dateStr; }
}

interface ApiAdminUser {
  id: number;
  nom: string;
  username: string;
  email: string | null;
  role: string;
  actif: number | boolean;
  last_login: string | null;
}

interface ApiUtilisateur {
  id: number;
  nom: string;
  email: string | null;
  poste: string;
  actif: number | boolean;
  date_creation: string | null;
}

interface ApiSecurityLog {
  id: number;
  admin_nom: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

function mapAdminUser(u: ApiAdminUser): Member {
  return {
    name:       u.nom,
    init:       initials(u.nom),
    color:      SWATCHES[hashStr(u.nom) % SWATCHES.length],
    email:      u.email ?? `${u.username}@admin`,
    role:       mapRole(u.role),
    workspaces: ['super_admin', 'admin'].includes(u.role) ? 'Tous' : 'Boutique · Store',
    last:       relativeTime(u.last_login),
    status:     (u.actif === 1 || u.actif === true) ? 'Actif' : 'Inactif',
  };
}

function mapUtilisateur(u: ApiUtilisateur): Member {
  const roleFromPoste = u.poste === 'Comptable' ? 'Comptable' : 'Vendeur';
  return {
    name:       u.nom,
    init:       initials(u.nom),
    color:      SWATCHES[hashStr(u.nom) % SWATCHES.length],
    email:      u.email ?? '—',
    role:       roleFromPoste,
    workspaces: u.poste === 'Livreur' ? 'Livraisons' : 'Boutique',
    last:       relativeTime(u.date_creation),
    status:     (u.actif === 1 || u.actif === true) ? 'Actif' : 'Inactif',
  };
}

function mapLog(l: ApiSecurityLog): ActivityLog {
  const who = l.admin_nom || 'Système';
  return {
    date:    formatDateTime(l.created_at),
    who,
    init:    initials(who),
    color:   SWATCHES[hashStr(who) % SWATCHES.length],
    action:  l.details || l.action,
    ws:      'Admin',
    wsColor: '#2A2522',
  };
}

interface Props {
  onSwitchWorkspace?: () => void;
  onInvite?: () => void;
  userName?: string;
  userRole?: string;
  shopName?: string;
}

export default function AdminWsDataLoader({
  onSwitchWorkspace,
  onInvite,
  userName,
  userRole,
  shopName,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [log,     setLog]     = useState<ActivityLog[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()).catch(() => ({ users: [] })),
      fetch('/api/admin/team').then(r => r.json()).catch(() => ({ utilisateurs: [] })),
    ]).then(([usersRes, teamRes]) => {
      const admins: Member[] = Array.isArray(usersRes.users)
        ? (usersRes.users as ApiAdminUser[]).map(mapAdminUser)
        : [];
      const team: Member[] = Array.isArray(teamRes.utilisateurs)
        ? (teamRes.utilisateurs as ApiUtilisateur[]).map(mapUtilisateur)
        : [];
      setMembers([...admins, ...team]);
    });
  }, []);

  useEffect(() => {
    fetch('/api/admin/security-logs?limit=20')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.logs)) setLog((d.logs as ApiSecurityLog[]).map(mapLog));
      })
      .catch(() => {});
  }, []);

  return (
    <AdminWsShell
      members={members}
      roles={SAMPLE_ROLES.map(r => ({
        ...r,
        count: members.filter(m => m.role === r.name).length,
      }))}
      workspaces={SAMPLE_WORKSPACES}
      integrations={SAMPLE_INTEGRATIONS}
      reports={SAMPLE_REPORTS}
      log={log}
      onSwitchWorkspace={onSwitchWorkspace}
      onInvite={onInvite}
      userName={userName}
      userRole={userRole}
      shopName={shopName}
    />
  );
}
