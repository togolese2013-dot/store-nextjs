/**
 * ReglagesPage — Store workspace settings
 * Sections: boutique info, paiements, notifications, danger zone
 * Persistence: localStorage key "store_reglages"
 */
'use client';

import React, { useEffect, useState } from 'react';
import { CogIcon, CheckIcon } from './icons';
import styles from './Store.module.css';

/* ─── Persisted shape ────────────────────────────────────────────── */
interface StoreSettings {
  nomBoutique:   string;
  emailContact:  string;
  telephone:     string;
  devise:        string;
  wave:          boolean;
  orangeMoney:   boolean;
  carte:         boolean;
  cash:          boolean;
  notifWhatsapp: boolean;
  notifEmail:    boolean;
  boutiqueActive: boolean;
}

const LS_KEY = 'store_reglages';

const DEFAULTS: StoreSettings = {
  nomBoutique:    'Maison Diallo',
  emailContact:   'contact@maisondiallo.com',
  telephone:      '+228 90 00 00 00',
  devise:         'XOF',
  wave:           true,
  orangeMoney:    true,
  carte:          false,
  cash:           true,
  notifWhatsapp:  true,
  notifEmail:     true,
  boutiqueActive: true,
};

function loadSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) } as StoreSettings;
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(s: StoreSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

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

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ReglagesPage() {
  const [s, setS] = useState<StoreSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  /* Load from localStorage on mount */
  useEffect(() => {
    setS(loadSettings());
  }, []);

  const patch = (partial: Partial<StoreSettings>) => setS(prev => ({ ...prev, ...partial }));

  const handleSave = () => {
    saveSettings(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Réglages</div>
          <h1 className={styles.title}>Réglages <span className={styles.serif}>boutique</span></h1>
          <p className={styles.subtitle}>Configurez les informations, paiements et notifications de votre boutique en ligne.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={handleSave}
          >
            {saved ? <CheckIcon size={14} /> : <CogIcon size={14} />}
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.settingsBody}>

        {/* ── Informations boutique ──────────────────────────────── */}
        <Section
          title="Informations boutique"
          desc="Visible par vos clients sur la page de commande et les reçus."
        >
          <Field label="Nom de la boutique">
            <input
              className={styles.settingsInput}
              value={s.nomBoutique}
              onChange={e => patch({ nomBoutique: e.target.value })}
              placeholder="Nom de la boutique"
            />
          </Field>
          <Field label="Email de contact" hint="Reçoit les notifications de commande">
            <input
              className={styles.settingsInput}
              type="email"
              value={s.emailContact}
              onChange={e => patch({ emailContact: e.target.value })}
              placeholder="contact@example.com"
            />
          </Field>
          <Field label="Téléphone">
            <input
              className={styles.settingsInput}
              type="tel"
              value={s.telephone}
              onChange={e => patch({ telephone: e.target.value })}
              placeholder="+228 90 00 00 00"
            />
          </Field>
          <Field label="Devise" hint="Utilisée sur toutes les commandes en ligne">
            <select
              className={styles.settingsSelect}
              value={s.devise}
              onChange={e => patch({ devise: e.target.value })}
            >
              <option value="XOF">XOF — Franc CFA (BCEAO)</option>
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — Dollar américain</option>
              <option value="GHS">GHS — Cedi ghanéen</option>
            </select>
          </Field>
        </Section>

        {/* ── Méthodes de paiement ───────────────────────────────── */}
        <Section
          title="Méthodes de paiement"
          desc="Activez les modes de règlement acceptés sur votre boutique."
        >
          <ToggleRow label="Wave" desc="Paiement mobile Wave (numéro Wave du client)"
            on={s.wave} onChange={v => patch({ wave: v })} />
          <ToggleRow label="Orange Money" desc="Paiement mobile Orange Money"
            on={s.orangeMoney} onChange={v => patch({ orangeMoney: v })} />
          <ToggleRow label="Carte bancaire" desc="Visa / Mastercard via passerelle de paiement"
            on={s.carte} onChange={v => patch({ carte: v })} />
          <ToggleRow label="Paiement à la livraison" desc="Le client règle en espèces à la réception"
            on={s.cash} onChange={v => patch({ cash: v })} />
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

        {/* ── Zone danger ────────────────────────────────────────── */}
        <Section title="Zone danger">
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowLabel}>
              <div className={styles.settingsRowLabelText} style={{ color: 'var(--danger)' }}>
                {s.boutiqueActive ? 'Désactiver la boutique' : 'Réactiver la boutique'}
              </div>
              <div className={styles.settingsRowLabelHint}>
                {s.boutiqueActive
                  ? 'La boutique ne sera plus visible — les commandes en cours restent accessibles.'
                  : 'La boutique redevient accessible à vos clients.'}
              </div>
            </div>
            <button
              type="button"
              className={`${styles.btn} ${s.boutiqueActive ? styles.danger : ''}`}
              onClick={() => {
                const next = { ...s, boutiqueActive: !s.boutiqueActive };
                setS(next);
                saveSettings(next); // save immediately for danger action
              }}
            >
              {s.boutiqueActive ? 'Désactiver' : 'Réactiver'}
            </button>
          </div>
        </Section>

      </div>
    </>
  );
}
