'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Admin.module.css';
import { formatDate, setDatePrefs } from '@/lib/format-date';
import { useT } from '@/lib/i18n/use-admin-ws-lang';
import type { DictKey } from '@/lib/i18n/admin-ws';

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

// `label`/`desc`/`btn` below are i18n dictionary KEYS, resolved via t() at render time.
const DANGER_ACTIONS: { label: DictKey; desc: DictKey; btn: DictKey; isDanger: boolean }[] = [
  { label: 'settings.danger.reset_demo_label', desc: 'settings.danger.reset_demo_desc', btn: 'settings.danger.reset_demo_btn', isDanger: false },
  { label: 'settings.danger.suspend_label', desc: 'settings.danger.suspend_desc', btn: 'settings.danger.suspend_btn', isDanger: false },
  { label: 'settings.danger.delete_label', desc: 'settings.danger.delete_desc', btn: 'settings.danger.delete_btn', isDanger: true },
];

// ── Primitives UI (mêmes classes que Store · Réglages boutique) ────

function Section({ id, title, desc, children, onSave, saving }: {
  id: string; title: string; desc?: string; children: React.ReactNode;
  onSave?: () => void; saving?: boolean;
}) {
  const t = useT();
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
              {saving ? t('common.saving') : t('common.save')}
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
  const t = useT();
  return (
    <Section id="profil" title={t('settings.profil.title')} desc={t('settings.profil.desc')} onSave={onSave} saving={saving}>
      <Field label={t('settings.profil.company_name_label')}><In value={s.nom_ent} onChange={v => u('nom_ent', v)} placeholder="Maison Diallo" /></Field>
      <Field label={t('settings.profil.email_label')}><In value={s.email_ent} onChange={v => u('email_ent', v)} placeholder="contact@entreprise.tg" type="email" /></Field>
      <Field label={t('settings.profil.sector_label')}>
        <Sel value={s.secteur} onChange={v => u('secteur', v)} options={['Commerce & Distribution', 'Mode & Artisanat', 'Restauration', 'Services', 'Technologie', 'Agriculture', 'Autre']} />
      </Field>
      <Field label={t('settings.profil.team_size_label')}>
        <Sel value={s.taille} onChange={v => u('taille', v)} options={['1 employé', '2–10 employés', '11–50 employés', '51–200 employés', '200+ employés']} />
      </Field>
      <Field label={t('settings.profil.address_label')}><In value={s.adresse} onChange={v => u('adresse', v)} placeholder="Lomé, Togo" /></Field>
      <Field label={t('settings.profil.phone_label')}><In value={s.tel} onChange={v => u('tel', v)} placeholder="+228 90 00 00 00" mono /></Field>
      <Field label={t('settings.profil.website_label')} hint={t('settings.profil.website_hint')}>
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
  const t = useT();
  const TOTAL_WS = 4;
  const NEXT_PLAN: Record<string, string> = { free: 'Basic', basic: 'Pro', pro: 'Business', business: 'Enterprise' };

  const fmtPrice = (p: number) => p === 0 ? t('settings.sub.free') : `${p.toLocaleString('fr-FR')} ${t('settings.sub.price_suffix')}`;
  const fmtDate  = (d: string | null) => d ? formatDate(d) : null;
  const statusStyle = (s: string) =>
    s === 'active'  ? { color: 'var(--ok)',     bg: 'var(--ok-bg)' } :
    s === 'trial'   ? { color: '#C9601E',        bg: 'rgba(201,96,30,.1)' } :
                      { color: 'var(--danger)',   bg: 'rgba(220,60,60,.1)' };

  if (!sub) return (
    <Section id="abonnement" title={t('settings.sub.title')} desc={t('settings.sub.desc')}>
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>{t('common.loading')}</div>
    </Section>
  );

  const ss    = statusStyle(sub.status);
  const date  = fmtDate(sub.renewal_date);
  const nextP = NEXT_PLAN[sub.plan] ?? 'Enterprise';
  const maxW  = sub.limits.max_entrepots === 0 ? null : sub.limits.max_entrepots;
  const maxM  = sub.limits.max_users     === 0 ? null : sub.limits.max_users;

  const rows = [
    { label: t('settings.sub.row_workspaces'), val: sub.usage.workspaces, max: maxW  ?? TOTAL_WS, pct: (sub.usage.workspaces / TOTAL_WS) * 100, unlimited: false },
    { label: t('settings.sub.row_members'), val: sub.usage.membres,    max: maxM,               pct: maxM ? (sub.usage.membres / maxM) * 100 : 20, unlimited: maxM === null },
  ];

  return (
    <Section id="abonnement" title={t('settings.sub.title')} desc={t('settings.sub.desc')}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface) 100%)' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--ink)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 20 }}>🧾</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.02em' }}>{sub.planLabel}</span>
            <Tag color={ss.color} bg={ss.bg}>{sub.statusLabel}</Tag>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            {date
              ? <>{t('settings.sub.renewal_prefix')} <strong style={{ color: 'var(--ink)' }}>{date}</strong> · {fmtPrice(sub.prix_mensuel)}</>
              : fmtPrice(sub.prix_mensuel)
            }
          </div>
        </div>
        <Btn variant="sm" onClick={() => toast(t('settings.sub.change_plan_toast'))}>{t('settings.sub.change_btn')}</Btn>
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
        <a href="/admin/billing" className={`${styles.btn} ${styles.primary}`} style={{ textDecoration: 'none' }}>{t('settings.sub.upgrade_prefix')} {nextP}</a>
        <a href="/admin/billing" className={styles.btn} style={{ textDecoration: 'none' }}>{t('settings.sub.manage_subscription')}</a>
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
// `label` values below are i18n dictionary KEYS, resolved via t() at render time.
const PAY_STATUS: Record<string, { label: DictKey; color: string; bg: string }> = {
  paid:      { label: 'settings.billing.status.paid',      color: 'var(--ok)',     bg: 'var(--ok-bg)' },
  pending:   { label: 'settings.billing.status.pending',   color: 'var(--warn)',   bg: 'var(--warn-bg)' },
  failed:    { label: 'settings.billing.status.failed',    color: 'var(--danger)', bg: 'var(--danger-bg)' },
  cancelled: { label: 'settings.billing.status.cancelled', color: 'var(--muted)',  bg: 'rgba(20,17,14,.06)' },
};

