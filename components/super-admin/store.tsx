import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UIStore, PageId, ModalState, ModalType, Tenant, Invoice, Ticket, Plan, AuditEntry,
  TenantStatus, InvoiceStatus, PlanName, TicketPriority,
} from './types';
import { initials } from './icons';
import { PLANS0, AUDIT, PALETTE } from './data';
import { fmt } from './primitives';

const UICtx = createContext<UIStore | null>(null);
export const useUI = (): UIStore => {
  const v = useContext(UICtx);
  if (!v) throw new Error('useUI must be used within <UIProvider>');
  return v;
};

/* ── helpers ────────────────────────────────────────────────────── */
const PLAN_MAP: Record<string, PlanName> = { basic: 'Basic', pro: 'Pro', business: 'Business', free: 'Basic' };
const PLAN_PRICE: Record<PlanName, number> = { Basic: 9000, Pro: 25000, Business: 75000 };
const PLAN_API: Record<PlanName, string> = { Basic: 'basic', Pro: 'pro', Business: 'business' };

function statusFromDB(s: string): TenantStatus {
  if (s === 'active') return 'Actif';
  if (s === 'trial') return 'Essai';
  if (s === 'suspended') return 'Suspendu';
  if (s === 'expired') return 'Impayé';
  return 'Inactif';
}

function shopToTenant(s: Record<string, unknown>): Tenant {
  const name = String(s.nom ?? '');
  const plan = PLAN_MAP[String(s.plan)] ?? 'Basic';
  return {
    id: Number(s.id),
    name,
    email: String(s.email ?? ''),
    init: initials(name),
    color: PALETTE[name.length % PALETTE.length],
    plan,
    mrr: PLAN_PRICE[plan] ?? 0,
    city: String(s.pays ?? '—'),
    joined: s.created_at ? new Date(String(s.created_at)).toLocaleDateString('fr-FR') : '—',
    last: '—',
    status: statusFromDB(String(s.subscription_status ?? 'trial')),
  };
}

