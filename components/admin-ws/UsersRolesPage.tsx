/**
 * Admin · Utilisateurs & rôles — page principale.
 *
 * Porte l'état (liste des membres + modales), câble toutes les actions du
 * menu ⋮, et rend : en-tête, cartes de rôles, tableau, modales et toast.
 *
 * Intégration API : passez `initialMembers` (sinon les données démo de
 * `data.ts` sont utilisées) et écoutez `onMembersChange` pour persister.
 * Remplacez le corps des handlers (reset/resend/etc.) par vos appels réseau —
 * la structure d'état optimiste et les toasts restent valables.
 */
import React, { useState, useEffect, useCallback } from 'react';
import './AdminUsers.css';
import { I } from './users-icons';
import { ROLES, ROLE_ST, ROLE_COLOR, getInitials } from './users-data';
import type { Member, RoleName, RowAction } from './users-types';
import {
  AddMemberModal, RowMenu, ConfirmModal, RoleChangeModal, RolesModal, Toast,
  type ConfirmConfig,
} from './UsersModals';

export interface UsersRolesPageProps {
  initialMembers?: Member[];
  onMembersChange?: (members: Member[]) => void;
}

const DB_ROLE_MAP: Record<string, RoleName> = {
  super_admin: 'Propriétaire',
  admin:       'Propriétaire',
  manager:     'Gérant',
  staff:       'Vendeur',
  comptable:   'Comptable',
};

function formatLastLogin(ts: string | null): string {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return "À l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  return `il y a ${d}j`;
}

function apiUserToMember(u: Record<string, unknown>): Member {
  const role: RoleName = DB_ROLE_MAP[u.role as string] ?? 'Vendeur';
  return {
    name:       (u.nom as string) || (u.username as string),
    init:       getInitials((u.nom as string) || (u.username as string)),
    color:      ROLE_COLOR[role],
    email:      (u.email as string) || (u.username as string),
    role,
    workspaces: 'Tous',
    last:       formatLastLogin(u.last_login as string | null),
    status:     (u.actif as number) === 1 ? 'Actif' : 'Inactif',
  };
}

const statusClass = (s: Member['status']) =>
  s === 'Actif' ? 'actif' : s === 'Invitation' ? 'attente' : 'inactif';