function FacturationSection() {
  const t = useT();
  const [billing, setBilling] = useState<BillingData | null>(null);

  useEffect(() => {
    fetch('/api/admin/billing', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setBilling(d); })
      .catch(() => {});
  }, []);

  const fmtAmount = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

  const payments = billing?.payments ?? [];
  const lastPaid = payments.find(p => p.status === 'paid' && p.operator);

  return (
    <Section id="facturation" title={t('settings.billing.title')} desc={t('settings.billing.desc')}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 26, borderRadius: 6, background: 'var(--ink)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'white', fontSize: 14 }}>📱</div>
        <div style={{ flex: 1 }}>
          {lastPaid ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{OPERATOR_LABELS[lastPaid.operator!] ?? lastPaid.operator} · {t('settings.billing.ref_abbr')} {lastPaid.mm_reference}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{t('settings.billing.last_payment_prefix')} {formatDate(lastPaid.paid_at ?? lastPaid.created_at)}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t('settings.billing.no_method')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{t('settings.billing.no_method_desc')}</div>
            </>
          )}
        </div>
        <a href="/admin/billing" className={`${styles.btn} ${styles.sm}`} style={{ textDecoration: 'none' }}>{t('common.manage')}</a>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>{t('settings.billing.recent_transactions')}</div>
        {payments.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>{t('settings.billing.no_invoices')}</div>
        )}
        {payments.map(p => {
          const st = PAY_STATUS[p.status];
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--muted)' }}>🧾</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.transaction_id}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 1 }}>{formatDate(p.paid_at ?? p.created_at)} · {p.plan} · {p.duration_months} {t('settings.billing.months_suffix')}</div>
              </div>
              <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12.5, fontWeight: 500 }}>{fmtAmount(p.amount)}</span>
              <Tag color={st.color} bg={st.bg}>{t(st.label)}</Tag>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function SecuriteSection({ s, u, onSave, saving, toast }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; saving: boolean; toast: (m: string) => void }) {
  const t = useT();
  return (
    <Section id="securite" title={t('settings.sec.title')} desc={t('settings.sec.desc')} onSave={onSave} saving={saving}>
      <ToggleRow label={t('settings.sec.twofa_label')} desc={t('settings.sec.twofa_desc')} on={s.two_fa} onChange={v => u('two_fa', v)}>
        {s.two_fa && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="ghost-ok" onClick={() => toast(t('settings.sec.configure_app_toast'))}>{t('settings.sec.configure_app_btn')}</Btn>
            <Btn variant="sm" onClick={() => toast(t('settings.sec.backup_codes_btn'))}>{t('settings.sec.backup_codes_btn')}</Btn>
          </div>
        )}
      </ToggleRow>
      <Field label={t('settings.sec.pin_label')} hint={t('settings.sec.pin_hint')}>
        <div style={{ display: 'flex', gap: 8 }}>
          <In value={s.pin_admin} onChange={v => u('pin_admin', v)} placeholder="••••••" type={s.pin_visible ? 'text' : 'password'} mono style={{ letterSpacing: '0.2em', width: 160 }} />
          <Btn variant="sm" onClick={() => u('pin_visible', !s.pin_visible)}>
            {s.pin_visible ? t('settings.sec.hide_btn') : t('settings.sec.show_btn')}
          </Btn>
        </div>
      </Field>
      <Field label={t('settings.sec.session_timeout_label')} hint={t('settings.sec.session_timeout_hint')}>
        <Sel value={s.session_timeout} onChange={v => u('session_timeout', v)} options={['30 minutes', '1 heure', '2 heures', '4 heures', '8 heures', '24 heures', 'Jamais']} />
      </Field>
      <div className={styles.settingsRow} style={{ background: 'var(--bg-2)', borderRadius: 11, border: '1px solid var(--border)' }}>
        <div className={styles.settingsRowLabel}>
          <div className={styles.settingsRowLabelText}>{t('settings.sec.password_label')}</div>
          <div className={styles.settingsRowLabelHint}>{t('settings.sec.password_hint')}</div>
        </div>
        <Btn variant="sm" onClick={() => toast(t('settings.sec.reset_email_toast'))}>{t('settings.sec.change_password_btn')}</Btn>
      </div>
    </Section>
  );
}