function paymentToInvoice(p: Record<string, unknown>): Invoice {
  return {
    id: `PAY-${p.id}`,
    tenant: String(p.shop_nom ?? ''),
    plan: PLAN_MAP[String(p.plan)] ?? 'Basic',
    amount: Number(p.amount ?? 0),
    date: p.created_at ? new Date(String(p.created_at)).toLocaleDateString('fr-FR') : '—',
    method: String(p.operator ?? 'Mobile Money'),
    status: p.status === 'paid' ? 'Payée' : p.status === 'failed' ? 'Échouée' : 'En attente',
  };
}

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error ?? 'Erreur');
  }
  return res.json();
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<PageId>('overview');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [plans, setPlans] = useState<Plan[]>(PLANS0);
  const [audit, setAudit] = useState<AuditEntry[]>(AUDIT);

  const notify = (msg: string) => setToast(msg);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  /* ── Fetch données réelles ──────────────────────────────────── */
  const refreshTenants = useCallback(async () => {
    try {
      const data = await api('GET', '/api/admin/saas/shops');
      setTenants((data.shops ?? []).map(shopToTenant));
    } catch { /* silencieux */ }
  }, []);

  const refreshInvoices = useCallback(async () => {
    try {
      const data = await api('GET', '/api/admin/saas/payments');
      setInvoices((data.payments ?? []).map(paymentToInvoice));
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    refreshTenants();
    refreshInvoices();
  }, [refreshTenants, refreshInvoices]);

  const logAct = (action: string, cat: string, catColor: string) =>
    setAudit((a) => [{ date: "À l'instant", who: 'Super Admin', init: 'SA', color: '#34396B', action, cat, catColor }, ...a]);

  const store: UIStore = {
    page, goto: setPage, modal,
    openModal: (type: ModalType, data?: unknown) => setModal({ type, data }),
    closeModal: () => setModal(null),
    notify,
    tenants, invoices, tickets, plans, audit,

    inviteTenant: async ({ name, email, city, plan }) => {
      try {
        await api('POST', '/api/admin/saas/shops', {
          nom: name, email, pays: city,
          plan: PLAN_API[plan as PlanName] ?? 'basic',
        });
        await refreshTenants();
        logAct(`a invité la boutique ${name} (${plan})`, 'Boutiques', '#34396B');
        notify('Invitation envoyée à ' + name);
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Erreur');
      }
    },

    changePlan: async (name, plan) => {
      const tenant = tenants.find((t) => t.name === name);
      if (!tenant) return;
      try {
        await api('PATCH', `/api/admin/saas/shops/${tenant.id}`, { plan: PLAN_API[plan as PlanName] ?? 'basic' });
        setTenants((t) => t.map((x) => x.name === name ? { ...x, plan, mrr: PLAN_PRICE[plan as PlanName] ?? x.mrr } : x));
        logAct(`a migré ${name} vers ${plan}`, 'Plans', '#8B5E2E');
        notify(name + ' → plan ' + plan);
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Erreur');
      }
    },

    setStatus: async (name, status, verb) => {
      const tenant = tenants.find((t) => t.name === name);
      if (!tenant) return;
      const actif = status === 'Actif' || status === 'Essai';
      try {
        await api('PATCH', `/api/admin/saas/shops/${tenant.id}`, { actif });
        setTenants((t) => t.map((x) => x.name === name ? { ...x, status } : x));
        logAct(`a ${verb === 'réactivée' ? 'réactivé' : 'suspendu'} ${name}`, 'Boutiques', '#34396B');
        notify(name + ' ' + verb);
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Erreur');
      }
    },

    bulkStatus: async (names, status) => {
      const actif = status === 'Actif';
      await Promise.allSettled(
        names.map((name) => {
          const t = tenants.find((x) => x.name === name);
          return t ? api('PATCH', `/api/admin/saas/shops/${t.id}`, { actif }) : Promise.resolve();
        })
      );
      setTenants((t) => t.map((x) => names.includes(x.name) ? { ...x, status } : x));
      logAct(`a suspendu ${names.length} boutique(s)`, 'Boutiques', '#34396B');
      notify(`${names.length} boutique(s) suspendues`);
    },

    removeTenant: async (name) => {
      const tenant = tenants.find((t) => t.name === name);
      if (!tenant) return;
      try {
        await api('DELETE', `/api/admin/saas/shops/${tenant.id}`);
        setTenants((t) => t.filter((x) => x.name !== name));
        logAct(`a supprimé la boutique ${name}`, 'Boutiques', '#34396B');
        notify(name + ' supprimée');
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Erreur');
      }
    },

    markInvoice: async (id, status, verb) => {
      const numId = id.replace('PAY-', '');
      try {
        if (status === 'Payée') {
          await api('PATCH', `/api/admin/saas/payments/${numId}/approve`);
        } else if (status === 'Échouée') {
          await api('PATCH', `/api/admin/saas/payments/${numId}/reject`);
        }
        setInvoices((iv) => iv.map((x) => x.id === id ? { ...x, status } : x));
        await refreshTenants();
        if (verb) { logAct(`a ${verb} la facture ${id}`, 'Facturation', '#3B6A8F'); notify('Facture ' + id + ' ' + verb); }
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Erreur');
      }
    },

    savePlan: (orig, { name, price }) => {
      const priceStr = fmt(Number(price));
      if (orig) {
        setPlans((ps) => ps.map((p) => p.name === orig ? { ...p, name, price: priceStr } : p));
        logAct(`a modifié le plan ${name}`, 'Plans', '#8B5E2E'); notify('Plan ' + name + ' enregistré');
      } else {
        setPlans((ps) => [...ps, { name, color: '#5C4A88', price: priceStr, period: '/ mois', count: 0, mrr: 0, pop: false, feats: ['Nouveau plan personnalisé'] }]);
        logAct(`a créé le plan ${name}`, 'Plans', '#8B5E2E'); notify('Plan ' + name + ' créé');
      }
    },

    addTicket: ({ tenant, subject, prio, msg }) => {
      const id = '#T-' + (tickets.length + 1).toString().padStart(3, '0');
      setTickets((ts) => [{ id, subject, tenant, prio, status: 'Ouvert', agent: '—', upd: "à l'instant", msg }, ...ts]);
      notify('Ticket ' + id + ' créé');
    },
    updateTicket: (id, patch) => setTickets((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t)),
    assignTicket: (id) => {
      setTickets((ts) => ts.map((t) => t.id === id ? { ...t, agent: 'Super Admin', status: t.status === 'Ouvert' ? 'En cours' : t.status, upd: "à l'instant" } : t));
      notify('Ticket assigné');
    },
  };

  return (
    <UICtx.Provider value={store}>
      {children}
      {toast && <div className="toast-wrap"><div className="toast"><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{toast}</div></div>}
    </UICtx.Provider>
  );
}
