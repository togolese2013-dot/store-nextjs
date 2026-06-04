import React from 'react';
import type { Kpi } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { SERVICES, SYS_ST, INCIDENTS } from '../data';
import { KpiRow, PageHead } from '../primitives';

const KPIS: Kpi[] = [
  { l: 'Uptime · 30 jours', v: '—', u: '%', sub: 'SLA 99,9% objectif', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#2D6A4F' },
  { l: 'Latence API moyenne', v: '—', u: 'ms', sub: 'p95 · 7 derniers jours', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#34396B' },
  { l: 'Incidents en cours', v: '0', sub: 'aucun incident actif' },
  { l: 'Transactions · 24h', v: '0', sub: 'paiements traités', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#3B6A8F' },
];

export default function SystemPage() {
  const ui = useUI();
  return (
    <>
      <PageHead eyb="Super Admin · Infrastructure" title="Santé" serif="système" sub="État des services en temps réel · uptime, latence et incidents sur la plateforme">
        <button className="btn" onClick={() => ui.notify('Configuration des alertes')}><I.bell size={14} /> Alertes</button>
        <button className="btn" onClick={() => ui.notify('Rapport SLA généré')}><I.download /> Rapport SLA</button>
      </PageHead>
      <KpiRow kpis={KPIS} />
      <div className="sys-grid">{SERVICES.map((s) => { const Icon = s.ic; const st = SYS_ST[s.state]; return <div key={s.name} className="sys-card">
        <div className="sys-top"><div className="sys-ic" style={{ background: s.bg, color: s.tint }}><Icon size={17} /></div>
          <div style={{ flex: 1, minWidth: 0 }}><div className="sys-n">{s.name}</div><div className="sys-cat">{s.cat}</div></div>
          <span className="st" style={{ color: st.color }}><span className="d" style={{ background: st.bg }} />{s.state}</span></div>
        <div className="upbar">{s.bars.map((b, i) => <i key={i} className={b === 'warn' ? 'warn' : b === 'down' ? 'down' : ''} style={{ height: `${b === 'down' ? 40 : b === 'warn' ? 70 : 100}%` }} />)}</div>
        <div className="sys-meta"><span>Uptime 30j <b>{s.uptime}</b></span><span>Latence <b>{s.extra}</b></span></div></div>; })}</div>
      <div className="ov-bot" style={{ paddingTop: 20 }}><div className="ov-card">
        <div className="ov-card-h">Incidents récents</div>
        {INCIDENTS.map((inc, i) => <div key={i} className="evt-item incident" style={{ alignItems: 'flex-start', padding: '12px 10px', margin: '0 -10px' }} onClick={() => ui.openModal('incident', inc)}>
          <span className="tag" style={{ background: `${inc.color}1A`, color: inc.color, flexShrink: 0, marginTop: 1 }}>{inc.sev}</span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{inc.title}</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>{inc.desc}</div></div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>{inc.time}</div></div>)}
      </div></div>
    </>
  );
}
