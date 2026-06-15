/**
 * Shared utilities for Magasin drawer components.
 */
import type { CSSProperties } from 'react';
import React from 'react';

let injected = false;

export function injectKeyframes(): void {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.id = 'magasin-kf';
  el.textContent = `
    @keyframes mgSpin  { to { transform: rotate(360deg); } }
    @keyframes mgSlide { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes mgFade  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes mgPop   { from { transform: scale(.86); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes mgDot   { 0%{left:8px;opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{left:calc(100% - 8px);opacity:0} }
    @keyframes mgPulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,106,143,.38)} 55%{box-shadow:0 0 0 9px rgba(59,106,143,0)} }
  `;
  document.head.appendChild(el);
}

export const fmt = (n: number): string => n.toLocaleString('fr-FR');

export const inputCss: CSSProperties = {
  width: '100%', padding: '9px 11px',
  border: '1px solid var(--border)', borderRadius: 9,
  background: 'var(--surface)', fontSize: 13, color: 'var(--ink)',
  fontFamily: 'inherit', boxSizing: 'border-box',
};

export const fieldCss: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 7,
};

export const labelCss: CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--ink-2)',
};

export const eyebrowCss: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
  color: 'var(--accent)', fontWeight: 500, marginBottom: 6,
};

export const drawerCss: CSSProperties = {
  position: 'fixed', top: 0, right: 0, height: '100vh',
  width: 480, maxWidth: '94vw',
  background: 'var(--bg)', borderLeft: '1px solid var(--border)',
  boxShadow: '-24px 0 60px rgba(20,17,14,.14)', zIndex: 51,
  display: 'flex', flexDirection: 'column',
  animation: 'mgSlide .28s cubic-bezier(.32,.72,0,1)',
};

export const btnCss: CSSProperties = {
  padding: '9px 14px', borderRadius: 9,
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 8,
};

export const btnPrimaryCss: CSSProperties = {
  ...btnCss,
  border: '1px solid var(--ink)', background: 'var(--ink)', color: 'white',
};

export const XIcon = (): React.JSX.Element => (
  React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
    React.createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    React.createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
  )
);

export const TransferRail = ({ fast = false }: { fast?: boolean }): React.JSX.Element => {
  const dotStyle = (delay = 0): CSSProperties => ({
    position: 'absolute', top: '50%', marginTop: -3.5,
    width: 7, height: 7, borderRadius: 99,
    background: 'var(--accent)',
    animation: `mgDot ${fast ? '.44s' : '1.6s'} ease-in-out infinite`,
    animationDelay: `${delay}s`,
  });
  return React.createElement('div',
    { style: { position: 'relative', height: 28, flex: 1, minWidth: 48 } },
    React.createElement('div', { style: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,var(--border),var(--accent),var(--border))', transform: 'translateY(-50%)', borderRadius: 99 } }),
    React.createElement('div', { style: dotStyle(0) }),
    React.createElement('div', { style: dotStyle(0.53) }),
    React.createElement('div', { style: dotStyle(1.06) }),
  );
};
