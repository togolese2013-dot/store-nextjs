'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Admin.module.css';

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

// ── Primitives UI (mêmes classes que Store · Réglages boutique) ────

function Section({ id, title, desc, children, onSave, saving }: {
  id: string; title: string; desc?: string; children: React.ReactNode;
  onSave?: () => void; saving?: boolean;
}) {
  return (
    <div id={`ss-${id}`} className={styles.settingsSection}>
      <div className={styles.settingsSectionHead}>
        <div className={styles.settingsSectionTitle}>{title}</div>
        {desc && <div className={styles.settingsSectionDesc}>{desc}</div>}
      </div>
      <div className={styles.settingsCard}>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        {onSave && (
          <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className={styles.settingsRow}>
      <div className={styles.settingsRowLabel}>
        <div className={styles.settingsRowLabelText}>{label}</div>
        {hint && <div className={styles.settingsRowLabelHint}>{hint}</div>}
      </div>
      <div className={styles.settingsRowControl}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, on, onChange, children }: {
  label: string; desc?: string; on: boolean; onChange: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <div className={styles.settingsRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: children ? 12 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div className={styles.settingsRowLabel}>
          <div className={styles.settingsRowLabelText}>{label}</div>
          {desc && <div className={styles.settingsRowLabelHint}>{desc}</div>}
        </div>
        <Toggle on={on} onChange={onChange} />
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={styles.toggle}
      style={{ background: on ? 'var(--accent)' : 'var(--border-strong)' }}
    >
      <span className={styles.toggleKnob} style={{ left: on ? 19 : 3 }} />
    </button>
  );
}

function In({ value, onChange, placeholder, mono, type = 'text', style }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  mono?: boolean; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      className={styles.settingsInput}
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ fontFamily: mono ? '"Geist Mono", monospace' : undefined, ...style }}
    />
  );
}

