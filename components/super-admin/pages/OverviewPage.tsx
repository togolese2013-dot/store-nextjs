import React from 'react';
import type { Kpi } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { PLAN_ST } from '../data';
import { Spark, PageHead, KpiRow, Avatar, fmt } from '../primitives';

const KPIS: Kpi[] = [
  { l: 'MRR · revenu mensuel', v: '0', u: 'F', sub: 'récurrent · ce mois', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#34396B' },
  { l: 'ARR projeté', v: '0', u: 'F', serif: true, sub: 'run-rate sur 12 mois' },
  { l: 'Boutiques actives', v: '0', u: '/ 0', sub: '0 inscriptions ce mois', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#3B6A8F' },
  { l: 'Churn mensuel', v: '0', u: '%', sub: '0 boutique perdue', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#2D6A4F' },
];
const SEGS: { name: string; color: string; ca: string; pct: number }[] = [];
const RECENTS: { n: string; c: string; i: string; t: string; p: string }[] = [];

export default function OverviewPage() {
  const ui = useUI();
  return (
    <>
      <PageHead eyb="Super Admin · Plateforme" title="Vue d'ensemble" serif="plateforme" sub="Afrisika · 0 boutique · 0 F de revenu mensuel récurrent">
        <button className="btn" onClick={() => ui.notify('Génération du rapport global…')}><I.download /> Rapport global</button>
        <button className="btn pri" onClick={() => ui.openModal('invite')}><I.plus /> Inviter une boutique</button>
      </PageHead>
      <KpiRow kpis={KPIS} />
      <div className="ov-grid">
        <div className="ov-card">
          <div className="ov-card-h">Croissance du MRR · 11 derniers mois</div>
          <div className="chart-wrap"><Spark data={[0,0,0,0,0,0,0,0,0,0,0]} color="#34396B" w={620} h={150} />
            <div className="chart-x"><span>juil.</span><span>août</span><span>sept.</span><span>oct.</span><span>nov.</span><span>déc.</span><span>jan.</span><span>fév.</span><span>mars</span><span>avr.</span><span>mai</span></div></div>
        </div>
        <div className="ov-side">
          <div className="ov-card"><div className="ov-card-h">Répartition du MRR par plan</div>
            {SEGS.map((s) => <div key={s.name} className="seg-row"><div className="seg-name"><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />{s.name}</div><div className="seg-bar"><div className="seg-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div><div className="seg-n">{s.ca}</div></div>)}</div>
          <div className="ov-card"><div className="ov-card-h">Inscriptions récentes</div>
            {RECENTS.map((r, i) => <div key={i} className="evt-item"><Avatar init={r.i} color={r.c} size={26} fs={9} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>{r.n}</div><div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{r.t}</div></div><span className="tag" style={PLAN_ST[r.p]}>{r.p}</span></div>)}</div>
        </div>
      </div>
      <div className="ov-bot"><div className="ov-card">
        <div className="ov-card-h">Top boutiques · revenu mensuel <button className="btn sm" onClick={() => ui.goto('tenants')}>Voir toutes</button></div>
        <table className="mini-t"><thead><tr><th>Boutique</th><th>Plan</th><th>Localisation</th><th style={{ textAlign: 'right' }}>MRR</th><th style={{ textAlign: 'right' }}>Statut</th></tr></thead>
          <tbody>{ui.tenants.filter((t) => t.status === 'Actif').sort((a, b) => b.mrr - a.mrr).slice(0, 5).map((t) => <tr key={t.name} style={{ cursor: 'pointer' }} onClick={() => ui.openModal('tenantDetail', t)}>
            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar init={t.init} color={t.color} size={28} fs={10} /><span style={{ fontWeight: 500 }}>{t.name}</span></div></td>
            <td><span className="tag" style={PLAN_ST[t.plan]}>{t.plan}</span></td><td style={{ color: 'var(--muted)' }}>{t.city}</td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 500 }}>{fmt(t.mrr)} F</td>
            <td style={{ textAlign: 'right' }}><span className="st actif"><span className="d" />Actif</span></td></tr>)}</tbody></table>
      </div></div>
    </>
  );
}
