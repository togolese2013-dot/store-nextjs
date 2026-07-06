/**
 * ContenuVitrinePage — Store workspace: hero, bandeau de confiance, bannière de publicité.
 * Persistence: real backend (/api/admin/settings + /api/admin/upload).
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './Store.module.css';
import { CogIcon } from './icons';

/* ─── Types ──────────────────────────────────────────────────────── */
interface HeroSlide {
  image: string; image_mobile: string;
  eyebrow: string; title: string; subtitle: string;
  cta_label: string; cta_href: string;
  gradient: string; accent: string;
}
interface TrustItem { label: string; sub: string }

const TRUST_LABELS = ['Livraison', 'Paiement', 'Retours', 'Confiance'];

const DEFAULT_SLIDE: HeroSlide = {
  image: '', image_mobile: '', eyebrow: '', title: '', subtitle: '',
  cta_label: 'Voir', cta_href: '/products',
  gradient: 'from-[#052e16] via-[#14532d] to-[#166534]', accent: '#E07A2C',
};
const DEFAULT_TRUST: TrustItem[] = [
  { label: 'Livraison rapide',        sub: 'Lomé & tout le Togo' },
  { label: 'Paiement à la livraison', sub: 'Vous payez à la réception' },
  { label: 'Retours acceptés',        sub: '7 jours après réception' },
  { label: '100% authentique',        sub: 'Produits vérifiés' },
];

interface S {
  slides: HeroSlide[];
  trust: TrustItem[];
  bar_text: string; bar_enabled: boolean; bar_bg: string; bar_color: string;
  bar_start: string; bar_end: string;
}
const DEFAULTS: S = {
  slides: [{ ...DEFAULT_SLIDE }],
  trust: DEFAULT_TRUST,
  bar_text: '', bar_enabled: true, bar_bg: '#14110E', bar_color: '#ffffff',
  bar_start: '', bar_end: '',
};

/* ─── UI atoms (mirrors ReglagesPage) ───────────────────────────── */
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
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}>
      <span className={styles.toggleKnob} />
    </button>
  );
}

