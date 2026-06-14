/**
 * AlertesPage — stock alert rules + AI stock forecast
 */
'use client';
import React, { useState, useCallback } from 'react';
import type { StockAlert, AlertChannel } from './types';
import { SAMPLE_ALERTS } from './sample-data';
import Sparkline from './Sparkline';
import { PlusIcon, CogIcon, MoreIcon, TrendIcon } from './icons';
import styles from './Magasin.module.css';
import { useUI } from '@/components/interaction-layer';

function SparklesIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.7L19 10l-5.1 1.3L12 17l-1.9-5.7L5 10l5.1-1.3z"/>
      <path d="M5 3l.9 2.6L8 7l-2.1.4L5 10l-.9-2.6L2 7l2.1-.4z" strokeWidth="1.5"/>
      <path d="M19 17l.9 2.6L22 21l-2.1.4L19 24l-.9-2.6L16 21l2.1-.4z" strokeWidth="1.5"/>
    </svg>
  );
}

interface Forecast {
  produit_id:     number;
  nom:            string;
  stock:          number;
  ventes_30j:     number;
  jours_restants: number | null;
  urgence:        'critique' | 'attention' | 'ok';
  recommandation: string;
  qte_a_commander: number;
}

type LocalKpi = { label: string; value: string; unit?: string; delta?: string; deltaColor?: string; sub: string; spark?: number[]; color?: string; serif?: boolean };

const CHANNEL_STYLE: Record<AlertChannel, React.CSSProperties> = {
  Email:    { background: 'var(--accent-bg)', color: 'var(--accent)' },
  SMS:      { background: 'var(--warn-bg)',   color: 'var(--warn)' },
  WhatsApp: { background: 'var(--ok-bg)',     color: 'var(--ok)' },
};

const URGENCE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critique: { bg: 'var(--danger-bg)', color: 'var(--danger)',  label: 'Critique' },
  attention:{ bg: 'var(--warn-bg)',   color: 'var(--warn)',    label: 'Attention' },
  ok:       { bg: 'var(--ok-bg)',     color: 'var(--ok)',      label: 'OK' },
};

export interface AlertesPageProps {
  alerts?: StockAlert[];
  onToggle?: (index: number, active: boolean) => void;
}

