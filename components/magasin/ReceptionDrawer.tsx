'use client';

import React, { useState } from 'react';
import type { PurchaseOrder, ArticleLigne } from './types';
import styles from './Magasin.module.css';

function money(n: number) { return n.toLocaleString('fr-FR'); }

const TRANSPORT_EMOJI: Record<string, string> = { Avion: '✈', Bateau: '🚢', Camion: '🚛' };

const PO_STATUS_STYLE: Record<string, React.CSSProperties> = {
  'En attente': { background: 'var(--warn-bg)',        color: 'var(--warn)'   },
  'En transit': { background: '#E6E0F0',               color: '#5C4A88'       },
  'Livré':      { background: 'var(--ok-bg)',          color: 'var(--ok)'     },
  'Partiel':    { background: 'rgba(201,96,30,.12)',   color: '#C9601E'       },
  'Retard':     { background: 'rgba(156,58,20,.1)',    color: 'var(--danger)' },
  'Annulé':     { background: 'rgba(20,17,14,.06)',   color: 'var(--muted)'  },
};

interface ReceivedArticle extends ArticleLigne { recuQty: number; }

interface ReceptionDrawerProps {
  order: PurchaseOrder;
  onClose: () => void;
  onConfirm: (newStatus: 'Livré' | 'Partiel') => void;
}

