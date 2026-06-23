'use client';

import React, { useState, useEffect, useRef } from 'react';
import './boutique-settings.css';

import type { BoutiqueSettingsProps, StoreState } from './types';
import { INIT, NAV_SECTIONS } from './constants';
import { useToast, useConfirm, ToastStack, ConfirmDialog } from './primitives';
import {
  HomeIcon, ReceiptIcon, BoxIcon, WalletIcon,
  UsersIcon, CogIcon, HelpIcon, SearchIcon, BellIcon,
  StoreIcon, GlobeIcon, PrinterIcon, StarIcon,
  ClockIcon, AlertTriIcon,
  ChevDownIcon, ChevLeftIcon,
} from './icons';
import {
  IdentiteSection, DeviseSection, PaiementsSection,
  RecusSection, StockSection, FideliteSection,
  EquipeSection, FiscalSection, HorairesSection,
  NotifsSection, DangerSection,
} from './sections';

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

function SettingsNav({
  active, onNav,
}: { active: string; onNav: (id: string) => void }) {
  return (
    <div>
      {NAV_SECTIONS.map((sec, i) => {
        const Icon = SECTION_ICONS[sec.id];
        const isSep = i === NAV_SECTIONS.length - 1;
        return (
          <React.Fragment key={sec.id}>
            {isSep && <div className="bs-snav-sep" />}
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
  );
}

export default function BoutiqueSettings({
  onBack,
  onNavigate,
  initialState,
  onSave,
  shopName,
  userName = 'Utilisateur',
  userRole = 'Propriétaire',
}: BoutiqueSettingsProps) {
  const [s, setS] = useState<StoreState>({ ...INIT, ...initialState });
  const [active, setActive] = useState('identite');
  const contentRef = useRef<HTMLDivElement>(null);
  const { toasts, toast } = useToast();
  const { dialog, confirm, close } = useConfirm();

  function u<K extends keyof StoreState>(k: K, v: StoreState[K]) {
    setS(p => ({ ...p, [k]: v }));
  }

  function save(section: string) {
    const label = NAV_SECTIONS.find(n => n.id === section)?.label ?? section;
    toast(`${label} enregistré`);
    onSave?.(section, s);
  }

  const onNav = (id: string) => {
    setActive(id);
    const el = document.getElementById('s-' + id);
    const c = contentRef.current;
    if (el && c) c.scrollTop = el.offsetTop - 24;
  };

  useEffect(() => {
    const c = contentRef.current;
    if (!c) return;
    const handler = () => {
      for (const sec of [...NAV_SECTIONS].reverse()) {
        const el = document.getElementById('s-' + sec.id);
        if (el && el.offsetTop <= c.scrollTop + 120) {
          setActive(sec.id);
          break;
        }
      }
    };
    c.addEventListener('scroll', handler, { passive: true });
    return () => c.removeEventListener('scroll', handler);
  }, []);

  const sp = { s, u, toast, save };

  const navGroups = [
    {
      section: null,
      items: [
        { Icon: HomeIcon,    label: "Vue d'ensemble", href: '/' },
        { Icon: ReceiptIcon, label: 'Ventes',          href: '/ventes' },
        { Icon: BoxIcon,     label: 'Stock boutique',  href: '/stock' },
        { Icon: WalletIcon,  label: 'Finance',         href: '/finance' },
        { Icon: UsersIcon,   label: 'Clients',         href: '/clients' },
      ],
    },
    {
      section: 'Paramètres',
      items: [
        { Icon: CogIcon,  label: 'Réglages boutique', active: true },
        { Icon: HelpIcon, label: 'Aide & support',    href: '/aide' },
      ],
    },
  ];

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="bs-root">
      <div className="bs-page">

        {/* Sidebar */}
        <aside className="bs-sidebar">
          <button type="button" className="bs-ws-sw">
            <div className="bs-ws-ic"><ReceiptIcon size={16} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="bs-ws-l1">{shopName ?? s.nom}</div>
              <div className="bs-ws-l2">Ventes &amp; caisse</div>
            </div>
            <ChevDownIcon />
          </button>

          <nav className="bs-snav">
            {navGroups.map((g, gi) => (
              <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {g.section && <div className="bs-nav-h">{g.section}</div>}
                {g.items.map((it, ii) => (
                  <a
                    key={ii}
                    href={it.href ?? '#'}
                    className={`bs-nav-i${(it as { active?: boolean }).active ? ' act' : ''}`}
                    style={{ textDecoration: 'none' }}
                    onClick={e => {
                      if ((it as { active?: boolean }).active) { e.preventDefault(); return; }
                      if (it.href) { e.preventDefault(); onNavigate?.(it.href); }
                    }}
                  >
                    <span className="ic"><it.Icon size={16} /></span>
                    <span>{it.label}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>

          <button type="button" className="bs-sb-foot">
            <div className="bs-usr">
              <div className="bs-avi">{initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="bs-usr-n">{userName}</div>
                <div className="bs-usr-r">{userRole}</div>
              </div>
              <CogIcon size={14} />
            </div>
          </button>
        </aside>

        {/* Main */}
        <div className="bs-main-col">
          <header className="bs-topbar">
            <button type="button" className="bs-ibtn" onClick={onBack} aria-label="Retour">
              <ChevLeftIcon size={16} />
            </button>
            <div className="bs-crumb">
              <span>{shopName ?? s.nom}</span>
              <span className="sep">/</span>
              <span>Boutique</span>
              <span className="sep">/</span>
              <span className="here">Réglages boutique</span>
            </div>
            <div className="bs-srch">
              <SearchIcon size={14} />
              <input placeholder="Rechercher…" readOnly />
              <span className="bs-k">⌘K</span>
            </div>
            <button type="button" className="bs-ibtn" aria-label="Notifications">
              <BellIcon size={16} />
            </button>
          </header>

          <div className="bs-settings-shell">
            <div className="bs-settings-leftnav">
              <SettingsNav active={active} onNav={onNav} />
            </div>

            <div className="bs-settings-content" ref={contentRef}>
              <div style={{ maxWidth: 680 }}>
                <div className="bs-eyb">Boutique · Paramètres</div>
                <h1 className="bs-t1">
                  Réglages <span className="bs-serif">boutique</span>
                </h1>

                <IdentiteSection {...sp} />
                <DeviseSection   {...sp} />
                <PaiementsSection {...sp} />
                <RecusSection    {...sp} />
                <StockSection    {...sp} />
                <FideliteSection {...sp} />
                <EquipeSection   {...sp} />
                <FiscalSection   {...sp} />
                <HorairesSection {...sp} />
                <NotifsSection   {...sp} />
                <DangerSection toast={toast} confirm={confirm} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastStack toasts={toasts} />
      {dialog && <ConfirmDialog opts={dialog} onClose={close} />}
    </div>
  );
}
