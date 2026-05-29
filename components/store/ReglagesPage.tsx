/**
 * ReglagesPage — Store workspace settings
 * Sections: boutique info, paiements, notifications, danger zone
 */
'use client';

import React, { useState } from 'react';
import { CogIcon, CheckIcon } from './icons';
import styles from './Store.module.css';

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
      <div className={styles.settingsCard}>
        {children}
      </div>
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
  /* --- Boutique info --- */
  const [nomBoutique,  setNomBoutique]  = useState('Maison Diallo');
  const [emailContact, setEmailContact] = useState('contact@maisondiallo.com');
  const [telephone,    setTelephone]    = useState('+228 90 00 00 00');
  const [devise,       setDevise]       = useState('XOF');
  const [saved, setSaved] = useState(false);

  /* --- Paiements --- */
  const [wave,         setWave]         = useState(true);
  const [orangeMoney,  setOrangeMoney]  = useState(true);
  const [carte,        setCarte]        = useState(false);
  const [cash,         setCash]         = useState(true);

  /* --- Notifications --- */
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifEmail,    setNotifEmail]    = useState(true);

  /* --- Boutique active --- */
  const [boutiqueActive, setBoutiqueActive] = useState(true);

  const handleSave = () => {
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
            {saved ? 'Enregistré' : 'Enregistrer'}
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
              value={nomBoutique}
              onChange={e => setNomBoutique(e.target.value)}
              placeholder="Nom de la boutique"
            />
          </Field>
          <Field label="Email de contact" hint="Reçoit les notifications de commande">
            <input
              className={styles.settingsInput}
              type="email"
              value={emailContact}
              onChange={e => setEmailContact(e.target.value)}
              placeholder="contact@example.com"
            />
          </Field>
          <Field label="Téléphone">
            <input
              className={styles.settingsInput}
              type="tel"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              placeholder="+228 90 00 00 00"
            />
          </Field>
          <Field label="Devise" hint="Utilisée sur toutes les commandes en ligne">
            <select
              className={styles.settingsSelect}
              value={devise}
              onChange={e => setDevise(e.target.value)}
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
          <ToggleRow
            label="Wave"
            desc="Paiement mobile Wave (numéro Wave du client)"
            on={wave}
            onChange={setWave}
          />
          <ToggleRow
            label="Orange Money"
            desc="Paiement mobile Orange Money"
            on={orangeMoney}
            onChange={setOrangeMoney}
          />
          <ToggleRow
            label="Carte bancaire"
            desc="Visa / Mastercard via passerelle de paiement"
            on={carte}
            onChange={setCarte}
          />
          <ToggleRow
            label="Paiement à la livraison"
            desc="Le client règle en espèces à la réception"
            on={cash}
            onChange={setCash}
          />
        </Section>

        {/* ── Notifications ─────────────────────────────────────── */}
        <Section
          title="Notifications"
          desc="Choisissez comment vous êtes alerté à chaque nouvelle commande."
        >
          <ToggleRow
            label="WhatsApp"
            desc="Message WhatsApp au numéro de la boutique"
            on={notifWhatsapp}
            onChange={setNotifWhatsapp}
          />
          <ToggleRow
            label="Email"
            desc="Email envoyé à l'adresse de contact"
            on={notifEmail}
            onChange={setNotifEmail}
          />
        </Section>

        {/* ── Zone danger ────────────────────────────────────────── */}
        <Section title="Zone danger">
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowLabel}>
              <div className={styles.settingsRowLabelText} style={{ color: 'var(--danger)' }}>
                {boutiqueActive ? 'Désactiver la boutique' : 'Réactiver la boutique'}
              </div>
              <div className={styles.settingsRowLabelHint}>
                {boutiqueActive
                  ? 'La boutique ne sera plus visible — les commandes en cours restent accessibles.'
                  : 'La boutique redevient accessible à vos clients.'}
              </div>
            </div>
            <button
              type="button"
              className={`${styles.btn} ${boutiqueActive ? styles.danger : ''}`}
              onClick={() => setBoutiqueActive(v => !v)}
            >
              {boutiqueActive ? 'Désactiver' : 'Réactiver'}
            </button>
          </div>
        </Section>

      </div>
    </>
  );
}
