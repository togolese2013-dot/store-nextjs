import React, { useState, useEffect } from 'react';
import type { Kpi } from './types';
import { I } from './icons';
import { PLAN_PRICE } from './data';

/** French thousands formatting ("1 421"). */
export function fmt(n: number): string { return n.toLocaleString('fr-FR'); }

/* ─── Sparkline ───────────────────────────────────────────────────── */
export function Spark({ data, color, w = 90, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1, step = w / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity=".12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Page header ─────────────────────────────────────────────────── */
export function PageHead({ eyb, title, serif, sub, children }: { eyb: string; title: string; serif?: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="head">
      <div className="head-l">
        <div className="eyb">{eyb}</div>
        <h1 className="t1">{title} {serif && <span className="serif">{serif}</span>}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}

/* ─── KPI row ─────────────────────────────────────────────────────── */
export function KpiRow({ kpis, cols = 4 }: { kpis: Kpi[]; cols?: 3 | 4 }) {
  return (
    <div className={cols === 3 ? 'kpis3' : 'kpis'}>
      {kpis.map((k) => (
        <div key={k.l} className="kpi">
          <div className="kpi-h"><div className="kpi-l">{k.l}</div>{k.d && <div className="kpi-d" style={{ color: k.dc, background: k.dc ? `${k.dc}1F` : undefined }}>{k.di || <I.trend size={10} />}{k.d}</div>}</div>
          <div className="kpi-v">{k.serif ? <div className="kpi-vs">{k.v}</div> : <div className="kpi-vn">{k.v}</div>}{k.u && <div className="kpi-u">{k.u}</div>}</div>
          <div className="kpi-f"><div className="kpi-s">{k.sub}</div>{k.spark && <Spark data={k.spark} color={k.c!} />}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Avatar ──────────────────────────────────────────────────────── */
export function Avatar({ init, color, size = 34, fs = 12 }: { init: string; color: string; size?: number; fs?: number }) {
  return <div style={{ width: size, height: size, borderRadius: 99, background: color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: fs, fontWeight: 700, flexShrink: 0 }}>{init}</div>;
}

/* ─── Checkbox ────────────────────────────────────────────────────── */
export function Cbx({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <button className={`cbx ${checked ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onChange(); }}>{checked && <I.check size={11} />}</button>;
}

/* ─── Multi-select hook ───────────────────────────────────────────── */
export function useSel() {
  const [sel, setSel] = useState<string[]>([]);
  return {
    sel,
    has: (id: string) => sel.includes(id),
    toggle: (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    set: (ids: string[]) => setSel(ids),
    clear: () => setSel([]),
  };
}

/* ─── Row action menu ─────────────────────────────────────────────── */
export interface MenuItem { sep?: boolean; ic?: React.ReactNode; label?: string; danger?: boolean; onClick?: () => void; }
export function RowMenu({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      <div className="menu-ov" onClick={onClose} />
      <div className="menu" onClick={(e) => e.stopPropagation()}>
        {items.map((it, i) => it.sep
          ? <div key={i} className="menu-sep" />
          : <button key={i} className={`menu-i ${it.danger ? 'danger' : ''}`} onClick={() => { onClose(); it.onClick && it.onClick(); }}>{it.ic && <span className="menu-ic">{it.ic}</span>}{it.label}</button>)}
      </div>
    </>
  );
}

/* ─── Form field ──────────────────────────────────────────────────── */
export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

/* ─── Modal shell ─────────────────────────────────────────────────── */
export function Modal({ title, sub, children, footer, onClose, wide }: {
  title: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" style={wide ? { width: 'min(620px,94vw)' } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h"><div><div className="modal-t">{title}</div>{sub && <div className="modal-sub">{sub}</div>}</div><button className="modal-x" onClick={onClose}><I.x size={18} /></button></div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
}

/* ─── Plan picker (radio cards) ───────────────────────────────────── */
export function PlanPick({ value, onChange }: { value: string; onChange: (p: string) => void }) {
  return (
    <div className="pick">
      {['Basic', 'Pro', 'Business'].map((p) => (
        <div key={p} className={`opt ${value === p ? 'on' : ''}`} onClick={() => onChange(p)}>
          <span className="radio" />
          <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{p === 'Basic' ? '1 espace · 2 équipiers' : p === 'Pro' ? 'Tous les espaces · 5 équipiers' : 'Illimité · support 24/7'}</div></div>
          <span className="po-price">{fmt(PLAN_PRICE[p])} F</span>
        </div>
      ))}
    </div>
  );
}

export const stClass = (s: string) =>
  s === 'Actif' ? 'actif' : s === 'Essai' ? 'essai' : s === 'Suspendu' ? 'suspendu' : s === 'Impayé' ? 'impaye' : 'inactif';