interface SessionRow {
  id: number; device_label: string | null; ip: string;
  created_at: string; last_seen_at: string; current: boolean;
}

function relativeTime(iso: string, t: (k: DictKey) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return t('common.time.just_now');
  if (min < 60) return t('common.time.min_ago').replace('{n}', String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return t('common.time.hours_ago').replace('{n}', String(h));
  const d = Math.floor(h / 24);
  return t('common.time.days_ago').replace('{n}', String(d)).replace('{s}', d > 1 ? 's' : '');
}

function SessionsSection({ toast }: { toast: (m: string) => void }) {
  const t = useT();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/settings/sessions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setSessions(d.sessions); })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const revoke = async (id: number) => {
    await fetch(`/api/admin/settings/sessions/${id}/revoke`, { method: 'POST', credentials: 'include' });
    toast(t('settings.sessions.revoked_toast'));
    load();
  };

  const revokeOthers = async () => {
    await fetch('/api/admin/settings/sessions/revoke-others', { method: 'POST', credentials: 'include' });
    toast(t('settings.sessions.revoked_others_toast'));
    load();
  };

  return (
    <Section id="sessions" title={t('settings.sessions.title')} desc={t('settings.sessions.desc')}>
      {sessions === null && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>{t('common.loading')}</div>}
      {sessions?.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>{t('settings.sessions.empty')}</div>}
      {sessions?.map(sess => {
        const mobile = /ios|android/i.test(sess.device_label ?? '');
        return (
          <div key={sess.id} className={styles.settingsRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--muted)', fontSize: 18 }}>
                {mobile ? '📱' : '🖥'}
              </div>
              <div className={styles.settingsRowLabel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.settingsRowLabelText}>{sess.device_label ?? t('settings.sessions.unknown_device')}</span>
                  {sess.current && <Tag color="var(--ok)" bg="var(--ok-bg)">{t('settings.sessions.current_tag')}</Tag>}
                </div>
                <div className={styles.settingsRowLabelHint}>{sess.ip} · {relativeTime(sess.last_seen_at, t)}</div>
              </div>
            </div>
            {!sess.current && <Btn variant="sm" onClick={() => revoke(sess.id)} style={{ color: 'var(--danger)' }}>{t('settings.sessions.revoke_btn')}</Btn>}
          </div>
        );
      })}
      {sessions && sessions.length > 1 && (
        <div style={{ paddingTop: 4 }}>
          <Btn onClick={revokeOthers} style={{ color: 'var(--danger)' }}>
            {t('settings.sessions.revoke_others_btn')}
          </Btn>
        </div>
      )}
    </Section>
  );
}

