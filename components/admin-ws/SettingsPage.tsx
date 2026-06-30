'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────
type NotifCanal = 'Email' | 'WhatsApp' | 'SMS';
type Langue = 'Français' | 'English';
type FormatDate = 'JJ/MM/AAAA' | 'MM/JJ/AAAA' | 'AAAA-MM-JJ';

interface S {
  nom_ent: string; secteur: string; taille: string;
  adresse: string; tel: string; email_ent: string; site: string;
  two_fa: boolean; pin_admin: string; pin_visible: boolean; session_timeout: string;
  notif_anomalie: boolean; notif_paiement: boolean; notif_rapport_hebdo: boolean;
  notif_rapport_mensuel: boolean; notif_alerte_secu: boolean; notif_canal: NotifCanal;
  langue: Langue; fuseau: string; format_date: FormatDate;
}

const INIT: S = {
  nom_ent: '', secteur: 'Commerce & Distribution', taille: '2–10 employés',
  adresse: '', tel: '', email_ent: '', site: '',
  two_fa: false, pin_admin: '', pin_visible: false, session_timeout: '8 heures',
  notif_anomalie: true, notif_paiement: true, notif_rapport_hebdo: true,
  notif_rapport_mensuel: true, notif_alerte_secu: true, notif_canal: 'Email',
  langue: 'Français', fuseau: 'Africa/Abidjan', format_date: 'JJ/MM/AAAA',
};

const NAV = [
  { id: 'profil',        label: 'Profil entreprise' },
  { id: 'abonnement',    label: 'Abonnement' },
  { id: 'facturation',   label: 'Facturation' },
  { id: 'securite',      label: 'Sécurité' },
  { id: 'sessions',      label: 'Sessions actives' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'preferences',   label: 'Préférences' },
  { id: 'donnees',       label: 'Données & export' },
  { id: 'danger',        label: 'Zone danger', danger: true },
];

const DANGER_ACTIONS = [
  { label: 'Réinitialiser les données de démonstration', desc: "Remet les données d'exemple de tous les workspaces à leur état initial.", btn: 'Réinitialiser', isDanger: false },
  { label: "Suspendre l'organisation", desc: 'Tous les workspaces seront mis en pause. Les données sont conservées.', btn: 'Suspendre', isDanger: false },
  { label: 'Supprimer définitivement le compte', desc: "Suppression irréversible de l'organisation, tous workspaces et données inclus.", btn: 'Supprimer', isDanger: true },
];

// ── Primitives UI ──────────────────────────────────────────────────

