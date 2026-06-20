import React, { useEffect, useRef } from 'react';
import './SaleConfirmation.css';

export interface SalePayload {
  client:   string;
  payment:  string;
  discount: number;
  note:     string;
  lines:    { product: string; qty: number | string }[];
  total:    number;
  net:      number;
}

export interface SaleConfirmationProps {
  sale:      SalePayload | null;
  onDismiss: () => void;
  duration?: number;
}

const sk = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const CheckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...sk}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CloseIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...sk}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TagIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" {...sk}>
    <path d="M12 2H7a2 2 0 0 0-2 2v5l9 9 7-7-9-9Z" />
    <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const fmt = (n: number) => n.toLocaleString('fr-FR');

export function SaleConfirmation({ sale, onDismiss, duration = 5000 }: SaleConfirmationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sale || duration === 0) return;
    timerRef.current = setTimeout(onDismiss, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [sale, duration, onDismiss]);

  if (!sale) return null;

  const itemCount    = sale.lines.filter(l => l.product).length;
  const hasDiscount  = sale.discount > 0;
  const displayAmt   = hasDiscount ? sale.net : sale.total;

  return (
    <div className="sc-root" role="status" aria-live="polite">
      <div className="sc-icon"><CheckIcon /></div>

      <div className="sc-body">
        <div className="sc-title">Vente enregistrée</div>
        <div className="sc-detail">
          <span className="sc-amount">{fmt(displayAmt)} FCFA</span>
          {hasDiscount && <span className="sc-discount">−{fmt(sale.discount)}</span>}
          <span className="sc-sep">·</span>
          <span className="sc-items">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
        </div>
        <div className="sc-meta">
          <TagIcon />
          <span>{sale.payment}</span>
          {sale.client !== 'Client anonyme' && (
            <><span className="sc-sep">·</span><span>{sale.client}</span></>
          )}
        </div>
      </div>

      {duration > 0 && (
        <div className="sc-progress" style={{ animationDuration: `${duration}ms` }} />
      )}

      <button className="sc-close" onClick={onDismiss} aria-label="Fermer">
        <CloseIcon />
      </button>
    </div>
  );
}
