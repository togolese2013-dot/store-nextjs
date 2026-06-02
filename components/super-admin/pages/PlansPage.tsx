import React from 'react';
import type { Kpi } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { KpiRow, PageHead, fmt } from '../primitives';

const KPIS: Kpi[] = [
  { l: 'Plan le plus populaire', v: 'Business', serif: true, sub: '17 boutiques · 44% du MRR' },
  { l: 'Revenu moyen / boutique', v: '20 400', u: 'F', d: '+6%', dc: '#2D6A4F', sub: 'ARPA mensuel', spark: [16,16.8,17.4,18,18.6,19,19.4,19.8,20,20.2,20.4], c: '#34396B' },
  { l: 'Essais → payant', v: '63', u: '%', d: '+5 pts', dc: '#2D6A4F', sub: 'taux de conversion', spark: [52,54,56,57,58,59,60,61,62,62,63], c: '#2D6A4F' },
];

export default function PlansPage() {
  const ui = useUI();
  return (
    <>
      <PageHead eyb="Super Admin · Offres" title="Plans &" serif="tarifs" sub="3 formules · facturation mensuelle en F CFA · modifiez prix et fonctionnalités">
        <button className="btn" onClick={() => ui.notify('Édition des offres')}><I.cog size={14} /> Modifier les offres</button>
        <button className="btn pri" onClick={() => ui.openModal('plan')}><I.plus /> Nouveau plan</button>
      </PageHead>
      <KpiRow kpis={KPIS} cols={3} />
      <div className="plan-grid">{ui.plans.map((p) => <div key={p.name} className={`plan-card ${p.pop ? 'pop' : ''}`}>
        {p.pop && <div className="plan-pop-tag">Le plus choisi</div>}
        <button className="plan-edit" onClick={() => ui.openModal('plan', p)}><I.edit size={15} /></button>
        <div className="plan-name"><span className="plan-dot" style={{ background: p.color }} />{p.name}</div>
        <div className="plan-price"><b>{p.price} F</b><span>{p.period}</span></div>
        <div className="plan-feat">{p.feats.map((f, i) => <div key={i} className="f"><span className="ck"><I.check size={14} /></span>{f}</div>)}</div>
        <div className="plan-foot"><span className="plan-stat"><b>{p.count}</b> boutiques</span><span className="plan-stat"><b>{fmt(p.mrr)} F</b> / mois</span></div>
      </div>)}</div>
      <div className="ov-bot" style={{ paddingTop: 16 }}><div className="ov-card">
        <div className="ov-card-h">Répartition des boutiques par plan</div>
        <table className="mini-t"><thead><tr><th>Plan</th><th>Prix mensuel</th><th style={{ textAlign: 'right' }}>Boutiques</th><th style={{ textAlign: 'right' }}>MRR</th><th style={{ textAlign: 'right' }}>Part du revenu</th></tr></thead>
          <tbody>{ui.plans.map((p) => { const pct = Math.round(p.mrr / 959000 * 100); return <tr key={p.name}>
            <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: p.color, display: 'inline-block' }} /><span style={{ fontWeight: 500 }}>{p.name}</span></div></td>
            <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12 }}>{p.price} F</td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace' }}>{p.count}</td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 500 }}>{fmt(p.mrr)} F</td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontSize: 12, color: 'var(--muted)' }}>{pct}%</td></tr>; })}</tbody></table>
      </div></div>
    </>
  );
}
