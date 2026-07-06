/**
 * ReglagesPage — Store workspace settings
 * Sections: URL/domaine, apparence, boutique info, paiements, notifications, danger
 * Persistence: real backend (settings table, shop-profile, payment_methods, shop danger actions)
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CogIcon, CheckIcon, CopyIcon } from './icons';
import styles from './Store.module.css';
import { THEME_PRESETS, FONT_OPTIONS } from '@/lib/theme-presets';
import { applyThemeToDOM, fontFamilyValue, isSystemFont } from '@/lib/theme-utils';

/* ─── Payment methods — shared shape/ids with PaymentMethodsManager ─────── */
interface PaymentMethod {
  id: string; label: string; description: string; enabled: boolean;
}
const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash_on_delivery', label: 'Paiement à la livraison', description: 'Le client règle en espèces à la réception.', enabled: true },
  { id: 'orange_money',     label: 'Orange Money',            description: 'Transfert mobile via Orange Money Togo.',   enabled: true },
  { id: 'tmoney',           label: 'T-Money (Togocel)',       description: 'Transfert mobile via T-Money.',             enabled: true },
  { id: 'flooz',            label: 'Flooz (Moov)',            description: 'Transfert mobile via Flooz Moov Africa.',  enabled: false },
  { id: 'bank_transfer',    label: 'Virement bancaire',       description: 'Virement sur le compte bancaire.',         enabled: false },
];

/* ─── Persisted shape ────────────────────────────────────────────── */
interface StoreSettings {
  /* URL & domaine (lecture seule) */
  slug:          string;
  domaine:       string;
  /* Apparence */
  logoUrl:       string;
  couleur:       string;
  accent:        string;
  font:          string;
  /* Boutique info */
  nomBoutique:   string;
  emailContact:  string;
  telephone:     string;
  devise:        string;
  /* Paiements */
  methods:       PaymentMethod[];
  /* Notifications */
  notifWhatsapp: boolean;
  notifEmail:    boolean;
}

const DEFAULTS: StoreSettings = {
  slug:           '',
  domaine:        '',
  logoUrl:        '',
  couleur:        '#E07A2C',
  accent:         '#2D8A5F',
  font:           'Geist',
  nomBoutique:    '',
  emailContact:   '',
  telephone:      '',
  devise:         'XOF',
  methods:        DEFAULT_PAYMENT_METHODS,
  notifWhatsapp:  true,
  notifEmail:     true,
};

/* ─── Toggle ─────────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

/* ─── Section wrapper ────────────────────────────────────────────── */
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className={styles.settingsSection}>
      <div className={styles.settingsSectionHead}>
        <div className={styles.settingsSectionTitle}>{title}</div>
        {desc && <div className={styles.settingsSectionDesc}>{desc}</div>}
      </div>
      <div className={styles.settingsCard}>{children}</div>
    </div>
  );
}

/* ─── Field row ──────────────────────────────────────────────────── */
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

