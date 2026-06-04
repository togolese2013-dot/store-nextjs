import React, { useEffect, useState } from 'react';
import type { Kpi } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { PLAN_ST } from '../data';
import { Spark, PageHead, KpiRow, Avatar, fmt } from '../primitives';

interface Stats {
  total_shops: number;
  active_shops: number;
  plan_basic: number;
  plan_pro: number;
  plan_business: number;
}

export default function OverviewPage() {
  const ui = useUI();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/saas/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const mrr = ui.tenants.reduce((s, t) => s + t.mrr, 0);
  const active = stats?.active_shops ?? ui.tenants.filter((t) => t.status === 'Actif').length;
  const total = stats?.total_shops ?? ui.tenants.length;

  const kpis: Kpi[] = [
    { l: 'MRR · revenu mensuel', v: fmt(mrr), u: 'F', sub: 'récurrent · ce mois', spark: [0,0,0,0,0,0,0,0,0,0,mrr], c: '#34396B' },
    { l: 'ARR projeté', v: fmt(mrr * 12), u: 'F', serif: true, sub: 'run-rate sur 12 mois' },
    { l: 'Boutiques actives', v: String(active), u: `/ ${total}`, sub: `${total} inscrites au total`, spark: [0,0,0,0,0,0,0,0,0,0,active], c: '#3B6A8F' },
    { l: 'Churn mensuel', v: '0', u: '%', sub: '0 boutique perdue', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#2D6A4F' },
  ];

  const planColors: Record<string, string> = { Starter: '#3B6A8F', Business: '#34396B', Enterprise: '#8B5E2E' };
  const segs = ui.tenants.length > 0
    ? (['Starter', 'Business', 'Enterprise'] as const).map((name) => {
        const count = ui.tenants.filter((t) => t.plan === name).length;
        const segMrr = ui.tenants.filter((t) => t.plan === name).reduce((s, t) => s + t.mrr, 0);
        const pct = mrr > 0 ? Math.round(segMrr / mrr * 100) : 0;
        return { name, color: planColors[name], ca: `${fmt(segMrr)} F`, pct, count };
      }).filter((s) => s.count > 0)
    : [];

  const recents = [...ui.tenants].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <>
      <PageHead eyb="Super Admin · Plateforme" title="Vue d'ensemble" serif="plateforme" sub={`Afrisika · ${total} boutique${total > 1 ? 's' : ''} · ${fmt(mrr)} F de revenu mensuel récurrent`}>
        <button className="btn" onClick={() => ui.notify('Génération du rapport global…')}><I.download /> Rapport global</button>
        <button className="btn pri" onClick={() => ui.openModal('invite')}><I.plus /> Inviter une boutique</button>
      </PageHead>
      <KpiRow kpis={kpis} />
      <div className="ov-grid">
        <div className="ov-card">
          <div className="ov-card-h">Croissance du MRR · évolution</div>
          <div className="chart-wrap"><Spark data={[0,0,0,0,0,0,0,0,0,0,mrr]} color="#34396B" w={620} h={150} />
            <div className="chart-x"><span>—</span><span>—</span><span>—</span><span>—</span><span>—</span><span>—</span><span>—</span><span>—</span><span>—</span><span>—</span><span>Maintenant</span></div></div>
        </div>
        <div className="ov-side">
          <div className="ov-card"><div className="ov-card-h">Répartition du MRR par plan</div>
            {segs.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0' }}>Aucune boutique active</div>
              : segs.map((s) => <div key={s.name} className="seg-row"><div className="seg-name"><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />{s.name}</div><div className="seg-bar"><div className="seg-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div><div className="seg-n">{s.ca}</div></div>)}
          </div>
          <div className="ov-card"><div className="ov-card-h">Inscriptions récentes</div>
            {recents.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0' }}>Aucune boutique</div>
              : recents.map((r) => <div key={r.id} className="evt-item"><Avatar init={r.init} color={r.color} size={26} fs={9} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>{r.name}</div><div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{r.joined}</div></div><span className="tag" style={PLAN_ST[r.plan]}>{r.plan}</span></div>)}
          </div>
        </div>
      </div>
      <div className="ov-bot"><div className="ov-card">
        <div className="ov-card-h">Top boutiques · revenu mensuel <button className="btn sm" onClick={() => ui.goto('tenants')}>Voir toutes</button></div>
        <table className="mini-t"><thead><tr><th>Boutique</th><th>Plan</th><th>Localisation</th><th style={{ textAlign: 'right' }}>MRR</th><th style={{ textAlign: 'right' }}>Statut</th></tr></thead>
          <tbody>{ui.tenants.filter((t) => t.status === 'Actif').sort((a, b) => b.mrr - a.mrr).slice(0, 5).map((t) => <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => ui.openModal('tenantDetail', t)}>
            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar init={t.init} color={t.color} size={28} fs={10} /><span style={{ fontWeight: 500 }}>{t.name}</span></div></td>
            <td><span className="tag" style={PLAN_ST[t.plan]}>{t.plan}</span></td><td style={{ color: 'var(--muted)' }}>{t.city}</td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 500 }}>{fmt(t.mrr)} F</td>
            <td style={{ textAlign: 'right' }}><span className="st actif"><span className="d" />Actif</span></td></tr>)}
            {ui.tenants.filter((t) => t.status === 'Actif').length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>Aucune boutique active</td></tr>}
          </tbody></table>
      </div></div>
    </>
  );
}
