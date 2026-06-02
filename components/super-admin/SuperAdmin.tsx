'use client';
/**
 * SuperAdmin
 * ─────────────────────────────────────────────────────────────────────
 * Back-office plateforme ShopSaaS (super admin) — shell sidebar + topbar
 * avec 7 pages entièrement interactives :
 *   Vue d'ensemble · Boutiques · Facturation · Plans & tarifs · Support ·
 *   Santé système · Journal d'audit.
 *
 * Toute l'interactivité (modals, sélection multiple, menus d'action,
 * toasts, journal d'audit qui s'écrit en direct) est portée par le store
 * `UIProvider` / `useUI` (store.tsx). Les actions mutent réellement l'état.
 *
 * Intégration :
 *   1. Copier le dossier `super-admin/` dans `src/components/super-admin/`.
 *   2. `import SuperAdmin from '@/components/super-admin/SuperAdmin';`
 *   3. `<SuperAdmin />` — c'est tout. (Aucune prop requise.)
 *
 * Dépendances : React 18+. Pas de CSS Modules (feuille globale importée ici).
 * Polices optionnelles : Geist, Geist Mono, Instrument Serif.
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { UIProvider, useUI } from './store';
import { ModalRouter } from './modals';
import { I } from './icons';
import { NAV, PAGE_LABELS, SEARCH_PH } from './data';
import OverviewPage from './pages/OverviewPage';
import TenantsPage from './pages/TenantsPage';
import BillingPage from './pages/BillingPage';
import PlansPage from './pages/PlansPage';
import SupportPage from './pages/SupportPage';
import SystemPage from './pages/SystemPage';
import LogsPage from './pages/LogsPage';
import './SuperAdmin.css';

interface SuperAdminProps {
  userName?: string;
  userRole?: string;
}

function Shell({ userName = 'Admin', userRole = 'Super Admin' }: SuperAdminProps) {
  const ui = useUI();
  const router = useRouter();
  const page = ui.page;
  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="page">
      <aside className="sidebar">
        <div className="sb-top">
          <button className="ws-sw">
            <div className="ws-ic"><I.shield size={16} /></div>
            <div className="ws-meta">
              <div className="ws-l1">Super Admin</div>
              <div className="ws-l2">Plateforme Afrisika</div>
            </div>
            <I.chevD />
          </button>
        </div>
        <nav className="nav">{NAV.map((g, gi) => (
          <div key={gi} className="nav-g">
            {g.section && <div className="nav-h">{g.section}</div>}
            {g.items.map((it, ii) => { const Icon = it.ic; const isAct = it.pg === page; return (
              <button key={ii} className={`nav-i ${isAct ? 'act' : ''}`} onClick={() => (it.pg ? ui.goto(it.pg) : ui.notify(it.l))}>
                <span className="ic"><Icon size={16} /></span><span>{it.l}</span>
                {it.c !== undefined && <span className={`nav-c ${it.bdg ? 'bdg' : ''}`}>{it.c}</span>}
              </button>
            ); })}
          </div>
        ))}</nav>
        <div className="sb-foot">
          <div className="usr-wrap">
            <button className="usr-row" onClick={() => ui.notify('Réglages du compte')}>
              <div className="avi">{initials}</div>
              <div className="usr-meta">
                <div className="usr-n">{userName}</div>
                <div className="usr-r">{userRole}</div>
              </div>
              <I.chevD />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="top">
          <button className="ibtn" onClick={() => router.push('/admin')}><I.chevL size={16} /></button>
          <div className="crumb"><span>Afrisika</span><span className="sep">/</span><span>Super Admin</span>{page !== 'overview' && <><span className="sep">/</span><span className="here">{PAGE_LABELS[page]}</span></>}</div>
          <div className="srch"><I.search size={14} /><input placeholder={SEARCH_PH[page] || 'Rechercher…'} /><span className="k">⌘K</span></div>
          <button className="ibtn" onClick={() => ui.notify('3 nouvelles notifications')}><I.bell size={16} /><span className="pip" /></button>
        </header>
        {page === 'overview' && <OverviewPage />}
        {page === 'tenants' && <TenantsPage />}
        {page === 'billing' && <BillingPage />}
        {page === 'plans' && <PlansPage />}
        {page === 'support' && <SupportPage />}
        {page === 'system' && <SystemPage />}
        {page === 'logs' && <LogsPage />}
      </main>
      <ModalRouter />
    </div>
  );
}

export default function SuperAdmin({ userName, userRole }: SuperAdminProps = {}) {
  return (
    <UIProvider>
      <Shell userName={userName} userRole={userRole} />
    </UIProvider>
  );
}