/* ─── Toggle row ─────────────────────────────────────────────────── */
function ToggleRow({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={styles.settingsRow}>
      <div className={styles.settingsRowLabel}>
        <div className={styles.settingsRowLabelText}>{label}</div>
        {desc && <div className={styles.settingsRowLabelHint}>{desc}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

/* ─── Confirm modal (Zone danger) ────────────────────────────────── */
type DangerAction = 'reset' | 'archive' | 'delete';
const DANGER_COPY: Record<DangerAction, { title: string; desc: string; endpoint: string; btn: string }> = {
  reset:   { title: 'Réinitialiser les données de démonstration', desc: 'Vide ventes, stock boutique, clients et caisse. Catalogue produits et historique Magasin non touchés.', endpoint: '/api/admin/shop/reset-demo-data', btn: 'Réinitialiser' },
  archive: { title: 'Archiver la boutique',                       desc: 'Boutique masquée immédiatement. Réversible à tout moment depuis /admin/billing en choisissant un plan.', endpoint: '/api/admin/shop/archive', btn: 'Archiver' },
  delete:  { title: 'Supprimer la boutique',                      desc: "Boutique désactivée. Aucune donnée n'est effacée, mais seul le support peut la restaurer.", endpoint: '/api/admin/shop/delete', btn: 'Supprimer' },
};

function ConfirmDangerModal({ action, shopNom, onClose, onDone }: {
  action: DangerAction; shopNom: string; onClose: () => void; onDone: (msg: string) => void;
}) {
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const copy = DANGER_COPY[action];
  const matches = typed.trim().toLowerCase() === shopNom.trim().toLowerCase();

  async function confirm() {
    setLoading(true); setError('');
    try {
      const res = await fetch(copy.endpoint, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_nom: typed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur.'); return; }
      onDone(`${copy.btn} — effectué.`);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(20,17,14,.32)', backdropFilter: 'saturate(120%) blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 440, maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{copy.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px' }}>{copy.desc}</p>
        <p style={{ fontSize: 12.5, marginBottom: 6 }}>
          Tapez <strong>{shopNom}</strong> pour confirmer :
        </p>
        <input
          className={styles.settingsInput}
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder={shopNom}
          style={{ marginBottom: 12 }}
        />
        {error && <p style={{ fontSize: 12.5, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className={styles.btn} onClick={onClose}>Annuler</button>
          <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={!matches || loading} onClick={confirm}>
            {loading ? '…' : copy.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ReglagesPage() {
  const [s, setS] = useState<StoreSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [dangerAction, setDangerAction] = useState<DangerAction | null>(null);
  const [toast, setToast] = useState('');
  const colorRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const patch = (partial: Partial<StoreSettings>) => setS(prev => ({ ...prev, ...partial }));

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Load real data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/settings/shop-profile', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/settings/domain', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
    ]).then(([cfg, profile, domain]) => {
      let methods = DEFAULT_PAYMENT_METHODS;
      try {
        const parsed = JSON.parse(cfg.payment_methods ?? '[]');
        if (Array.isArray(parsed) && parsed.length) methods = parsed;
      } catch { /* keep defaults */ }

      setS(prev => ({
        ...prev,
        slug:          domain.slug          ?? prev.slug,
        domaine:       domain.custom_domain ?? '',
        logoUrl:       cfg.site_logo        || prev.logoUrl,
        couleur:       cfg.theme_primary    || prev.couleur,
        accent:        cfg.theme_accent     || prev.accent,
        font:          cfg.theme_font       || prev.font,
        nomBoutique:   profile.nom          || prev.nomBoutique,
        emailContact:  cfg.shop_contact_email || profile.email || prev.emailContact,
        telephone:     profile.telephone    || prev.telephone,
        devise:        cfg.shop_devise      || prev.devise,
        methods,
        notifWhatsapp: cfg.order_notif_whatsapp !== 'false',
        notifEmail:    cfg.order_notif_email    !== 'false',
      }));
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch('/api/admin/settings/shop-profile', {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: s.nomBoutique, telephone: s.telephone }),
        }),
        fetch('/api/admin/settings', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme_primary: s.couleur, theme_accent: s.accent, theme_font: s.font,
            site_logo: s.logoUrl,
            shop_contact_email: s.emailContact, shop_devise: s.devise,
            payment_methods: JSON.stringify(s.methods),
            order_notif_whatsapp: String(s.notifWhatsapp), order_notif_email: String(s.notifEmail),
          }),
        }),
      ]);
      applyThemeToDOM(s.couleur, s.accent, s.font);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/upload', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: { data: base64, type: file.type, name: file.name } }),
      });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) patch({ logoUrl: data.urls[0] });
      else flash(data.errors?.[0] ?? 'Erreur upload logo');
    } finally {
      setLogoUploading(false);
    }
  }

  function selectPreset(i: number) {
    const p = THEME_PRESETS[i];
    patch({ couleur: p.primary, accent: p.accent });
    applyThemeToDOM(p.primary, p.accent, s.font);
  }

  function toggleMethod(id: string) {
    setS(prev => ({ ...prev, methods: prev.methods.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m) }));
  }

  const storeUrl = s.domaine.trim()
    ? `https://${s.domaine.trim()}`
    : `https://${s.slug}.afrisika.com`;

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Réglages</div>
          <h1 className={styles.title}>Réglages <span className={styles.serif}>boutique</span></h1>
          <p className={styles.subtitle}>Configurez l'URL, l'apparence, les paiements et les notifications de votre boutique.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={handleSave} disabled={saving}>
            {saved ? <CheckIcon size={14} /> : <CogIcon size={14} />}
            {saving ? 'Enregistrement…' : saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className={styles.settingsBody}>

        {/* ── URL & Domaine ─────────────────────────────────────── */}
        <Section
          title="URL & Domaine"
          desc="Adresse publique de votre boutique en ligne."
        >
          <Field label="Sous-domaine Afrisika" hint="Attribué à la création — non modifiable">
            <div className={styles.settingsSlugWrap}>
              <span className={styles.settingsSlugPrefix}>afrisika.com/</span>
              <input
                className={`${styles.settingsInput} ${styles.settingsInputReadonly}`}
                value={s.slug}
                readOnly
                style={{ width: 140 }}
              />
            </div>
          </Field>

          <Field label="URL active" hint={s.domaine ? 'Domaine personnalisé actif' : 'Sous-domaine par défaut'}>
            <div className={styles.settingsUrlRow}>
              <span className={styles.settingsUrlText}>{storeUrl}</span>
              <button
                type="button"
                className={styles.rowMenu}
                title={copied ? 'Copié !' : 'Copier'}
                onClick={handleCopy}
              >
                <CopyIcon size={13} />
              </button>
            </div>
          </Field>

          <Field label="Domaine personnalisé" hint="Contactez le support pour connecter un domaine — configuration DNS manuelle requise">
            <span className={styles.settingsRowLabelHint}>{s.domaine || 'Aucun domaine personnalisé configuré'}</span>
          </Field>
        </Section>

        {/* ── Apparence ─────────────────────────────────────────── */}
        <Section
          title="Apparence"
          desc="Logo, couleurs et police affichés sur votre boutique."
        >
          <Field label="Logo" hint="PNG, JPG ou SVG · fond transparent recommandé · 2 Mo max">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0, background: 'var(--surface)' }}>
                {s.logoUrl
                  ? <img src={s.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>Aucun</span>}
              </div>
              <button type="button" className={styles.btn} disabled={logoUploading} onClick={() => logoInputRef.current?.click()}>
                {logoUploading ? 'Envoi…' : s.logoUrl ? 'Changer' : 'Téléverser'}
              </button>
              {s.logoUrl && (
                <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={() => patch({ logoUrl: '' })}>
                  Retirer
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*,.svg" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
            </div>
          </Field>

          <Field label="Thème de couleur" hint="Presets prêts à l'emploi">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {THEME_PRESETS.map((p, i) => {
                const on = p.primary === s.couleur && p.accent === s.accent;
                return (
                  <button key={p.label} type="button" title={p.label} onClick={() => selectPreset(i)} style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
                    background: `linear-gradient(135deg, ${p.primary} 50%, ${p.accent} 50%)`,
                    border: on ? '2px solid var(--ink)' : '1px solid var(--border)',
                  }} />
                );
              })}
            </div>
          </Field>

          <Field label="Couleur principale" hint="Boutons, liens et accents de la boutique">
            <div className={styles.colorPickerWrap}>
              <button
                type="button"
                className={styles.colorSwatch}
                style={{ background: s.couleur }}
                onClick={() => colorRef.current?.click()}
                title="Choisir une couleur"
              />
              <input
                ref={colorRef}
                type="color"
                value={s.couleur}
                onChange={e => { patch({ couleur: e.target.value }); applyThemeToDOM(e.target.value, s.accent, s.font); }}
                className={styles.colorInput}
              />
              <input
                className={styles.settingsInput}
                value={s.couleur}
                onChange={e => patch({ couleur: e.target.value })}
                placeholder="#E07A2C"
                style={{ width: 120, fontFamily: 'Geist Mono, monospace', fontSize: 13 }}
              />
            </div>
          </Field>

          <Field label="Police">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FONT_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => { patch({ font: f }); applyThemeToDOM(s.couleur, s.accent, f); }} style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontFamily: fontFamilyValue(f),
                  border: s.font === f ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  background: s.font === f ? 'var(--bg-2)' : 'var(--surface)', color: 'var(--ink)',
                }}>
                  {isSystemFont(f) ? 'Système' : f}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── Informations boutique ─────────────────────────────── */}
        <Section
          title="Informations boutique"
          desc="Visible par vos clients sur la page de commande et les reçus."
        >
          <Field label="Nom de la boutique">
            <input className={styles.settingsInput} value={s.nomBoutique}
              onChange={e => patch({ nomBoutique: e.target.value })} placeholder="Nom de la boutique" />
          </Field>
          <Field label="Email de contact" hint="Reçoit les notifications de commande">
            <input className={styles.settingsInput} type="email" value={s.emailContact}
              onChange={e => patch({ emailContact: e.target.value })} placeholder="contact@example.com" />
          </Field>
          <Field label="Téléphone">
            <input className={styles.settingsInput} type="tel" value={s.telephone}
              onChange={e => patch({ telephone: e.target.value })} placeholder="+228 90 00 00 00" />
          </Field>
          <Field label="Devise" hint="Utilisée sur toutes les commandes en ligne">
            <select className={styles.settingsSelect} value={s.devise}
              onChange={e => patch({ devise: e.target.value })}>
              <option value="XOF">XOF — Franc CFA (BCEAO)</option>
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — Dollar américain</option>
              <option value="GHS">GHS — Cedi ghanéen</option>
            </select>
          </Field>
        </Section>

        {/* ── Méthodes de paiement ──────────────────────────────── */}
        <Section
          title="Méthodes de paiement"
          desc="Activez les modes de règlement acceptés sur votre boutique."
        >
          {s.methods.map(m => (
            <ToggleRow key={m.id} label={m.label} desc={m.description}
              on={m.enabled} onChange={() => toggleMethod(m.id)} />
          ))}
        </Section>

        {/* ── Notifications ─────────────────────────────────────── */}
        <Section
          title="Notifications"
          desc="Choisissez comment vous êtes alerté à chaque nouvelle commande."
        >
          <ToggleRow label="WhatsApp" desc="Message WhatsApp au numéro de la boutique"
            on={s.notifWhatsapp} onChange={v => patch({ notifWhatsapp: v })} />
          <ToggleRow label="Email" desc="Email envoyé à l'adresse de contact"
            on={s.notifEmail} onChange={v => patch({ notifEmail: v })} />
        </Section>

        {/* ── Zone danger ───────────────────────────────────────── */}
        <Section title="Zone danger">
          {(['reset', 'archive', 'delete'] as DangerAction[]).map(action => {
            const copy = DANGER_COPY[action];
            return (
              <div key={action} className={styles.settingsRow}>
                <div className={styles.settingsRowLabel}>
                  <div className={styles.settingsRowLabelText} style={{ color: 'var(--danger)' }}>{copy.title}</div>
                  <div className={styles.settingsRowLabelHint}>{copy.desc}</div>
                </div>
                <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={() => setDangerAction(action)}>
                  {copy.btn}
                </button>
              </div>
            );
          })}
        </Section>

      </div>

      {dangerAction && (
        <ConfirmDangerModal
          action={dangerAction}
          shopNom={s.nomBoutique}
          onClose={() => setDangerAction(null)}
          onDone={flash}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 300, padding: '11px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 11, fontSize: 13, fontWeight: 500 }}>
          {toast}
        </div>
      )}
    </>
  );
}
