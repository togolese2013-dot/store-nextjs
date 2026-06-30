'use client';

import React, { useEffect, useRef, useState } from 'react';
import './settings/boutique-settings.css';
import { INIT, NAV_SECTIONS } from './settings/constants';
import type { StoreState } from './settings/types';
import { useToast, useConfirm, ToastStack, ConfirmDialog } from './settings/primitives';
import { useRefreshBoutiqueSettings } from './BoutiqueSettingsContext';
import {
  StoreIcon, GlobeIcon, WalletIcon, PrinterIcon, BoxIcon,
  StarIcon, UsersIcon, ReceiptIcon, ClockIcon, BellIcon, AlertTriIcon,
} from './settings/icons';
import {
  IdentiteSection, DeviseSection, PaiementsSection,
  RecusSection, StockSection, FideliteSection,
  EquipeSection, FiscalSection, HorairesSection,
  NotifsSection, DangerSection,
} from './settings/sections';

const SECTION_ICONS: Record<string, (p?: { size?: number }) => React.JSX.Element> = {
  identite:  StoreIcon,
  devise:    GlobeIcon,
  paiements: WalletIcon,
  recus:     PrinterIcon,
  stock:     BoxIcon,
  fidelite:  StarIcon,
  equipe:    UsersIcon,
  fiscal:    ReceiptIcon,
  horaires:  ClockIcon,
  notifs:    BellIcon,
  danger:    AlertTriIcon,
};

// Topbar height — must match .topbar padding in Boutique.module.css
const TOPBAR_H = 57;

interface Props {
  shopName?: string;
}

export default function SettingsPage({ shopName }: Props) {
  const [s, setS] = useState<StoreState>(INIT);
  const [active, setActive] = useState('identite');
  const contentRef = useRef<HTMLDivElement>(null);
  const { toasts, toast } = useToast();
  const { dialog, confirm, close } = useConfirm();
  const refreshSettings = useRefreshBoutiqueSettings();

  useEffect(() => {
    fetch('/api/admin/boutique/settings')
      .then(r => r.json())
      .then((data: Record<string, Partial<StoreState>>) => {
        const merged: Partial<StoreState> = {};
        for (const v of Object.values(data)) Object.assign(merged, v);
        if (shopName) merged.nom = shopName;
        setS(p => ({ ...p, ...merged }));
      })
      .catch(() => {
        if (shopName) setS(p => ({ ...p, nom: shopName }));
      });
  }, [shopName]);

  function u<K extends keyof StoreState>(k: K, v: StoreState[K]) {
    setS(p => ({ ...p, [k]: v }));
  }

  function save(section: string) {
    const label = NAV_SECTIONS.find(n => n.id === section)?.label ?? section;
    fetch('/api/admin/boutique/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, state: s }),
    })
      .then(async r => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({} as {error?: string}));
          toast(`Erreur ${r.status}${d.error ? ' — ' + d.error : ''}`);
          return;
        }
        toast(`${label} enregistré`);
        refreshSettings();
      })
      .catch(() => toast('Erreur réseau — sauvegarde échouée'));
  }

  const onNav = (id: string) => {
    setActive(id);
    const el = document.getElementById('s-' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Track active section on window scroll
  useEffect(() => {
    const handler = () => {
      for (const sec of [...NAV_SECTIONS].reverse()) {
        const el = document.getElementById('s-' + sec.id);
        if (el && el.getBoundingClientRect().top <= TOPBAR_H + 80) {
          setActive(sec.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const sp = { s, u, toast, save };

  return (
    // bs-root provides CSS custom properties (--accent, --border, etc.)
    <div className="bs-root" style={{ display: 'block', height: 'auto', background: 'transparent' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr' }}>

        {/* Left nav — sticky below topbar, natural window scroll */}
        <div
          className="bs-settings-leftnav"
          style={{
            position: 'sticky',
            top: TOPBAR_H,
            height: `calc(100vh - ${TOPBAR_H}px)`,
            alignSelf: 'start',
          }}
        >
          {NAV_SECTIONS.map((sec, i) => {
            const Icon = SECTION_ICONS[sec.id];
            return (
              <React.Fragment key={sec.id}>
                {i === NAV_SECTIONS.length - 1 && <div className="bs-snav-sep" />}
                <button
                  type="button"
                  className={[
                    'bs-snav-item',
                    active === sec.id ? 'act' : '',
                    sec.danger ? 'danger-item' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onNav(sec.id)}
                >
                  <span className="sic">{Icon && <Icon size={14} />}</span>
                  {sec.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Content — flows naturally, window scrolls */}
        <div
          ref={contentRef}
          style={{ padding: '28px 32px 80px', minHeight: '100vh' }}
        >
          <div style={{ maxWidth: 680 }}>
            <div className="bs-eyb">Boutique · Paramètres</div>
            <h1 className="bs-t1">
              Réglages <span className="bs-serif">boutique</span>
            </h1>

            <IdentiteSection  {...sp} />
            <DeviseSection    {...sp} />
            <PaiementsSection {...sp} />
            <RecusSection     {...sp} />
            <StockSection     {...sp} />
            <FideliteSection  {...sp} />
            <EquipeSection    {...sp} />
            <FiscalSection    {...sp} />
            <HorairesSection  {...sp} />
            <NotifsSection    {...sp} />
            <DangerSection toast={toast} confirm={confirm} />
          </div>
        </div>

      </div>

      <ToastStack toasts={toasts} />
      {dialog && <ConfirmDialog opts={dialog} onClose={close} />}
    </div>
  );
}
