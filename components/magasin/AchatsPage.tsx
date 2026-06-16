'use client';

/**
 * AchatsPage — purchase order management
 * Route: page id 'achats' in MagasinShell
 * Self-fetching; orders prop from MagasinShell is ignored.
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { PurchaseOrder, PurchaseOrderStatus } from './types';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';
import ReceptionDrawer from './ReceptionDrawer';
import NouvelAchatDrawer from './NouvelAchatDrawer';

function money(n: number) { return n.toLocaleString('fr-FR'); }

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

const TRANSPORT_ICONS: Record<string, string> = { Avion: '✈', Bateau: '🚢', Camion: '🚛' };
const CAN_RECEIVE: PurchaseOrderStatus[] = ['En transit', 'En attente', 'Retard'];

const STATUS_STYLE: Record<PurchaseOrderStatus, React.CSSProperties> = {
  'En attente': { background: 'var(--warn-bg)',        color: 'var(--warn)'   },
  'En transit': { background: '#E6E0F0',               color: '#5C4A88'       },
  'Livré':      { background: 'var(--ok-bg)',          color: 'var(--ok)'     },
  'Partiel':    { background: 'rgba(201,96,30,.12)',   color: '#C9601E'       },
  'Retard':     { background: 'rgba(156,58,20,.1)',    color: 'var(--danger)' },
  'Annulé':     { background: 'rgba(20,17,14,.06)',   color: 'var(--muted)'  },
};

function mapStatut(s: string): PurchaseOrderStatus {
  if (s === 'recu')       return 'Livré';
  if (s === 'partiel')    return 'Partiel';
  if (s === 'annule')     return 'Annulé';
  if (s === 'en_transit') return 'En transit';
  if (s === 'retard')     return 'Retard';
  return 'En attente';
}

function mapTransport(t: string | null | undefined): PurchaseOrder['transport'] {
  if (t === 'avion')  return 'Avion';
  if (t === 'bateau') return 'Bateau';
  if (t === 'camion') return 'Camion';
  return null;
}

function mapAchat(a: any): PurchaseOrder {
  return {
    id:          a.id,
    ref:         a.reference ?? `ACH-${a.id}`,
    supplier:    a.fournisseur_nom ?? '—',
    supplier_id: a.fournisseur_id ?? null,
    date:        fmtDate(a.date_achat),
    transport:   mapTransport(a.transport),
    arrival:     a.date_arrivee ? fmtDate(a.date_arrivee) : null,
    products:    Number(a.items_count ?? 0),
    amount:      Number(a.montant_total ?? 0),
    status:      mapStatut(a.statut ?? ''),
  };
}

// ── PODetail drawer (inline) ────────────────────────────────────────
function PODetail({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const totalMontant = (po.articles ?? []).reduce((s, a) => s + a.qty * a.prix, 0);
  return (
    <div className={styles.drawer}>
      <div className={styles.drawerHeader}>
        <div>
          <div className={styles.eyebrow}>Magasin · Achats · {po.ref}</div>
          <h2 className={styles.drawerTitle}>Fiche <span className={styles.serif}>bon d'achat</span></h2>
        </div>
        <button className={styles.iconBtnSm} onClick={onClose} aria-label="Fermer">✕</button>
      </div>
      <div className={styles.drawerBody}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            ['Produits', String(po.products)],
            ['Montant',  `${money(po.amount)} FCFA`],
            ['Statut',   po.status],
          ].map(([label, val]) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statCardValue}>{val}</div>
              <div className={styles.statCardLabel}>{label}</div>
            </div>
          ))}
        </div>
        {/* KV */}
        <div className={styles.kvBlock}>
          {[
            ['Fournisseur', po.supplier],
            ['Date', po.date],
            ['Transport', po.transport ? `${TRANSPORT_ICONS[po.transport] ?? ''} ${po.transport}` : '—'],
            ['Arrivée estimée', po.arrival ?? '—'],
          ].map(([k, v]) => (
            <div key={k} className={styles.kvRow}>
              <span className={styles.kvKey}>{k}</span>
              <span className={styles.kvVal}>{v}</span>
            </div>
          ))}
        </div>
        {/* Articles */}
        {(po.articles ?? []).length > 0 && (
          <div className={styles.articlesTableWrap}>
            <div className={styles.articlesTableHead}>Articles commandés</div>
            <table className={styles.articlesTable}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Produit</th>
                  <th style={{ textAlign: 'right' }}>Qté</th>
                  <th style={{ textAlign: 'right' }}>Prix unit.</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {(po.articles ?? []).map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'monospace', marginTop: 1 }}>{a.sku}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.qty}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--muted)' }}>{money(a.prix)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 500 }}>{money(a.qty * a.prix)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 600, color: 'var(--muted)', fontSize: 12 }}>Total</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>
                    {money(totalMontant)} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      <div className={styles.drawerFooter}>
        <button className={`${styles.btn} ${styles.primary}`} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

