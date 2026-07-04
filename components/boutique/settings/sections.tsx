// All sections of the BoutiqueSettings page

import React, { useState } from 'react';
import type { SectionProps, StoreState } from './types';
import { DEVISES, PAYS_LIST, JOURS, TEAM, fmtPreview } from './constants';
import {
  Toggle, Seg, TRow, Fld, In, Ta, Sel, Card, Row2, LogoDrop,
} from './primitives';
import {
  StoreIcon, GlobeIcon, WalletIcon, PrinterIcon, BoxIcon,
  StarIcon, UsersIcon, ReceiptIcon, ClockIcon, BellIcon,
  AlertTriIcon, PlusIcon, ChevDownIcon,
} from './icons';

// ── Identité ──────────────────────────────────────────────────────────────────

export function IdentiteSection({ s, u, save }: SectionProps) {
  return (
    <Card
      id="identite"
      Icon={StoreIcon}
      title="Identité de la boutique"
      sub="Informations affichées sur les reçus, rapports et communications clients."
      onSave={() => save?.('identite')}
    >
      <Row2>
        <Fld label="Nom de la boutique">
          <In val={s.nom} set={v => u('nom', v)} ph="Maison Diallo" />
        </Fld>
        <Fld label="Email de contact">
          <In val={s.email} set={v => u('email', v)} ph="contact@boutique.com" type="email" />
        </Fld>
      </Row2>
      <Fld label="Description courte">
        <In val={s.desc} set={v => u('desc', v)} ph="Boutique de mode et artisanat africain" />
      </Fld>
      <Row2>
        <Fld label="Adresse physique">
          <In val={s.adresse} set={v => u('adresse', v)} ph="Lomé, Togo" />
        </Fld>
        <Fld label="Téléphone / WhatsApp">
          <In val={s.tel} set={v => u('tel', v)} ph="+228 90 12 34 56" mono />
        </Fld>
      </Row2>
      <Fld label="Logo de la boutique" hint="PNG ou JPG · 1:1 recommandé · 2 Mo max">
        <LogoDrop />
      </Fld>
    </Card>
  );
}

// ── Devise & Localisation ─────────────────────────────────────────────────────

export function DeviseSection({ s, u, save }: SectionProps) {
  const handleDevise = (v: string) => {
    const d = DEVISES.find(x => x.code === v);
    u('devise', v);
    if (d) u('symbole', d.sym);
  };
  const preview = fmtPreview(1250000, s.sep1k, s.sepDec, s.decimales, s.symbole, s.symPos);

  return (
    <Card
      id="devise"
      Icon={GlobeIcon}
      title="Devise & Localisation"
      sub="Monnaie d'affichage, formats numériques et paramètres régionaux."
      onSave={() => save?.('devise')}
    >
      <Row2>
        <Fld label="Devise principale">
          <Sel
            val={s.devise}
            set={handleDevise}
            opts={DEVISES.map(d => ({ value: d.code, label: `${d.code} — ${d.nom}` }))}
          />
        </Fld>
        <Fld label="Symbole affiché" hint="Auto-rempli, modifiable librement">
          <In val={s.symbole} set={v => u('symbole', v)} ph="FCFA" mono />
        </Fld>
      </Row2>
      <Row2>
        <Fld label="Position du symbole">
          <Seg val={s.symPos} set={v => u('symPos', v)} opts={['Avant', 'Après']} />
        </Fld>
        <Fld label="Décimales">
          <Seg val={s.decimales} set={v => u('decimales', v)} opts={['0', '2']} />
        </Fld>
      </Row2>
      <Row2>
        <Fld label="Séparateur de milliers">
          <Seg val={s.sep1k} set={v => u('sep1k', v)} opts={['Espace', 'Point', 'Virgule']} />
        </Fld>
        <Fld label="Séparateur décimal">
          <Seg val={s.sepDec} set={v => u('sepDec', v)} opts={['Virgule', 'Point']} />
        </Fld>
      </Row2>
      <div className="bs-preview-box">
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Aperçu format</span>
        <span style={{
          fontFamily: 'Geist Mono, monospace', fontSize: 20,
          fontWeight: 600, letterSpacing: '-.02em', color: 'var(--ink)',
        }}>{preview}</span>
      </div>
      <Row2>
        <Fld label="Langue de l'interface">
          <Seg val={s.langue} set={v => u('langue', v)} opts={['Français', 'English']} />
        </Fld>
        <Fld label="Fuseau horaire">
          <Sel
            val={s.fuseau}
            set={v => u('fuseau', v)}
            opts={['Africa/Abidjan','Africa/Accra','Africa/Lagos','Africa/Dakar','Africa/Nairobi','Europe/Paris','America/New_York']}
          />
        </Fld>
      </Row2>
    </Card>
  );
}