export default function UsersRolesPage({ initialMembers, onMembersChange }: UsersRolesPageProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers ?? []);
  const [loading, setLoading] = useState(true);
  const localFetchDone = React.useRef(false);

  // Sync when DataLoader passes fresh initialMembers (prop change after async fetch)
  useEffect(() => {
    if (initialMembers && initialMembers.length > 0 && !localFetchDone.current) {
      setMembers(initialMembers);
      setLoading(false);
    }
  }, [initialMembers]);

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.users) && data.users.length > 0) {
          localFetchDone.current = true;
          setMembers(data.users.map(apiUserToMember));
        }
      })
      .catch(e => console.error('[UsersRolesPage] fetch error:', e))
      .finally(() => setLoading(false));
  }, []);

  // modales
  const [addOpen, setAddOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [roleMember, setRoleMember] = useState<Member | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  // menu de ligne
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  // notifie le parent à chaque changement
  useEffect(() => { onMembersChange?.(members); }, [members, onMembersChange]);

  // fermeture du menu au clic extérieur / scroll
  useEffect(() => {
    if (openMenu === null) return;
    const close = () => setOpenMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [openMenu]);

  const patch = (email: string, changes: Partial<Member>) =>
    setMembers((prev) => prev.map((m) => (m.email === email ? { ...m, ...changes } : m)));

  const ROLE_TO_DB: Record<RoleName, string> = {
    'Propriétaire': 'super_admin',
    'Gérant':       'manager',
    'Vendeur':      'staff',
    'Comptable':    'comptable',
  };

  function genPassword(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p.charAt(0).toUpperCase() + p.slice(1) + '!';
  }

  const addMember = async (m: Member) => {
    const username = m.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || m.name.toLowerCase().replace(/\s+/g, '');
    const tempPassword = genPassword();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:       m.name,
          username,
          email:     m.email || null,
          telephone: (m as Member & { phone?: string }).phone || null,
          poste:     m.role,
          role:      ROLE_TO_DB[m.role] ?? 'staff',
          password:  tempPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { flash(`Erreur : ${data.error ?? res.status}`); return; }
      setMembers((prev) => [...prev, m]);
      setAddOpen(false);
      flash(`${m.name} ajouté — mot de passe temp : ${tempPassword}`);
    } catch {
      flash('Erreur réseau, membre non sauvegardé');
    }
  };

  const saveEdit = (m: Member) => {
    if (!editMember) return;
    patch(editMember.email, m);
    setEditMember(null);
    flash(`Les informations de ${m.name} ont été mises à jour`);
  };

  const changeRole = (newRole: RoleName) => {
    if (!roleMember) return;
    patch(roleMember.email, { role: newRole, color: ROLE_COLOR[newRole] });
    flash(`${roleMember.name} est maintenant ${newRole}`);
    setRoleMember(null);
  };

  const onAction = (action: RowAction, m: Member) => {
    switch (action) {
      case 'edit': setEditMember(m); break;
      case 'role': setRoleMember(m); break;
      case 'reset': flash(`Lien de réinitialisation envoyé à ${m.email}`); break;
      case 'resend': flash(`Invitation renvoyée à ${m.email}`); break;
      case 'reactivate':
        patch(m.email, { status: 'Actif', last: "À l'instant" });
        flash(`${m.name} a été réactivé`);
        break;
      case 'deactivate':
        setConfirm({
          tone: 'warn', icon: I.userX, title: 'Désactiver', serif: m.name.split(' ')[0],
          body: `${m.name} ne pourra plus se connecter ni accéder aux espaces de travail. Vous pourrez réactiver le compte à tout moment.`,
          confirmLabel: 'Désactiver',
          run: () => { patch(m.email, { status: 'Inactif' }); flash(`${m.name} a été désactivé`); },
        });
        break;
      case 'delete':
        setConfirm({
          tone: 'danger', icon: I.trash, title: 'Supprimer', serif: m.name.split(' ')[0],
          body: `Cette action est irréversible. ${m.name} sera définitivement retiré de l'équipe et perdra tout accès.`,
          confirmLabel: 'Supprimer définitivement',
          run: () => { setMembers((prev) => prev.filter((x) => x.email !== m.email)); flash(`${m.name} a été supprimé de l'équipe`); },
        });
        break;
    }
  };

  const pending = members.filter((m) => m.status === 'Invitation').length;

  if (loading) return (
    <div className="admin-users" style={{ padding: '2rem', color: 'var(--muted)' }}>Chargement…</div>
  );

  return (
    <div className="admin-users">
      {/* En-tête */}
      <div className="head">
        <div className="head-l">
          <div className="eyb">Admin · Équipe</div>
          <h1 className="t1">Utilisateurs & <span className="serif">rôles</span></h1>
          <p className="sub">{members.length} membre{members.length > 1 ? 's' : ''} · 4 rôles · {pending} invitation{pending > 1 ? 's' : ''} en attente</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setRolesOpen(true)}><I.shield size={14} /> Gérer les rôles</button>
          <button className="btn pri" onClick={() => setAddOpen(true)}><I.userPlus size={14} /> Ajouter un membre</button>
        </div>
      </div>

      {/* Cartes de rôles */}
      <div className="role-grid">
        {ROLES.map((r) => {
          const count = members.filter(m => m.role === r.name).length;
          return (
            <div key={r.name} className="role-card">
              <div className="role-name"><span className="role-dot" style={{ background: r.color }} />{r.name}</div>
              <div className="role-count">{count} <span style={{ fontSize: 13, color: 'var(--muted-2)', fontWeight: 400 }}>membre{count > 1 ? 's' : ''}</span></div>
              <div className="role-perms">{r.perms}</div>
            </div>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="twrap">
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Membre</th><th>Rôle</th><th>Workspaces</th><th>Dernière activité</th><th>Statut</th><th />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 99, background: m.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.init}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="tag" style={ROLE_ST[m.role]}>{m.role}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{m.workspaces}</td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{m.last}</td>
                  <td><span className={`st ${statusClass(m.status)}`}><span className="d" />{m.status}</span></td>
                  <td className="act-c">
                    <button
                      className={`rm ${openMenu === m.email ? 'open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openMenu === m.email) { setOpenMenu(null); }
                        else { setAnchor(e.currentTarget.getBoundingClientRect()); setOpenMenu(m.email); }
                      }}
                    >
                      <I.more size={16} />
                    </button>
                    {openMenu === m.email && (
                      <RowMenu member={m} anchor={anchor} onPick={(a) => { setOpenMenu(null); onAction(a, m); }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{members.length} membres · {pending} invitation{pending > 1 ? 's' : ''} en attente</span>
          <div className="pgr"><button>‹</button><button className="on">1</button><button>›</button></div>
        </div>
      </div>

      {/* Modales */}
      {addOpen && <AddMemberModal onClose={() => setAddOpen(false)} onAdd={addMember} />}
      {editMember && <AddMemberModal member={editMember} onClose={() => setEditMember(null)} onAdd={saveEdit} />}
      {roleMember && <RoleChangeModal member={roleMember} onClose={() => setRoleMember(null)} onConfirm={changeRole} />}
      {confirm && (
        <ConfirmModal
          {...confirm}
          onClose={() => setConfirm(null)}
          onConfirm={() => { confirm.run(); setConfirm(null); }}
        />
      )}
      {rolesOpen && <RolesModal onClose={() => setRolesOpen(false)} onSave={(name) => { setRolesOpen(false); flash(`Permissions du rôle « ${name} » enregistrées`); }} />}
      {toast && <Toast msg={toast} />}
    </div>
  );
}
