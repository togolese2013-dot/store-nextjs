import React from 'react';
import { useUI } from '../store';
import { I } from '../icons';
import { PageHead, Avatar } from '../primitives';

export default function LogsPage() {
  const ui = useUI();
  return (
    <>
      <PageHead eyb="Super Admin · Audit" title="Journal d'" serif="audit" sub="Traçabilité des actions plateforme · équipe ShopSaaS et événements automatiques">
        <button className="btn" onClick={() => ui.notify('Filtrer le journal')}><I.filter size={14} /> Filtrer</button>
        <button className="btn" onClick={() => ui.notify('Export du journal')}><I.download /> Exporter</button>
      </PageHead>
      <div className="tools"><button className="chip">Membre <I.chevD size={10} /></button><button className="chip">Catégorie <I.chevD size={10} /></button><button className="chip">Période : 27–28 mai 2026 <I.chevD size={10} /></button></div>
      <div className="twrap"><div className="tscroll"><table><thead><tr><th>Date & heure</th><th>Auteur</th><th>Action</th><th>Catégorie</th></tr></thead>
        <tbody>{ui.audit.map((l, i) => <tr key={i}>
          <td style={{ color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{l.date}</td>
          <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar init={l.init} color={l.color} size={28} fs={10} /><span style={{ fontWeight: 500, fontSize: 13 }}>{l.who}</span></div></td>
          <td style={{ fontSize: 13 }}>{l.action}</td><td><span className="tag" style={{ background: `${l.catColor}1A`, color: l.catColor }}>{l.cat}</span></td></tr>)}</tbody></table></div>
        <div className="tfoot"><span>{ui.audit.length} affichés · 0 événements ce mois</span><div className="pgr"><button>‹</button><button className="on">1</button><button>2</button><button>3</button><button>›</button></div></div>
      </div>
    </>
  );
}
