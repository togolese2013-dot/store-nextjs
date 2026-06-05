import React, { useState } from 'react';
import { I, initials } from './icons';
import { PLAN_PRICE, PLAN_ST, CITIES, INV_ST, PRIO_ST, TKT_ST } from './data';
import { useUI } from './store';
import { fmt, Avatar, Field, Modal, PlanPick, stClass } from './primitives';
import type { Tenant, Invoice, Ticket, Plan, Incident, PlanName } from './types';

function InviteModal({ close }: { close: () => void }) {
  const ui = useUI();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity]       = useState('Lomé');
  const [plan, setPlan]       = useState<PlanName>('Starter');
  const ok = name.trim() && email.trim() && username.trim() && password.length >= 6;
  return (
    <Modal title="Créer une boutique" sub="Un compte admin sera créé automatiquement · essai de 14 jours" onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Annuler</button><button className="btn pri" disabled={!ok} onClick={() => { ui.inviteTenant({ name, email, city, plan, username, password }); close(); }}><I.send size={13} /> Créer la boutique</button></>}>
      <div className="field-row">
        <Field label="Nom de la boutique"><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Boutique Améyo" /></Field>
        <Field label="Ville"><select className="inp" value={city} onChange={(e) => setCity(e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      </div>
      <Field label="Email du propriétaire"><input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="proprietaire@email.com" /></Field>
      <div className="field-row">
        <Field label="Identifiant de connexion"><input className="inp" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex. boutique_ameyo" /></Field>
        <Field label="Mot de passe (min. 6 car.)"><input className="inp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
      </div>
      <Field label="Plan proposé"><PlanPick value={plan} onChange={setPlan} /></Field>
    </Modal>
  );
}

function ChangePlanModal({ data, close }: { data: Tenant; close: () => void }) {
  const ui = useUI(); const [plan, setPlan] = useState<PlanName>(data.plan);
  return (
    <Modal title="Changer de plan" sub={data.name} onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Annuler</button><button className="btn pri" disabled={plan === data.plan} onClick={() => { ui.changePlan(data.name, plan); close(); }}>Confirmer le changement</button></>}>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>Plan actuel : <b style={{ color: 'var(--ink)' }}>{data.plan}</b> · {fmt(PLAN_PRICE[data.plan])} F/mois. Le nouveau tarif s'applique au prochain cycle de facturation.</div>
      <PlanPick value={plan} onChange={setPlan} />
    </Modal>
  );
}

