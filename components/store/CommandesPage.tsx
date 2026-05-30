/**
 * CommandesPage — order management content
 * Mount via StoreShell (page id: 'commandes') or standalone.
 */
'use client';
import React, { useMemo, useState } from 'react';
import type { Order } from './types';
import { SAMPLE_ORDERS, COMMANDES_KPIS, ORDER_STATUS_STYLE } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, FilterIcon, ChevDownIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Store.module.css';

export interface CommandesPageProps {
  orders?: Order[];
  onCreateOrder?: () => void;
}

export default function CommandesPage({ orders = SAMPLE_ORDERS, onCreateOrder }: CommandesPageProps) {
  const [activeTab, setActiveTab] = useState('all');
  const totalCA = orders.reduce((s, o) => s + o.amount, 0);
  const TABS = [
    { id: 'all',       label: 'Toutes',     count: orders.length },
    { id: 'pending',   label: 'En attente', count: orders.filter(o => o.status === 'En attente').length, warn: true },
    { id: 'confirmed', label: 'Confirmées', count: orders.filter(o => o.status === 'Confirmée').length },
    { id: 'shipped',   label: 'Expédiées',  count: orders.filter(o => o.status === 'Expédiée').length },
    { id: 'delivered', label: 'Livrées',    count: orders.filter(o => o.status === 'Livrée').length },
    { id: 'cancelled', label: 'Annulées',   count: orders.filter(o => o.status === 'Annulée').length, warn: true },
  ];

  const visible = useMemo(() => {
    switch (activeTab) {
      case 'pending':   return orders.filter(o => o.status === 'En attente');
      case 'confirmed': return orders.filter(o => o.status === 'Confirmée');
      case 'shipped':   return orders.filter(o => o.status === 'Expédiée');
      case 'delivered': return orders.filter(o => o.status === 'Livrée');
      case 'cancelled': return orders.filter(o => o.status === 'Annulée');
      default: return orders;
    }
  }, [activeTab, orders]);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Store · Commandes</div>
          <h1 className={styles.title}>Gestion des <span className={styles.serif}>commandes</span></h1>
          <p className={styles.subtitle}>{orders.length} commande{orders.length !== 1 ? 's' : ''} · {orders.filter(o => o.status === 'En attente').length} en attente · {totalCA.toLocaleString('fr-FR')} F de CA</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}><DownloadIcon size={14} /> Exporter</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onCreateOrder}>
            <PlusIcon size={14} /> Nouvelle commande
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {COMMANDES_KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.sparkColor && <Sparkline data={k.spark} color={k.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        {TABS.map(t => (
          <button
            key={t.id} type="button"
            className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className={`${styles.pill} ${t.warn ? styles.warn : ''}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button type="button" className={styles.chip}><FilterIcon size={12} /> Filtres</button>
        <button type="button" className={styles.chip}>Statut <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Zone <ChevDownIcon size={10} /></button>
        <button type="button" className={styles.chip}>Paiement <ChevDownIcon size={10} /></button>
        <button type="button" className={`${styles.chip} ${styles.add}`}>+ Filtre</button>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Date</th>
                <th>Zone</th>
                <th style={{ textAlign: 'right' }}>Produits</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map(o => (
                <tr key={o.ref}>
                  <td>
                    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12.5, fontWeight: 500 }}>{o.ref}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 99, background: o.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                        {o.init}
                      </div>
                      <div className={styles.productName}>{o.client}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13, whiteSpace: 'nowrap' }}>{o.date}</td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{o.zone}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{o.products}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 500 }}>
                    {o.amount.toLocaleString('fr-FR')} F
                  </td>
                  <td><span className={styles.tag} style={ORDER_STATUS_STYLE[o.status]}>{o.status}</span></td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>Affichage {visible.length} sur 32</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