/* ─── Image upload button ───────────────────────────────────────── */
function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
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
      if (res.ok && data.urls?.[0]) onChange(data.urls[0]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 72, height: 44, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {value
          ? <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 9, color: 'var(--muted-2)' }}>Aucune</span>}
      </div>
      <button type="button" className={styles.btn} disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? 'Envoi…' : value ? 'Changer' : 'Téléverser'}
      </button>
      {value && (
        <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={() => onChange('')}>Retirer</button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ContenuVitrinePage() {
  const [s, setS] = useState<S>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(r => r.json())
      .then((cfg: Record<string, string>) => {
        let slides = DEFAULTS.slides;
        try {
          const parsed = JSON.parse(cfg.hero_slides_json ?? '[]');
          if (Array.isArray(parsed) && parsed.length) {
            slides = parsed.map((sl: Partial<HeroSlide>) => ({ ...DEFAULT_SLIDE, ...sl }));
          }
        } catch { /* keep defaults */ }

        let trust = DEFAULTS.trust;
        try {
          const parsed = JSON.parse(cfg.trust_bar_json ?? '[]');
          if (Array.isArray(parsed) && parsed.length === 4) trust = parsed;
        } catch { /* keep defaults */ }

        setS(prev => ({
          ...prev,
          slides, trust,
          bar_text:    cfg.announcement_bar ?? prev.bar_text,
          bar_enabled: cfg.announcement_bar_enabled !== 'false',
          bar_bg:      cfg.announcement_bar_bg    || prev.bar_bg,
          bar_color:   cfg.announcement_bar_color || prev.bar_color,
          bar_start:   cfg.announcement_bar_start || '',
          bar_end:     cfg.announcement_bar_end   || '',
        }));
      })
      .catch(() => {});
  }, []);

  function updateSlide(i: number, field: keyof HeroSlide, value: string) {
    setS(prev => ({ ...prev, slides: prev.slides.map((sl, idx) => idx === i ? { ...sl, [field]: value } : sl) }));
  }
  function addSlide() {
    setS(prev => ({ ...prev, slides: [...prev.slides, { ...DEFAULT_SLIDE }] }));
  }
  function removeSlide(i: number) {
    setS(prev => ({ ...prev, slides: prev.slides.filter((_, idx) => idx !== i) }));
  }
  function updateTrust(i: number, field: keyof TrustItem, value: string) {
    setS(prev => ({ ...prev, trust: prev.trust.map((t, idx) => idx === i ? { ...t, [field]: value } : t) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_slides_json: JSON.stringify(s.slides),
          trust_bar_json:   JSON.stringify(s.trust),
          announcement_bar:         s.bar_text,
          announcement_bar_enabled: String(s.bar_enabled),
          announcement_bar_bg:      s.bar_bg,
          announcement_bar_color:   s.bar_color,
          announcement_bar_start:   s.bar_start,
          announcement_bar_end:     s.bar_end,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Contenu vitrine</div>
          <h1 className={styles.title}>Contenu <span className={styles.serif}>vitrine</span></h1>
          <p className={styles.subtitle}>Images hero, bandeau de confiance et bannière de publicité affichés sur votre boutique.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={handleSave} disabled={saving}>
            <CogIcon size={14} />
            {saving ? 'Enregistrement…' : saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className={styles.settingsBody}>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <Section title="Images hero" desc="Slides affichés en haut de la page d'accueil — image desktop et mobile séparées.">
          {s.slides.map((slide, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13 }}>Slide {i + 1}</strong>
                {s.slides.length > 1 && (
                  <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={() => removeSlide(i)}>Supprimer</button>
                )}
              </div>
              <Field label="Image desktop" hint="Format large, ex. 1600×600 px">
                <ImageUpload label="Desktop" value={slide.image} onChange={v => updateSlide(i, 'image', v)} />
              </Field>
              <Field label="Image mobile" hint="Format vertical/carré, ex. 800×800 px">
                <ImageUpload label="Mobile" value={slide.image_mobile} onChange={v => updateSlide(i, 'image_mobile', v)} />
              </Field>
              <Field label="Titre">
                <input className={styles.settingsInput} value={slide.title}
                  onChange={e => updateSlide(i, 'title', e.target.value)} placeholder="Capturez chaque moment parfait" />
              </Field>
              <Field label="Sous-titre">
                <input className={styles.settingsInput} value={slide.subtitle}
                  onChange={e => updateSlide(i, 'subtitle', e.target.value)} placeholder="Description courte du slide" />
              </Field>
              <Field label="Texte du bouton">
                <input className={styles.settingsInput} value={slide.cta_label}
                  onChange={e => updateSlide(i, 'cta_label', e.target.value)} placeholder="Découvrir le catalogue" />
              </Field>
              <Field label="Lien du bouton">
                <input className={styles.settingsInput} value={slide.cta_href}
                  onChange={e => updateSlide(i, 'cta_href', e.target.value)} placeholder="/products" />
              </Field>
            </div>
          ))}
          <button type="button" className={styles.btn} onClick={addSlide}>+ Ajouter un slide</button>
        </Section>

        {/* ── Bandeau de confiance ───────────────────────────────── */}
        <Section title="Bandeau de confiance" desc="Les 4 arguments affichés juste sous le hero.">
          {s.trust.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 90, fontSize: 11.5, color: 'var(--muted)', paddingTop: 9, flexShrink: 0 }}>{TRUST_LABELS[i]}</div>
              <input className={styles.settingsInput} value={t.label}
                onChange={e => updateTrust(i, 'label', e.target.value)} placeholder="Titre" style={{ flex: 1 }} />
              <input className={styles.settingsInput} value={t.sub}
                onChange={e => updateTrust(i, 'sub', e.target.value)} placeholder="Sous-titre" style={{ flex: 1 }} />
            </div>
          ))}
        </Section>

        {/* ── Bannière de publicité ──────────────────────────────── */}
        <Section title="Bannière de publicité" desc="Message en haut de toutes les pages du site vitrine.">
          <Field label="Activée">
            <Toggle on={s.bar_enabled} onChange={v => setS(prev => ({ ...prev, bar_enabled: v }))} />
          </Field>
          <Field label="Texte">
            <input className={styles.settingsInput} value={s.bar_text}
              onChange={e => setS(prev => ({ ...prev, bar_text: e.target.value }))}
              placeholder="Livraison gratuite dès 50 000 FCFA d'achat" />
          </Field>
          <div style={{ display: 'flex', gap: 14 }}>
            <Field label="Couleur de fond">
              <input type="color" value={s.bar_bg} onChange={e => setS(prev => ({ ...prev, bar_bg: e.target.value }))}
                style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
            </Field>
            <Field label="Couleur du texte">
              <input type="color" value={s.bar_color} onChange={e => setS(prev => ({ ...prev, bar_color: e.target.value }))}
                style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <Field label="Date de début" hint="Optionnel">
              <input type="date" className={styles.settingsInput} value={s.bar_start}
                onChange={e => setS(prev => ({ ...prev, bar_start: e.target.value }))} />
            </Field>
            <Field label="Date de fin" hint="Optionnel">
              <input type="date" className={styles.settingsInput} value={s.bar_end}
                onChange={e => setS(prev => ({ ...prev, bar_end: e.target.value }))} />
            </Field>
          </div>
          {s.bar_text && (
            <div style={{ padding: '10px 14px', borderRadius: 8, textAlign: 'center', fontSize: 12.5, fontWeight: 500, background: s.bar_bg, color: s.bar_color }}>
              {s.bar_text}
            </div>
          )}
        </Section>

      </div>
    </>
  );
}