function SuspendModal({ data, close }: { data: Tenant; close: () => void }) {
  const ui = useUI(); const reactivate = data.status === 'Suspendu'; const [reason, setReason] = useState('');
  return (
    <Modal title={reactivate ? 'Réactiver la boutique' : 'Suspendre la boutique'} sub={data.name} onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Annuler</button>{reactivate
        ? <button className="btn pri" onClick={() => { ui.setStatus(data.name, 'Actif', 'réactivée'); close(); }}><I.play size={13} /> Réactiver l'accès</button>
        : <button className="btn dgr" onClick={() => { ui.setStatus(data.name, 'Suspendu', 'suspendue'); close(); }}><I.pause size={13} /> Suspendre l'accès</button>}</>}>
      <div className={`callout ${reactivate ? 'warn' : 'dgr'}`}><I.alert size={17} /><div>{reactivate ? "La boutique retrouvera immédiatement l'accès à tous ses espaces." : "L'accès de la boutique sera bloqué pour tous les utilisateurs jusqu'à réactivation. Les données sont conservées."}</div></div>
      {!reactivate && <Field label="Motif (visible dans le journal)"><input className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Impayé · 2 mois de retard" style={{ marginTop: 14 }} /></Field>}
    </Modal>
  );
}

function DeleteTenantModal({ data, close }: { data: Tenant; close: () => void }) {
  const ui = useUI(); const [confirm, setConfirm] = useState('');
  return (
    <Modal title="Supprimer la boutique" sub={data.name} onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Annuler</button><button className="btn dgr" disabled={confirm !== data.name} onClick={() => { ui.removeTenant(data.name); close(); }}><I.trash size={13} /> Supprimer définitivement</button></>}>
      <div className="callout dgr"><I.alert size={17} /><div>Action irréversible. Toutes les données de la boutique (produits, ventes, clients) seront supprimées et l'abonnement résilié.</div></div>
      <Field label={<span>Tapez <b>{data.name}</b> pour confirmer</span>}><input className="inp" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={data.name} style={{ marginTop: 14 }} /></Field>
    </Modal>
  );
}

function TenantDetailModal({ data, close }: { data: Tenant; close: () => void }) {
  const ui = useUI(); const t = ui.tenants.find((x) => x.name === data.name) || data;
  const invs = ui.invoices.filter((i) => i.tenant === t.name);
  return (
    <Modal title={t.name} sub={`${t.plan} · ${t.city}`} onClose={close} wide
      footer={<><button className="btn" onClick={() => ui.openModal('suspend', t)}>{t.status === 'Suspendu' ? 'Réactiver' : 'Suspendre'}</button><button className="btn pri" onClick={() => ui.openModal('changePlan', t)}><I.layers size={13} /> Changer de plan</button></>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}><Avatar init={t.init} color={t.color} size={48} fs={16} />
        <div><div style={{ fontSize: 16, fontWeight: 600 }}>{t.name}</div><div style={{ marginTop: 4 }}><span className={`st ${stClass(t.status)}`}><span className="d" />{t.status}</span></div></div></div>
      <div className="dl">
        <div><div className="dt">Plan</div><div className="dd"><span className="tag" style={PLAN_ST[t.plan]}>{t.plan}</span></div></div>
        <div><div className="dt">Revenu mensuel</div><div className="dd" style={{ fontFamily: 'var(--font-geist-mono),monospace' }}>{fmt(t.mrr)} F</div></div>
        <div><div className="dt">Localisation</div><div className="dd">{t.city}</div></div>
        <div><div className="dt">Inscrite le</div><div className="dd">{t.joined}</div></div>
        <div><div className="dt">Dernière activité</div><div className="dd">{t.last}</div></div>
        <div><div className="dt">Identifiant</div><div className="dd" style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12 }}>shop_{t.init.toLowerCase()}_{String(t.name.length * 7).padStart(3, '0')}</div></div>
      </div>
      <div className="modal-sec">Factures récentes</div>
      {invs.length ? <table className="mini-t"><tbody>{invs.map((i) => <tr key={i.id}>
        <td style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12 }}>{i.id}</td><td style={{ color: 'var(--muted)' }}>{i.date}</td>
        <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 500 }}>{fmt(i.amount)} F</td>
        <td style={{ textAlign: 'right' }}><span className="tag" style={INV_ST[i.status]}>{i.status}</span></td></tr>)}</tbody></table>
        : <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>Aucune facture pour cette boutique.</div>}
    </Modal>
  );
}

function InvoiceModal({ data, close }: { data: Invoice; close: () => void }) {
  const ui = useUI(); const inv = ui.invoices.find((x) => x.id === data.id) || data; const paid = inv.status === 'Payée';
  return (
    <Modal title={inv.id} sub={`${inv.tenant} · ${inv.date}`} onClose={close}
      footer={<><button className="btn ghost" onClick={() => { ui.notify('Facture renvoyée à ' + inv.tenant); }}><I.send size={13} /> Renvoyer</button>
        {inv.status !== 'Payée' && inv.status !== 'Remboursée' && <button className="btn pri" onClick={() => { ui.markInvoice(inv.id, 'Payée', 'marquée payée'); close(); }}><I.check size={13} /> Marquer payée</button>}
        {paid && <button className="btn dgr" onClick={() => ui.openModal('refund', inv)}><I.refresh size={13} /> Rembourser</button>}</>}>
      <div className="dl">
        <div><div className="dt">Boutique</div><div className="dd">{inv.tenant}</div></div>
        <div><div className="dt">Plan</div><div className="dd"><span className="tag" style={PLAN_ST[inv.plan]}>{inv.plan}</span></div></div>
        <div><div className="dt">Moyen de paiement</div><div className="dd">{inv.method}</div></div>
        <div><div className="dt">Statut</div><div className="dd"><span className="tag" style={INV_ST[inv.status]}>{inv.status}</span></div></div>
      </div>
      <div className="modal-sec">Détail</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>Abonnement {inv.plan} · 1 mois</span><span style={{ fontFamily: 'var(--font-geist-mono),monospace' }}>{fmt(inv.amount)} F</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, padding: '12px 0 2px' }}><span>Total</span><span style={{ fontFamily: 'var(--font-geist-mono),monospace' }}>{fmt(inv.amount)} F</span></div>
    </Modal>
  );
}

