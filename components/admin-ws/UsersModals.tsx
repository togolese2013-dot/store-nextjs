/**
 * Admin · Utilisateurs & rôles — modales + menu d'actions de ligne.
 *
 * Composants :
 *   AddMemberModal   — ajout OU édition (préremplie via `member`)
 *   RowMenu          — menu ⋮ contextuel (position fixe, ancrée au bouton)
 *   ConfirmModal     — confirmation générique (désactiver / supprimer)
 *   RoleChangeModal  — changement rapide de rôle
 *   RolesModal       — gestionnaire de permissions à deux panneaux
 *   Toast            — notification de confirmation
 */
import React, { useState } from 'react';
import { I } from './users-icons';
import {
  ROLES, WORKSPACES, ROLE_COLOR, PERM_GROUPS, DEFAULT_PERMS, getInitials,
} from './users-data';
import type { Member, RoleName, RowAction, PermMatrix } from './users-types';
import { useT } from '@/lib/i18n/use-admin-ws-lang';

/* ── ADD / EDIT MEMBER ──────────────────────────────── */
export function AddMemberModal({
  onClose, onAdd, member,
}: {
  onClose: () => void;
  onAdd: (m: Member) => void;
  member?: Member;
}) {
  const t = useT();
  const editing = !!member;
  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [role, setRole] = useState<RoleName>(member?.role || 'Vendeur');
  const [wss, setWss] = useState<string[]>(() => {
    if (!member) return ['Boutique'];
    if (member.workspaces === 'Tous') return WORKSPACES.map((w) => w.name);
    return member.workspaces.split(' · ').filter((x) => x && x !== 'Aucun');
  });
  const toggleWs = (n: string) =>
    setWss((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const init = getInitials(name || '');
  const color = ROLE_COLOR[role] || member?.color || '#8A8278';
  const ok = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  const submit = () => {
    if (!ok) return;
    onAdd({
      ...(member || ({} as Member)),
      name: name.trim(), init, color, email: email.trim(), phone: phone.trim(), role,
      workspaces: wss.length ? wss.join(' · ') : 'Aucun',
      last: editing ? member!.last : "À l'instant",
      status: editing ? member!.status : 'Actif',
    });
  };

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="md-head">
          <div className="md-head-ic"><I.userPlus size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="md-title">
              {editing ? <>{t('usersmodals.edit_title_main')} <span className="serif">{t('usersmodals.member_serif')}</span></>
                       : <>{t('usersmodals.add_title_main')} <span className="serif">{t('usersmodals.member_serif')}</span></>}
            </h2>
            <p className="md-sub">
              {editing ? t('usersmodals.edit_sub')
                       : t('usersmodals.add_sub')}
            </p>
          </div>
          <button className="md-x" onClick={onClose} aria-label={t('common.close')}><I.x size={18} /></button>
        </div>

        <div className="md-body">
          <div className="avp">
            <div className="avp-av" style={{ background: name.trim() ? color : 'var(--border-strong)' }}>{init}</div>
            <div style={{ minWidth: 0 }}>
              <div className="avp-n">{name.trim() || t('usersmodals.new_member_placeholder')}</div>
              <div className="avp-e">{email.trim() || 'adresse@email.com'} · {role}</div>
            </div>
          </div>

          <div className="fld-row">
            <div className="fld">
              <label className="lbl">{t('usersmodals.field.full_name')}</label>
              <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('usersmodals.field.full_name_placeholder')} autoFocus />
            </div>
            <div className="fld">
              <label className="lbl">{t('usersmodals.field.phone')}</label>
              <input className="inp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+228 90 00 00 00" />
            </div>
          </div>

          <div className="fld">
            <label className="lbl">{t('usersmodals.field.email')}</label>
            <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amadou@maisondiallo.tg" />
          </div>

          <div className="fld">
            <label className="lbl">{t('usersmodals.field.role')}</label>
            <div className="role-pick">
              {ROLES.map((r) => (
                <button key={r.name} type="button" className={`rp ${role === r.name ? 'on' : ''}`} onClick={() => setRole(r.name)}>
                  <span className="rp-dot" style={{ background: r.color }} />
                  <span><span className="rp-n">{r.name}</span><span className="rp-p">{r.perms}</span></span>
                </button>
              ))}
            </div>
          </div>

          <div className="fld">
            <label className="lbl">{t('usersmodals.field.workspaces_access')}</label>
            <div className="ws-pick">
              {WORKSPACES.map((w) => (
                <button key={w.id} type="button" className={`wsc ${wss.includes(w.name) ? 'on' : ''}`} onClick={() => toggleWs(w.name)}>
                  <span className="wd" style={{ background: w.tint }} />{w.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md-foot">
          <span className="left">{wss.length} workspace{wss.length > 1 ? 's' : ''} {wss.length > 1 ? t('usersmodals.selected_plural') : t('usersmodals.selected_singular')}</span>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn pri" disabled={!ok} onClick={submit} style={{ opacity: ok ? 1 : .5, cursor: ok ? 'pointer' : 'not-allowed' }}>
            <I.check size={14} /> {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ROW ACTIONS MENU ──────────────────────────────── */
export function RowMenu({
  member, onPick, anchor,
}: {
  member: Member;
  onPick: (a: RowAction) => void;
  anchor: DOMRect | null;
}) {
  const t = useT();
  const isOwner = member.role === 'Propriétaire';
  const isInvite = member.status === 'Invitation';
  const isInactive = member.status === 'Inactif';
  const W = 222;
  const pos: React.CSSProperties = anchor
    ? { top: Math.min(anchor.bottom + 6, window.innerHeight - 260), left: Math.max(8, anchor.right - W) }
    : { top: 0, left: 0 };

  return (
    <div className="amenu" style={pos} onClick={(e) => e.stopPropagation()}>
      <div className="ami-h">{t('usersmodals.menu.header')}</div>
      <button className="ami" onClick={() => onPick('edit')}><I.pencil size={15} /> {t('usersmodals.menu.edit_member')}</button>
      {!isOwner && <button className="ami" onClick={() => onPick('role')}><I.shield size={15} /> {t('usersmodals.menu.change_role')}</button>}
      {isInvite
        ? <button className="ami" onClick={() => onPick('resend')}><I.mail size={15} /> {t('usersmodals.menu.resend_invite')}</button>
        : <button className="ami" onClick={() => onPick('reset')}><I.key size={15} /> {t('usersmodals.menu.reset_password')}</button>}
      {!isOwner && (
        <>
          <div className="ami-sep" />
          {isInactive
            ? <button className="ami" onClick={() => onPick('reactivate')}><I.userCheck size={15} /> {t('usersmodals.menu.reactivate')}</button>
            : !isInvite && <button className="ami" onClick={() => onPick('deactivate')}><I.userX size={15} /> {t('usersmodals.menu.deactivate')}</button>}
          <button className="ami danger" onClick={() => onPick('delete')}><I.trash size={15} /> {t('usersmodals.menu.delete_member')}</button>
        </>
      )}
    </div>
  );
}

/* ── CONFIRM ────────────────────────────────────────── */
export interface ConfirmConfig {
  tone: 'danger' | 'warn';
  icon: (p: { size?: number }) => React.ReactElement;
  title: string;
  serif?: string;
  body: string;
  confirmLabel: string;
  run: () => void;
}

export function ConfirmModal({
  title, serif, body, confirmLabel, tone = 'danger', icon, onClose, onConfirm,
}: Omit<ConfirmConfig, 'run'> & { onClose: () => void; onConfirm: () => void }) {
  const t = useT();
  const Icon = icon || I.alert;
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 440 }} role="dialog" aria-modal="true">
        <div className="md-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className={`confirm-ic ${tone}`}><Icon size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="md-title">{title} {serif && <span className="serif">{serif}</span>}</h2>
          </div>
          <button className="md-x" onClick={onClose} aria-label={t('common.close')}><I.x size={18} /></button>
        </div>
        <div className="md-body" style={{ paddingTop: 14 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--muted)', margin: 0 }}>{body}</p>
        </div>
        <div className="md-foot">
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className={`btn ${tone === 'danger' ? 'danger' : 'pri'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ── QUICK ROLE CHANGE ──────────────────────────────── */
export function RoleChangeModal({
  member, onClose, onConfirm,
}: {
  member: Member;
  onClose: () => void;
  onConfirm: (role: RoleName) => void;
}) {
  const t = useT();
  const [role, setRole] = useState<RoleName>(member.role);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 460 }} role="dialog" aria-modal="true">
        <div className="md-head">
          <div className="md-head-ic"><I.shield size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="md-title">{t('usersmodals.role_change.title_main')} <span className="serif">{t('usersmodals.role_change.title_serif')}</span></h2>
            <p className="md-sub">{member.name} · {t('usersmodals.currently')} {member.role}</p>
          </div>
          <button className="md-x" onClick={onClose} aria-label={t('common.close')}><I.x size={18} /></button>
        </div>
        <div className="md-body">
          <div className="role-pick">
            {ROLES.map((r) => (
              <button key={r.name} type="button" className={`rp ${role === r.name ? 'on' : ''}`} onClick={() => setRole(r.name)}>
                <span className="rp-dot" style={{ background: r.color }} />
                <span><span className="rp-n">{r.name}</span><span className="rp-p">{r.perms}</span></span>
              </button>
            ))}
          </div>
        </div>
        <div className="md-foot">
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn pri" disabled={role === member.role} onClick={() => onConfirm(role)}
            style={{ opacity: role === member.role ? .5 : 1, cursor: role === member.role ? 'not-allowed' : 'pointer' }}>
            <I.check size={14} /> {t('common.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MANAGE ROLES ───────────────────────────────────── */
export function RolesModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (role: RoleName) => void;
}) {
  const t = useT();
  const [sel, setSel] = useState<RoleName>('Propriétaire');
  const [perms, setPerms] = useState<PermMatrix>(() => JSON.parse(JSON.stringify(DEFAULT_PERMS)));
  const role = ROLES.find((r) => r.name === sel)!;
  const locked = sel === 'Propriétaire';
  const toggle = (k: string) => {
    if (locked) return;
    setPerms((p) => ({ ...p, [sel]: { ...p[sel], [k]: p[sel][k] ? 0 : 1 } }));
  };
  const activeCount = Object.values(perms[sel]).filter(Boolean).length;

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal wide" role="dialog" aria-modal="true">
        <div className="md-head">
          <div className="md-head-ic"><I.shield size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="md-title">{t('usersmodals.roles.title_main')} <span className="serif">{t('usersmodals.roles.title_serif')}</span></h2>
            <p className="md-sub">{t('usersmodals.roles.sub')}</p>
          </div>
          <button className="md-x" onClick={onClose} aria-label={t('common.close')}><I.x size={18} /></button>
        </div>

        <div className="rm-body">
          <div className="rm-list">
            {ROLES.map((r) => (
              <button key={r.name} className={`rm-li ${sel === r.name ? 'on' : ''}`} onClick={() => setSel(r.name)}>
                <span className="rm-li-dot" style={{ background: r.color }} />
                <span style={{ minWidth: 0 }}>
                  <span className="rm-li-n">{r.name}</span>
                  <span className="rm-li-c">{Object.values(perms[r.name]).filter(Boolean).length} permissions</span>
                </span>
                <span className="cnt">{r.count}</span>
              </button>
            ))}
            <button className="rm-add"><I.plus size={13} /> {t('usersmodals.roles.new_role_btn')}</button>
          </div>

          <div className="rm-detail">
            <div className="rm-d-head">
              <div className="rm-d-ic" style={{ background: role.color }}><I.shield size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rm-d-n">{role.name}</div>
                <div className="rm-d-s">{role.count} {t('common.word.member')}{role.count > 1 ? 's' : ''} · {activeCount} permission{activeCount > 1 ? 's' : ''} {t('usersmodals.active_suffix')}</div>
              </div>
              {locked && <span className="rm-locked">{t('usersmodals.roles.locked_badge')}</span>}
            </div>

            {PERM_GROUPS.map((g) => (
              <div key={g.sec}>
                <div className="perm-sec">{g.sec}</div>
                <div className="perm-grp">
                  {g.items.map((it) => {
                    const on = !!perms[sel][it.k];
                    return (
                      <div key={it.k} className="perm">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="perm-t">{it.t}</div>
                          <div className="perm-d">{it.d}</div>
                        </div>
                        <div onClick={() => toggle(it.k)} className="tog sm2"
                          style={{ background: on ? role.color : 'var(--border-strong)', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? .55 : 1 }}>
                          <div className="knob" style={{ left: on ? 19 : 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md-foot">
          <span className="left">{t('usersmodals.roles.footer_note')}</span>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn pri" onClick={() => onSave(sel)}><I.check size={14} /> {t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}

/* ── TOAST ──────────────────────────────────────────── */
export function Toast({ msg }: { msg: string }) {
  return <div className="toast"><span className="tk"><I.check size={11} /></span>{msg}</div>;
}