export default function ReceptionDrawer({ order, onClose, onConfirm }: ReceptionDrawerProps) {
  const today = new Date().toISOString().split('T')[0];
  const [dateRecep, setDateRecep] = useState(today);
  const [note, setNote] = useState('');
  const [received, setReceived] = useState<ReceivedArticle[]>(
    () => (order.articles ?? []).map(a => ({ ...a, recuQty: a.qty }))
  );
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [error, setError] = useState('');

  const updateQty = (idx: number, val: string) =>
    setReceived(prev => prev.map((a, i) =>
      i === idx ? { ...a, recuQty: Math.max(0, Math.min(a.qty, Number(val) || 0)) } : a
    ));

  const totalRecu = received.reduce((s, a) => s + (Number(a.recuQty) || 0), 0);
  const totalCmd  = received.reduce((s, a) => s + a.qty, 0);
  const isPartial = received.some(a => Number(a.recuQty) < a.qty);
  const newStatus: 'Livré' | 'Partiel' = isPartial ? 'Partiel' : 'Livré';
  const isLoading = step === 'loading';

  const confirm = async () => {
    if (!order.id) return;
    setStep('loading');
    setError('');
    try {
      const res = await fetch(`/api/admin/achats/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recevoir',
          date_recue: dateRecep,
          note_recue: note || null,
          received_items: received.map(a => ({
            produit_id: a.produit_id ?? null,
            qty_recue: Number(a.recuQty) || 0,
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Erreur serveur.');
      }
      setStep('success');
      onConfirm(newStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur.');
      setStep('form');
    }
  };

  // ── Success ──────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.eyebrow}>Magasin · Achats</div>
            <h2 className={styles.drawerTitle}>
              Réception <span className={styles.serif}>confirmée</span>
            </h2>
          </div>
          <button className={styles.iconBtnSm} onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className={`${styles.drawerBody} ${styles.drawerBodyCentered}`}>
          <div className={styles.successCircle}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className={styles.successTitle}>
              {isPartial ? 'Réception partielle !' : 'Réception complète !'}
            </p>
            <p className={styles.successSub}>
              <strong>{order.ref}</strong> · {order.supplier}<br />
              <span style={{ color: 'var(--ok)', fontWeight: 500 }}>
                {totalRecu} article{totalRecu > 1 ? 's' : ''} ajouté{totalRecu > 1 ? 's' : ''} au stock magasin
              </span>
              {isPartial && (
                <>
                  <br />
                  <span style={{ color: '#C9601E', fontSize: 12.5 }}>
                    {totalCmd - totalRecu} article{totalCmd - totalRecu > 1 ? 's' : ''} en reliquat
                  </span>
                </>
              )}
            </p>
          </div>
          <div className={styles.successStamp}>
            Stock mis à jour · {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className={styles.drawerFooter}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={onClose}>Fermer</button>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────
  return (
    <div className={styles.drawer}>
      <div className={styles.drawerHeader}>
        <div>
          <div className={styles.eyebrow}>Magasin · Achats · {order.ref}</div>
          <h2 className={styles.drawerTitle}>
            Confirmer la <span className={styles.serif}>réception</span>
          </h2>
        </div>
        <button className={styles.iconBtnSm} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className={styles.drawerBody}>
        {/* Bandeau récapitulatif */}
        <div className={styles.receptionBanner}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{order.supplier}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {order.transport ? `${TRANSPORT_EMOJI[order.transport] ?? ''} ${order.transport} · ` : ''}
              {order.arrival ? `Arrivée prévue ${order.arrival}` : ''}
            </div>
          </div>
          <span className={styles.tag} style={PO_STATUS_STYLE[order.status] ?? {}}>
            {order.status}
          </span>
        </div>

        {/* Flux animé transit → stock */}
        <div className={styles.transitFlow}>
          <div className={styles.transitNode}>
            <div className={styles.transitNodeIcon}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                <path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
              </svg>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, textAlign: 'center' }}>En transit</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Source</div>
          </div>

          <div className={styles.transitRail}>
            <div className={styles.transitRailLine} />
            {[0, 0.15, 0.3].map((delay, i) => (
              <div
                key={i}
                className={`${styles.transitDot}${isLoading ? ` ${styles.transitDotFast}` : ''}`}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>

          <div className={`${styles.transitNode} ${styles.transitNodeDest}`}>
            <div className={styles.transitNodeIcon}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
              </svg>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, textAlign: 'center' }}>Stock Magasin</div>
            <div style={{ fontSize: 10.5, color: 'var(--accent)' }}>Destination</div>
          </div>
        </div>

        {/* Articles */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className={styles.fieldLabel} style={{ margin: 0 }}>Articles commandés</label>
            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace' }}>
              {totalRecu}/{totalCmd} reçus
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {received.map((a, idx) => {
              const pct = a.qty > 0 ? (Number(a.recuQty) || 0) / a.qty : 1;
              return (
                <div key={idx} className={styles.articleRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'monospace', marginTop: 1 }}>
                      {a.sku} · cmd : {a.qty}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <label style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Reçu</label>
                    <input
                      type="number" min={0} max={a.qty}
                      value={a.recuQty}
                      disabled={isLoading}
                      className={`${styles.input} ${styles.inputMono}`}
                      style={{ width: 62, textAlign: 'center', padding: '5px 6px', fontSize: 13 }}
                      onChange={e => updateQty(idx, e.target.value)}
                    />
                  </div>
                  {/* Barre de progression verticale */}
                  <div style={{ width: 6, height: 36, borderRadius: 99, background: 'var(--border)', position: 'relative', overflow: 'hidden', alignSelf: 'center' }}>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: `${pct * 100}%`,
                      background: pct >= 1 ? 'var(--ok)' : pct > 0 ? '#C9601E' : 'var(--border)',
                      borderRadius: 'inherit', transition: 'height .2s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date + Note */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Date de réception</label>
            <input type="date" value={dateRecep} disabled={isLoading}
              className={styles.input} onChange={e => setDateRecep(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Note</label>
            <textarea
              className={styles.input}
              style={{ resize: 'none', height: 72, lineHeight: 1.5 }}
              placeholder="Remarques…"
              value={note} disabled={isLoading}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Alerte partielle */}
        {isPartial && (
          <div className={styles.alertBannerWarn}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Livraison partielle — {totalCmd - totalRecu} article{totalCmd - totalRecu > 1 ? 's' : ''} en reliquat.
              Statut → <strong>Partiel</strong>.
            </span>
          </div>
        )}

        {error && (
          <div className={styles.formError}>{error}</div>
        )}
      </div>

      <div className={styles.drawerFooter}>
        <button className={styles.btn} onClick={onClose} disabled={isLoading}>Annuler</button>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={confirm}
          disabled={isLoading || totalRecu === 0}
          style={{ minWidth: 220, justifyContent: 'center', opacity: totalRecu === 0 ? 0.55 : 1 }}
        >
          {isLoading ? (
            <>
              <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: 99, display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              Mise à jour stock…
            </>
          ) : (
            <>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Confirmer la réception ({totalRecu} art.)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
