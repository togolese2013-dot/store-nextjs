import React, { useState } from 'react';
import type { Kpi } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { PLAN_ST, INV_ST } from '../data';
import { KpiRow, PageHead, Cbx, useSel, RowMenu, fmt } from '../primitives';

export default function BillingPage() {
  const ui = useUI();
  const [menu, setMenu] = useState<string | null>(null);
  const selH = useSel();
  const allSel = ui.invoices.length > 0 && ui.invoices.every((i) => selH.has(i.id));
  const kpis: Kpi[] = [
    { l: 'Encaissé · ce mois', v: '1 042 000', u: 'F', d: '+12%', dc: '#2D6A4F', sub: 'paiements reçus', spark: [720,760,800,840,870,910,945,975,1000,1025,1042], c: '#34396B' },
    { l: 'En attente', v: '86 000', u: 'F', sub: '3 factures à échéance', spark: [60,70,65,80,75,90,85,88,84,86,86], c: '#C9601E' },
    { l: 'Impayés', v: '54 000', u: 'F', d: '2 factures', dc: '#9C3A14', di: <span />, sub: 'relance automatique active' },
    { l: 'Taux de recouvrement', v: '94', u: '%', d: '+2 pts', dc: '#2D6A4F', sub: 'sur 90 jours', spark: [88,89,90,90,91,92,92,93,93,94,94], c: '#2D6A4F' },
  ];
  return (
    <>
      <PageHead eyb="Super Admin · Revenus" title="Abonnements &" serif="facturation" sub="Encaissements, factures et impayés · paiement mobile money (Wave, Orange) et carte">
        <button className="btn" onClick={() => ui.notify('Règles de relance')}><I.cog size={14} /> Règles de relance</button>
        <button className="btn pri" onClick={() => ui.notify('Export comptable généré')}><I.download /> Exporter la compta</button>
      </PageHead>
      <KpiRow kpis={kpis} />
      <div className="twrap" style={{ marginTop: 16 }}>
        {selH.sel.length > 0 && <div className="bulkbar"><Cbx checked onChange={selH.clear} /><span className="bb-n">{selH.sel.length} facture(s)</span>
          <div className="bb-actions"><button className="bb-btn" onClick={() => { ui.notify('Relance envoyée'); selH.clear(); }}><I.send size={13} /> Relancer</button>
            <button className="bb-btn" onClick={() => { selH.sel.forEach((id) => ui.markInvoice(id, 'Payée')); ui.notify(selH.sel.length + ' facture(s) marquée(s) payée(s)'); selH.clear(); }}><I.check size={13} /> Marquer payées</button>
            <button className="bb-btn x" onClick={selH.clear}><I.x size={14} /></button></div></div>}
        <div className="tscroll"><table><thead><tr>
          <th className="cbx-c"><Cbx checked={allSel} onChange={() => selH.set(allSel ? [] : ui.invoices.map((i) => i.id))} /></th>
          <th>Facture</th><th>Boutique</th><th>Plan</th><th style={{ textAlign: 'right' }}>Montant</th><th>Émise le</th><th>Statut</th><th /></tr></thead>
          <tbody>{ui.invoices.map((inv) => <tr key={inv.id} className={selH.has(inv.id) ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => ui.openModal('invoice', inv)}>
            <td className="cbx-c" onClick={(e) => e.stopPropagation()}><Cbx checked={selH.has(inv.id)} onChange={() => selH.toggle(inv.id)} /></td>
            <td style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12.5, fontWeight: 500 }}>{inv.id}</td><td style={{ fontWeight: 500 }}>{inv.tenant}</td>
            <td><span className="tag" style={PLAN_ST[inv.plan]}>{inv.plan}</span></td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontSize: 13, fontWeight: 500 }}>{fmt(inv.amount)} F</td>
            <td style={{ fontSize: 13, color: 'var(--muted)' }}>{inv.date}</td><td><span className="tag" style={INV_ST[inv.status]}>{inv.status}</span></td>
            <td className="act-c" onClick={(e) => e.stopPropagation()}><button className="rm" onClick={() => setMenu(menu === inv.id ? null : inv.id)}><I.more size={16} /></button>
              {menu === inv.id && <RowMenu onClose={() => setMenu(null)} items={[
                { ic: <I.card size={15} />, label: 'Voir la facture', onClick: () => ui.openModal('invoice', inv) },
                { ic: <I.send size={15} />, label: 'Renvoyer au client', onClick: () => ui.notify('Facture renvoyée à ' + inv.tenant) },
                (inv.status !== 'Payée' && inv.status !== 'Remboursée') ? { ic: <I.check size={15} />, label: 'Marquer payée', onClick: () => ui.markInvoice(inv.id, 'Payée', 'marquée payée') } : { sep: false, label: '' },
                inv.status === 'Payée' ? { ic: <I.refresh size={15} />, label: 'Rembourser', danger: true, onClick: () => ui.openModal('refund', inv) } : { sep: false, label: '' },
              ].filter((x) => x.label)} />}
            </td></tr>)}</tbody></table></div>
        <div className="tfoot"><span>{ui.invoices.length} factures récentes · 291 émises au total</span><div className="pgr"><button>‹</button><button className="on">1</button><button>2</button><button>…</button><button>33</button><button>›</button></div></div>
      </div>
    </>
  );
}
