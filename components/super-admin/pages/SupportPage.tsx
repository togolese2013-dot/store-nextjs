import React from 'react';
import type { Kpi } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { PRIO_ST, TKT_ST } from '../data';
import { KpiRow, PageHead } from '../primitives';

export default function SupportPage() {
  const ui = useUI();
  const open = ui.tickets.filter((t) => t.status !== 'Résolu').length;
  const kpis: Kpi[] = [
    { l: 'Tickets ouverts', v: String(open), d: '2 prioritaires', dc: '#9C3A14', di: <span />, sub: 'sur 8 ce mois' },
    { l: 'Temps de réponse moyen', v: '2h 14m', sub: 'objectif : < 4h', spark: [4,3.8,3.5,3.2,3,2.8,2.6,2.5,2.4,2.3,2.2], c: '#34396B' },
    { l: 'Satisfaction', v: '4,6', u: '/ 5', d: '+0,2', dc: '#2D6A4F', sub: '126 réponses', spark: [4.1,4.2,4.2,4.3,4.4,4.4,4.5,4.5,4.6,4.6,4.6], c: '#2D6A4F' },
  ];
  return (
    <>
      <PageHead eyb="Super Admin · Assistance" title="Support &" serif="tickets" sub="Demandes des boutiques abonnées · priorisez, assignez et suivez la résolution">
        <button className="btn" onClick={() => ui.notify('Filtrer les tickets')}><I.filter size={14} /> Filtrer</button>
        <button className="btn pri" onClick={() => ui.openModal('newTicket')}><I.plus /> Nouveau ticket</button>
      </PageHead>
      <KpiRow kpis={kpis} cols={3} />
      <div className="twrap" style={{ marginTop: 16 }}><div className="tscroll"><table><thead><tr>
        <th>Ticket</th><th>Sujet</th><th>Boutique</th><th>Priorité</th><th>Statut</th><th>Agent</th><th style={{ textAlign: 'right' }}>Mis à jour</th></tr></thead>
        <tbody>{ui.tickets.map((t) => <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => ui.openModal('ticket', t)}>
          <td style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12.5, fontWeight: 500 }}>{t.id}</td>
          <td style={{ fontSize: 13, fontWeight: 500, maxWidth: 280 }}>{t.subject}</td><td style={{ fontSize: 13, color: 'var(--muted)' }}>{t.tenant}</td>
          <td><span className="tag" style={PRIO_ST[t.prio]}>{t.prio}</span></td>
          <td><span className={`st ${TKT_ST[t.status].cls}`}><span className="d" />{t.status}</span></td>
          <td style={{ fontSize: 13, color: t.agent === '—' ? 'var(--muted-2)' : 'var(--ink-2)' }}>{t.agent}</td>
          <td style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--muted)' }}>{t.upd}</td></tr>)}</tbody></table></div>
        <div className="tfoot"><span>{ui.tickets.length} tickets · {open} ouverts</span><div className="pgr"><button>‹</button><button className="on">1</button><button>›</button></div></div>
      </div>
    </>
  );
}
