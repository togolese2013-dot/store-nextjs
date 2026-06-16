'use client';

/**
 * EntrepotsPage — warehouse management
 * Route: page id 'entrepots' in MagasinShell
 * Self-fetching; warehouses prop from MagasinShell ignored.
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { Warehouse } from './types';
import Sparkline from './Sparkline';
import { DownloadIcon, PlusIcon, MoreIcon, MapPinIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';
import EntrepotProduitsDrawer from './EntrepotProduitsDrawer';
import MouvementDrawer from './MouvementDrawer';

const WH_COLORS = ['#3B6A8F','#2D6A4F','#5C4A88','#C9601E','#7A2C3A','#D4A437'];

const LockIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const fmt = (n: number) => n.toLocaleString('fr-FR');

function occColor(pct: number): string {
  if (pct > 0.9)  return '#9C3A14';
  if (pct > 0.75) return '#C9601E';
  return '#2D6A4F';
}

function mapWarehouse(e: any, i: number): Warehouse & { id: string } {
  return {
    id:        String(e.id),
    name:      e.nom ?? '—',
    location:  e.adresse ?? '',
    color:     WH_COLORS[i % WH_COLORS.length],
    capacity:  Number(e.capacite ?? 0),
    occupied:  Number(e.stock_total ?? 0),
    products:  Number(e.products_count ?? 0),
    principal: Boolean(e.principal),
  };
}

export interface EntrepotsPageProps {
  warehouses?: Warehouse[]; // kept for type compat, ignored — page self-fetches
}

// ── Plan limits (Basic = 1 entrepôt) ─────────────────────────────
const MAX_ENTREPOTS: Record<string, number> = { basic: 1, free: 1 };

export default function EntrepotsPage(_props: EntrepotsPageProps) {
  const ui = useUI();

  const [list,           setList]           = useState<Warehouse[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [plan,           setPlan]           = useState<string | null>(null);
  const [showUpgrade,    setShowUpgrade]    = useState(false);

  // Drawer state
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);
  const [addToWh,    setAddToWh]    = useState<Warehouse | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/entrepots').then(r => r.json());
      if (r.entrepots) setList(r.entrepots.map(mapWarehouse));
    } catch { /* keep current */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    // Fetch plan for limit check
    fetch('/api/admin/billing').then(r => r.json()).then(d => {
      if (d.plan) setPlan(d.plan);
    }).catch(() => {});
    // Refresh list when a warehouse is created/edited via the global form
    const handler = () => fetchList();
    window.addEventListener('warehouse-saved', handler);
    return () => window.removeEventListener('warehouse-saved', handler);
  }, [fetchList]);

  // Plan lock logic
  const maxWh   = plan ? (MAX_ENTREPOTS[plan] ?? 0) : 0; // 0 = illimité
  const isLocked = maxWh > 0 && list.length >= maxWh;

  const handleNewWarehouse = () => {
    if (isLocked) { setShowUpgrade(true); return; }
    ui.openForm('warehouse');
  };

  // KPIs
  const totalCap      = list.reduce((s, w) => s + w.capacity, 0);
  const totalOccupied = list.reduce((s, w) => s + w.occupied, 0);
  const totalProducts = list.reduce((s, w) => s + w.products, 0);
  const avgPct        = totalCap > 0 ? Math.round((totalOccupied / totalCap) * 100) : 0;

  const subtitle = loading
    ? 'Chargement…'
    : list.length === 0
    ? 'Aucun entrepôt configuré'
    : `${list.length} entrepôt${list.length > 1 ? 's' : ''} · capacité totale ${fmt(totalCap)} unités · ${fmt(totalOccupied)} occupées (${avgPct}%)`;

  const KPIS = [
    { label: 'Entrepôts actifs',   value: String(list.length), sub: list.slice(0,3).map(w => w.name).join(' · ') || 'Aucun' },
    { label: 'Occupation moyenne', value: String(avgPct), unit: '%', sub: `${fmt(totalOccupied)} / ${fmt(totalCap)} unités`, color: '#C9601E',
      spark: [62,64,66,68,68,70,71,72,72,avgPct%90||73,avgPct] },
    { label: 'Produits stockés',   value: String(totalProducts), sub: `répartis sur ${list.length} site${list.length > 1 ? 's' : ''}`, color: '#2D6A4F',
      spark: [220,224,228,230,232,236,238,240,242,245,totalProducts] },
  ];

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Approvisionnement</div>
          <h1 className={styles.title}>
            Gestion des <span className={styles.serif}>entrepôts</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn} onClick={() => ui.openExport('Capacité entrepôts')}>
            <DownloadIcon size={14} /> Rapport capacité
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={handleNewWarehouse}
            title={isLocked ? 'Disponible sur le plan Pro' : undefined}
            style={isLocked ? { opacity: 0.65 } : undefined}
          >
            {isLocked
              ? <><LockIcon /> Nouvel entrepôt · Pro</>
              : <><PlusIcon size={14} /> Nouvel entrepôt</>
            }
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis3}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
            </div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiValue}>{k.value}</div>
              {k.unit && <div className={styles.kpiUnit}>{k.unit}</div>}
            </div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.color && <Sparkline data={k.spark} color={k.color} />}
            </div>
          </div>
        ))}
      </div>

      {/* Plan lock banner */}
      {isLocked && (
        <div className={styles.lockBanner}>
          <div className={styles.lockBannerIcon}>
            <LockIcon size={18} />
          </div>
          <div className={styles.lockBannerText}>
            <div className={styles.lockBannerTitle}>Limite du plan Basic atteinte</div>
            <div className={styles.lockBannerSub}>
              Votre plan Basic inclut 1 entrepôt. Passez en Pro pour créer des entrepôts illimités.
            </div>
          </div>
          <a href="/admin/billing" className={styles.lockBannerCta}>
            Passer en Pro →
          </a>
        </div>
      )}

      {/* Principal banner */}
      {list.filter(w => w.principal).map(w => (
        <div key={w.id} className={styles.whBanner}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
            <path d="M6 18h12M6 14h12"/>
          </svg>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{w.name}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 8 }}>
              Entrepôt principal · tous les nouveaux produits y sont ajoutés par défaut
            </span>
          </div>
          <span className={styles.whPrincipalBadge}>Principal</span>
        </div>
      ))}

      {/* Warehouse grid */}
      <div className={styles.whGrid}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--muted-2)', fontSize: 13 }}>
            Chargement…
          </div>
        ) : list.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--muted-2)', fontSize: 13 }}>
            Aucun entrepôt · créez votre premier entrepôt
          </div>
        ) : list.map(w => {
          const pct      = w.capacity > 0 ? Math.min(1, w.occupied / w.capacity) : 0;
          const barColor = occColor(pct);
          return (
            <div key={w.id} className={styles.whCard}>
              <div className={styles.whCardAccent} style={{ background: w.color }} />
              <div className={styles.whCardBody}>
                {/* Header */}
                <div className={styles.whCardHead}>
                  <div className={styles.whCardNameWrap}>
                    <div className={styles.whCardName}>{w.name}</div>
                    {w.principal && <span className={styles.whPrincipalBadge}>Principal</span>}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <button
                      type="button" className={styles.rowMenu}
                      onClick={e => ui.menu(e, [
                        { label: 'Voir les produits', onClick: () => setSelectedWh(w) },
                        { label: 'Modifier',          onClick: () => ui.openForm('warehouse', 'edit', w) },
                        { sep: true },
                        { label: 'Supprimer', danger: true, onClick: () => ui.confirmDelete("l'entrepôt", w.name, {
                          onConfirm: () => ui.config.onDeleteRow?.('warehouse', w),
                        }) },
                      ], 'right')}
                    >
                      <MoreIcon size={16} />
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div className={styles.whLocation}>
                  <MapPinIcon size={12} />{w.location || '—'}
                </div>

                {/* Occupation bar */}
                <div>
                  <div className={styles.whOccLabel}>
                    <span style={{ color: 'var(--muted)' }}>Occupation</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: barColor, fontWeight: 500 }}>
                      {w.capacity > 0 ? `${Math.round(pct * 100)}%` : '—'}
                    </span>
                  </div>
                  <div className={styles.whOccTrack}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor, borderRadius: 'inherit' }} />
                  </div>
                  <div className={styles.whOccFooter}>
                    <span>{fmt(w.occupied)} occupés</span>
                    <span>{w.capacity > 0 ? `${fmt(w.capacity)} total` : 'capacité non définie'}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className={styles.whStats}>
                  <div>
                    <div className={styles.whStatVal}>{w.products}</div>
                    <div className={styles.whStatLabel}>Références</div>
                  </div>
                  <div>
                    <div className={styles.whStatVal}>
                      {w.capacity > 0 ? fmt(w.capacity - w.occupied) : '—'}
                    </div>
                    <div className={styles.whStatLabel}>Disponible</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className={styles.whBtns} onClick={e => e.stopPropagation()}>
                  <button type="button" className={styles.whBtnSec} onClick={() => setSelectedWh(w)}>
                    Voir les produits
                  </button>
                  <button type="button" className={styles.whBtnPri} onClick={() => setAddToWh(w)}>
                    <PlusIcon size={12} /> Ajouter
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EntrepotProduitsDrawer */}
      {selectedWh && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,14,.34)', zIndex: 50 }}
            onMouseDown={() => setSelectedWh(null)} />
          <EntrepotProduitsDrawer
            warehouse={selectedWh}
            onClose={() => setSelectedWh(null)}
            onAddProduit={() => { setAddToWh(selectedWh); setSelectedWh(null); }}
          />
        </>
      )}

      {/* MouvementDrawer — entrée stock */}
      {addToWh && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,14,.34)', zIndex: 50 }}
            onMouseDown={() => setAddToWh(null)} />
          <MouvementDrawer
            defaultType="entree"
            defaultDstWh={addToWh.name}
            onClose={() => setAddToWh(null)}
            onSuccess={() => { setAddToWh(null); fetchList(); }}
          />
        </>
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className={styles.upgradeOverlay} onMouseDown={() => setShowUpgrade(false)}>
          <div className={styles.upgradeCard} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.upgradeCardHead}>
              <div className={styles.upgradeCardIcon}>
                <LockIcon size={22} />
              </div>
              <div>
                <p className={styles.upgradeCardTitle}>Limite atteinte</p>
                <p className={styles.upgradeCardSub}>
                  Votre plan <strong>Basic</strong> inclut 1 entrepôt.
                  Passez en Pro pour créer des entrepôts illimités et gérer plusieurs sites de stockage.
                </p>
              </div>
            </div>

            <div className={styles.upgradePlans}>
              <div className={styles.upgradePlan}>
                <div className={styles.upgradePlanName}>Basic · Actuel</div>
                <div className={styles.upgradePlanFeature}>🏭 1 entrepôt</div>
                <div className={styles.upgradePlanFeature}>📦 20 produits</div>
                <div className={styles.upgradePlanPrice}>Gratuit</div>
              </div>
              <div className={`${styles.upgradePlan} ${styles.upgradePlanPro}`}>
                <div className={styles.upgradePlanName}>Pro · Recommandé</div>
                <div className={styles.upgradePlanFeature}>🏭 Entrepôts illimités</div>
                <div className={styles.upgradePlanFeature}>📦 Produits illimités</div>
                <div className={styles.upgradePlanPrice}>9 900 F / mois</div>
              </div>
            </div>

            <div className={styles.upgradeActions}>
              <button className={styles.upgradeActionsBtn} onClick={() => setShowUpgrade(false)}>
                Annuler
              </button>
              <a href="/admin/billing" className={`${styles.upgradeActionsBtn} ${styles.upgradeActionsPrimary}`}>
                Voir les plans →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
