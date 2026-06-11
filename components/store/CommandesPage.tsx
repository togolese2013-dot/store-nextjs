/**
 * CommandesPage — order management content
 * Mount via StoreShell (page id: 'commandes') or standalone.
 */
'use client';
import React, { useMemo, useState } from 'react';
import type { Order, OrderStatus } from './types';
import { SAMPLE_ORDERS, COMMANDES_KPIS, ORDER_STATUS_STYLE } from './sample-data';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, FilterIcon, ChevDownIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Store.module.css';

/* ─── Modal "Modifier une commande" ─────────────── */

const STATUTS: OrderStatus[] = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

// Sample coupon codes for demo validation
const DEMO_COUPONS: Record<string, { type: '%' | 'F'; valeur: number }> = {
  'PROMO10':  { type: '%', valeur: 10 },
  'REDUC5000': { type: 'F', valeur: 5000 },
  'SOLDES20': { type: '%', valeur: 20 },
};

function calcRemise(code: string, subtotal: number): number {
  const c = DEMO_COUPONS[code.toUpperCase()];
  if (!c) return 0;
  return c.type === '%' ? Math.round(subtotal * c.valeur / 100) : Math.min(c.valeur, subtotal);
}

interface EditModalProps {
  order: Order;
  onClose: () => void;
  onSave: (updated: Order) => void;
}

