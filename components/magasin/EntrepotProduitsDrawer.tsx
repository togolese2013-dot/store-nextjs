'use client';

import React, { useEffect, useState } from 'react';
import type { Warehouse } from './types';
import {
  injectKeyframes, drawerCss, eyebrowCss, fmt, XIcon,
} from './drawerUtils';

// ── Types ──────────────────────────────────────────────────────────
interface DrawerProduct {
  id: number;
  name: string;
  sku: string;
  cat: string;
  stock: number;
  price: number;
  swatch: string;
  initial: string;
}

const SWATCHES = ['#1F3D6E','#3A2F25','#C8962A','#7A2C3A','#D4A437','#2D6A4F','#5C4A88','#3B6A8F','#C9601E','#B8501A'];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function barColor(pct: number): string {
  if (pct > 0.7) return 'var(--ok)';
  if (pct > 0.3) return '#C9601E';
  return 'var(--danger)';
}

// ── Icons ───────────────────────────────────────────────────────────
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const IcPlus = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...S} strokeWidth={2}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Props ───────────────────────────────────────────────────────────
interface Props {
  warehouse: Warehouse;
  onClose: () => void;
  onAddProduit: () => void;
}

export default function EntrepotProduitsDrawer({ warehouse, onClose, onAddProduit }: Props) {
  injectKeyframes();

  const [products, setProducts] = useState<DrawerProduct[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/products?entrepot_id=${warehouse.id}&limit=100`)
      .then(r => r.json())
      .then(d => {
        if (d.products) {
          setProducts(d.products.map((p: any) => ({
            id:      p.id,
            name:    p.nom ?? '—',
            sku:     p.reference ?? '',
            cat:     p.categorie_nom ?? '—',
            stock:   Number(p.stock_magasin ?? 0),
            price:   Number(p.prix_unitaire ?? 0),
            swatch:  SWATCHES[hashStr(p.reference ?? p.nom ?? '') % SWATCHES.length],
            initial: (p.nom?.[0] ?? 'P').toUpperCase(),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [warehouse.id]);

  const TARGET = 50; // référence visuelle pour la barre de stock

  return (
    <div style={{ ...drawerCss, background: 'var(--bg)' }} onMouseDown={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 22px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...eyebrowCss }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)', display: 'inline-block' }} />
            Magasin · Entrepôts
            {warehouse.principal && (
              <span style={{ marginLeft: 8, background: 'var(--accent)', color: 'white', fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 99, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Principal
              </span>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1.05 }}>
            {warehouse.name} —{' '}
            <span style={{ fontFamily: '"Instrument Serif",Georgia,serif', fontStyle: 'italic' }}>produits</span>
          </div>
        </div>
        <button onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'transparent', border: 0, cursor: 'pointer', marginLeft: 'auto', flexShrink: 0 }}>
          <XIcon />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {([
            ['Références', warehouse.products],
            ['Stock occupé', fmt(warehouse.occupied)],
            ['Capacité', warehouse.capacity > 0 ? fmt(warehouse.capacity) : '—'],
          ] as [string, string | number][]).map(([l, v]) => (
            <div key={l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'Geist Mono,monospace', letterSpacing: '-.02em' }}>{v}</div>
              <div style={{ fontSize: 10.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted-2)', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <button onClick={onAddProduit}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, border: '1px solid var(--ink)', background: 'var(--ink)', color: 'white', cursor: 'pointer', width: '100%' }}>
          <IcPlus /> Ajouter un produit à cet entrepôt
        </button>

        {/* Product list */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 8 }}>
            {loading ? 'Chargement…' : `${products.length} produit${products.length !== 1 ? 's' : ''} stockés`}
          </div>

          {!loading && products.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>
              Aucun produit dans cet entrepôt.<br />
              <span style={{ fontSize: 12 }}>Utilisez "Ajouter un produit" pour commencer.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {products.map(p => {
                const pct = TARGET > 0 ? Math.min(1, p.stock / TARGET) : 0;
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '10px 13px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    {/* Thumb */}
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: p.swatch, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 600, fontSize: 11, flexShrink: 0 }}>
                      {p.initial}
                    </div>
                    {/* Name + bar */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor(pct), borderRadius: 'inherit' }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'Geist Mono,monospace', color: 'var(--muted-2)', flexShrink: 0 }}>
                          {p.stock} u.
                        </span>
                      </div>
                    </div>
                    {/* Price + cat */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 12.5, fontWeight: 500 }}>{fmt(p.price)} F</div>
                      <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 1 }}>{p.cat}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-2)' }}>
        <button onClick={onClose}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer' }}>
          Fermer
        </button>
      </div>
    </div>
  );
}
