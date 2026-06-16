'use client';

import React, { useEffect, useState } from 'react';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

// ── Local types ───────────────────────────────────────────────────
type SettingsSection = 'general' | 'devise' | 'stock' | 'equipe' | 'notifs' | 'donnees';
type MemberRole     = 'Admin' | 'Gérant' | 'Vendeur';
type ThousandSep    = 'espace' | 'point' | 'virgule';
type SymbolPos      = 'avant' | 'apres';
type ValMethod      = 'CMUP' | 'FIFO';
type NotifFreq      = 'quotidien' | 'hebdomadaire' | 'aucun';
type ExportFmt      = 'CSV' | 'Excel' | 'PDF';
interface TeamMember { nom: string; email: string; role: MemberRole; avi: string; color: string; }

// ── Constants ─────────────────────────────────────────────────────
const NAV: Array<{ id: SettingsSection; label: string; icon: string }> = [
  { id: 'general', label: 'Général',          icon: '⚙'  },
  { id: 'devise',  label: 'Devise & Formats', icon: '₣'  },
  { id: 'stock',   label: 'Stock & Appro.',   icon: '📦' },
  { id: 'equipe',  label: 'Équipe & Accès',   icon: '👥' },
  { id: 'notifs',  label: 'Notifications',    icon: '🔔' },
  { id: 'donnees', label: 'Données & Export', icon: '💾' },
];

const COUNTRIES      = ['Togo', "Côte d'Ivoire", 'Sénégal', 'Mali', 'Ghana', 'Burkina Faso', 'Bénin', 'Nigeria'];
const CURRENCIES     = ['FCFA (XOF)', 'EUR (€)', 'USD ($)', 'GHS (₵)', 'NGN (₦)'];
const EXPORT_SCOPES  = ['Produits', 'Fournisseurs', 'Achats', 'Mouvements', 'Ajustements'];
const ROLE_MAP: Record<string, MemberRole> = {
  admin: 'Admin', super_admin: 'Admin', manager: 'Gérant', staff: 'Vendeur',
};
const ROLE_DB: Record<MemberRole, string> = {
  Admin: 'admin', Gérant: 'manager', Vendeur: 'staff',
};
const MEMBER_COLORS = ['#3B6A8F','#2D6A4F','#5C4A88','#C9601E','#7A2C3A','#D4A437'];

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h);
}

// ── Sub-components ────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)} role="switch" aria-checked={on}
      style={{
        width: 40, height: 22, borderRadius: 99,
        background: on ? 'var(--ok)' : 'var(--border)',
        border: 0, padding: 2, cursor: 'pointer', flexShrink: 0,
        transition: 'background .2s', display: 'flex', alignItems: 'center',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 99, background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transform: on ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform .2s',
      }} />
    </button>
  );
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={styles.sField} style={full ? { gridColumn: '1 / -1' } : {}}>
      <label className={styles.sFieldLabel}>{label}</label>
      {children}
      {hint && <div className={styles.sFieldHint}>{hint}</div>}
    </div>
  );
}

function SectionCard({ title, sub, children }: { title?: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className={styles.settingsCard}>
      {(title || sub) && (
        <div className={styles.settingsCardHead}>
          {title && <div className={styles.settingsCardTitle}>{title}</div>}
          {sub && <div className={styles.settingsCardSub}>{sub}</div>}
        </div>
      )}
      <div className={styles.settingsCardBody}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function Seg<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ v: T; l: string; sub?: string }>;
}) {
  return (
    <div className={styles.segmented}>
      {options.map(o => (
        <button key={o.v}
          className={`${styles.segmentedBtn}${value === o.v ? ` ${styles.segmentedBtnOn}` : ''}`}
          onClick={() => onChange(o.v)}
          style={o.sub ? { textAlign: 'left', padding: '9px 12px' } : undefined}
        >
          {o.sub ? (
            <>
              <div style={{ fontWeight: 600 }}>{o.l}</div>
              <div style={{ fontSize: 11, color: value === o.v ? 'var(--muted)' : 'var(--muted-2)', marginTop: 2 }}>{o.sub}</div>
            </>
          ) : o.l}
        </button>
      ))}
    </div>
  );
}

