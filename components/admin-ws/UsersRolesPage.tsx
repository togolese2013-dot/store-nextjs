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
import { useT } from '@/lib/i18n/use-admin-ws-lang';
import type { DictKey } from '@/lib/i18n/admin-ws';

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

// `t` is threaded through since this is a plain helper (not a component/hook itself).
function formatLastLogin(ts: string | null, t: (k: DictKey) => string): string {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return t('common.time.just_now');
  if (min < 60) return t('common.time.min_ago').replace('{n}', String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return t('common.time.hours_ago').replace('{n}', String(h));
  const d = Math.floor(h / 24);
  if (d === 1) return t('common.time.yesterday');
  return t('common.time.days_ago_abbr').replace('{n}', String(d));
}

function apiUserToMember(u: Record<string, unknown>, t: (k: DictKey) => string): Member {
  const role: RoleName = DB_ROLE_MAP[u.role as string] ?? 'Vendeur';
  let workspaces = 'Tous';
  if (u.permissions) {
    try {
      const p = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
      if (p?.workspaces) workspaces = p.workspaces;
    } catch { /* keep default */ }
  }
  return {
    name:       (u.nom as string) || (u.username as string),
    init:       getInitials((u.nom as string) || (u.username as string)),
    color:      ROLE_COLOR[role],
    email:      (u.email as string) || (u.username as string),
    role,
    workspaces,
    last:       formatLastLogin(u.last_login as string | null, t),
    status:     (u.actif as number) === 1 ? 'Actif' : 'Inactif',
  };
}

const statusClass = (s: Member['status']) =>
  s === 'Actif' ? 'actif' : s === 'Invitation' ? 'attente' : 'inactif';

export default function UsersRolesPage({ initialMembers, onMembersChange }: UsersRolesPageProps) {
  const t = useT();
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
          setMembers(data.users.map((u: Record<string, unknown>) => apiUserToMember(u, t)));
        }
      })
      .catch(e => console.error('[UsersRolesPage]', e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          nom:        m.name,
          username,
          email:      m.email || null,
          telephone:  (m as Member & { phone?: string }).phone || null,
          poste:      m.role,
          role:       ROLE_TO_DB[m.role] ?? 'staff',
          password:   tempPassword,
          workspaces: m.workspaces || 'Tous',
        }),
      });
      const data = await res.json();
      if (!res.ok) { flash(`${t('usersroles.toast.error_prefix')} ${data.error ?? res.status}`); return; }
      setMembers((prev) => [...prev, m]);
      setAddOpen(false);
      flash(`${m.name} ${t('usersroles.toast.member_added_suffix')} ${tempPassword}`);
    } catch {
      flash(t('usersroles.toast.network_error'));
    }
  };

  const saveEdit = (m: Member) => {
    if (!editMember) return;
    patch(editMember.email, m);
    setEditMember(null);
    flash(`${t('usersroles.toast.info_updated_prefix')} ${m.name} ${t('usersroles.toast.info_updated_suffix')}`);
  };

  const changeRole = (newRole: RoleName) => {
    if (!roleMember) return;
    patch(roleMember.email, { role: newRole, color: ROLE_COLOR[newRole] });
    flash(`${roleMember.name} ${t('usersroles.toast.now_role_suffix')} ${newRole}`);
    setRoleMember(null);
  };

  const onAction = (action: RowAction, m: Member) => {
    switch (action) {
      case 'edit': setEditMember(m); break;
      case 'role': setRoleMember(m); break;
      case 'reset': flash(`${t('usersroles.toast.reset_link_prefix')} ${m.email}`); break;
      case 'resend': flash(`${t('usersroles.toast.invite_resent_prefix')} ${m.email}`); break;
      case 'reactivate':
        patch(m.email, { status: 'Actif', last: t('common.time.just_now') });
        flash(`${m.name} ${t('usersroles.toast.reactivated_suffix')}`);
        break;
      case 'deactivate':
        setConfirm({
          tone: 'warn', icon: I.userX, title: t('usersroles.confirm.deactivate_title'), serif: m.name.split(' ')[0],
          body: `${m.name} ${t('usersroles.confirm.deactivate_body_suffix')}`,
          confirmLabel: t('usersroles.confirm.deactivate_title'),
          run: () => { patch(m.email, { status: 'Inactif' }); flash(`${m.name} ${t('usersroles.toast.deactivated_suffix')}`); },
        });
        break;
      case 'delete':
        setConfirm({
          tone: 'danger', icon: I.trash, title: t('usersroles.confirm.delete_title'), serif: m.name.split(' ')[0],
          body: `${t('usersroles.confirm.delete_body_prefix')} ${m.name} ${t('usersroles.confirm.delete_body_suffix')}`,
          confirmLabel: t('usersroles.confirm.delete_confirm'),
          run: () => { setMembers((prev) => prev.filter((x) => x.email !== m.email)); flash(`${m.name} ${t('usersroles.toast.deleted_suffix')}`); },
        });
        break;
    }
  };

  const pending = members.filter((m) => m.status === 'Invitation').length;

  if (loading) return (
    <div className="admin-users" style={{ padding: '2rem', color: 'var(--muted)' }}>{t('common.loading')}</div>
  );

  return (
    <div className="admin-users">
      {/* En-tête */}
      <div className="head">
        <div className="head-l">
          <div className="eyb">{t('users.eyebrow')}</div>
          <h1 className="t1">{t('users.title.main')} <span className="serif">{t('users.title.serif')}</span></h1>
          <p className="sub">{members.length} {t('common.word.member')}{members.length > 1 ? 's' : ''} · 4 {t('usersroles.subtitle_roles_word')} · {pending} {t('common.word.invitation')}{pending > 1 ? 's' : ''} {t('common.pending_suffix')}</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setRolesOpen(true)}><I.shield size={14} /> {t('common.manage_roles')}</button>
          <button className="btn pri" onClick={() => setAddOpen(true)}><I.userPlus size={14} /> {t('common.add_member')}</button>
        </div>
      </div>

      {/* Cartes de rôles */}
      <div className="role-grid">
        {ROLES.map((r) => {
          const count = members.filter(m => m.role === r.name).length;
          return (
            <div key={r.name} className="role-card">
              <div className="role-name"><span className="role-dot" style={{ background: r.color }} />{r.name}</div>
              <div className="role-count">{count} <span style={{ fontSize: 13, color: 'var(--muted-2)', fontWeight: 400 }}>{t('common.word.member')}{count > 1 ? 's' : ''}</span></div>
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
                <th>{t('users.table.member')}</th><th>{t('users.table.role')}</th><th>{t('users.table.workspaces')}</th><th>{t('users.table.last_activity')}</th><th>{t('users.table.status')}</th><th />
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
          <span>{members.length} {t('common.word.member')}s · {pending} {t('common.word.invitation')}{pending > 1 ? 's' : ''} {t('common.pending_suffix')}</span>
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
      {rolesOpen && <RolesModal onClose={() => setRolesOpen(false)} onSave={(name) => { setRolesOpen(false); flash(`${t('usersroles.toast.role_perms_saved_prefix')} ${name} ${t('usersroles.toast.role_perms_saved_suffix')}`); }} />}
      {toast && <Toast msg={toast} />}
    </div>
  );
}