function Sel({ value, onChange, options, style }: {
  value: string; onChange: (v: string) => void; options: string[]; style?: React.CSSProperties;
}) {
  return (
    <select className={styles.settingsSelect} value={value} onChange={e => onChange(e.target.value)} style={style}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className={styles.seg}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)} className={`${styles.segBtn} ${value === o ? styles.on : ''}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Btn({ variant = 'default', onClick, children, style, disabled }: {
  variant?: 'default' | 'primary' | 'sm' | 'danger' | 'ghost-ok';
  onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties; disabled?: boolean;
}) {
  const cls = [
    styles.btn,
    variant === 'primary' ? styles.primary : '',
    variant === 'sm' ? styles.sm : '',
    variant === 'danger' ? styles.danger : '',
  ].filter(Boolean).join(' ');
  const ghostOk: React.CSSProperties = variant === 'ghost-ok'
    ? { color: 'var(--ok)', borderColor: 'var(--ok-bg)' } : {};
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...ghostOk, ...style }}>
      {children}
    </button>
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

function ProfilSection({ s, u, onSave, saving }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; saving: boolean }) {
  return (
    <Section id="profil" title="Profil de l'entreprise" desc="Informations légales et coordonnées de votre organisation." onSave={onSave} saving={saving}>
      <Field label="Nom de l'entreprise"><In value={s.nom_ent} onChange={v => u('nom_ent', v)} placeholder="Maison Diallo" /></Field>
      <Field label="Email principal"><In value={s.email_ent} onChange={v => u('email_ent', v)} placeholder="contact@entreprise.tg" type="email" /></Field>
      <Field label="Secteur d'activité">
        <Sel value={s.secteur} onChange={v => u('secteur', v)} options={['Commerce & Distribution', 'Mode & Artisanat', 'Restauration', 'Services', 'Technologie', 'Agriculture', 'Autre']} />
      </Field>
      <Field label="Taille de l'équipe">
        <Sel value={s.taille} onChange={v => u('taille', v)} options={['1 employé', '2–10 employés', '11–50 employés', '51–200 employés', '200+ employés']} />
      </Field>
      <Field label="Adresse physique"><In value={s.adresse} onChange={v => u('adresse', v)} placeholder="Lomé, Togo" /></Field>
      <Field label="Téléphone"><In value={s.tel} onChange={v => u('tel', v)} placeholder="+228 90 00 00 00" mono /></Field>
      <Field label="Site web" hint="Optionnel — affiché sur les rapports et communications">
        <In value={s.site} onChange={v => u('site', v)} placeholder="maisondiallo.tg" />
      </Field>
    </Section>
  );
}

interface SubData {
  plan: string; planLabel: string; status: string; statusLabel: string;
  prix_mensuel: number; renewal_date: string | null;
  limits: { max_users: number; max_entrepots: number };
  usage: { membres: number; workspaces: number };
}

function AbonnementSection({ toast, sub }: { toast: (m: string) => void; sub: SubData | null }) {
  const TOTAL_WS = 4;
  const NEXT_PLAN: Record<string, string> = { free: 'Basic', basic: 'Pro', pro: 'Business', business: 'Enterprise' };

  const fmtPrice = (p: number) => p === 0 ? 'Gratuit' : `${p.toLocaleString('fr-FR')} FCFA / mois`;
  const fmtDate  = (d: string | null) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const statusStyle = (s: string) =>
    s === 'active'  ? { color: 'var(--ok)',     bg: 'var(--ok-bg)' } :
    s === 'trial'   ? { color: '#C9601E',        bg: 'rgba(201,96,30,.1)' } :
                      { color: 'var(--danger)',   bg: 'rgba(220,60,60,.1)' };

  if (!sub) return (
    <Section id="abonnement" title="Abonnement" desc="Votre plan actuel, limites d'utilisation et renouvellement.">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>Chargement…</div>
    </Section>
  );

  const ss    = statusStyle(sub.status);
  const date  = fmtDate(sub.renewal_date);
  const nextP = NEXT_PLAN[sub.plan] ?? 'Enterprise';
  const maxW  = sub.limits.max_entrepots === 0 ? null : sub.limits.max_entrepots;
  const maxM  = sub.limits.max_users     === 0 ? null : sub.limits.max_users;

  const rows = [
    { label: 'Workspaces actifs',   val: sub.usage.workspaces, max: maxW  ?? TOTAL_WS, pct: (sub.usage.workspaces / TOTAL_WS) * 100, unlimited: false },
    { label: "Membres de l'équipe", val: sub.usage.membres,    max: maxM,               pct: maxM ? (sub.usage.membres / maxM) * 100 : 20, unlimited: maxM === null },
  ];

  return (
    <Section id="abonnement" title="Abonnement" desc="Votre plan actuel, limites d'utilisation et renouvellement.">
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface) 100%)' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--ink)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 20 }}>🧾</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.02em' }}>{sub.planLabel}</span>
            <Tag color={ss.color} bg={ss.bg}>{sub.statusLabel}</Tag>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            {date
              ? <>Renouvellement le <strong style={{ color: 'var(--ink)' }}>{date}</strong> · {fmtPrice(sub.prix_mensuel)}</>
              : fmtPrice(sub.prix_mensuel)
            }
          </div>
        </div>
        <Btn variant="sm" onClick={() => toast('Changement de plan')}>Changer</Btn>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {rows.map((it, i) => (
          <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{it.label}</div>
              <div style={{ marginTop: 5, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', maxWidth: 220 }}>
                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 'inherit', width: `${Math.min(100, it.pct)}%` }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12.5, fontWeight: 500 }}>{it.val}</span>
              {!it.unlimited && it.max !== null && <span style={{ fontSize: 11.5, color: 'var(--muted-2)' }}> / {it.max}</span>}
              {it.unlimited && <span style={{ fontSize: 11.5, color: 'var(--muted-2)' }}> / ∞</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <a href="/admin/billing" className={`${styles.btn} ${styles.primary}`} style={{ textDecoration: 'none' }}>Passer à {nextP}</a>
        <a href="/admin/billing" className={styles.btn} style={{ textDecoration: 'none' }}>Gérer l'abonnement</a>
      </div>
    </Section>
  );
}

// ── Facturation — données réelles (table shop_payments via GET /api/admin/billing) ──

interface BillingPayment {
  id: number; transaction_id: string; plan: string; amount: number;
  duration_months: number; status: 'pending' | 'paid' | 'failed' | 'cancelled';
  operator: 'moov' | 'yas' | null; mm_reference: string | null;
  created_at: string; paid_at: string | null;
}
interface BillingData {
  plan: string; subscription_status: string; payments: BillingPayment[];
}

const OPERATOR_LABELS: Record<string, string> = { moov: 'Moov Money', yas: 'Yas (Togocel)' };
const PAY_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:      { label: 'Payé',     color: 'var(--ok)',     bg: 'var(--ok-bg)' },
  pending:   { label: 'En attente', color: 'var(--warn)', bg: 'var(--warn-bg)' },
  failed:    { label: 'Échoué',   color: 'var(--danger)', bg: 'var(--danger-bg)' },
  cancelled: { label: 'Annulé',   color: 'var(--muted)',  bg: 'rgba(20,17,14,.06)' },
};

function FacturationSection() {
  const [billing, setBilling] = useState<BillingData | null>(null);

  useEffect(() => {
    fetch('/api/admin/billing', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setBilling(d); })
      .catch(() => {});
  }, []);

  const fmtAmount = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const payments = billing?.payments ?? [];
  const lastPaid = payments.find(p => p.status === 'paid' && p.operator);

  return (
    <Section id="facturation" title="Facturation" desc="Moyen de paiement et historique des transactions.">
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 26, borderRadius: 6, background: 'var(--ink)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'white', fontSize: 14 }}>📱</div>
        <div style={{ flex: 1 }}>
          {lastPaid ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{OPERATOR_LABELS[lastPaid.operator!] ?? lastPaid.operator} · réf. {lastPaid.mm_reference}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Dernier paiement le {fmtDate(lastPaid.paid_at ?? lastPaid.created_at)}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Aucun moyen de paiement enregistré</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Le paiement se fait par mobile money (Moov ou Yas) lors du changement de plan.</div>
            </>
          )}
        </div>
        <a href="/admin/billing" className={`${styles.btn} ${styles.sm}`} style={{ textDecoration: 'none' }}>Gérer</a>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>Transactions récentes</div>
        {payments.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>Aucune facture pour le moment.</div>
        )}
        {payments.map(p => {
          const st = PAY_STATUS[p.status];
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--muted)' }}>🧾</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.transaction_id}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 1 }}>{fmtDate(p.paid_at ?? p.created_at)} · {p.plan} · {p.duration_months} mois</div>
              </div>
              <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12.5, fontWeight: 500 }}>{fmtAmount(p.amount)}</span>
              <Tag color={st.color} bg={st.bg}>{st.label}</Tag>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function SecuriteSection({ s, u, onSave, saving, toast }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; saving: boolean; toast: (m: string) => void }) {
  return (
    <Section id="securite" title="Sécurité & authentification" desc="Protégez l'accès à votre compte avec une double vérification." onSave={onSave} saving={saving}>
      <ToggleRow label="Authentification à deux facteurs (2FA)" desc="Un code temporaire sera demandé à chaque connexion, en plus du mot de passe." on={s.two_fa} onChange={v => u('two_fa', v)}>
        {s.two_fa && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="ghost-ok" onClick={() => toast("Configuration de l'app authenticator")}>📱 Configurer l'app authenticator</Btn>
            <Btn variant="sm" onClick={() => toast('Codes de secours')}>Codes de secours</Btn>
          </div>
        )}
      </ToggleRow>
      <Field label="Code PIN administrateur" hint="Requis pour les actions sensibles : suppression, export de données, modifications critiques.">
        <div style={{ display: 'flex', gap: 8 }}>
          <In value={s.pin_admin} onChange={v => u('pin_admin', v)} placeholder="••••••" type={s.pin_visible ? 'text' : 'password'} mono style={{ letterSpacing: '0.2em', width: 160 }} />
          <Btn variant="sm" onClick={() => u('pin_visible', !s.pin_visible)}>
            {s.pin_visible ? 'Masquer' : 'Afficher'}
          </Btn>
        </div>
      </Field>
      <Field label="Délai d'expiration de session" hint="Déconnexion automatique après cette durée d'inactivité.">
        <Sel value={s.session_timeout} onChange={v => u('session_timeout', v)} options={['30 minutes', '1 heure', '2 heures', '4 heures', '8 heures', '24 heures', 'Jamais']} />
      </Field>
      <div className={styles.settingsRow} style={{ background: 'var(--bg-2)', borderRadius: 11, border: '1px solid var(--border)' }}>
        <div className={styles.settingsRowLabel}>
          <div className={styles.settingsRowLabelText}>Mot de passe du compte</div>
          <div className={styles.settingsRowLabelHint}>Modifié il y a 45 jours</div>
        </div>
        <Btn variant="sm" onClick={() => toast('Email de réinitialisation envoyé')}>🔑 Modifier</Btn>
      </div>
    </Section>
  );
}

function SessionsSection({ toast }: { toast: (m: string) => void }) {
  const sessions = [
    { label: 'MacBook Pro · Chrome',   sub: "Lomé, Togo · À l'instant",         mobile: false, current: true  },
    { label: 'iPhone 15 Pro · Safari', sub: 'Lomé, Togo · il y a 2h',            mobile: true,  current: false },
    { label: 'MacBook Air · Firefox',  sub: 'Accra, Ghana · il y a 3 jours',     mobile: false, current: false },
  ];
  return (
    <Section id="sessions" title="Sessions actives" desc="Appareils et navigateurs actuellement connectés à votre compte.">
      {sessions.map((sess, i) => (
        <div key={i} className={styles.settingsRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--muted)', fontSize: 18 }}>
              {sess.mobile ? '📱' : '🖥'}
            </div>
            <div className={styles.settingsRowLabel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={styles.settingsRowLabelText}>{sess.label}</span>
                {sess.current && <Tag color="var(--ok)" bg="var(--ok-bg)">Session actuelle</Tag>}
              </div>
              <div className={styles.settingsRowLabelHint}>{sess.sub}</div>
            </div>
          </div>
          {!sess.current && <Btn variant="sm" onClick={() => toast('Session révoquée')} style={{ color: 'var(--danger)' }}>Révoquer</Btn>}
        </div>
      ))}
      <div style={{ paddingTop: 4 }}>
        <Btn onClick={() => toast('Toutes les autres sessions révoquées')} style={{ color: 'var(--danger)' }}>
          ↩ Révoquer toutes les autres sessions
        </Btn>
      </div>
    </Section>
  );
}

function NotificationsSection({ s, u, onSave, saving }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; saving: boolean }) {
  return (
    <Section id="notifications" title="Notifications" desc="Alertes système, rapports automatiques et communications de sécurité." onSave={onSave} saving={saving}>
      <ToggleRow label="Alertes d'anomalie critique" desc="Erreur système, paiement échoué, dépassement de seuil sur un workspace" on={s.notif_anomalie} onChange={v => u('notif_anomalie', v)} />
      <ToggleRow label="Confirmation de paiement" desc="Notification à chaque renouvellement ou changement de plan" on={s.notif_paiement} onChange={v => u('notif_paiement', v)} />
      <ToggleRow label="Rapport hebdomadaire consolidé" desc="Synthèse CA, équipe et performances tous workspaces — envoyé le lundi" on={s.notif_rapport_hebdo} onChange={v => u('notif_rapport_hebdo', v)} />
      <ToggleRow label="Rapport mensuel" desc="Bilan complet du mois avec export PDF joint" on={s.notif_rapport_mensuel} onChange={v => u('notif_rapport_mensuel', v)} />
      <ToggleRow label="Alertes de sécurité" desc="Nouvelle connexion depuis un appareil inconnu, tentatives d'accès suspectes" on={s.notif_alerte_secu} onChange={v => u('notif_alerte_secu', v)} />
      <Field label="Canal principal">
        <Seg value={s.notif_canal} onChange={v => u('notif_canal', v as NotifCanal)} options={['Email', 'WhatsApp', 'SMS']} />
      </Field>
      <Field label="Email de réception" hint="Par défaut : l'adresse principale du compte">
        <In value={s.email_ent} onChange={v => u('email_ent', v)} placeholder="admin@entreprise.tg" type="email" />
      </Field>
    </Section>
  );
}

function PreferencesSection({ s, u, onSave, saving }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; saving: boolean }) {
  const datePreview = s.format_date === 'JJ/MM/AAAA' ? '29/06/2026' : s.format_date === 'MM/JJ/AAAA' ? '06/29/2026' : '2026-06-29';
  return (
    <Section id="preferences" title="Préférences" desc="Langue de l'interface, fuseau horaire et formats d'affichage." onSave={onSave} saving={saving}>
      <Field label="Langue de l'interface">
        <Seg value={s.langue} onChange={v => u('langue', v as Langue)} options={['Français', 'English']} />
      </Field>
      <Field label="Fuseau horaire">
        <Sel value={s.fuseau} onChange={v => u('fuseau', v)} options={['Africa/Abidjan', 'Africa/Accra', 'Africa/Lagos', 'Africa/Dakar', 'Africa/Nairobi', 'Europe/Paris', 'America/New_York']} />
      </Field>
      <Field label="Format de date">
        <Seg value={s.format_date} onChange={v => u('format_date', v as FormatDate)} options={['JJ/MM/AAAA', 'MM/JJ/AAAA', 'AAAA-MM-JJ']} />
      </Field>
      <div className={styles.settingsRow} style={{ background: 'var(--bg-2)', borderRadius: 11, border: '1px solid var(--border)' }}>
        <div>
          <div className={styles.settingsRowLabelText}>Aperçu</div>
          <div className={styles.settingsRowLabelHint}>UTC+0 (Lomé, Togo)</div>
        </div>
        <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{datePreview}</span>
      </div>
    </Section>
  );
}

function DonneesSection({ toast }: { toast: (m: string) => void }) {
  const actions = [
    { label: 'Exporter toutes les données',     desc: "Archive ZIP incluant ventes, clients, stocks et journaux d'activité.",   btn: 'Exporter' },
    { label: 'Exporter les données comptables', desc: 'Fichier CSV/Excel compatible avec les outils comptables.',                btn: 'Exporter' },
    { label: 'Rapport de conformité RGPD',      desc: 'Liste des données personnelles détenues et politique de traitement.',    btn: 'Générer'  },
  ];
  return (
    <Section id="donnees" title="Données & confidentialité" desc="Export de vos données, conformité et politique de rétention.">
      {actions.map(it => (
        <div key={it.label} className={styles.settingsRow}>
          <div className={styles.settingsRowLabel}>
            <div className={styles.settingsRowLabelText}>{it.label}</div>
            <div className={styles.settingsRowLabelHint}>{it.desc}</div>
          </div>
          <Btn onClick={() => toast(it.btn + ' en cours…')}>↓ {it.btn}</Btn>
        </div>
      ))}
      <Field label="Durée de conservation des journaux d'activité" hint="Au-delà de cette période, les logs anciens sont archivés.">
        <Sel value="12 mois" onChange={() => {}} options={['3 mois', '6 mois', '12 mois', '24 mois', 'Indéfinie']} />
      </Field>
    </Section>
  );
}

function DangerSection({ onConfirm }: { onConfirm: (a: typeof DANGER_ACTIONS[number]) => void }) {
  return (
    <Section id="danger" title="Zone danger" desc="Actions irréversibles — réservées au propriétaire du compte.">
      {DANGER_ACTIONS.map(it => (
        <div key={it.label} className={styles.settingsRow}>
          <div className={styles.settingsRowLabel}>
            <div className={styles.settingsRowLabelText} style={{ color: it.isDanger ? 'var(--danger)' : undefined }}>{it.label}</div>
            <div className={styles.settingsRowLabelHint}>{it.desc}</div>
          </div>
          <button type="button" className={`${styles.btn} ${it.isDanger ? styles.danger : ''}`} onClick={() => onConfirm(it)}>
            {it.btn}
          </button>
        </div>
      ))}
    </Section>
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
      <div style={{ width: 440, maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{action.label}</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px' }}>{action.desc}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className={styles.btn} onClick={onClose}>Annuler</button>
          <button type="button" className={`${styles.btn} ${action.isDanger ? styles.danger : styles.primary}`} onClick={onConfirm}>
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
    <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 300, padding: '11px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 11, fontSize: 13, fontWeight: 500 }}>
      {message}
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
  const [sub, setSub] = useState<SubData | null>(null);
  const [active, setActive] = useState('profil');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<typeof DANGER_ACTIONS[number] | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
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
    fetch('/api/admin/settings/subscription', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setSub(d as SubData); })
      .catch(() => {});
  }, []);

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
    setSavingKey('profil');
    try {
      await Promise.all([
        fetch('/api/admin/settings/shop-profile', {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: s.nom_ent, email: s.email_ent, telephone: s.tel, adresse: s.adresse }),
        }),
        post({ shop_secteur: s.secteur, shop_taille: s.taille, shop_site: s.site }),
      ]);
      flash('Profil enregistré');
    } finally { setSavingKey(null); }
  };

  const saveSecurite = async () => {
    setSavingKey('securite');
    try {
      await post({ security_2fa: String(s.two_fa), security_pin_admin: s.pin_admin, security_session_timeout: s.session_timeout });
      flash('Paramètres de sécurité enregistrés');
    } finally { setSavingKey(null); }
  };

  const saveNotifs = async () => {
    setSavingKey('notifications');
    try {
      await post({
        notif_anomalie: String(s.notif_anomalie), notif_paiement: String(s.notif_paiement),
        notif_rapport_hebdo: String(s.notif_rapport_hebdo), notif_rapport_mensuel: String(s.notif_rapport_mensuel),
        notif_alerte_secu: String(s.notif_alerte_secu), notif_canal: s.notif_canal,
      });
      flash('Notifications enregistrées');
    } finally { setSavingKey(null); }
  };

  const savePreferences = async () => {
    setSavingKey('preferences');
    try {
      await post({ pref_langue: s.langue, pref_fuseau: s.fuseau, pref_format_date: s.format_date });
      flash('Préférences enregistrées');
    } finally { setSavingKey(null); }
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
      <div ref={contentRef} style={{ overflowY: 'auto' }}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrow}>Admin · Paramètres</div>
            <h1 className={styles.title}>Paramètres <span className={styles.serif}>compte</span></h1>
            <p className={styles.subtitle}>Profil de l'entreprise, abonnement, sécurité et préférences du compte administrateur.</p>
          </div>
        </div>

        <div className={styles.settingsBody}>
          <ProfilSection        s={s} u={u} onSave={saveProfil} saving={savingKey === 'profil'} />
          <AbonnementSection    toast={flash} sub={sub} />
          <FacturationSection />
          <SecuriteSection      s={s} u={u} onSave={saveSecurite} saving={savingKey === 'securite'} toast={flash} />
          <SessionsSection      toast={flash} />
          <NotificationsSection s={s} u={u} onSave={saveNotifs} saving={savingKey === 'notifications'} />
          <PreferencesSection   s={s} u={u} onSave={savePreferences} saving={savingKey === 'preferences'} />
          <DonneesSection       toast={flash} />
          <DangerSection        onConfirm={a => setConfirmAction(a)} />
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