function Sel({ value, onChange, children, style }: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div className={styles.selectWrap} style={style}>
      <select
        className={styles.formSelect}
        value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', paddingRight: 28, cursor: 'pointer' }}
      >
        {children}
      </select>
      <span className={styles.selectArrow}>▾</span>
    </div>
  );
}

function roleBadgeStyle(role: MemberRole): React.CSSProperties {
  if (role === 'Admin')  return { background: 'var(--accent-bg)', color: 'var(--accent)' };
  if (role === 'Gérant') return { background: 'var(--ok-bg)',     color: 'var(--ok)' };
  return { background: 'rgba(20,17,14,.06)', color: 'var(--muted)' };
}

// ── Main component ────────────────────────────────────────────────
export default function ReglagesPage() {
  const ui = useUI();
  const [section, setSection] = useState<SettingsSection>('general');
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  // Général
  const [nom,     setNom]     = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville,   setVille]   = useState('');
  const [pays,    setPays]    = useState('Togo');
  const [email,   setEmail]   = useState('');
  const [tel,     setTel]     = useState('');

  // Devise
  const [devise,     setDevise]     = useState('FCFA (XOF)');
  const [separateur, setSeparateur] = useState<ThousandSep>('espace');
  const [symbolePos, setSymbolePos] = useState<SymbolPos>('apres');
  const [tva,        setTva]        = useState('0');

  // Stock
  const [warehouses,     setWarehouses]     = useState<{ id: string; name: string }[]>([]);
  const [entrepotDefaut, setEntrepotDefaut] = useState('');
  const [seuilAlerte,    setSeuilAlerte]    = useState('10');
  const [methodeValo,    setMethodeValo]    = useState<ValMethod>('CMUP');
  const [refFormat,      setRefFormat]      = useState('ACH-{YYYY}-{NNN}');
  const [autoRef,        setAutoRef]        = useState(true);

  // Équipe
  const [membres, setMembres] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState<MemberRole>('Vendeur');
  const [inviteError, setInviteError] = useState(false);

  // Notifs
  const [notifEmail,        setNotifEmail]        = useState(true);
  const [notifSMS,          setNotifSMS]          = useState(false);
  const [notifWhatsApp,     setNotifWhatsApp]     = useState(true);
  const [notifRuptureStock, setNotifRuptureStock] = useState(true);
  const [notifNouvelAchat,  setNotifNouvelAchat]  = useState(true);
  const [notifReception,    setNotifReception]    = useState(true);
  const [notifResume,       setNotifResume]       = useState<NotifFreq>('quotidien');

  // Données
  const [exportFmt,   setExportFmt]   = useState<ExportFmt>('Excel');
  const [archiveAuto, setArchiveAuto] = useState('12');

  // ── Fetch all data on mount ────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings/shop-profile').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/settings').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/settings/team').then(r => r.json()).catch(() => ({ users: [] })),
      fetch('/api/admin/entrepots').then(r => r.json()).catch(() => ({ entrepots: [] })),
    ]).then(([profile, settings, team, wh]) => {
      // Général
      if (profile.nom)       setNom(profile.nom);
      if (profile.email)     setEmail(profile.email);
      if (profile.telephone) setTel(profile.telephone);
      if (profile.adresse)   setAdresse(profile.adresse);
      if (profile.ville)     setVille(profile.ville);
      if (profile.pays)      setPays(profile.pays);

      // Devise
      if (settings.devise_devise)      setDevise(settings.devise_devise);
      if (settings.devise_separateur)  setSeparateur(settings.devise_separateur as ThousandSep);
      if (settings.devise_symbole_pos) setSymbolePos(settings.devise_symbole_pos as SymbolPos);
      if (settings.devise_tva)         setTva(settings.devise_tva);

      // Stock
      if (settings.stock_seuil_alerte)  setSeuilAlerte(settings.stock_seuil_alerte);
      if (settings.stock_methode_valo)  setMethodeValo(settings.stock_methode_valo as ValMethod);
      if (settings.stock_ref_format)    setRefFormat(settings.stock_ref_format);
      if (settings.stock_auto_ref !== undefined) setAutoRef(settings.stock_auto_ref === 'true');

      // Warehouses list + default
      const wlist = (wh.entrepots ?? []).map((e: any) => ({ id: String(e.id), name: e.nom }));
      setWarehouses(wlist);
      if (settings.stock_entrepot_defaut) setEntrepotDefaut(settings.stock_entrepot_defaut);
      else if (wlist[0]) setEntrepotDefaut(wlist[0].id);

      // Notifs
      if (settings.notif_email         !== undefined) setNotifEmail(settings.notif_email === 'true');
      if (settings.notif_sms           !== undefined) setNotifSMS(settings.notif_sms === 'true');
      if (settings.notif_whatsapp      !== undefined) setNotifWhatsApp(settings.notif_whatsapp === 'true');
      if (settings.notif_rupture_stock !== undefined) setNotifRuptureStock(settings.notif_rupture_stock === 'true');
      if (settings.notif_nouvel_achat  !== undefined) setNotifNouvelAchat(settings.notif_nouvel_achat === 'true');
      if (settings.notif_reception     !== undefined) setNotifReception(settings.notif_reception === 'true');
      if (settings.notif_resume)        setNotifResume(settings.notif_resume as NotifFreq);

      // Données
      if (settings.donnees_export_fmt)   setExportFmt(settings.donnees_export_fmt as ExportFmt);
      if (settings.donnees_archive_auto) setArchiveAuto(settings.donnees_archive_auto);

      // Équipe
      if (team.users) {
        setMembres((team.users as any[]).map((u, i) => ({
          nom:   u.nom ?? u.username,
          email: u.email ?? '',
          role:  ROLE_MAP[u.role] ?? 'Vendeur',
          avi:   (u.nom ?? u.username ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase(),
          color: MEMBER_COLORS[hashStr(u.email ?? u.username ?? String(i)) % MEMBER_COLORS.length],
        })));
      }
    }).finally(() => setLoading(false));
  }, []);

  const changeRole = (memberEmail: string, role: MemberRole) =>
    setMembres(prev => prev.map(m => m.email === memberEmail ? { ...m, role } : m));

  const removeMembre = (m: TeamMember) => {
    ui.confirmDelete('le membre', m.nom, {
      onConfirm: () => {
        setMembres(prev => prev.filter(x => x.email !== m.email));
        ui.toast(`${m.nom} retiré du magasin.`);
      },
    });
  };

  const sendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteError(true);
      setTimeout(() => setInviteError(false), 2000);
      return;
    }
    try {
      const res = await fetch('/api/admin/settings/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        ui.toast(d.error ?? 'Erreur lors de l\'invitation.');
        return;
      }
      ui.toast(`Membre ajouté : ${inviteEmail} · Rôle : ${inviteRole}`);
      setInviteEmail('');
      // Refresh team
      fetch('/api/admin/settings/team').then(r => r.json()).then(d => {
        if (d.users) setMembres((d.users as any[]).map((u, i) => ({
          nom: u.nom ?? u.username, email: u.email ?? '', role: ROLE_MAP[u.role] ?? 'Vendeur',
          avi: (u.nom ?? u.username ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase(),
          color: MEMBER_COLORS[hashStr(u.email ?? u.username ?? String(i)) % MEMBER_COLORS.length],
        })));
      }).catch(() => {});
    } catch { ui.toast('Erreur réseau.'); }
  };

  // ── Save all settings ─────────────────────────────────────────
  const handleSave = async () => {
    try {
      await Promise.all([
        fetch('/api/admin/settings/shop-profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom, email, telephone: tel, adresse, ville, pays }),
        }),
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            devise_devise:        devise,
            devise_separateur:    separateur,
            devise_symbole_pos:   symbolePos,
            devise_tva:           tva,
            stock_entrepot_defaut:entrepotDefaut,
            stock_seuil_alerte:   seuilAlerte,
            stock_methode_valo:   methodeValo,
            stock_ref_format:     refFormat,
            stock_auto_ref:       String(autoRef),
            notif_email:          String(notifEmail),
            notif_sms:            String(notifSMS),
            notif_whatsapp:       String(notifWhatsApp),
            notif_rupture_stock:  String(notifRuptureStock),
            notif_nouvel_achat:   String(notifNouvelAchat),
            notif_reception:      String(notifReception),
            notif_resume:         notifResume,
            donnees_export_fmt:   exportFmt,
            donnees_archive_auto: archiveAuto,
          }),
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      ui.toast('Réglages enregistrés');
    } catch {
      ui.toast('Erreur lors de la sauvegarde.');
    }
  };

  const formatPreview =
    separateur === 'espace' ? '975 000' :
    separateur === 'point'  ? '975.000' : '975,000';

  // ── Section content ───────────────────────────────────────────
  const sections: Record<SettingsSection, React.ReactNode> = {

    // GÉNÉRAL
    general: (
      <>
        <SectionCard title="Informations du magasin" sub="Ces informations apparaissent sur vos documents (bons de commande, factures).">
          <div className={styles.grid2}>
            <Field label="Nom du magasin" full>
              <input className={styles.formInput} value={nom} onChange={e => setNom(e.target.value)} />
            </Field>
            <Field label="Email professionnel">
              <input className={styles.formInput} type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <input className={styles.formInput} value={tel} onChange={e => setTel(e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Adresse physique">
          <div className={styles.grid2}>
            <Field label="Adresse" full>
              <input className={styles.formInput} value={adresse} onChange={e => setAdresse(e.target.value)} />
            </Field>
            <Field label="Ville">
              <input className={styles.formInput} value={ville} onChange={e => setVille(e.target.value)} />
            </Field>
            <Field label="Pays">
              <Sel value={pays} onChange={setPays}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </Sel>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Logo du magasin" sub="Format recommandé : PNG ou SVG, fond transparent, 200×200px minimum.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className={styles.logoPlaceholder}>
              <span style={{ fontSize: 10, textAlign: 'center' }}>LOGO</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className={styles.btn} onClick={() => ui.toast('Sélection de fichier')}>
                ↑ Choisir un fichier
              </button>
              <div style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>PNG, SVG, WebP · 2 Mo max</div>
            </div>
          </div>
        </SectionCard>
      </>
    ),

    // DEVISE
    devise: (
      <>
        <SectionCard title="Devise principale" sub="Utilisée pour tous les montants, exports et affichages du magasin.">
          <div className={styles.grid2}>
            <Field label="Devise">
              <Sel value={devise} onChange={setDevise}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </Sel>
            </Field>
            <Field label="Position du symbole">
              <Seg<SymbolPos>
                value={symbolePos} onChange={setSymbolePos}
                options={[
                  { v: 'avant', l: 'FCFA 975 000' },
                  { v: 'apres', l: '975 000 FCFA' },
                ]}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Format des nombres">
          <Field label="Séparateur de milliers">
            <Seg<ThousandSep>
              value={separateur} onChange={setSeparateur}
              options={[
                { v: 'espace',  l: 'Espace · 975 000'  },
                { v: 'point',   l: 'Point · 975.000'   },
                { v: 'virgule', l: 'Virgule · 975,000' },
              ]}
            />
          </Field>
          <div className={styles.formatPreview}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Aperçu du format</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 15, color: 'var(--accent)' }}>
              {formatPreview} {devise.split(' ')[0]}
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Taxes" sub="Taux appliqué par défaut sur les bons d'achat et documents.">
          <div className={styles.grid2}>
            <Field label="TVA par défaut (%)" hint="Laisser à 0 si hors taxe.">
              <input
                className={`${styles.formInput} ${styles.mono}`}
                type="number" min={0} max={100}
                value={tva} onChange={e => setTva(e.target.value)}
                style={{ textAlign: 'right' }}
              />
            </Field>
          </div>
        </SectionCard>
      </>
    ),

    // STOCK
    stock: (
      <>
        <SectionCard title="Entrepôt & Réceptions" sub="Paramètres par défaut pour les nouvelles réceptions de marchandises.">
          <div className={styles.grid2}>
            <Field label="Entrepôt par défaut">
              <Sel value={entrepotDefaut} onChange={setEntrepotDefaut}>
                {warehouses.length === 0
                  ? <option value="">Aucun entrepôt</option>
                  : warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Sel>
            </Field>
            <Field label="Seuil d'alerte stock global" hint="Nombre d'unités en dessous duquel une alerte est créée.">
              <input
                className={`${styles.formInput} ${styles.mono}`}
                type="number" min={0}
                value={seuilAlerte} onChange={e => setSeuilAlerte(e.target.value)}
                style={{ textAlign: 'right' }}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Valorisation du stock" sub="Méthode comptable utilisée pour calculer la valeur de votre inventaire.">
          <Seg<ValMethod>
            value={methodeValo} onChange={setMethodeValo}
            options={[
              { v: 'CMUP', l: 'CMUP', sub: 'Coût moyen unitaire pondéré' },
              { v: 'FIFO', l: 'FIFO', sub: 'Premier entré, premier sorti' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Références automatiques" sub="Format de génération des numéros de bons d'achat.">
          <ToggleRow
            label="Génération automatique des références"
            sub="Format : ACH-2026-001, ACH-2026-002…"
            on={autoRef} onChange={setAutoRef}
          />
          {autoRef && (
            <Field label="Modèle de référence" hint="Variables : {YYYY} = année, {MM} = mois, {NNN} = numéro séquentiel">
              <input className={`${styles.formInput} ${styles.mono}`} value={refFormat} onChange={e => setRefFormat(e.target.value)} />
            </Field>
          )}
        </SectionCard>
      </>
    ),

    // ÉQUIPE
    equipe: (
      <>
        <SectionCard
          title="Membres de l'équipe"
          sub={`${membres.length} membres · Gérez les accès et rôles de votre magasin.`}
        >
          <div>
            {membres.map((m, i) => (
              <div
                key={m.email} className={styles.memberRow}
                style={{ borderBottom: i < membres.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className={styles.memberAvatar} style={{ background: m.color }}>{m.avi}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{m.email}</div>
                </div>
                <span className={styles.roleBadge} style={roleBadgeStyle(m.role)}>{m.role}</span>
                <button
                  className={styles.iconBtnSm}
                  aria-label={`Options pour ${m.nom}`}
                  onClick={e => ui.menu(e, [
                    { label: 'Admin',   onClick: () => { changeRole(m.email, 'Admin');   ui.toast(`${m.nom} → Admin`);   } },
                    { label: 'Gérant',  onClick: () => { changeRole(m.email, 'Gérant');  ui.toast(`${m.nom} → Gérant`);  } },
                    { label: 'Vendeur', onClick: () => { changeRole(m.email, 'Vendeur'); ui.toast(`${m.nom} → Vendeur`); } },
                    { sep: true },
                    { label: 'Retirer du magasin', danger: true, onClick: () => removeMembre(m) },
                  ], 'right')}
                >
                  ···
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Inviter un membre" sub="L'invitation sera envoyée par email.">
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className={styles.formInput}
              style={{ flex: 1, borderColor: inviteError ? 'var(--danger)' : undefined }}
              placeholder="adresse@email.com"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteError(false); }}
              onKeyDown={e => e.key === 'Enter' && sendInvite()}
            />
            <Sel value={inviteRole} onChange={v => setInviteRole(v as MemberRole)} style={{ flexShrink: 0 }}>
              <option>Vendeur</option>
              <option>Gérant</option>
              <option>Admin</option>
            </Sel>
            <button className={`${styles.btn} ${styles.primary}`} onClick={sendInvite}>Inviter</button>
          </div>
          {inviteError && (
            <div style={{ fontSize: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              ⚠ Adresse email invalide
            </div>
          )}
        </SectionCard>
      </>
    ),

    // NOTIFS
    notifs: (
      <>
        <SectionCard title="Canaux de notification" sub="Choisissez comment recevoir les alertes et résumés.">
          {([
            { l: 'Email',    s: 'Alertes et résumés par email',  on: notifEmail,    set: setNotifEmail,    ic: '✉'  },
            { l: 'SMS',      s: 'Alertes critiques uniquement',  on: notifSMS,      set: setNotifSMS,      ic: '📱' },
            { l: 'WhatsApp', s: 'Notifications en temps réel',   on: notifWhatsApp, set: setNotifWhatsApp, ic: '💬' },
          ] as const).map((c, i, arr) => (
            <React.Fragment key={c.l}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={styles.channelIcon}>{c.ic}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.l}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.s}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {c.on && (
                    <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => ui.toast(`Test ${c.l} envoyé ✓`)}>
                      Tester
                    </button>
                  )}
                  <Toggle on={c.on} onChange={c.set} />
                </div>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </SectionCard>

        <SectionCard title="Événements notifiés" sub="Choisissez quels événements déclenchent une notification.">
          <ToggleRow label="Rupture de stock"    sub="Quand un produit passe sous le seuil d'alerte"    on={notifRuptureStock} onChange={setNotifRuptureStock} />
          <div style={{ height: 1, background: 'var(--border)' }} />
          <ToggleRow label="Nouvel achat créé"   sub="À chaque nouveau bon d'achat fournisseur"         on={notifNouvelAchat}  onChange={setNotifNouvelAchat}  />
          <div style={{ height: 1, background: 'var(--border)' }} />
          <ToggleRow label="Réception confirmée" sub="Quand un achat passe en statut Livré ou Partiel"  on={notifReception}    onChange={setNotifReception}    />
        </SectionCard>

        <SectionCard title="Résumé périodique">
          <Field label="Fréquence du résumé">
            <Seg<NotifFreq>
              value={notifResume} onChange={setNotifResume}
              options={[
                { v: 'quotidien',    l: 'Quotidien'    },
                { v: 'hebdomadaire', l: 'Hebdomadaire' },
                { v: 'aucun',        l: 'Aucun'        },
              ]}
            />
          </Field>
        </SectionCard>
      </>
    ),

    // DONNÉES
    donnees: (
      <>
        <SectionCard title="Export" sub="Paramètres par défaut pour les exports de données.">
          <Field label="Format d'export par défaut">
            <Seg<ExportFmt>
              value={exportFmt} onChange={setExportFmt}
              options={[
                { v: 'CSV',   l: 'CSV'   },
                { v: 'Excel', l: 'Excel' },
                { v: 'PDF',   l: 'PDF'   },
              ]}
            />
          </Field>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXPORT_SCOPES.map(scope => (
              <button key={scope} className={styles.exportChip}
                onClick={() => ui.openExport(scope)}>
                ↓ {scope}
              </button>
            ))}
          </div>
          <Field label="Archivage automatique" hint="Les données plus anciennes que cette période sont archivées.">
            <Sel value={archiveAuto} onChange={setArchiveAuto} style={{ maxWidth: 260 }}>
              <option value="3">Après 3 mois</option>
              <option value="6">Après 6 mois</option>
              <option value="12">Après 12 mois</option>
              <option value="24">Après 24 mois</option>
              <option value="0">Jamais</option>
            </Sel>
          </Field>
        </SectionCard>

        <SectionCard title="Zone de danger">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className={styles.dangerRow}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Réinitialiser les données de stock</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Remet tous les niveaux de stock à zéro. Irréversible.
                </div>
              </div>
              <button
                className={styles.btn}
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-bg)', flexShrink: 0 }}
                onClick={() => ui.confirmDelete('les données', 'de stock (irréversible)', {
                  onConfirm: () => ui.toast('Stock réinitialisé'),
                })}
              >
                Réinitialiser
              </button>
            </div>

            <div className={`${styles.dangerRow} ${styles.dangerRowCritical}`}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--danger)' }}>Supprimer le magasin</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Supprime définitivement toutes les données. Cette action est irréversible.
                </div>
              </div>
              <button
                className={styles.btn}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', flexShrink: 0 }}
                onClick={() => ui.confirmDelete('le magasin', `« ${nom} »`, {
                  onConfirm: () => ui.toast('Magasin supprimé'),
                })}
              >
                Supprimer
              </button>
            </div>
          </div>
        </SectionCard>
      </>
    ),
  };

  if (loading) return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} />Chargement des réglages…
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Paramètres</div>
          <h1 className={styles.title}>
            Réglages <span className={styles.serif}>magasin</span>
          </h1>
          <p className={styles.subtitle}>
            {nom ? `${nom} · ` : ''}Configurez votre magasin, équipe, devise et notifications
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.btn} ${styles.primary}`}
            style={{ minWidth: 140, justifyContent: 'center' }}
            onClick={handleSave}
          >
            {saved ? '✓ Enregistré' : '💾 Enregistrer'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={styles.settingsLayout}>
        <nav className={styles.settingsNav}>
          {NAV.map(s => (
            <button
              key={s.id}
              className={`${styles.settingsNavItem}${section === s.id ? ` ${styles.settingsNavItemActive}` : ''}`}
              onClick={() => setSection(s.id)}
            >
              <span className={styles.settingsNavIcon} style={section === s.id ? { color: 'var(--accent)' } : {}}>
                {s.icon}
              </span>
              {s.label}
            </button>
          ))}
        </nav>
        <div className={styles.settingsContent}>
          {sections[section]}
        </div>
      </div>
    </>
  );
}
