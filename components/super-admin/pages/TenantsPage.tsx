import React, { useState, useMemo } from 'react';
import type { Kpi, Tenant } from '../types';
import { useUI } from '../store';
import { I } from '../icons';
import { PLAN_ST, TENANT_TABS } from '../data';
import { KpiRow, PageHead, Avatar, Cbx, useSel, RowMenu, fmt, stClass } from '../primitives';

export default function TenantsPage() {
  const ui = useUI();
  const [tab, setTab] = useState<string>('all');
  const [menu, setMenu] = useState<string | null>(null);
  const selH = useSel();
  const billable = useMemo(() => ui.tenants.filter((t) => t.id !== 1), [ui.tenants]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: billable.length };
    billable.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [billable]);
  const vis = useMemo(() => (tab === 'all' ? billable : billable.filter((t) => t.status === tab)), [tab, billable]);
  const allSel = vis.length > 0 && vis.every((t) => selH.has(t.name));
  const kpis: Kpi[] = [
    { l: 'Boutiques totales', v: String(ui.tenants.length), sub: 'inscrites', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#34396B' },
    { l: 'Actives & payantes', v: String(counts['Actif'] || 0), sub: 'du parc', spark: [0,0,0,0,0,0,0,0,0,0,0], c: '#2D6A4F' },
    { l: "En période d'essai", v: String(counts['Essai'] || 0), sub: 'en cours' },
    { l: 'À risque', v: String((counts['Impayé'] || 0) + (counts['Suspendu'] || 0)), sub: 'impayé / suspendu' },
  ];
  return (
    <>
      <PageHead eyb="Super Admin · Parc" title="Boutiques" serif="abonnées" sub="Afrisika · gérez les abonnements, l'accès et le statut de chaque commerce">
        <button className="btn" onClick={() => ui.notify('Export CSV des boutiques…')}><I.download /> Exporter</button>
        <button className="btn pri" onClick={() => ui.openModal('invite')}><I.plus /> Inviter une boutique</button>
      </PageHead>
      <KpiRow kpis={kpis} />
      <div className="tabs">{TENANT_TABS.map((t) => <button key={t.id} className={`tab ${tab === t.id ? 'act' : ''}`} onClick={() => { setTab(t.id); selH.clear(); }}>{t.l}<span className="pl">{t.id === 'all' ? counts.all : (counts[t.id] || 0)}</span></button>)}</div>
      <div className="tools">
        <button className="chip" onClick={() => ui.notify('Panneau de filtres')}><I.filter size={12} /> Filtres</button>
        <button className="chip">Plan <I.chevD size={10} /></button><button className="chip">Localisation <I.chevD size={10} /></button><button className="chip add" onClick={() => ui.notify('Ajouter un filtre')}>+ Filtre</button>
      </div>
      <div className="twrap">
        {selH.sel.length > 0 && <div className="bulkbar"><Cbx checked onChange={selH.clear} /><span className="bb-n">{selH.sel.length} sélectionnée{selH.sel.length > 1 ? 's' : ''}</span>
          <div className="bb-actions">
            <button className="bb-btn" onClick={() => { ui.notify('Email envoyé à ' + selH.sel.length + ' boutique(s)'); selH.clear(); }}><I.send size={13} /> Email groupé</button>
            <button className="bb-btn" onClick={() => { ui.bulkStatus(selH.sel, 'Suspendu'); ui.notify(selH.sel.length + ' boutique(s) suspendue(s)'); selH.clear(); }}><I.pause size={13} /> Suspendre</button>
            <button className="bb-btn x" onClick={selH.clear}><I.x size={14} /></button>
          </div></div>}
        <div className="tscroll"><table><thead><tr>
          <th className="cbx-c"><Cbx checked={allSel} onChange={() => selH.set(allSel ? [] : vis.map((t) => t.name))} /></th>
          <th>Boutique</th><th>Plan</th><th style={{ textAlign: 'right' }}>MRR</th><th>Localisation</th><th>Inscrite le</th><th>Dernière activité</th><th>Statut</th><th /></tr></thead>
          <tbody>{vis.map((t) => <tr key={t.name} className={selH.has(t.name) ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => ui.openModal('tenantDetail', t)}>
            <td className="cbx-c" onClick={(e) => e.stopPropagation()}><Cbx checked={selH.has(t.name)} onChange={() => selH.toggle(t.name)} /></td>
            <td><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar init={t.init} color={t.color} /><div style={{ fontWeight: 500 }}>{t.name}</div></div></td>
            <td><span className="tag" style={PLAN_ST[t.plan]}>{t.plan}</span></td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono),monospace', fontSize: 13, fontWeight: 500 }}>{t.mrr ? `${fmt(t.mrr)} F` : '—'}</td>
            <td style={{ fontSize: 13, color: 'var(--muted)' }}>{t.city}</td><td style={{ fontSize: 13, color: 'var(--muted)' }}>{t.joined}</td><td style={{ fontSize: 13, color: 'var(--muted)' }}>{t.last}</td>
            <td><span className={`st ${stClass(t.status)}`}><span className="d" />{t.status}</span></td>
            <td className="act-c" onClick={(e) => e.stopPropagation()}><button className="rm" onClick={() => setMenu(menu === t.name ? null : t.name)}><I.more size={16} /></button>
              {menu === t.name && <RowMenu onClose={() => setMenu(null)} items={[
                { ic: <I.layers size={15} />, label: 'Détails de la boutique', onClick: () => ui.openModal('tenantDetail', t) },
                { ic: <I.layers size={15} />, label: 'Changer de plan', onClick: () => ui.openModal('changePlan', t) },
                { ic: <I.send size={15} />, label: 'Envoyer un email', onClick: () => ui.notify('Email à ' + t.name) },
                { sep: true },
                t.status === 'Suspendu' ? { ic: <I.play size={15} />, label: "Réactiver l'accès", onClick: () => ui.openModal('suspend', t) } : { ic: <I.pause size={15} />, label: "Suspendre l'accès", onClick: () => ui.openModal('suspend', t) },
                { ic: <I.trash size={15} />, label: 'Supprimer la boutique', danger: true, onClick: () => ui.openModal('deleteTenant', t) },
              ]} />}
            </td></tr>)}</tbody></table></div>
        <div className="tfoot"><span>Affichage {vis.length} sur {ui.tenants.length}</span><div className="pgr"><button>‹</button><button className="on">1</button><button>2</button><button>3</button><button>›</button></div></div>
      </div>
    </>
  );
}