function NotificationsSection({ s, u, onSave, saving }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; saving: boolean }) {
  const t = useT();
  return (
    <Section id="notifications" title={t('settings.notif.title')} desc={t('settings.notif.desc')} onSave={onSave} saving={saving}>
      <ToggleRow label={t('settings.notif.anomalie_label')} desc={t('settings.notif.anomalie_desc')} on={s.notif_anomalie} onChange={v => u('notif_anomalie', v)} />
      <ToggleRow label={t('settings.notif.paiement_label')} desc={t('settings.notif.paiement_desc')} on={s.notif_paiement} onChange={v => u('notif_paiement', v)} />
      <ToggleRow label={t('settings.notif.hebdo_label')} desc={t('settings.notif.hebdo_desc')} on={s.notif_rapport_hebdo} onChange={v => u('notif_rapport_hebdo', v)} />
      <ToggleRow label={t('settings.notif.mensuel_label')} desc={t('settings.notif.mensuel_desc')} on={s.notif_rapport_mensuel} onChange={v => u('notif_rapport_mensuel', v)} />
      <ToggleRow label={t('settings.notif.secu_label')} desc={t('settings.notif.secu_desc')} on={s.notif_alerte_secu} onChange={v => u('notif_alerte_secu', v)} />
      <Field label={t('settings.notif.canal_label')}>
        <Seg value={s.notif_canal} onChange={v => u('notif_canal', v as NotifCanal)} options={['Email', 'WhatsApp', 'SMS']} />
      </Field>
      <Field label={t('settings.notif.email_label')} hint={t('settings.notif.email_hint')}>
        <In value={s.email_ent} onChange={v => u('email_ent', v)} placeholder="admin@entreprise.tg" type="email" />
      </Field>
    </Section>
  );
}

const TIMEZONE_LABELS: Record<string, string> = {
  'Africa/Abidjan':    'Abidjan / Lomé (UTC+0)',
  'Africa/Accra':      'Accra (UTC+0)',
  'Africa/Lagos':      'Lagos (UTC+1)',
  'Africa/Dakar':      'Dakar (UTC+0)',
  'Africa/Nairobi':    'Nairobi (UTC+3)',
  'Europe/Paris':      'Paris (UTC+1/+2)',
  'America/New_York':  'New York (UTC-5/-4)',
};

function PreferencesSection({ s, u, onSave, saving }: { s: S; u: <K extends keyof S>(k: K, v: S[K]) => void; onSave: () => void; saving: boolean }) {
  const t = useT();
  // Live preview of the CURRENT (unsaved) selection — separate from the app-wide saved formatDate().
  const now = new Date();
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: s.fuseau, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(now);
  const day = parts.find(p => p.type === 'day')?.value ?? '--';
  const month = parts.find(p => p.type === 'month')?.value ?? '--';
  const year = parts.find(p => p.type === 'year')?.value ?? '----';
  const datePreview =
    s.format_date === 'MM/JJ/AAAA' ? `${month}/${day}/${year}` :
    s.format_date === 'AAAA-MM-JJ' ? `${year}-${month}-${day}` :
    `${day}/${month}/${year}`;

  return (
    <Section id="preferences" title={t('settings.pref.title')} desc={t('settings.pref.desc')} onSave={onSave} saving={saving}>
      <Field label={t('settings.pref.langue_label')} hint={t('settings.pref.langue_hint')}>
        {/* NOTE: option values are the actual persisted pref_langue setting (drives this
            translation feature) — kept literal 'Français'/'English', never translated. */}
        <Seg value={s.langue} onChange={v => u('langue', v as Langue)} options={['Français', 'English']} />
      </Field>
      <Field label={t('settings.pref.timezone_label')}>
        <Sel value={s.fuseau} onChange={v => u('fuseau', v)} options={['Africa/Abidjan', 'Africa/Accra', 'Africa/Lagos', 'Africa/Dakar', 'Africa/Nairobi', 'Europe/Paris', 'America/New_York']} />
      </Field>
      <Field label={t('settings.pref.date_format_label')}>
        <Seg value={s.format_date} onChange={v => u('format_date', v as FormatDate)} options={['JJ/MM/AAAA', 'MM/JJ/AAAA', 'AAAA-MM-JJ']} />
      </Field>
      <div className={styles.settingsRow} style={{ background: 'var(--bg-2)', borderRadius: 11, border: '1px solid var(--border)' }}>
        <div>
          <div className={styles.settingsRowLabelText}>{t('settings.pref.preview_label')}</div>
          <div className={styles.settingsRowLabelHint}>{TIMEZONE_LABELS[s.fuseau] ?? s.fuseau}</div>
        </div>
        <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{datePreview}</span>
      </div>
    </Section>
  );
}