// ── Modes de paiement ─────────────────────────────────────────────────────────

export function PaiementsSection({ s, u, save }: SectionProps) {
  return (
    <Card
      id="paiements"
      Icon={WalletIcon}
      title="Modes de paiement"
      sub="Activez les moyens de paiement acceptés et configurez vos numéros de réception."
      onSave={() => save?.('paiements')}
    >
      {PAYS_LIST.map(pm => {
        const isOn = s[`pay_${pm.key}` as keyof StoreState] as boolean;
        const numVal = pm.numKey ? (s[pm.numKey as keyof StoreState] as string) ?? '' : '';
        return (
          <TRow
            key={pm.key}
            label={pm.label}
            desc={pm.noNum ? 'Paiement en espèces ou carte physique' : 'Mobile money — numéro de collecte'}
            on={isOn}
            set={v => u(`pay_${pm.key}` as keyof StoreState, v as never)}
          >
            {!pm.noNum && isOn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: pm.dot, flexShrink: 0 }} />
                <In
                  val={numVal}
                  set={v => pm.numKey && u(pm.numKey as keyof StoreState, v as never)}
                  ph={pm.ph}
                  mono
                  style={{ flex: 1 }}
                />
              </div>
            )}
          </TRow>
        );
      })}
    </Card>
  );
}

// ── Reçus & impression ────────────────────────────────────────────────────────

export function RecusSection({ s, u, save }: SectionProps) {
  return (
    <Card
      id="recus"
      Icon={PrinterIcon}
      title="Reçus & impression"
      sub="Format, contenu et envoi automatique des reçus après chaque vente."
      onSave={() => save?.('recus')}
    >
      <Fld label="Format du reçu">
        <Seg val={s.recu_format} set={v => u('recu_format', v)} opts={['Ticket thermique', 'A4', 'A5']} />
      </Fld>
      <TRow
        label="Afficher le logo sur le reçu"
        desc="Le logo de la boutique sera imprimé en en-tête"
        on={s.recu_logo}
        set={v => u('recu_logo', v)}
      />
      <Fld label="En-tête personnalisé">
        <In val={s.recu_header} set={v => u('recu_header', v)} ph="Maison Diallo — Boutique" />
      </Fld>
      <Fld label="Message de pied de page" hint="Affiché en bas de chaque reçu imprimé ou envoyé">
        <Ta val={s.recu_footer} set={v => u('recu_footer', v)} ph="Merci de votre visite !" />
      </Fld>
      <TRow
        label="Envoi automatique après chaque vente"
        desc="Le reçu est transmis au client dès la validation de la vente"
        on={s.recu_auto}
        set={v => u('recu_auto', v)}
      >
        {s.recu_auto && (
          <Seg val={s.recu_canal} set={v => u('recu_canal', v)} opts={['WhatsApp', 'SMS', 'Email']} />
        )}
      </TRow>
    </Card>
  );
}

// ── Stock & alertes ───────────────────────────────────────────────────────────

export function StockSection({ s, u, save }: SectionProps) {
  const toggleCh = (ch: string) => {
    const curr = s.notif_stock_canaux ?? [];
    u('notif_stock_canaux', curr.includes(ch) ? curr.filter(x => x !== ch) : [...curr, ch]);
  };

  return (
    <Card
      id="stock"
      Icon={BoxIcon}
      title="Stock & alertes"
      sub="Seuils de réapprovisionnement et comportement en cas de rupture."
      onSave={() => save?.('stock')}
    >
      <Fld label="Seuil d'alerte global par défaut" hint="Appliqué aux produits sans seuil individuel défini">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 140 }}>
            <input
              className="bs-in mono"
              type="number"
              value={s.seuil_global}
              onChange={e => u('seuil_global', e.target.value)}
              style={{ paddingRight: 50 }}
            />
            <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 12 }}>unités</span>
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>par produit</span>
        </div>
      </Fld>
      <TRow
        label="Bloquer la vente en cas de rupture"
        desc="Empêche d'enregistrer une vente si le stock est à 0"
        on={s.bloquer_vente}
        set={v => u('bloquer_vente', v)}
      />
      <TRow
        label="Notifications de stock bas"
        desc="Alerte automatique lorsqu'un produit passe sous son seuil"
        on={s.notif_stock}
        set={v => u('notif_stock', v)}
      >
        {s.notif_stock && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['WhatsApp', 'SMS', 'Email'].map(ch => (
              <button
                key={ch}
                type="button"
                className={`bs-channel-btn${(s.notif_stock_canaux ?? []).includes(ch) ? ' on' : ''}`}
                onClick={() => toggleCh(ch)}
              >{ch}</button>
            ))}
          </div>
        )}
      </TRow>
    </Card>
  );
}