// ── Row action menu ─────────────────────────────────────────────────
function RowMenu({ po, onReceive, onDetail, onDelete }: {
  po: PurchaseOrder;
  onReceive: () => void;
  onDetail: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const canReceive = CAN_RECEIVE.includes(po.status);
  return (
    <div style={{ position: 'relative' }}>
      <button className={styles.rowMenu} onClick={() => setOpen(o => !o)} aria-label="Actions">
        <MoreIcon size={16} />
      </button>
      {open && (
        <div className={styles.dropdown} onMouseLeave={() => setOpen(false)}>
          {canReceive && (
            <button className={styles.dropdownItem} onClick={() => { setOpen(false); onReceive(); }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Réceptionner
            </button>
          )}
          <button className={styles.dropdownItem} onClick={() => { setOpen(false); onDetail(); }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            Voir les détails
          </button>
          <div className={styles.dropdownSep} />
          <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => { setOpen(false); onDelete(); }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────
export interface AchatsPageProps {
  orders?: PurchaseOrder[]; // kept for type compat with MagasinShell
}

export default function AchatsPage(_props: AchatsPageProps) {
  const ui = useUI();

  const [poList,     setPoList]     = useState<PurchaseOrder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState({ total: 0, en_attente: 0, recu: 0, montant_total: 0 });

  // Drawer state
  const [reception,  setReception]  = useState<PurchaseOrder | null>(null);
  const [detail,     setDetail]     = useState<PurchaseOrder | null>(null);
  const [showAchat,  setShowAchat]  = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/achats').then(r => r.json());
      if (r.achats) setPoList(r.achats.map(mapAchat));
      if (r.stats)  setStats(r.stats);
    } catch { /* keep current */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Fetch full achat (with articles) then open drawer
  const openFull = async (po: PurchaseOrder, target: 'reception' | 'detail') => {
    if (!po.id) return;
    setLoadingDetail(true);
    try {
      const r = await fetch(`/api/admin/achats/${po.id}`).then(r => r.json());
      if (r.achat && r.items) {
        const full: PurchaseOrder = {
          ...po,
          articles: (r.items as any[]).map(i => ({
            id: i.id, produit_id: i.produit_id ?? null,
            name: i.designation ?? i.produit_nom ?? '—',
            sku: i.produit_ref ?? '',
            qty: Number(i.quantite ?? 0),
            prix: Number(i.prix_unitaire ?? 0),
          })),
        };
        if (target === 'reception') setReception(full);
        else setDetail(full);
      }
    } catch { /* ignore */ } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (po: PurchaseOrder) => {
    ui.confirmDelete('l\'achat', po.ref, {
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/achats/${po.id}`, { method: 'DELETE' });
          setPoList(prev => prev.filter(p => p.id !== po.id));
          ui.toast('Achat supprimé.');
        } catch { ui.toast('Erreur lors de la suppression.'); }
      },
    });
  };

  // KPIs
  const enCours   = poList.filter(o => o.status !== 'Livré' && o.status !== 'Annulé').length;
  const enRetard  = poList.filter(o => o.status === 'Retard').length;
  const recu      = poList.filter(o => o.status === 'Livré' || o.status === 'Partiel').length;
  const totalVal  = poList.filter(o => o.status !== 'Annulé').reduce((s, o) => s + o.amount, 0);

  const subtitle = loading
    ? 'Chargement…'
    : poList.length === 0
    ? 'Aucun achat fournisseur'
    : [
        `${poList.length} achat${poList.length > 1 ? 's' : ''}`,
        enCours > 0 && `${enCours} en cours`,
        recu > 0    && `${recu} livré${recu > 1 ? 's' : ''}`,
        totalVal > 0 && `${money(totalVal)} FCFA engagés`,
      ].filter(Boolean).join(' · ');

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>achats</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Achats')}>
            <DownloadIcon size={14} /> Exporter
          </button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setShowAchat(true)}>
            <PlusIcon size={14} /> Nouvel achat
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {[
          {
            label: 'Achats en cours', value: String(enCours),
            delta: enRetard > 0 ? `${enRetard} en retard` : undefined,
            deltaColor: '#C9601E', sub: 'en transit ou en attente',
            spark: [2,2,3,3,3,4,3,4,3,3,enCours % 8 || 3], sparkColor: '#C9601E',
          },
          {
            label: 'Valeur totale engagée', value: totalVal > 0 ? money(totalVal) : '—',
            unit: totalVal > 0 ? 'FCFA' : undefined,
            sub: 'bons non annulés',
            spark: [520,580,610,640,700,720,760,800,850,920,totalVal > 0 ? Math.min(totalVal / 1000, 999) : 0], sparkColor: '#3B6A8F',
          },
          {
            label: 'Livrés ce mois', value: String(recu),
            sub: `sur ${poList.length} achats émis`,
            spark: [1,1,1,1,1,2,2,2,2,2,recu % 5], sparkColor: '#2D6A4F',
          },
        ].map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && (
                <div className={styles.kpiDelta} style={{ color: k.deltaColor }}>
                  {k.delta}
                </div>
              )}
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              <Sparkline data={k.spark} color={k.sparkColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Fournisseur</th>
                <th>Date achat</th>
                <th>Transport</th>
                <th>Arrivée estimée</th>
                <th style={{ textAlign: 'right' }}>Articles</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-2)', fontSize: 13 }}>
                    Chargement…
                  </td>
                </tr>
              ) : poList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--muted-2)', fontSize: 13 }}>
                    Aucun achat fournisseur · Créez votre premier bon d'achat
                  </td>
                </tr>
              ) : poList.map(p => (
                <tr key={p.id ?? p.ref}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 500 }}>{p.ref}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.supplier}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{p.date}</td>
                  <td style={{ fontSize: 13 }}>
                    {p.transport ? (
                      <>{TRANSPORT_ICONS[p.transport] ?? ''} <span style={{ color: 'var(--muted)' }}>{p.transport}</span></>
                    ) : <span style={{ color: 'var(--muted-2)' }}>—</span>}
                  </td>
                  <td style={{
                    fontFamily: 'monospace', fontSize: 12.5,
                    color: p.status === 'Retard' ? 'var(--danger)' : p.status === 'Livré' ? 'var(--ok)' : 'var(--ink)',
                  }}>
                    {p.arrival ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>{p.products}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>{money(p.amount)}</td>
                  <td>
                    <span className={styles.tag} style={STATUS_STYLE[p.status] ?? {}}>{p.status}</span>
                  </td>
                  <td className={styles.actionsCell} onClick={e => e.stopPropagation()}>
                    <RowMenu
                      po={p}
                      onReceive={() => openFull(p, 'reception')}
                      onDetail={() => openFull(p, 'detail')}
                      onDelete={() => handleDelete(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{poList.length} achat{poList.length !== 1 ? 's' : ''} fournisseur{poList.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Loading detail overlay */}
      {loadingDetail && (
        <div className={styles.backdrop} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 24px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={styles.spinner} />
            Chargement…
          </div>
        </div>
      )}

      {/* ReceptionDrawer */}
      {reception && (
        <>
          <div className={styles.backdrop} onMouseDown={() => setReception(null)} />
          <ReceptionDrawer
            order={reception}
            onClose={() => setReception(null)}
            onConfirm={(newStatus) => {
              setPoList(prev => prev.map(p =>
                p.id === reception.id ? { ...p, status: newStatus } : p
              ));
              ui.toast(`Stock mis à jour · ${reception.ref} → ${newStatus}`);
              setReception(null);
            }}
          />
        </>
      )}

      {/* PODetail */}
      {detail && (
        <>
          <div className={styles.backdrop} onMouseDown={() => setDetail(null)} />
          <PODetail po={detail} onClose={() => setDetail(null)} />
        </>
      )}

      {/* NouvelAchatDrawer */}
      {showAchat && (
        <>
          <div className={styles.backdrop} onMouseDown={() => setShowAchat(false)} />
          <NouvelAchatDrawer
            onClose={() => setShowAchat(false)}
            onSaved={() => { setShowAchat(false); fetchList(); }}
          />
        </>
      )}
    </>
  );
}
