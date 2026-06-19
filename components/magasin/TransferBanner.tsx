'use client';

import { useEffect, useState } from 'react';
import { TransferStore } from '@/lib/transferStore';
import type { TransferRequest } from '@/lib/transferStore';
import styles from './TransferBanner.module.css';

// ── Icons ─────────────────────────────────────────────────────────────────────

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function SwapIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" {...S}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 6h18" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 18H3" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" {...S}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function usePendingTransfers(): TransferRequest[] {
  const [list, setList] = useState<TransferRequest[]>([]);
  useEffect(() => {
    const update = () => setList(TransferStore.pending());
    update();
    return TransferStore.subscribe(update);
  }, []);
  return list;
}

export function useStoreMovements() {
  const [list, setList] = useState(() => TransferStore.movements());
  useEffect(() => {
    const update = () => setList(TransferStore.movements());
    update();
    return TransferStore.subscribe(update);
  }, []);
  return list;
}

// ── PendingBadge ──────────────────────────────────────────────────────────────

export function PendingBadge({ pipClass }: { pipClass: string }) {
  const pending = usePendingTransfers();
  if (pending.length === 0) return <span className={pipClass} />;
  return <span className={styles.pendingBadge}>{pending.length}</span>;
}

// ── TransferBanner ────────────────────────────────────────────────────────────

interface TransferBannerProps {
  onApproved?: (req: TransferRequest) => void;
  onRejected?: (req: TransferRequest) => void;
  confirmReject?: (req: TransferRequest) => boolean | Promise<boolean>;
}

export function TransferBanner({ onApproved, onRejected, confirmReject }: TransferBannerProps) {
  const pending = usePendingTransfers();
  if (pending.length === 0) return null;

  function handleApprove(r: TransferRequest) {
    const approved = TransferStore.approve(r.id);
    if (approved) onApproved?.(approved);
  }

  async function handleReject(r: TransferRequest) {
    const ok = confirmReject ? await confirmReject(r) : true;
    if (!ok) return;
    const rejected = TransferStore.reject(r.id);
    if (rejected) onRejected?.(rejected);
  }

  return (
    <div className={styles.banner}>
      <div className={styles.head}>
        <span className={styles.dot} />
        <span className={styles.title}>
          Demande{pending.length > 1 ? 's' : ''} de transfert · Boutique
        </span>
        <span className={styles.count}>{pending.length} en attente</span>
      </div>

      {pending.map(r => (
        <div key={r.id} className={styles.row}>
          <div className={styles.icon}><SwapIcon /></div>
          <div className={styles.body}>
            <div className={styles.prod}>{r.product}</div>
            <div className={styles.meta}>
              {r.id} · {r.sku} · {r.timeLabel}
              {r.note ? ` · ${r.note}` : ''}
            </div>
          </div>
          <div className={styles.qty}>{r.qty} u.</div>
          <div className={styles.flow}>
            <b>{r.from}</b>
            <ArrowRight />
            <b>Boutique</b>
          </div>
          <div className={styles.acts}>
            <button
              className="btn sm"
              onClick={() => handleReject(r)}
            >
              Refuser
            </button>
            <button
              className="btn sm pri"
              onClick={() => handleApprove(r)}
            >
              Approuver
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