function SCard({ id, icon, iconVariant = 'default', title, sub, children, onSave, dangerZone }: {
  id: string; icon: React.ReactNode; iconVariant?: string;
  title: string; sub?: string; children: React.ReactNode;
  onSave?: () => void; dangerZone?: boolean;
}) {
  const iconBg: Record<string, string> = {
    default: 'var(--accent-bg)', ok: 'var(--ok-bg)', blue: 'var(--blue-bg)',
    purple: 'var(--purple-bg)', warn: 'var(--warn-bg)', danger: 'var(--danger-bg)',
  };
  const iconColor: Record<string, string> = {
    default: 'var(--accent)', ok: 'var(--ok)', blue: 'var(--blue)',
    purple: 'var(--purple)', warn: 'var(--warn)', danger: 'var(--danger)',
  };
  const variant = dangerZone ? 'danger' : iconVariant;
  return (
    <div id={`ss-${id}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', flexShrink: 0, background: iconBg[variant] ?? iconBg.default, color: iconColor[variant] ?? iconColor.default }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.015em', lineHeight: 1.2 }}>{title}</div>
          {sub && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
      {onSave && (
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="primary" onClick={onSave}>Enregistrer</Btn>
        </div>
      )}
    </div>
  );
}

function Fld({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>{label}</label>}
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 1, lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 14 }}>{children}</div>;
}

function In({ value, onChange, placeholder, mono, type = 'text', style }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  mono?: boolean; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 9,
        background: 'var(--surface)', fontSize: 13, color: 'var(--ink)',
        fontFamily: mono ? '"Geist Mono", monospace' : 'inherit',
        transition: 'border-color .15s, box-shadow .15s', outline: 'none', ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}

function Sel({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '9px 30px 9px 11px', border: '1px solid var(--border)', borderRadius: 9, background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', fontSize: 12 }}>▾</span>
    </div>
  );
}

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: 'flex', padding: 3, gap: 2, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)} style={{
          flex: 1, padding: '6px 10px', fontSize: 12.5, fontWeight: 500, borderRadius: 6,
          whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background .15s, color .15s',
          background: value === o ? 'var(--surface)' : 'transparent',
          color: value === o ? 'var(--ink)' : 'var(--muted)',
          boxShadow: value === o ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
        }}>{o}</button>
      ))}
    </div>
  );
}

function Tog({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 38, height: 22, borderRadius: 999, flexShrink: 0,
      background: on ? 'var(--accent)' : 'var(--border-strong)',
      position: 'relative', transition: 'background .2s', border: 'none', cursor: 'pointer',
    }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 18 : 3, width: 16, height: 16, borderRadius: 999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </button>
  );
}

function TRow({ label, desc, on, onChange, children, last }: {
  label: string; desc?: string; on?: boolean; onChange?: (v: boolean) => void;
  children?: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
        {children && <div style={{ marginTop: 10 }}>{children}</div>}
      </div>
      {on !== undefined && onChange && <Tog on={on} onChange={onChange} />}
    </div>
  );
}

function Btn({ variant = 'default', onClick, children, style, disabled }: {
  variant?: 'default' | 'primary' | 'sm' | 'ghost-ok' | 'ghost-danger';
  onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties; disabled?: boolean;
}) {
  const v: Record<string, React.CSSProperties> = {
    default:       { background: 'var(--surface)', color: 'var(--ink)',    border: '1px solid var(--border)',          padding: '9px 14px', fontSize: 13 },
    primary:       { background: 'var(--accent)',  color: '#fff',           border: '1px solid var(--accent)',          padding: '9px 14px', fontSize: 13 },
    sm:            { background: 'var(--surface)', color: 'var(--ink)',    border: '1px solid var(--border)',          padding: '5px 10px', fontSize: 12 },
    'ghost-ok':    { background: 'var(--surface)', color: 'var(--ok)',     border: '1px solid var(--ok-bg)',           padding: '5px 10px', fontSize: 12 },
    'ghost-danger':{ background: 'var(--surface)', color: 'var(--danger)', border: '1px solid rgba(156,58,20,.2)',     padding: '9px 14px', fontSize: 13 },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 9,
      fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background .15s', opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap', fontFamily: 'inherit', ...v[variant], ...style,
    }}>{children}</button>
  );
}

function Tag({ children, color, bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: bg ?? 'rgba(20,17,14,.06)', color: color ?? 'var(--ink-2)' }}>
      {children}
    </span>
  );
}

// ── Sections ───────────────────────────────────────────────────────

function ProfilSection({ s, u, onSave }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void }) {
  return (
    <SCard id="profil" icon="🏢" title="Profil de l'entreprise" sub="Informations légales et coordonnées de votre organisation." onSave={onSave}>
      <Row2>
        <Fld label="Nom de l'entreprise"><In value={s.nom_ent} onChange={v => u('nom_ent', v)} placeholder="Maison Diallo" /></Fld>
        <Fld label="Email principal"><In value={s.email_ent} onChange={v => u('email_ent', v)} placeholder="contact@entreprise.tg" type="email" /></Fld>
      </Row2>
      <Row2>
        <Fld label="Secteur d'activité">
          <Sel value={s.secteur} onChange={v => u('secteur', v)} options={['Commerce & Distribution', 'Mode & Artisanat', 'Restauration', 'Services', 'Technologie', 'Agriculture', 'Autre']} />
        </Fld>
        <Fld label="Taille de l'équipe">
          <Sel value={s.taille} onChange={v => u('taille', v)} options={['1 employé', '2–10 employés', '11–50 employés', '51–200 employés', '200+ employés']} />
        </Fld>
      </Row2>
      <Row2>
        <Fld label="Adresse physique"><In value={s.adresse} onChange={v => u('adresse', v)} placeholder="Lomé, Togo" /></Fld>
        <Fld label="Téléphone"><In value={s.tel} onChange={v => u('tel', v)} placeholder="+228 90 00 00 00" mono /></Fld>
      </Row2>
      <Fld label="Site web" hint="Optionnel — affiché sur les rapports et communications">
        <div style={{ display: 'flex' }}>
          <span style={{ padding: '9px 10px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '9px 0 0 9px', fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>https://</span>
          <In value={s.site} onChange={v => u('site', v)} placeholder="maisondiallo.tg" style={{ borderRadius: '0 9px 9px 0' }} />
        </div>
      </Fld>
      <Fld label="Logo de l'organisation" hint="PNG ou SVG · fond transparent recommandé · 2 Mo max">
        <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, color: 'var(--muted)', background: 'var(--bg-2)', textAlign: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: 20 }}>↓</span>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>Glissez une image ou cliquez pour importer</div>
        </div>
      </Fld>
    </SCard>
  );
}

function AbonnementSection({ toast }: { toast: (m: string) => void }) {
  const limits = [
    { label: 'Workspaces actifs',   val: '3',      max: '5'     },
    { label: "Membres de l'équipe", val: '6',      max: '20'    },
    { label: 'Volume de ventes',    val: '48 200', max: '∞'     },
    { label: 'Stockage données',    val: '2,4 Go', max: '10 Go' },
  ];
  return (
    <SCard id="abonnement" icon="🧾" iconVariant="ok" title="Abonnement" sub="Votre plan actuel, limites d'utilisation et renouvellement.">
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface) 100%)' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--ink)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 20 }}>🧾</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.02em' }}>Business</span>
            <Tag color="var(--ok)" bg="var(--ok-bg)">Actif</Tag>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            Renouvellement le <strong style={{ color: 'var(--ink)' }}>15 juillet 2026</strong> · 45 000 FCFA / mois
          </div>
        </div>
        <Btn variant="sm" onClick={() => toast('Changement de plan')}>Changer</Btn>
      </div>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {limits.map((it, i) => (
          <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < limits.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{it.label}</div>
              <div style={{ marginTop: 5, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', maxWidth: 220 }}>
                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 'inherit', width: it.max === '∞' ? '30%' : `${(parseInt(it.val) / parseInt(it.max)) * 100}%` }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12.5, fontWeight: 500 }}>{it.val}</span>
              {it.max !== '∞' && <span style={{ fontSize: 11.5, color: 'var(--muted-2)' }}> / {it.max}</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={() => toast('Mise à niveau vers Enterprise')}>Passer à Enterprise</Btn>
        <Btn onClick={() => toast("Annulation d'abonnement")}>Annuler l'abonnement</Btn>
      </div>
    </SCard>
  );
}

function FacturationSection({ toast }: { toast: (m: string) => void }) {
  const invoices = [
    { date: '01 juin 2026',  ref: 'INV-2026-06', montant: '45 000 FCFA' },
    { date: '01 mai 2026',   ref: 'INV-2026-05', montant: '45 000 FCFA' },
    { date: '01 avr. 2026',  ref: 'INV-2026-04', montant: '45 000 FCFA' },
    { date: '01 mars 2026',  ref: 'INV-2026-03', montant: '38 000 FCFA' },
  ];
  return (
    <SCard id="facturation" icon="💳" iconVariant="blue" title="Facturation" sub="Méthode de paiement et historique des factures.">
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 26, borderRadius: 6, background: 'var(--ink)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'white', fontSize: 14 }}>💳</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Wave Business · •••• 4521</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Expire 12/2027 · méthode principale</div>
        </div>
        <Tag color="var(--ok)" bg="var(--ok-bg)">Active</Tag>
        <Btn variant="sm" onClick={() => toast('Modification du moyen de paiement')}>Modifier</Btn>
      </div>
      <Btn onClick={() => toast("Ajout d'un moyen de paiement")} style={{ alignSelf: 'flex-start' }}>+ Ajouter un moyen de paiement</Btn>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>Factures récentes</div>
        {invoices.map(inv => (
          <div key={inv.ref} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--muted)' }}>🧾</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{inv.ref}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 1 }}>{inv.date}</div>
            </div>
            <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12.5, fontWeight: 500 }}>{inv.montant}</span>
            <Tag color="var(--ok)" bg="var(--ok-bg)">Payé</Tag>
            <Btn variant="sm" onClick={() => toast(`Téléchargement ${inv.ref}`)}>↓</Btn>
          </div>
        ))}
      </div>
    </SCard>
  );
}

function SecuriteSection({ s, u, onSave, toast }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; toast: (m: string) => void }) {
  return (
    <SCard id="securite" icon="🛡" title="Sécurité & authentification" sub="Protégez l'accès à votre compte avec une double vérification." onSave={onSave}>
      <TRow label="Authentification à deux facteurs (2FA)" desc="Un code temporaire sera demandé à chaque connexion, en plus du mot de passe." on={s.two_fa} onChange={v => u('two_fa', v)}>
        {s.two_fa && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="ghost-ok" onClick={() => toast("Configuration de l'app authenticator")}>📱 Configurer l'app authenticator</Btn>
            <Btn variant="sm" onClick={() => toast('Codes de secours')}>Codes de secours</Btn>
          </div>
        )}
      </TRow>
      <Fld label="Code PIN administrateur" hint="Requis pour les actions sensibles : suppression, export de données, modifications critiques.">
        <div style={{ display: 'flex', gap: 8, maxWidth: 320 }}>
          <In value={s.pin_admin} onChange={v => u('pin_admin', v)} placeholder="••••••" type={s.pin_visible ? 'text' : 'password'} mono style={{ letterSpacing: '0.2em' }} />
          <Btn variant="sm" onClick={() => u('pin_visible', !s.pin_visible as unknown as boolean)}>
            {s.pin_visible ? 'Masquer' : 'Afficher'}
          </Btn>
        </div>
      </Fld>
      <Fld label="Délai d'expiration de session" hint="L'utilisateur sera automatiquement déconnecté après cette durée d'inactivité.">
        <Sel value={s.session_timeout} onChange={v => u('session_timeout', v)} options={['30 minutes', '1 heure', '2 heures', '4 heures', '8 heures', '24 heures', 'Jamais']} />
      </Fld>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--muted)', flexShrink: 0 }}>🔑</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Mot de passe du compte</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Modifié il y a 45 jours</div>
        </div>
        <Btn variant="sm" onClick={() => toast('Email de réinitialisation envoyé')}>🔑 Modifier</Btn>
      </div>
    </SCard>
  );
}

function SessionsSection({ toast }: { toast: (m: string) => void }) {
  const sessions = [
    { label: 'MacBook Pro · Chrome',   sub: "Lomé, Togo · À l'instant",         mobile: false, current: true  },
    { label: 'iPhone 15 Pro · Safari', sub: 'Lomé, Togo · il y a 2h',            mobile: true,  current: false },
    { label: 'MacBook Air · Firefox',  sub: 'Accra, Ghana · il y a 3 jours',     mobile: false, current: false },
  ];
  return (
    <SCard id="sessions" icon="🖥" iconVariant="blue" title="Sessions actives" sub="Appareils et navigateurs actuellement connectés à votre compte.">
      {sessions.map((sess, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--muted)', fontSize: 18 }}>
            {sess.mobile ? '📱' : '🖥'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{sess.label}</span>
              {sess.current && <Tag color="var(--ok)" bg="var(--ok-bg)">Session actuelle</Tag>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{sess.sub}</div>
          </div>
          {!sess.current && <Btn variant="ghost-danger" onClick={() => toast('Session révoquée')}>Révoquer</Btn>}
        </div>
      ))}
      <Btn variant="ghost-danger" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Toutes les autres sessions révoquées')}>
        ↩ Révoquer toutes les autres sessions
      </Btn>
    </SCard>
  );
}

function NotificationsSection({ s, u, onSave }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void }) {
  return (
    <SCard id="notifications" icon="🔔" title="Notifications" sub="Alertes système, rapports automatiques et communications de sécurité." onSave={onSave}>
      <TRow label="Alertes d'anomalie critique" desc="Erreur système, paiement échoué, dépassement de seuil sur un workspace" on={s.notif_anomalie} onChange={v => u('notif_anomalie', v)} />
      <TRow label="Confirmation de paiement" desc="Notification à chaque renouvellement ou changement de plan" on={s.notif_paiement} onChange={v => u('notif_paiement', v)} />
      <TRow label="Rapport hebdomadaire consolidé" desc="Synthèse CA, équipe et performances tous workspaces — envoyé le lundi" on={s.notif_rapport_hebdo} onChange={v => u('notif_rapport_hebdo', v)} />
      <TRow label="Rapport mensuel" desc="Bilan complet du mois avec export PDF joint" on={s.notif_rapport_mensuel} onChange={v => u('notif_rapport_mensuel', v)} />
      <TRow label="Alertes de sécurité" desc="Nouvelle connexion depuis un appareil inconnu, tentatives d'accès suspectes" on={s.notif_alerte_secu} onChange={v => u('notif_alerte_secu', v)} last />
      <Fld label="Canal principal">
        <Seg value={s.notif_canal} onChange={v => u('notif_canal', v as NotifCanal)} options={['Email', 'WhatsApp', 'SMS']} />
      </Fld>
      <Fld label="Email de réception des notifications" hint="Par défaut : l'adresse principale du compte">
        <In value={s.email_ent} onChange={v => u('email_ent', v)} placeholder="admin@entreprise.tg" type="email" />
      </Fld>
    </SCard>
  );
}

function PreferencesSection({ s, u, onSave }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void }) {
  const datePreview = s.format_date === 'JJ/MM/AAAA' ? '29/06/2026' : s.format_date === 'MM/JJ/AAAA' ? '06/29/2026' : '2026-06-29';
  return (
    <SCard id="preferences" icon="🌐" title="Préférences" sub="Langue de l'interface, fuseau horaire et formats d'affichage." onSave={onSave}>
      <Row2>
        <Fld label="Langue de l'interface">
          <Seg value={s.langue} onChange={v => u('langue', v as Langue)} options={['Français', 'English']} />
        </Fld>
        <Fld label="Fuseau horaire">
          <Sel value={s.fuseau} onChange={v => u('fuseau', v)} options={['Africa/Abidjan', 'Africa/Accra', 'Africa/Lagos', 'Africa/Dakar', 'Africa/Nairobi', 'Europe/Paris', 'America/New_York']} />
        </Fld>
      </Row2>
      <Fld label="Format de date">
        <Seg value={s.format_date} onChange={v => u('format_date', v as FormatDate)} options={['JJ/MM/AAAA', 'MM/JJ/AAAA', 'AAAA-MM-JJ']} />
      </Fld>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Aperçu</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>UTC+0 (Lomé, Togo)</div>
        </div>
        <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{datePreview}</span>
      </div>
    </SCard>
  );
}

function DonneesSection({ toast }: { toast: (m: string) => void }) {
  const actions = [
    { label: 'Exporter toutes les données',     desc: "Archive ZIP incluant ventes, clients, stocks et journaux d'activité.",   btn: 'Exporter' },
    { label: 'Exporter les données comptables', desc: 'Fichier CSV/Excel compatible avec les outils comptables.',                btn: 'Exporter' },
    { label: 'Rapport de conformité RGPD',      desc: 'Liste des données personnelles détenues et politique de traitement.',    btn: 'Générer'  },
  ];
  return (
    <SCard id="donnees" icon="🗄" iconVariant="purple" title="Données & confidentialité" sub="Export de vos données, conformité et politique de rétention.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actions.map(it => (
          <div key={it.label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: 16, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>
            </div>
            <Btn style={{ flexShrink: 0 }} onClick={() => toast(it.btn + ' en cours…')}>↓ {it.btn}</Btn>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>Rétention des données</div>
        <Fld label="Durée de conservation des journaux d'activité" hint="Au-delà de cette période, les logs anciens sont archivés.">
          <Sel value="12 mois" onChange={() => {}} options={['3 mois', '6 mois', '12 mois', '24 mois', 'Indéfinie']} />
        </Fld>
      </div>
    </SCard>
  );
}

function DangerSection({ toast, onConfirm }: {
  toast: (m: string) => void;
  onConfirm: (a: typeof DANGER_ACTIONS[number]) => void;
}) {
  return (
    <SCard id="danger" icon="⚠️" title="Zone danger" sub="Actions irréversibles — réservées au propriétaire du compte." dangerZone>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DANGER_ACTIONS.map(it => (
          <div key={it.label} style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
            padding: 16, borderRadius: 12,
            background: it.isDanger ? 'var(--danger-bg)' : 'var(--bg-2)',
            border: `1px solid ${it.isDanger ? 'rgba(156,58,20,.2)' : 'var(--border)'}`,
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: it.isDanger ? 'var(--danger)' : 'var(--ink)' }}>{it.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>
            </div>
            <Btn variant={it.isDanger ? 'ghost-danger' : 'default'} style={{ flexShrink: 0 }} onClick={() => onConfirm(it)}>
              {it.btn}
            </Btn>
          </div>
        ))}
      </div>
    </SCard>
  );
}

// ── Confirm modal ──────────────────────────────────────────────────

function ConfirmModal({ action, onClose, onConfirm }: {
  action: typeof DANGER_ACTIONS[number];
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(20,17,14,.32)', backdropFilter: 'saturate(120%) blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 440, maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 70px -18px rgba(20,17,14,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '22px 24px 16px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: action.isDanger ? 'var(--danger-bg)' : 'var(--warn-bg)', color: action.isDanger ? 'var(--danger)' : 'var(--warn)', display: 'grid', placeItems: 'center', fontSize: 20 }}>
            {action.isDanger ? '⚠️' : '⚡'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.02em', margin: 0 }}>{action.label}</h2>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--muted)', border: 'none', cursor: 'pointer', background: 'transparent', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: '0 24px 20px' }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--muted)', margin: 0 }}>{action.desc}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <button type="button" onClick={onConfirm} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, border: `1px solid ${action.isDanger ? 'var(--danger)' : 'var(--warn)'}`, background: action.isDanger ? 'var(--danger)' : 'var(--warn)', cursor: 'pointer', color: 'white', fontFamily: 'inherit' }}>
            {action.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 300, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 11, fontSize: 13, fontWeight: 500, boxShadow: '0 12px 34px -10px rgba(20,17,14,.5)', animation: 'toast-in .24s cubic-bezier(.2,.8,.2,1)', whiteSpace: 'nowrap' }}>
      <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--ok)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11 }}>✓</span>
      {message}
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ── Settings Nav ───────────────────────────────────────────────────

function SettingsNav({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  return (
    <div>
      {NAV.map((sec, i) => {
        const isSep = i === NAV.length - 1;
        return (
          <React.Fragment key={sec.id}>
            {isSep && <div style={{ height: 1, background: 'var(--border)', margin: '8px 2px' }} />}
            <button type="button" onClick={() => onNav(sec.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 9,
              fontSize: 13, color: sec.danger ? 'var(--danger)' : (active === sec.id ? 'var(--ink)' : 'var(--ink-2)'),
              fontWeight: active === sec.id ? 500 : 400,
              background: active === sec.id ? 'var(--surface)' : 'transparent',
              border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              boxShadow: active === sec.id ? '0 1px 3px rgba(20,17,14,.06)' : 'none',
              marginBottom: 1, transition: 'background .15s', fontFamily: 'inherit',
            }}>
              {sec.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────

export default function SettingsPage() {
  const [s, setS] = useState<S>(INIT);
  const [active, setActive] = useState('profil');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<typeof DANGER_ACTIONS[number] | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const u = useCallback(<K extends keyof S>(k: K, v: S[K]) => {
    setS(prev => ({ ...prev, [k]: v }));
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings/shop-profile', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/settings', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
    ]).then(([profile, cfg]) => {
      setS(prev => ({
        ...prev,
        nom_ent:   profile.nom       || prev.nom_ent,
        email_ent: profile.email     || prev.email_ent,
        tel:       profile.telephone || prev.tel,
        adresse:   profile.adresse   || prev.adresse,
        secteur:   cfg.shop_secteur      || prev.secteur,
        taille:    cfg.shop_taille       || prev.taille,
        site:      cfg.shop_site         || prev.site,
        two_fa:    cfg.security_2fa === 'true',
        pin_admin: cfg.security_pin_admin || prev.pin_admin,
        session_timeout: cfg.security_session_timeout || prev.session_timeout,
        notif_anomalie:       cfg.notif_anomalie       !== 'false',
        notif_paiement:       cfg.notif_paiement       !== 'false',
        notif_rapport_hebdo:  cfg.notif_rapport_hebdo  !== 'false',
        notif_rapport_mensuel:cfg.notif_rapport_mensuel!== 'false',
        notif_alerte_secu:    cfg.notif_alerte_secu    !== 'false',
        notif_canal:  (cfg.notif_canal as NotifCanal)     || prev.notif_canal,
        langue:       (cfg.pref_langue as Langue)         || prev.langue,
        fuseau:       cfg.pref_fuseau      || prev.fuseau,
        format_date:  (cfg.pref_format_date as FormatDate)|| prev.format_date,
      }));
    });
  }, []);

  const post = (body: Record<string, string>) =>
    fetch('/api/admin/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const saveProfil = async () => {
    await Promise.all([
      fetch('/api/admin/settings/shop-profile', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: s.nom_ent, email: s.email_ent, telephone: s.tel, adresse: s.adresse }),
      }),
      post({ shop_secteur: s.secteur, shop_taille: s.taille, shop_site: s.site }),
    ]);
    flash('Profil enregistré');
  };

  const saveSecurite = async () => {
    await post({ security_2fa: String(s.two_fa), security_pin_admin: s.pin_admin, security_session_timeout: s.session_timeout });
    flash('Paramètres de sécurité enregistrés');
  };

  const saveNotifs = async () => {
    await post({
      notif_anomalie: String(s.notif_anomalie), notif_paiement: String(s.notif_paiement),
      notif_rapport_hebdo: String(s.notif_rapport_hebdo), notif_rapport_mensuel: String(s.notif_rapport_mensuel),
      notif_alerte_secu: String(s.notif_alerte_secu), notif_canal: s.notif_canal,
    });
    flash('Notifications enregistrées');
  };

  const savePreferences = async () => {
    await post({ pref_langue: s.langue, pref_fuseau: s.fuseau, pref_format_date: s.format_date });
    flash('Préférences enregistrées');
  };

  const onNav = (id: string) => {
    setActive(id);
    const el = document.getElementById(`ss-${id}`);
    const c = contentRef.current;
    if (el && c) c.scrollTop = el.offsetTop - 24;
  };

  useEffect(() => {
    const c = contentRef.current;
    if (!c) return;
    const handler = () => {
      for (const sec of [...NAV].reverse()) {
        const el = document.getElementById(`ss-${sec.id}`);
        if (el && el.offsetTop <= c.scrollTop + 120) { setActive(sec.id); break; }
      }
    };
    c.addEventListener('scroll', handler, { passive: true });
    return () => c.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '196px 1fr', overflow: 'hidden' }}>
      {/* Left settings nav */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-2)', overflowY: 'auto', padding: '16px 10px' }}>
        <SettingsNav active={active} onNav={onNav} />
      </div>

      {/* Content */}
      <div ref={contentRef} style={{ overflowY: 'auto', padding: '28px 32px 60px' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 500, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)', display: 'inline-block' }} />
            Admin · Paramètres
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1.05, margin: '0 0 24px' }}>
            Paramètres <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>compte</span>
          </h1>

          <ProfilSection        s={s} u={u} onSave={saveProfil} />
          <AbonnementSection    toast={flash} />
          <FacturationSection   toast={flash} />
          <SecuriteSection      s={s} u={u} onSave={saveSecurite} toast={flash} />
          <SessionsSection      toast={flash} />
          <NotificationsSection s={s} u={u} onSave={saveNotifs} />
          <PreferencesSection   s={s} u={u} onSave={savePreferences} />
          <DonneesSection      toast={flash} />
          <DangerSection       toast={flash} onConfirm={a => setConfirmAction(a)} />
        </div>
      </div>

      {toast && <Toast message={toast} />}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => { flash(confirmAction.btn + ' effectué'); setConfirmAction(null); }}
        />
      )}
    </div>
  );
}
