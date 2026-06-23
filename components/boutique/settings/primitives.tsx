// Reusable UI primitives: Toggle, Seg, TRow, Fld, Input, Select, Card…

import React, { useState } from 'react';
import type { ConfirmOptions } from './types';
import { ChevDownIcon, DownloadIcon } from './icons';

// ── Toggle ────────────────────────────────────────────────────────────────────

export function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      aria-pressed={on}
      style={{
        cursor: 'pointer', width: 38, height: 22, borderRadius: 99,
        background: on ? 'var(--accent)' : 'var(--border-strong)',
        position: 'relative', transition: 'background .2s',
        border: 'none', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 18 : 3,
        width: 16, height: 16, borderRadius: 99, background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      }} />
    </button>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────

export function Seg({ val, set, opts }: {
  val: string; set: (v: string) => void; opts: string[];
}) {
  return (
    <div className="bs-seg">
      {opts.map(o => (
        <button key={o} type="button"
          className={val === o ? 'on' : ''}
          onClick={() => set(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

export function TRow({ label, desc, on, set, children }: {
  label: string; desc?: string;
  on?: boolean; set?: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="bs-trow">
      <div className="bs-trow-body">
        <div className="bs-trow-label">{label}</div>
        {desc && <div className="bs-trow-desc">{desc}</div>}
        {children && <div className="bs-trow-child">{children}</div>}
      </div>
      {on !== undefined && set && <Toggle on={on} set={set} />}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

export function Fld({ label, hint, children }: {
  label?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="bs-fld">
      {label && <label className="bs-fld-l">{label}</label>}
      {children}
      {hint && <span className="bs-fld-h">{hint}</span>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

export function In({ val, set, ph, mono, type = 'text', style }: {
  val: string; set: (v: string) => void;
  ph?: string; mono?: boolean;
  type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      className={`bs-in${mono ? ' mono' : ''}`}
      type={type} value={val}
      onChange={e => set(e.target.value)}
      placeholder={ph}
      style={style}
    />
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────

export function Ta({ val, set, ph, rows = 3 }: {
  val: string; set: (v: string) => void; ph?: string; rows?: number;
}) {
  return (
    <textarea
      className="bs-in"
      value={val}
      onChange={e => set(e.target.value)}
      placeholder={ph}
      rows={rows}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

export function Sel({ val, set, opts }: {
  val: string; set: (v: string) => void;
  opts: string[] | { value: string; label: string }[];
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        className="bs-in"
        value={val}
        onChange={e => set(e.target.value)}
        style={{ paddingRight: 30 }}>
        {opts.map(o => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <span style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--muted)', pointerEvents: 'none',
      }}>
        <ChevDownIcon size={13} />
      </span>
    </div>
  );
}

// ── Two-column row ────────────────────────────────────────────────────────────

export function Row2({ children }: { children: React.ReactNode }) {
  return <div className="bs-row2">{children}</div>;
}

// ── Section card ──────────────────────────────────────────────────────────────

export function Card({ id, Icon, title, sub, children, onSave, dangerZone }: {
  id: string;
  Icon: (p?: { size?: number }) => React.JSX.Element;
  title: string; sub?: string;
  children: React.ReactNode;
  onSave?: () => void;
  dangerZone?: boolean;
}) {
  return (
    <div id={`s-${id}`} className="bs-sc">
      <div className="bs-sc-head">
        <div className={`bs-sc-icon${dangerZone ? ' danger' : ''}`}>
          <Icon size={18} />
        </div>
        <div>
          <div className="bs-sc-title">{title}</div>
          {sub && <div className="bs-sc-sub">{sub}</div>}
        </div>
      </div>
      <div className="bs-sc-body">{children}</div>
      {onSave && (
        <div className="bs-sc-footer">
          <button type="button" className="bs-btn pri" onClick={onSave}>
            Enregistrer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Logo drop zone ────────────────────────────────────────────────────────────

export function LogoDrop() {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="bs-logo-drop"
      data-hover={hover ? '' : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <DownloadIcon size={20} />
      <div style={{ fontSize: 12.5, fontWeight: 500 }}>
        Glissez une image ou cliquez pour importer
      </div>
    </div>
  );
}

// ── Toast stack ───────────────────────────────────────────────────────────────

export function ToastStack({ toasts }: { toasts: { id: number; msg: string }[] }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--ink)', color: '#fff', borderRadius: 10,
          padding: '10px 16px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,.18)',
          animation: 'bsToastIn .2s ease',
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

export function ConfirmDialog({
  opts, onClose,
}: { opts: ConfirmOptions; onClose: () => void }) {
  const isDanger = opts.tone === 'danger';
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
        zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 16, padding: '28px 32px',
          maxWidth: 420, width: '90%', boxShadow: '0 16px 48px rgba(0,0,0,.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{opts.title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 24 }}>{opts.sub}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="bs-btn" onClick={onClose}>Annuler</button>
          <button
            type="button"
            className={isDanger ? 'bs-btn ghost-danger' : 'bs-btn pri'}
            onClick={() => { opts.onConfirm(); onClose(); }}
          >
            {opts.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toast = (msg: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return { toasts, toast };
}

export function useConfirm() {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const confirm = (opts: ConfirmOptions) => setDialog(opts);
  const close = () => setDialog(null);
  return { dialog, confirm, close };
}