function DonneesSection({ toast }: { toast: (m: string) => void }) {
  const t = useT();
  const actions: { label: DictKey; desc: DictKey; btn: DictKey }[] = [
    { label: 'settings.data.export_all_label',        desc: 'settings.data.export_all_desc',        btn: 'common.export' },
    { label: 'settings.data.export_accounting_label',  desc: 'settings.data.export_accounting_desc', btn: 'common.export' },
    { label: 'settings.data.gdpr_label',               desc: 'settings.data.gdpr_desc',               btn: 'common.generate' },
  ];
  return (
    <Section id="donnees" title={t('settings.data.title')} desc={t('settings.data.desc')}>
      {actions.map(it => (
        <div key={it.label} className={styles.settingsRow}>
          <div className={styles.settingsRowLabel}>
            <div className={styles.settingsRowLabelText}>{t(it.label)}</div>
            <div className={styles.settingsRowLabelHint}>{t(it.desc)}</div>
          </div>
          <Btn onClick={() => toast(`${t(it.btn)} ${t('settings.data.in_progress_suffix')}`)}>↓ {t(it.btn)}</Btn>
        </div>
      ))}
      <Field label={t('settings.data.retention.label')} hint={t('settings.data.retention.hint')}>
        <Sel
          value={t('settings.data.retention.12m')}
          onChange={() => {}}
          options={[
            t('settings.data.retention.3m'),
            t('settings.data.retention.6m'),
            t('settings.data.retention.12m'),
            t('settings.data.retention.24m'),
            t('settings.data.retention.indefinite'),
          ]}
        />
      </Field>
    </Section>
  );
}

function DangerSection({ onConfirm }: { onConfirm: (a: typeof DANGER_ACTIONS[number]) => void }) {
  const t = useT();
  return (
    <Section id="danger" title={t('settings.danger.title')} desc={t('settings.danger.desc')}>
      {DANGER_ACTIONS.map(it => (
        <div key={it.label} className={styles.settingsRow}>
          <div className={styles.settingsRowLabel}>
            <div className={styles.settingsRowLabelText} style={{ color: it.isDanger ? 'var(--danger)' : undefined }}>{t(it.label)}</div>
            <div className={styles.settingsRowLabelHint}>{t(it.desc)}</div>
          </div>
          <button type="button" className={`${styles.btn} ${it.isDanger ? styles.danger : ''}`} onClick={() => onConfirm(it)}>
            {t(it.btn)}
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
  const t = useT();
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(20,17,14,.32)', backdropFilter: 'saturate(120%) blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 440, maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{t(action.label)}</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px' }}>{t(action.desc)}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className={styles.btn} onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className={`${styles.btn} ${action.isDanger ? styles.danger : styles.primary}`} onClick={onConfirm}>
            {t(action.btn)}
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

// ── Main export ────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useT();
  const [s, setS] = useState<S>(INIT);
  const [sub, setSub] = useState<SubData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<typeof DANGER_ACTIONS[number] | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

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
      flash(t('settings.toast.profil_saved'));
    } finally { setSavingKey(null); }
  };

  const saveSecurite = async () => {
    setSavingKey('securite');
    try {
      await post({ security_2fa: String(s.two_fa), security_pin_admin: s.pin_admin, security_session_timeout: s.session_timeout });
      flash(t('settings.toast.securite_saved'));
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
      flash(t('settings.toast.notifs_saved'));
    } finally { setSavingKey(null); }
  };

  const savePreferences = async () => {
    setSavingKey('preferences');
    try {
      await post({ pref_langue: s.langue, pref_fuseau: s.fuseau, pref_format_date: s.format_date });
      setDatePrefs({ format: s.format_date, timezone: s.fuseau }); // apply app-wide immediately, no reload needed
      flash(t('settings.toast.prefs_saved'));
    } finally { setSavingKey(null); }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>{t('settings.header.eyebrow')}</div>
          <h1 className={styles.title}>{t('settings.header.title_main')} <span className={styles.serif}>{t('settings.header.title_serif')}</span></h1>
          <p className={styles.subtitle}>{t('settings.header.subtitle')}</p>
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

      {toast && <Toast message={toast} />}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => { flash(`${t(confirmAction.btn)} ${t('settings.danger.done_suffix')}`); setConfirmAction(null); }}
        />
      )}
    </div>
  );
}