// ── Fidélité clients ──────────────────────────────────────────────────────────

export function FideliteSection({ s, u, save }: SectionProps) {
  const tiers = [
    { st: 'Régulier', key: 'regulier', color: 'var(--blue)',   bg: 'var(--blue-bg)' },
    { st: 'Fidèle',   key: 'fidele',   color: 'var(--accent)', bg: 'var(--accent-bg)' },
    { st: 'VIP',      key: 'vip',      color: '#8B5E2E',        bg: '#F5E6D0' },
  ];
  return (
    <Card
      id="fidelite"
      Icon={StarIcon}
      title="Programme de fidélité"
      sub="Seuils d'accès aux statuts clients et critère de progression."
      onSave={() => save?.('fidelite')}
    >
      <TRow
        label="Activer le programme de fidélité"
        desc="Les clients accumulent des visites ou du chiffre d'affaires pour progresser"
        on={s.fidelite_active}
        set={v => u('fidelite_active', v)}
      />
      {s.fidelite_active && (
        <>
          <Fld label="Critère de progression">
            <Seg val={s.fidelite_critere} set={v => u('fidelite_critere', v)} opts={['Visites', 'CA (FCFA)']} />
          </Fld>
          <div style={{ background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {tiers.map((t, i) => {
              const seuilKey = `seuil_${t.key}` as keyof StoreState;
              return (
                <div key={t.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px',
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                }}>
                  <span className="bs-tag" style={{ background: t.bg, color: t.color, minWidth: 72, textAlign: 'center', flexShrink: 0 }}>{t.st}</span>
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--muted)' }}>À partir de</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className="bs-in mono"
                      type="number"
                      value={s[seuilKey] as string}
                      onChange={e => u(seuilKey, e.target.value as never)}
                      style={{ width: 90, textAlign: 'right' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {s.fidelite_critere === 'Visites' ? 'visites' : 'FCFA de CA'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Équipe & accès ────────────────────────────────────────────────────────────

export function EquipeSection({ s, u, save, toast }: SectionProps) {
  const [roles, setRoles] = useState(TEAM.map(m => m.role));

  return (
    <Card
      id="equipe"
      Icon={UsersIcon}
      title="Équipe & accès"
      sub="Membres, rôles, permissions et code PIN de caisse."
      onSave={() => save?.('equipe')}
    >
      <div style={{ background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {TEAM.map((m, i) => (
          <div key={m.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < TEAM.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 99,
              background: m.color, color: '#fff',
              display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>{m.init}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{roles[i]}</div>
            </div>
            <div style={{ position: 'relative' }}>
              <select
                className="bs-in"
                value={roles[i]}
                onChange={e => { const r = [...roles]; r[i] = e.target.value; setRoles(r); }}
                style={{ width: 138, fontSize: 12.5, paddingRight: 28 }}
              >
                {['Propriétaire', 'Gérant·e', 'Vendeur·se', 'Caissier·e', 'Lecture seule'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
                <ChevDownIcon size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="bs-btn" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Invitation envoyée')}>
        <PlusIcon size={13} /> Inviter un membre
      </button>
      <Row2>
        <Fld label="Code PIN de caisse" hint="Requis pour ouvrir et clôturer la caisse">
          <div style={{ display: 'flex', gap: 8 }}>
            <In
              val={s.pin_caisse}
              set={v => u('pin_caisse', v)}
              ph="••••"
              type={s.pin_visible ? 'text' : 'password'}
              mono
              style={{ letterSpacing: '0.2em' }}
            />
            <button type="button" className="bs-btn" style={{ flexShrink: 0, padding: '9px 12px' }}
              onClick={() => u('pin_visible', !s.pin_visible)}>
              {s.pin_visible ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </Fld>
        <Fld label="Accès invité" hint="Autorise la vente sans connexion">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 }}>
            <Toggle on={false} set={() => toast('Paramètre accès invité modifié')} />
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Mode invité désactivé</span>
          </div>
        </Fld>
      </Row2>
    </Card>
  );
}

// ── Fiscal & TVA ──────────────────────────────────────────────────────────────

export function FiscalSection({ s, u, save }: SectionProps) {
  return (
    <Card
      id="fiscal"
      Icon={ReceiptIcon}
      title="Fiscal & TVA"
      sub="Régime légal, identifiants fiscaux et configuration de la taxe sur la valeur ajoutée."
      onSave={() => save?.('fiscal')}
    >
      <Fld label="Régime fiscal">
        <Sel
          val={s.regime}
          set={v => u('regime', v)}
          opts={['Réel simplifié', 'Réel normal', 'Taxe professionnelle unique', 'Forfait', 'Exonéré']}
        />
      </Fld>
      <Row2>
        <Fld label="Numéro RCCM">
          <In val={s.rccm} set={v => u('rccm', v)} ph="TG-LOM-2024-B-1234" mono />
        </Fld>
        <Fld label="NIF / Numéro fiscal">
          <In val={s.nif} set={v => u('nif', v)} ph="TG123456789" mono />
        </Fld>
      </Row2>
      <TRow
        label="TVA applicable"
        desc="Le taux sera calculé et affiché sur les reçus et rapports"
        on={s.tva_active}
        set={v => u('tva_active', v)}
      >
        {s.tva_active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 110 }}>
              <input
                className="bs-in mono"
                type="number"
                value={s.tva_taux}
                onChange={e => u('tva_taux', e.target.value)}
                style={{ paddingRight: 28 }}
              />
              <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 12 }}>%</span>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>taux standard</span>
          </div>
        )}
      </TRow>
      <Fld label="Affichage des prix">
        <Seg val={s.prix_mode} set={v => u('prix_mode', v)} opts={['TTC', 'HT']} />
      </Fld>
    </Card>
  );
}

// ── Heures d'ouverture ────────────────────────────────────────────────────────

export function HorairesSection({ s, u, save }: SectionProps) {
  return (
    <Card
      id="horaires"
      Icon={ClockIcon}
      title="Heures d'ouverture"
      sub="Horaires de la boutique, affichés sur les reçus et dans les rapports."
      onSave={() => save?.('horaires')}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {JOURS.map((j, i) => {
          const h = s[j.key] ?? { open: false, debut: '08:00', fin: '18:00' };
          return (
            <div key={j.key} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '11px 0',
              borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ width: 88, fontSize: 13, fontWeight: 500, color: h.open ? 'var(--ink)' : 'var(--muted-2)', flexShrink: 0 }}>
                {j.label}
              </div>
              <Toggle on={h.open} set={v => u(j.key, { ...h, open: v })} />
              {h.open ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input type="time" value={h.debut} onChange={e => u(j.key, { ...h, debut: e.target.value })} className="bs-in mono" style={{ width: 118 }} />
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>→</span>
                  <input type="time" value={h.fin} onChange={e => u(j.key, { ...h, fin: e.target.value })} className="bs-in mono" style={{ width: 118 }} />
                </div>
              ) : (
                <span style={{ fontSize: 12.5, color: 'var(--muted-2)', fontStyle: 'italic' }}>Fermé</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function NotifsSection({ s, u, save }: SectionProps) {
  return (
    <Card
      id="notifs"
      Icon={BellIcon}
      title="Notifications"
      sub="Rapports automatiques et alertes envoyés à l'équipe de la boutique."
      onSave={() => save?.('notifs')}
    >
      <TRow
        label="Résumé journalier automatique"
        desc="Un bilan complet de la journée (ventes, caisse, stock) envoyé chaque soir"
        on={s.notif_journalier}
        set={v => u('notif_journalier', v)}
      >
        {s.notif_journalier && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Heure d'envoi :</span>
            <input
              type="time"
              value={s.notif_journalier_heure}
              onChange={e => u('notif_journalier_heure', e.target.value)}
              className="bs-in mono"
              style={{ width: 118 }}
            />
          </div>
        )}
      </TRow>
      <TRow
        label="Rapport hebdomadaire"
        desc="Synthèse des ventes, clients et performances de la semaine"
        on={s.notif_hebdo}
        set={v => u('notif_hebdo', v)}
      >
        {s.notif_hebdo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Envoyé le :</span>
            <Sel
              val={s.notif_hebdo_jour}
              set={v => u('notif_hebdo_jour', v)}
              opts={['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']}
            />
          </div>
        )}
      </TRow>
      <TRow
        label="Alertes critiques en temps réel"
        desc="Rupture de stock urgente, seuil de caisse dépassé, grosse vente"
        on={s.notif_critiques}
        set={v => u('notif_critiques', v)}
      />
      <Fld label="Canal principal de notification">
        <Seg val={s.notif_canal} set={v => u('notif_canal', v)} opts={['WhatsApp', 'SMS', 'Email']} />
      </Fld>
    </Card>
  );
}

// ── Zone danger ───────────────────────────────────────────────────────────────

type DangerAction = 'reset' | 'archive' | 'delete' | null;

const DANGER_ITEMS: Record<Exclude<DangerAction, null>, { label: string; desc: string; btn: string; endpoint: string; danger?: boolean }> = {
  reset: {
    label: 'Réinitialiser les données de démonstration',
    desc: "Efface les ventes, le stock boutique et les clients de cette boutique. Le catalogue produits n'est pas touché.",
    btn: 'Réinitialiser',
    endpoint: '/api/admin/shop/reset-demo-data',
  },
  archive: {
    label: 'Archiver la boutique',
    desc: "La boutique sera masquée et l'accès admin bloqué jusqu'à réactivation depuis la page Abonnement (choisir un plan).",
    btn: 'Archiver',
    endpoint: '/api/admin/shop/archive',
  },
  delete: {
    label: 'Supprimer définitivement la boutique',
    desc: "Bloque immédiatement et durablement l'accès à cette boutique. Aucune donnée n'est effacée — seul un administrateur de la plateforme peut restaurer l'accès.",
    btn: 'Supprimer',
    endpoint: '/api/admin/shop/delete',
    danger: true,
  },
};

export function DangerSection({
  toast, shopName,
}: { toast: (m: string) => void; shopName?: string }) {
  const [active,  setActive]  = useState<DangerAction>(null);
  const [typed,   setTyped]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const name = shopName ?? '';
  const items: { key: Exclude<DangerAction, null>; danger: boolean }[] = [
    { key: 'reset',   danger: false },
    { key: 'archive', danger: false },
    { key: 'delete',  danger: true  },
  ];

  function open(key: Exclude<DangerAction, null>) {
    setActive(key);
    setTyped('');
    setError('');
  }

  async function confirmAction() {
    if (!active) return;
    const item = DANGER_ITEMS[active];
    setSaving(true);
    setError('');
    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_nom: typed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur.'); setSaving(false); return; }
      toast(`${item.btn} effectué`);
      setActive(null);
      if (active === 'archive') {
        window.location.href = '/admin/billing';
      } else if (active === 'delete') {
        await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {});
        window.location.href = '/admin/login';
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id="danger" Icon={AlertTriIcon} title="Zone danger" sub="Actions irréversibles — manipulation uniquement par le propriétaire." dangerZone>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(({ key, danger }) => {
          const it = DANGER_ITEMS[key];
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: 16, padding: 16,
              background: danger ? 'var(--danger-bg)' : 'var(--bg-2)',
              borderRadius: 12,
              border: `1px solid ${danger ? 'rgba(156,58,20,.2)' : 'var(--border)'}`,
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--ink)' }}>{it.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>
              </div>
              <button
                type="button"
                className={danger ? 'bs-btn ghost-danger' : 'bs-btn'}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                onClick={() => open(key)}
              >{it.btn}</button>
            </div>
          );
        })}
      </div>

      {active && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(20,17,14,.4)', padding: 16,
        }} onClick={() => !saving && setActive(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440,
            padding: 24, boxShadow: '0 20px 60px rgba(20,17,14,.25)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--danger)' }}>{DANGER_ITEMS[active].label} ?</h3>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 8 }}>{DANGER_ITEMS[active].desc}</p>
            <p style={{ fontSize: 12.5, marginTop: 14, marginBottom: 6 }}>
              Tapez <strong>{name}</strong> pour confirmer :
            </p>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={name}
              style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)', boxSizing: 'border-box' }}
            />
            {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" className="bs-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setActive(null)} disabled={saving}>Annuler</button>
              <button
                type="button"
                className="bs-btn ghost-danger"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={saving || typed.trim().toLowerCase() !== name.trim().toLowerCase()}
                onClick={confirmAction}
              >{saving ? 'En cours…' : DANGER_ITEMS[active].btn}</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
