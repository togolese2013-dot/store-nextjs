import type { CSSProperties } from 'react';

/* ─── Orders ────────────────────────────────────── */
export const ORDER_STATUS_STYLE: Record<string, CSSProperties> = {
  'En attente': { background: 'var(--warn-bg)',          color: 'var(--warn)' },
  'Confirmée':  { background: 'var(--accent-bg)',        color: 'var(--accent)' },
  'Expédiée':   { background: 'var(--purple-bg)',        color: 'var(--purple)' },
  'Livrée':     { background: 'var(--ok-bg)',            color: 'var(--ok)' },
  'Annulée':    { background: 'rgba(20,17,14,.06)',      color: 'var(--muted)' },
};

/* ─── Payments (méthode dérivée de orders.payment_mode) ── */
export const PAYMENT_METHOD_STYLE: Record<string, CSSProperties> = {
  'Moov Money':  { background: '#FFF1E6', color: '#E07A2C' },
  'Mixx by Yas': { background: 'var(--warn-bg)', color: '#C9601E' },
  'Échelonné':   { background: 'var(--purple-bg)', color: 'var(--purple)' },
  'Comptant':    { background: 'var(--bg-2)',  color: 'var(--muted)' },
};

export const PAYMENT_STATUS_STYLE: Record<string, CSSProperties> = {
  'Réussi':     { background: 'var(--ok-bg)',       color: 'var(--ok)' },
  'En attente': { background: 'var(--warn-bg)',     color: 'var(--warn)' },
};