function RefundModal({ data, close }: { data: Invoice; close: () => void }) {
  const ui = useUI(); const [reason, setReason] = useState('');
  return (
    <Modal title="Rembourser la facture" sub={`${data.id} · ${data.tenant}`} onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Annuler</button><button className="btn dgr" onClick={() => { ui.markInvoice(data.id, 'Remboursée', 'remboursée'); close(); }}><I.refresh size={13} /> Rembourser {fmt(data.amount)} F</button></>}>
      <div className="callout warn"><I.alert size={17} /><div>Le montant de <b>{fmt(data.amount)} F</b> sera recrédité via {data.method}. Le MRR de la boutique sera ajusté.</div></div>
      <Field label="Motif du remboursement"><textarea className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Facturation en double" style={{ marginTop: 14 }} /></Field>
    </Modal>
  );
}

function PlanModal({ data, close }: { data?: Plan; close: () => void }) {
  const ui = useUI(); const editing = !!data;
  const [name, setName] = useState(data?.name ?? '');
  const unit = data ? Number((data.price || '').replace(/\s/g, '')) : '';
  const [p, setP] = useState(unit ? String(unit) : '');
  const ok = name.trim() && ('' + p).trim();
  return (
    <Modal title={editing ? 'Modifier le plan' : 'Nouveau plan'} sub={editing ? data!.name : "Créer une nouvelle formule d'abonnement"} onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Annuler</button><button className="btn pri" disabled={!ok} onClick={() => { ui.savePlan(editing ? data!.name : null, { name, price: p }); close(); }}>{editing ? 'Enregistrer' : 'Créer le plan'}</button></>}>
      <div className="field-row">
        <Field label="Nom du plan"><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Pro" /></Field>
        <Field label="Prix mensuel (F CFA)"><input className="inp" type="number" value={p} onChange={(e) => setP(e.target.value)} placeholder="25000" /></Field>
      </div>
      <Field label="Fonctionnalités (une par ligne)"><textarea className="inp" defaultValue={(data?.feats || []).join('\n')} placeholder={"Multi-points de vente\nE-commerce & livraison\nSupport prioritaire"} style={{ minHeight: 120 }} /></Field>
    </Modal>
  );
}

