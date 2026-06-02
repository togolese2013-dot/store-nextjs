import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  UIStore, PageId, ModalState, ModalType, Tenant, Invoice, Ticket, Plan, AuditEntry,
  TenantStatus, InvoiceStatus, PlanName, TicketPriority,
} from './types';
import { initials } from './icons';
import {
  TENANTS0, INVOICES0, TICKETS0, PLANS0, AUDIT, PLAN_PRICE, PALETTE,
} from './data';
import { fmt } from './primitives';

const UICtx = createContext<UIStore | null>(null);
export const useUI = (): UIStore => {
  const v = useContext(UICtx);
  if (!v) throw new Error('useUI must be used within <UIProvider>');
  return v;
};

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<PageId>('overview');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS0);
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES0);
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS0);
  const [plans, setPlans] = useState<Plan[]>(PLANS0);
  const [audit, setAudit] = useState<AuditEntry[]>(AUDIT);

  const notify = (msg: string) => setToast(msg);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const logAct = (action: string, cat: string, catColor: string) =>
    setAudit((a) => [{ date: "À l'instant", who: 'Awa Sané', init: 'AS', color: '#34396B', action, cat, catColor }, ...a]);

  const store: UIStore = {
    page, goto: setPage, modal,
    openModal: (type: ModalType, data?: any) => setModal({ type, data }),
    closeModal: () => setModal(null),
    notify,
    tenants, invoices, tickets, plans, audit,

    inviteTenant: ({ name, city, plan }) => {
      const init = initials(name);
      const color = PALETTE[name.length % PALETTE.length];
      setTenants((t) => [{ name, init, color, plan, mrr: PLAN_PRICE[plan] ?? 0, city, joined: "À l'instant", last: 'jamais', status: 'Essai' }, ...t]);
      logAct(`a invité la boutique ${name} (${plan})`, 'Boutiques', '#34396B');
      notify('Invitation envoyée à ' + name);
    },
    changePlan: (name, plan) => {
      setTenants((t) => t.map((x) => (x.name === name ? { ...x, plan, mrr: PLAN_PRICE[plan] ?? x.mrr } : x)));
      logAct(`a migré ${name} vers le plan ${plan}`, 'Plans', '#8B5E2E');
      notify(name + ' → plan ' + plan);
    },
    setStatus: (name, status, verb) => {
      setTenants((t) => t.map((x) => (x.name === name ? { ...x, status } : x)));
      logAct(`a ${verb === 'réactivée' ? 'réactivé' : 'suspendu'} la boutique ${name}`, 'Boutiques', '#34396B');
      notify(name + ' ' + verb);
    },
    bulkStatus: (names, status) => {
      setTenants((t) => t.map((x) => (names.includes(x.name) ? { ...x, status } : x)));
      logAct(`a suspendu ${names.length} boutique(s)`, 'Boutiques', '#34396B');
    },
    removeTenant: (name) => {
      setTenants((t) => t.filter((x) => x.name !== name));
      logAct(`a supprimé la boutique ${name}`, 'Boutiques', '#34396B');
      notify(name + ' supprimée');
    },
    markInvoice: (id, status, verb) => {
      setInvoices((iv) => iv.map((x) => (x.id === id ? { ...x, status } : x)));
      if (verb) { logAct(`a ${verb} la facture ${id}`, 'Facturation', '#3B6A8F'); notify('Facture ' + id + ' ' + verb); }
    },
    savePlan: (orig, { name, price }) => {
      const priceStr = fmt(Number(price));
      if (orig) {
        setPlans((ps) => ps.map((p) => (p.name === orig ? { ...p, name, price: priceStr } : p)));
        logAct(`a modifié le plan ${name}`, 'Plans', '#8B5E2E'); notify('Plan ' + name + ' enregistré');
      } else {
        setPlans((ps) => [...ps, { name, color: '#5C4A88', price: priceStr, period: '/ mois', count: 0, mrr: 0, pop: false, feats: ['Nouveau plan personnalisé'] }]);
        logAct(`a créé le plan ${name}`, 'Plans', '#8B5E2E'); notify('Plan ' + name + ' créé');
      }
    },
    addTicket: ({ tenant, subject, prio, msg }) => {
      const id = '#T-' + (483 + tickets.length);
      setTickets((ts) => [{ id, subject, tenant, prio, status: 'Ouvert', agent: '—', upd: "à l'instant", msg }, ...ts]);
      notify('Ticket ' + id + ' créé');
    },
    updateTicket: (id, patch) => setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    assignTicket: (id) => {
      setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, agent: 'Awa S.', status: t.status === 'Ouvert' ? 'En cours' : t.status, upd: "à l'instant" } : t)));
      notify('Ticket assigné à Awa S.');
    },
  };

  return (
    <UICtx.Provider value={store}>
      {children}
      {/* Toast lives here so it survives page switches */}
      {toast && <div className="toast-wrap"><div className="toast"><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{toast}</div></div>}
    </UICtx.Provider>
  );
}
