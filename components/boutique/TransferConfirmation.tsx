import React, { useEffect, useRef } from 'react';
import type { TransferRequest as TransferRecord } from '@/lib/transferStore';
import './TransferConfirmation.css';

export interface TransferConfirmationProps {
  record: TransferRecord | null;
  onDismiss: () => void;
  duration?: number;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const CheckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...stroke}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CloseIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...stroke}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ArrowRight = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" {...stroke}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export function TransferConfirmation({
  record,
  onDismiss,
  duration = 5000,
}: TransferConfirmationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!record || duration === 0) return;
    timerRef.current = setTimeout(onDismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [record, duration, onDismiss]);

  if (!record) return null;

  return (
    <div className="tc-root" role="status" aria-live="polite">
      <div className="tc-icon">
        <CheckIcon />
      </div>

      <div className="tc-body">
        <div className="tc-title">Demande envoyée</div>
        <div className="tc-detail">
          <span className="tc-id">{record.id}</span>
          <span className="tc-sep">·</span>
          <span className="tc-prod">{record.product}</span>
          <span className="tc-sep">·</span>
          <span className="tc-qty">{record.qty} u.</span>
        </div>
        <div className="tc-flow">
          <span>{record.from}</span>
          <ArrowRight />
          <span>{record.destination}</span>
        </div>
      </div>

      {duration > 0 && (
        <div
          className="tc-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}

      <button className="tc-close" onClick={onDismiss} aria-label="Fermer">
        <CloseIcon />
      </button>
    </div>
  );
}