function NewTicketModal({ close }: { close: () => void }) {
  const ui = useUI();
  const [tenant, setTenant] = useState(ui.tenants[0]?.name ?? '');
  const [subject, setSubject] = useState(''); const [prio, setPrio] = useState<'Haute' | 'Moyenne' | 'Basse'>('Moyenne'); const [msg, setMsg] = useState('');
  const ok = subject.trim() && msg.trim();
  return (
    <Modal title="Nouveau ticket" sub="Créer une demande de support au nom d'une boutique" onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Annuler</button><button className="btn pri" disabled={!ok} onClick={() => { ui.addTicket({ tenant, subject, prio, msg }); close(); }}>Créer le ticket</button></>}>
      <div className="field-row">
        <Field label="Boutique"><select className="inp" value={tenant} onChange={(e) => setTenant(e.target.value)}>{ui.tenants.map((t) => <option key={t.name}>{t.name}</option>)}</select></Field>
        <Field label="Priorité"><select className="inp" value={prio} onChange={(e) => setPrio(e.target.value as any)}>{['Haute', 'Moyenne', 'Basse'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>
      <Field label="Sujet"><input className="inp" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. Problème de paiement" /></Field>
      <Field label="Message"><textarea className="inp" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Décrivez la demande…" /></Field>
    </Modal>
  );
}

function TicketModal({ data, close }: { data: Ticket; close: () => void }) {
  const ui = useUI(); const t = ui.tickets.find((x) => x.id === data.id) || data; const [reply, setReply] = useState('');
  return (
    <Modal title={t.subject} sub={`${t.id} · ${t.tenant}`} onClose={close} wide
      footer={<><button className="btn ghost" onClick={() => { ui.assignTicket(t.id); }}><I.userPlus size={13} /> {t.agent === 'Awa S.' ? 'Assigné' : "M'assigner"}</button>
        {t.status !== 'Résolu' ? <button className="btn pri" onClick={() => { ui.updateTicket(t.id, { status: 'Résolu', upd: "à l'instant" }); ui.notify('Ticket ' + t.id + ' résolu'); close(); }}><I.check size={13} /> Marquer résolu</button>
          : <button className="btn" onClick={() => { ui.updateTicket(t.id, { status: 'Ouvert', upd: "à l'instant" }); }}>Rouvrir</button>}</>}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <span className="tag" style={PRIO_ST[t.prio]}>Priorité {t.prio.toLowerCase()}</span>
        <span className={`st ${TKT_ST[t.status].cls}`} style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(20,17,14,.05)' }}><span className="d" />{t.status}</span>
        <span className="tag">Agent : {t.agent}</span>
      </div>
      <div className="conv">
        <div className="msg"><Avatar init={initials(t.tenant)} color="#8A8278" size={30} fs={10} /><div className="bub"><div className="who">{t.tenant} · {t.upd}</div>{t.msg}</div></div>
        {t.status !== 'Ouvert' && <div className="msg me"><Avatar init="AS" color="#34396B" size={30} fs={10} /><div className="bub"><div className="who">Awa Sané · support</div>Bonjour, merci pour votre message. Nous prenons en charge votre demande et revenons vers vous rapidement.</div></div>}
      </div>
      <div className="modal-sec">Répondre</div>
      <textarea className="inp" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Écrire une réponse…" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}><button className="btn pri sm" disabled={!reply.trim()} onClick={() => { ui.updateTicket(t.id, { status: 'En cours', agent: 'Awa S.', upd: "à l'instant" }); ui.notify('Réponse envoyée à ' + t.tenant); setReply(''); }}><I.send size={12} /> Envoyer</button></div>
    </Modal>
  );
}

function IncidentModal({ data, close }: { data: Incident; close: () => void }) {
  return (
    <Modal title={data.title} sub={data.time} onClose={close} footer={<button className="btn pri" onClick={close}>Fermer</button>}>
      <div className="callout" style={{ background: `${data.color}1A`, color: data.color, marginBottom: 16 }}><I.activity size={17} /><div><b>{data.sev}</b> — {data.desc}</div></div>
      <div className="modal-sec">Chronologie</div>
      <div>{data.timeline.map((e, i) => <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12, color: 'var(--muted)', width: 56, flexShrink: 0 }}>{e[0]}</span><span style={{ fontSize: 13 }}>{e[1]}</span></div>)}</div>
    </Modal>
  );
}

/** Renders whichever modal is active in the store. Mount once near the root. */
export function ModalRouter() {
  const ui = useUI(); const m = ui.modal; if (!m) return null; const close = ui.closeModal;
  switch (m.type) {
    case 'invite': return <InviteModal close={close} />;
    case 'changePlan': return <ChangePlanModal data={m.data} close={close} />;
    case 'suspend': return <SuspendModal data={m.data} close={close} />;
    case 'deleteTenant': return <DeleteTenantModal data={m.data} close={close} />;
    case 'tenantDetail': return <TenantDetailModal data={m.data} close={close} />;
    case 'invoice': return <InvoiceModal data={m.data} close={close} />;
    case 'refund': return <RefundModal data={m.data} close={close} />;
    case 'plan': return <PlanModal data={m.data} close={close} />;
    case 'newTicket': return <NewTicketModal close={close} />;
    case 'ticket': return <TicketModal data={m.data} close={close} />;
    case 'incident': return <IncidentModal data={m.data} close={close} />;
    default: return null;
  }
}
