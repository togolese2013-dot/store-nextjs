import React, { useMemo, useState } from 'react';
import type { Kpi, TierName } from '../types';
import { CLIENTS, TIER_STYLE } from '../data';
import { DownloadIcon, PlusIcon, FilterIcon, ChevronDownIcon, MoreIcon } from '../icons';
import { PageHead, KpiRow, Tag, fmt } from '../primitives';
import styles from '../Crm.module.css';

const KPIS: Kpi[] = [
  { l: 'Clients totaux', v: '1 421', d: '+86', dc: '#2D6A4F', sub: 'ce mois', spark: [1180,1220,1255,1290,1310,1340,1360,1385,1400,1412,1421], c: '#5C4A88' },
  { l: 'Clients Or',     v: '142',   d: '+9',  dc: '#2D6A4F', sub: '≥ 500 000 F cumulés', spark: [110,115,120,124,128,131,134,137,139,141,142], c: '#C8962A' },
  { l: 'Panier moyen',   v: '18 200', u: 'F',  d: '+5%', dc: '#2D6A4F', sub: 'tous clients', spark: [15,15.5,16,16.5,17,17.3,17.6,17.9,18,18.1,18.2], c: '#3B6A8F' },
];

type TabId = 'all' | TierName;
const TABS: { id: TabId; l: string; c: number }[] = [
  { id: 'all',     l: 'Tous',     c: 1421 },
  { id: 'Or',      l: 'Or',       c: 142 },
  { id: 'Argent',  l: 'Argent',   c: 386 },
  { id: 'Bronze',  l: 'Bronze',   c: 512 },
  { id: 'Nouveau', l: 'Nouveaux', c: 381 },
];

export default function ClientsPage() {
  const [tab, setTab] = useState<TabId>('all');
  const vis = useMemo(
    () => (tab === 'all' ? CLIENTS : CLIENTS.filter((c) => c.tier === tab)),
    [tab],
  );

  return (
    <>
      <PageHead
        eyebrow="CRM · Clients" title="Comptes" serif="clients"
        sub="1 421 clients · 4 niveaux de fidélité · base synchronisée tous workspaces"
      >
        <button type="button" className={styles.btn}><DownloadIcon /> Exporter</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><PlusIcon /> Nouveau client</button>
      </PageHead>

      <KpiRow kpis={KPIS} cols={3} />

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.l}<span className={styles.tabPill}>{fmt(t.c)}</span>
          </button>
        ))}
      </div>

      <div className={styles.tools}>
        <button type="button" className={styles.chip}><FilterIcon size={12} /> Filtres</button>
        <button type="button" className={styles.chip}>Niveau <ChevronDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Dernière commande <ChevronDownIcon size={10} /></button>
        <button type="button" className={`${styles.chip} ${styles.add}`}>+ Filtre</button>
      </div>

      <div className={styles.twrap}>
        <div className={styles.tscroll}>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Niveau</th>
                <th style={{ textAlign: 'right' }}>Commandes</th>
                <th style={{ textAlign: 'right' }}>Total dépensé</th>
                <th>Dernière commande</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vis.map((c) => (
                <tr key={c.email}>
                  <td>
                    <div className={styles.cellName}>
                      <div className={styles.rowAvatar} style={{ background: c.color }}>{c.init}</div>
                      {c.name}
                    </div>
                  </td>
                  <td>
                    <div className={styles.cellContact}>{c.email}</div>
                    <div className={styles.cellPhone}>{c.phone}</div>
                  </td>
                  <td><Tag label={c.tier} style={TIER_STYLE[c.tier]} /></td>
                  <td className={styles.numCell}>{c.orders}</td>
                  <td className={styles.numCellStrong}>{fmt(c.total)} F</td>
                  <td className={styles.dimCell}>{c.last}</td>
                  <td className={styles.actCol}>
                    <button type="button" className={styles.rm}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tfoot}>
          <span>Affichage {vis.length} sur {tab === 'all' ? '1 421' : fmt(vis.length)}</span>
          <div className={styles.pgr}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">…</button>
            <button type="button">178</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