export default function AlertesPage({ alerts: initialAlerts = SAMPLE_ALERTS, onToggle }: AlertesPageProps) {
  const ui = useUI();
  const [alerts, setAlerts]         = useState<StockAlert[]>(initialAlerts);
  const [forecasts, setForecasts]   = useState<Forecast[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError]     = useState('');
  const [forecastMsg, setForecastMsg]         = useState('');
  const [showForecast, setShowForecast]       = useState(false);

  const activeCount    = alerts.filter(a => a.active).length;
  const triggeredCount = alerts.filter(a => a.triggered).length;
  const channels       = [...new Set(alerts.flatMap(a => a.channels))];

  const KPIS: LocalKpi[] = [
    { label: 'Alertes actives',     value: String(activeCount),    sub: `sur ${alerts.length} règles configurées`, color: '#3B6A8F' },
    { label: 'Déclenchées ce mois', value: String(triggeredCount), sub: 'requièrent une action', color: '#C9601E' },
    { label: 'Canaux configurés',   value: String(channels.length || '—'), sub: channels.length ? channels.join(' · ') : 'Aucun canal' },
  ];

  const subtitle = alerts.length === 0
    ? "Aucune règle d'alerte configurée"
    : `${activeCount} règle${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''} · ${triggeredCount} déclenchée${triggeredCount > 1 ? 's' : ''} ce mois${channels.length ? ` · ${channels.join(', ')}` : ''}`;

  const handleToggle = (i: number) => {
    const next = alerts.map((a, j) => j === i ? { ...a, active: !a.active } : a);
    setAlerts(next);
    onToggle?.(i, next[i].active);
  };

  const loadForecast = useCallback(async () => {
    setForecastLoading(true);
    setForecastError('');
    setForecastMsg('');
    setShowForecast(true);
    try {
      const res  = await fetch('/api/admin/ai/stock-forecast', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setForecastError(data.error ?? 'Erreur serveur'); return; }
      if (data.message) { setForecastMsg(data.message); setForecasts([]); return; }
      setForecasts(Array.isArray(data.forecasts) ? data.forecasts : []);
    } catch { setForecastError('Erreur réseau'); }
    finally { setForecastLoading(false); }
  }, []);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Magasin · Stock</div>
          <h1 className={styles.title}>Alertes <span className={styles.serif}>stock</span></h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btn}
            onClick={loadForecast} disabled={forecastLoading}
            title="Analyse IA des prévisions de rupture de stock">
            <SparklesIcon size={14} />
            {forecastLoading ? 'Analyse…' : 'Prévisions IA'}
          </button>
          <button type="button" className={styles.btn} onClick={() => ui.toast('Paramètres globaux des alertes')}><CogIcon size={14} /> Paramètres</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => ui.openForm('alert')}>
            <PlusIcon size={14} /> Nouvelle alerte
          </button>
        </div>
      </div>

      <div className={styles.kpis3}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <div className={styles.kpiLabel}>{k.label}</div>
              {k.delta && <div className={styles.kpiDelta} style={{ color: k.deltaColor }}><TrendIcon size={10} />{k.delta}</div>}
            </div>
            <div className={styles.kpiValueRow}><div className={styles.kpiValue}>{k.value}</div></div>
            <div className={styles.kpiFoot}>
              <div className={styles.kpiSub}>{k.sub}</div>
              {k.spark && k.color && <Sparkline data={k.spark} color={k.color} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Section Prévisions IA ── */}
      {showForecast && (
        <div style={{ margin: '16px 0 0', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 0 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SparklesIcon size={15} />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Prévisions IA — Risques de rupture</span>
            </div>
            <button className={styles.btn} style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setShowForecast(false)}>Fermer</button>
          </div>

          {forecastLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--bg-2)', opacity: 0.6 + i * 0.1,
                  backgroundImage: 'linear-gradient(90deg, var(--bg-2) 0%, var(--border) 50%, var(--bg-2) 100%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          )}

          {forecastError && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 9, fontSize: 13 }}>
              {forecastError}
            </div>
          )}

          {forecastMsg && (
            <div style={{ padding: '10px 14px', background: 'var(--ok-bg)', color: 'var(--ok)', borderRadius: 9, fontSize: 13, fontWeight: 500 }}>
              ✓ {forecastMsg}
            </div>
          )}

          {!forecastLoading && forecasts.length > 0 && (
            <div className={styles.tableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th style={{ textAlign: 'right' }}>Stock</th>
                      <th style={{ textAlign: 'right' }}>Ventes 30j</th>
                      <th style={{ textAlign: 'right' }}>Jours restants</th>
                      <th>Urgence</th>
                      <th>Recommandation</th>
                      <th style={{ textAlign: 'right' }}>Qté à commander</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((f, i) => {
                      const urg = URGENCE_STYLE[f.urgence] ?? URGENCE_STYLE.ok;
                      return (
                        <tr key={i}>
                          <td><div className={styles.productName}>{f.nom}</div></td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13, fontWeight: 600 }}>{f.stock}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13 }}>{f.ventes_30j}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13, fontWeight: 600, color: f.jours_restants !== null && f.jours_restants < 7 ? 'var(--danger)' : f.jours_restants !== null && f.jours_restants < 20 ? 'var(--warn)' : 'var(--ink)' }}>
                            {f.jours_restants !== null ? `${f.jours_restants}j` : '—'}
                          </td>
                          <td>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: urg.bg, color: urg.color }}>
                              {urg.label}
                            </span>
                          </td>
                          <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 200 }}>{f.recommandation}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                            {f.qte_a_commander > 0 ? `+${f.qte_a_commander}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Table alertes existantes ── */}
      <div className={styles.tableWrap} style={{ marginTop: 16 }}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Règle</th><th>Cible</th><th>Type</th>
                <th style={{ textAlign: 'right' }}>Seuil</th>
                <th>Canaux</th><th>Déclenchée</th><th>Actif</th><th />
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} style={{ opacity: a.active ? 1 : 0.55, transition: 'opacity .2s' }}>
                  <td><div className={styles.productName}>{a.name}</div></td>
                  <td style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 180 }}>{a.target}</td>
                  <td><span className={styles.tag} style={{ fontSize: 11 }}>{a.targetType}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13 }}>{a.threshold}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.channels.map(ch => (
                        <span key={ch} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, fontWeight: 500, ...CHANNEL_STYLE[ch] }}>{ch}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {a.triggered
                      ? <span className={`${styles.status} ${styles.rupture}`}><span className={styles.d} />Oui</span>
                      : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td>
                    <div role="switch" aria-checked={a.active} tabIndex={0}
                      onClick={() => handleToggle(i)}
                      onKeyDown={e => e.key === 'Enter' && handleToggle(i)}
                      style={{ cursor: 'pointer', width: 34, height: 20, borderRadius: 99, background: a.active ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}
                    >
                      <div style={{ position: 'absolute', top: 3, left: a.active ? 15 : 3, width: 14, height: 14, borderRadius: 99, background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.rowMenu} onClick={(e) => {
                      e.stopPropagation();
                      ui.menu(e, [
                        { label: 'Modifier', icon: 'edit', onClick: () => ui.openForm('alert', 'edit', a) },
                        { sep: true },
                        { label: 'Supprimer', icon: 'trash', danger: true, onClick: () => ui.confirmDelete("l'alerte", a.name) },
                      ], 'right');
                    }}><MoreIcon size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFoot}>
          <span>{alerts.length} alerte{alerts.length !== 1 ? 's' : ''} · {triggeredCount} déclenchée{triggeredCount !== 1 ? 's' : ''}</span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <button type="button" className={styles.on}>1</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
