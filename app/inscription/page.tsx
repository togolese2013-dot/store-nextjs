'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function toSlug(str: string) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const PLANS = [
  { id: 'basic',    label: 'Starter',    price: '9 000 F / mois',  desc: 'Boutique · Caisse · Stock' },
  { id: 'pro',      label: 'Business',   price: '25 000 F / mois', desc: 'Tous les espaces · E-commerce · CRM' },
];

export default function InscriptionPage() {
  const router = useRouter();

  const [shopNom,       setShopNom]       = useState('');
  const [shopSlug,      setShopSlug]      = useState('');
  const [slugEdited,    setSlugEdited]    = useState(false);
  const [slugStatus,    setSlugStatus]    = useState<'idle'|'checking'|'ok'|'taken'>('idle');
  const [shopEmail,     setShopEmail]     = useState('');
  const [adminNom,      setAdminNom]      = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail,    setAdminEmail]    = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [plan,          setPlan]          = useState('basic');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  // Auto-generate slug from shop name
  useEffect(() => {
    if (!slugEdited && shopNom) setShopSlug(toSlug(shopNom));
  }, [shopNom, slugEdited]);

  // Check slug availability
  useEffect(() => {
    if (!shopSlug || shopSlug.length < 3) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    const t = setTimeout(() => {
      fetch(`/api/admin/onboarding/check-slug?slug=${shopSlug}`)
        .then(r => r.json())
        .then(d => setSlugStatus(d.available ? 'ok' : 'taken'))
        .catch(() => setSlugStatus('idle'));
    }, 500);
    return () => clearTimeout(t);
  }, [shopSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (slugStatus === 'taken') { setError('Ce slug est déjà utilisé.'); return; }
    if (adminPassword.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_nom: shopNom, shop_slug: shopSlug, shop_email: shopEmail, shop_plan: plan,
          admin_nom: adminNom, admin_username: adminUsername,
          admin_email: adminEmail || shopEmail, admin_password: adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur serveur'); return; }
      router.push('/admin/login?welcome=1');
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }

  const slugColor = slugStatus === 'ok' ? '#2D6A4F' : slugStatus === 'taken' ? '#9C3A14' : '#8A8278';
  const slugMsg   = slugStatus === 'ok' ? '✓ Disponible' : slugStatus === 'taken' ? '✗ Déjà pris' : slugStatus === 'checking' ? '…' : '';

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#14110E', marginBottom: 28 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: '#C9601E', display: 'grid', placeItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9h18l-1.5-4.5A1 1 0 0 0 18.55 4H5.45a1 1 0 0 0-.95.7L3 9z"/>
              <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/>
              <path d="M9 13h6"/>
            </svg>
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Afrisika</span>
        </a>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Créer votre boutique</h1>
        <p style={{ fontSize: 15, color: '#6B635B', margin: 0 }}>14 jours d'essai gratuit · Aucune carte requise</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Section boutique */}
        <Section title="Votre boutique">
          <Field label="Nom de la boutique">
            <input style={inp} value={shopNom} onChange={e => setShopNom(e.target.value)} placeholder="Ex. Boutique Améyo" required />
          </Field>
          <Field label={<span>Adresse web <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#8A8278' }}>afrisika.tg/<b>{shopSlug || '…'}</b></span></span>}>
            <div style={{ position: 'relative' }}>
              <input style={inp} value={shopSlug}
                onChange={e => { setShopSlug(e.target.value); setSlugEdited(true); }}
                placeholder="boutique-ameyo" required />
              {slugMsg && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: slugColor }}>{slugMsg}</span>}
            </div>
          </Field>
          <Field label="Email de la boutique">
            <input style={inp} type="email" value={shopEmail} onChange={e => setShopEmail(e.target.value)} placeholder="contact@maboutique.com" required />
          </Field>
        </Section>

        {/* Section plan */}
        <Section title="Choisir un plan">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {PLANS.map(p => (
              <button key={p.id} type="button" onClick={() => setPlan(p.id)} style={{
                border: `2px solid ${plan === p.id ? '#C9601E' : '#E8E1D4'}`,
                borderRadius: 12, padding: '14px 16px', background: plan === p.id ? '#FBE9D6' : 'white',
                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: plan === p.id ? '#C9601E' : '#14110E' }}>{p.label}</div>
                <div style={{ fontSize: 12, color: '#6B635B', marginTop: 3 }}>{p.price}</div>
                <div style={{ fontSize: 11, color: '#8A8278', marginTop: 4 }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Section compte admin */}
        <Section title="Votre compte administrateur">
          <Field label="Votre nom">
            <input style={inp} value={adminNom} onChange={e => setAdminNom(e.target.value)} placeholder="Kofi Mensah" required />
          </Field>
          <Field label="Identifiant de connexion">
            <input style={inp} value={adminUsername} onChange={e => setAdminUsername(e.target.value)} placeholder="kofi_mensah" pattern="[a-zA-Z0-9_]{3,30}" title="3–30 caractères, lettres/chiffres/underscore" required />
          </Field>
          <Field label="Email (pour récupération)">
            <input style={inp} type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="kofi@email.com (facultatif)" />
          </Field>
          <Field label="Mot de passe">
            <input style={inp} type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="8 caractères minimum" minLength={8} required />
          </Field>
        </Section>

        {error && (
          <div style={{ background: '#F7DCCB', border: '1px solid rgba(156,58,20,.25)', borderRadius: 10, padding: '12px 16px', fontSize: 13.5, color: '#7D2D0E', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || slugStatus === 'taken'} style={{
          background: loading ? '#E8E1D4' : '#14110E', color: loading ? '#8A8278' : 'white',
          border: 0, borderRadius: 12, padding: '15px 24px', fontSize: 15, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .15s',
        }}>
          {loading ? 'Création en cours…' : 'Créer ma boutique →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#8A8278', marginTop: 20 }}>
          Déjà un compte ? <a href="/admin/login" style={{ color: '#C9601E', textDecoration: 'none', fontWeight: 500 }}>Se connecter</a>
        </p>
      </form>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1.5px solid #E8E1D4', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, background: 'white',
  outline: 'none', fontFamily: 'inherit', color: '#14110E',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E8E1D4', borderRadius: 16, padding: '24px 24px 20px', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8A8278', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6B635B', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