function EditOrderModal({ order, onClose, onSave }: EditModalProps) {
  const [statut, setStatut]         = useState<OrderStatus>(order.status);
  const [zone, setZone]             = useState(order.zone);
  const [telephone, setTelephone]   = useState(order.telephone ?? '');
  const [adresse, setAdresse]       = useState(order.adresse ?? '');
  const [couponInput, setCouponInput] = useState(order.couponCode ?? '');
  const [couponApplied, setCouponApplied] = useState<string | null>(order.couponCode ?? null);
  const [couponRemise, setCouponRemise]   = useState(order.couponRemise ?? 0);
  const [couponError, setCouponError]     = useState('');

  const items        = order.items ?? [];
  const frais        = order.fraisLivraison ?? 0;
  const subtotal     = items.reduce((s, i) => s + i.qty * i.prix, 0);
  const totalFinal   = Math.max(0, subtotal + frais - couponRemise);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Entrez un code promo.'); return; }
    if (!DEMO_COUPONS[code]) { setCouponError('Code invalide ou expiré.'); return; }
    const remise = calcRemise(code, subtotal);
    setCouponApplied(code);
    setCouponRemise(remise);
    setCouponError('');
  }

  function removeCoupon() {
    setCouponApplied(null);
    setCouponRemise(0);
    setCouponInput('');
    setCouponError('');
  }

  function handleSave() {
    onSave({
      ...order,
      status: statut,
      zone,
      telephone: telephone || undefined,
      adresse: adresse || undefined,
      couponCode: couponApplied ?? undefined,
      couponRemise: couponRemise || undefined,
      amount: totalFinal,
    });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(20,17,14,.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 14,
        width: '100%', maxWidth: 600, maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,.18)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 500, marginBottom: 2 }}>
              Modifier la commande
            </div>
            <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{order.ref}</div>
          </div>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: 'var(--muted)', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Infos client */}
          <section>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500, marginBottom: 10 }}>Client</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Téléphone</span>
                <input
                  value={telephone} onChange={e => setTelephone(e.target.value)}
                  style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 9, font: 'inherit', fontSize: '16px', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Zone</span>
                <input
                  value={zone} onChange={e => setZone(e.target.value)}
                  style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 9, font: 'inherit', fontSize: '16px', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Adresse</span>
              <input
                value={adresse} onChange={e => setAdresse(e.target.value)}
                style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 9, font: 'inherit', fontSize: '16px', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </label>
          </section>

          {/* Statut */}
          <section>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500, marginBottom: 10 }}>Statut</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STATUTS.map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setStatut(s)}
                  style={{
                    padding: '5px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                    border: statut === s ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: statut === s ? 'var(--accent-bg)' : 'var(--surface)',
                    color: statut === s ? 'var(--accent)' : 'var(--ink-2)',
                    cursor: 'pointer', font: 'inherit',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Articles */}
          <section>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500, marginBottom: 10 }}>
              Articles ({items.length})
            </div>
            {items.length === 0 ? (
              <div style={{ padding: '18px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Aucun article</div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '9px 14px', fontWeight: 500 }}>Article</th>
                      <th style={{ textAlign: 'center', fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '9px 14px', fontWeight: 500 }}>Qté</th>
                      <th style={{ textAlign: 'right', fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '9px 14px', fontWeight: 500 }}>P.U.</th>
                      <th style={{ textAlign: 'right', fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '9px 14px', fontWeight: 500 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink)' }}>{item.nom}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: '"Geist Mono", monospace', fontSize: 13, color: 'var(--ink-2)' }}>{item.qty}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: '"Geist Mono", monospace', fontSize: 13, color: 'var(--muted)' }}>{item.prix.toLocaleString('fr-FR')} F</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: '"Geist Mono", monospace', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{(item.qty * item.prix).toLocaleString('fr-FR')} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Code promo */}
          <section>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500, marginBottom: 10 }}>Code promo</div>
            {couponApplied ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 9, background: 'var(--ok-bg)', border: '1px solid var(--ok)', flex: 1 }}>
                  <span style={{ fontSize: 13, fontFamily: '"Geist Mono", monospace', fontWeight: 600, color: 'var(--ok)' }}>{couponApplied}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--ok)', marginLeft: 'auto' }}>−{couponRemise.toLocaleString('fr-FR')} F</span>
                </div>
                <button
                  type="button" onClick={removeCoupon}
                  style={{ height: 36, padding: '0 14px', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer', font: 'inherit', fontSize: 12.5, color: 'var(--muted)', background: 'transparent' }}
                >
                  Retirer
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                  placeholder="Ex : PROMO10"
                  style={{ flex: 1, height: 36, padding: '0 12px', border: `1px solid ${couponError ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 9, font: 'inherit', fontSize: '16px', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                />
                <button
                  type="button" onClick={applyCoupon}
                  style={{ height: 36, padding: '0 16px', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--ink)', background: 'var(--surface)' }}
                >
                  Appliquer
                </button>
              </div>
            )}
            {couponError && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 5 }}>{couponError}</div>}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Codes de démo : PROMO10 · REDUC5000 · SOLDES20</div>
          </section>

          {/* Récapitulatif total */}
          <section style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500, marginBottom: 2 }}>Récapitulatif</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-2)' }}>
              <span>Sous-total</span>
              <span style={{ fontFamily: '"Geist Mono", monospace' }}>{subtotal.toLocaleString('fr-FR')} F</span>
            </div>
            {frais > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-2)' }}>
                <span>Frais de livraison</span>
                <span style={{ fontFamily: '"Geist Mono", monospace' }}>+{frais.toLocaleString('fr-FR')} F</span>
              </div>
            )}
            {couponRemise > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ok)' }}>
                <span>Réduction ({couponApplied})</span>
                <span style={{ fontFamily: '"Geist Mono", monospace' }}>−{couponRemise.toLocaleString('fr-FR')} F</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              <span>Total</span>
              <span style={{ fontFamily: '"Geist Mono", monospace', color: 'var(--accent)' }}>{totalFinal.toLocaleString('fr-FR')} F</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button" onClick={onClose}
            style={{ height: 36, padding: '0 18px', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', background: 'transparent' }}
          >
            Annuler
          </button>
          <button
            type="button" onClick={handleSave}
            style={{ height: 36, padding: '0 20px', border: 0, borderRadius: 9, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 600, color: 'white', background: 'var(--accent)' }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export interface CommandesPageProps {
  orders?: Order[];
  onCreateOrder?: () => void;
}

export default function CommandesPage({ orders: initialOrders = SAMPLE_ORDERS, onCreateOrder }: CommandesPageProps) {
  const [orders, setOrders]         = useState(initialOrders);
  const [activeTab, setActiveTab]   = useState('all');
  const [editing, setEditing]       = useState<Order | null>(null);
  const totalCA = orders.reduce((s, o) => s + o.amount, 0);

  function handleSave(updated: Order) {
    setOrders(prev => prev.map(o => o.ref === updated.ref ? updated : o));
  }
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
      {editing && (
        <EditOrderModal
          order={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
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
                    <button type="button" className={styles.rowMenu} onClick={() => setEditing(o)}><MoreIcon size={16} /></button>
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
