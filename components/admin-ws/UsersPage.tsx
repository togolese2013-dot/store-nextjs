/**
 * UsersPage — team members & roles
 * Mount via AdminWsShell (page id: 'users') or standalone.
 */
import React from 'react';
import type { Member, Role } from './types';
import { SAMPLE_MEMBERS, SAMPLE_ROLES, ROLE_STYLE } from './sample-data';
import { ShieldIcon, PlusIcon, MoreIcon } from './icons';
import styles from './Admin.module.css';

export interface UsersPageProps {
  members?: Member[];
  roles?: Role[];
  onInvite?: () => void;
}

export default function UsersPage({ members = SAMPLE_MEMBERS, roles = SAMPLE_ROLES, onInvite }: UsersPageProps) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Admin · Équipe</div>
          <h1 className={styles.title}>Utilisateurs &amp; <span className={styles.serif}>rôles</span></h1>
          <p className={styles.subtitle}>6 membres · 4 rôles · 1 invitation en attente</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><ShieldIcon size={14} /> Gérer les rôles</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onInvite}>
            <PlusIcon size={14} /> Inviter un membre
          </button>
        </div>
      </div>

      {/* Role cards */}
      <div className={styles.roleGrid}>
        {roles.map(r => (
          <div key={r.name} className={styles.roleCard}>
            <div className={styles.roleName}><span className={styles.roleDot} style={{ background: r.color }} />{r.name}</div>
            <div className={styles.roleCount}>{r.count} <span style={{ fontSize: 13, color: 'var(--muted-2)', fontWeight: 400 }}>membre{r.count > 1 ? 's' : ''}</span></div>
            <div className={styles.rolePerms}>{r.perms}</div>
          </div>
        ))}
      </div>

      {/* Members table */}
      <div className={styles.tableWrap} style={{ marginTop: 24 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rôle</th>
                <th>Workspaces</th>
                <th>Dernière activité</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const statusClass = m.status === 'Actif' ? styles.actif : m.status === 'Invitation' ? styles.attente : styles.inactif;
                return (
                  <tr key={m.email}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 99, background: m.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.init}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.tag} style={ROLE_STYLE[m.role]}>{m.role}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>{m.workspaces}</td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>{m.last}</td>
                    <td><span className={`${styles.status} ${statusClass}`}><span className={styles.d} />{m.status}</span></td>
                    <td className={styles.actionsCell}><button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>6 membres · 1 invitation en attente</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
