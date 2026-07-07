'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './Magasin.module.css';
import { formatDate } from '@/lib/format-date';

function money(n: number) { return n.toLocaleString('fr-FR'); }

const TRANSPORT_OPTS = [
  { id: 'avion',  label: '✈ Avion',       delay: 3  },
  { id: 'bateau', label: '🚢 Bateau',       delay: 21 },
  { id: 'camion', label: '🚛 Camion',       delay: 5  },
  { id: 'autre',  label: '— Non spécifié', delay: 0  },
];

interface ArticleDraft {
  id: number;
  produit_id: number | null;
  designation: string;
  search: string;
  qty: number;
  prix: string;
  showSugg: boolean;
}

interface ApiProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  cost: number | null;  // prix_entrepot — prix d'achat fournisseur
  swatch: string;
  initial: string;
}

interface NouvelAchatDrawerProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function NouvelAchatDrawer({ onClose, onSaved }: NouvelAchatDrawerProps) {
  const today = new Date().toISOString().split('T')[0];
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [products,  setProducts]  = useState<ApiProduct[]>([]);

  const [supplier,  setSupplier]  = useState('');
  const [dateAchat, setDateAchat] = useState(today);
  const [transport, setTransport] = useState('avion');
  const [note,      setNote]      = useState('');
  const [articles,  setArticles]  = useState<ArticleDraft[]>([
    { id: 1, produit_id: null, designation: '', search: '', qty: 1, prix: '', showSugg: false },
  ]);
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [error, setError] = useState('');
  const nextId = useRef(2);

  // ── Fetch suppliers + products on mount ──
  useEffect(() => {
    fetch('/api/admin/fournisseurs').then(r => r.json()).then(d => {
      if (d.fournisseurs) setSuppliers(d.fournisseurs.map((f: any) => ({ id: f.id, name: f.nom })));
    }).catch(() => {});

    fetch('/api/admin/products?limit=200').then(r => r.json()).then(d => {
      if (d.products) setProducts(d.products.map((p: any) => ({
        id: p.id, name: p.nom, sku: p.reference ?? '',
        price: Number(p.prix_unitaire ?? 0),
        cost: p.prix_entrepot != null ? Number(p.prix_entrepot) : null,
        swatch: '#3B6A8F',
        initial: (p.nom?.[0] ?? 'P').toUpperCase(),
      })));
    }).catch(() => {});
  }, []);

  // ── Close suggestions on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-sugg]')) {
        setArticles(prev => prev.map(a => ({ ...a, showSugg: false })));
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Arrivée estimée ──
  const delay = TRANSPORT_OPTS.find(t => t.id === transport)?.delay ?? 0;
  const arrivalDate = useMemo(() => {
    if (!dateAchat || !delay) return null;
    const d = new Date(dateAchat);
    d.setDate(d.getDate() + delay);
    return formatDate(d);
  }, [dateAchat, transport, delay]);

  const total = articles.reduce((s, a) => s + (Number(a.qty) || 0) * (Number(a.prix) || 0), 0);
  const validArticles = articles.filter(a => a.designation && a.qty > 0 && Number(a.prix) > 0);
  const isValid = !!supplier && validArticles.length > 0;
  const isLoading = step === 'loading';

  const addLine = () => {
    setArticles(prev => [...prev, { id: nextId.current++, produit_id: null, designation: '', search: '', qty: 1, prix: '', showSugg: false }]);
  };
  const removeLine = (id: number) => setArticles(prev => prev.filter(a => a.id !== id));
  const updateLine = (id: number, patch: Partial<ArticleDraft>) =>
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

  const confirm = async () => {
    if (!isValid) return;
    setStep('loading');
    setError('');
    try {
      const suppObj = suppliers.find(s => String(s.id) === supplier);
      const res = await fetch('/api/admin/achats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fournisseur_id: suppObj ? suppObj.id : null,
          date_achat: dateAchat,
          transport: transport !== 'autre' ? transport : null,
          date_arrivee: arrivalDate ? new Date(new Date(dateAchat).getTime() + delay * 86400000).toISOString().split('T')[0] : null,
          note: note || null,
          statut: 'en_attente',
          items: validArticles.map(a => ({
            produit_id: a.produit_id ?? null,
            designation: a.designation,
            quantite: Number(a.qty),
            prix_unitaire: Number(a.prix),
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Erreur serveur.');
      }
      setStep('success');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur.');
      setStep('form');
    }
  };

  const reset = () => {
    setSupplier(''); setDateAchat(today); setTransport('avion'); setNote('');
    setArticles([{ id: 1, produit_id: null, designation: '', search: '', qty: 1, prix: '', showSugg: false }]);
    setStep('form'); setError('');
  };

  // ── Success ──────────────────────────────────────────────────────
  if (step === 'success') {
    const suppName = suppliers.find(s => String(s.id) === supplier)?.name ?? supplier;
    return (
      <div className={`${styles.drawer} ${styles.drawerWide}`}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.eyebrow}>Magasin · Achats</div>
            <h2 className={styles.drawerTitle}>Achat <span className={styles.serif}>enregistré</span></h2>
          </div>
          <button className={styles.iconBtnSm} onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className={`${styles.drawerBody} ${styles.drawerBodyCentered}`}>
          <div className={styles.successCircle}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className={styles.successTitle}>Achat enregistré !</p>
            <p className={styles.successSub}>
              <strong>{suppName}</strong> · {validArticles.length} article{validArticles.length > 1 ? 's' : ''}<br />
              {arrivalDate && <>Arrivée estimée : <strong>{arrivalDate}</strong></>}
            </p>
          </div>
          <div className={styles.successStamp}>
            {money(total)} FCFA · {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className={styles.drawerFooter}>
          <button className={styles.btn} onClick={onClose}>Fermer</button>
          <button className={`${styles.btn} ${styles.primary}`} onClick={reset}>Nouvel achat</button>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────
  return (
    <div className={`${styles.drawer} ${styles.drawerWide}`}>
      <div className={styles.drawerHeader}>
        <div>
          <div className={styles.eyebrow}>Magasin · Achats</div>
          <h2 className={styles.drawerTitle}>Nouvel achat <span className={styles.serif}>fournisseur</span></h2>
        </div>
        <button className={styles.iconBtnSm} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className={styles.drawerBody}>
        {/* Fournisseur + Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Fournisseur <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select
                className={styles.input}
                style={{ appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
                value={supplier} disabled={isLoading}
                onChange={e => setSupplier(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {suppliers.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Date d'achat <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input type="date" className={styles.input} value={dateAchat} disabled={isLoading}
              onChange={e => setDateAchat(e.target.value)} />
          </div>
        </div>

        {/* Transport + Note */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Mode de transport</label>
            <div className={styles.selectWrap}>
              <select
                className={styles.input}
                style={{ appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
                value={transport} disabled={isLoading}
                onChange={e => setTransport(e.target.value)}
              >
                {TRANSPORT_OPTS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
            {arrivalDate && (
              <div className={styles.fieldHintOk}>⏱ Arrivée estimée le {arrivalDate}</div>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Note</label>
            <textarea
              className={styles.input}
              style={{ resize: 'none', height: 72, lineHeight: 1.5 }}
              placeholder="Informations complémentaires…"
              value={note} disabled={isLoading}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Articles */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className={styles.fieldLabel} style={{ margin: 0 }}>
              Articles <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <button type="button" onClick={addLine} disabled={isLoading}
              style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ok)', background: 'none', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              + Ajouter une ligne
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {articles.map(art => {
              const suggs = products.filter(p => {
                const q = art.search.toLowerCase().trim();
                return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
              }).slice(0, 5);

              return (
                <div key={art.id} data-sugg="1"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 72px 80px 30px', gap: 6, alignItems: 'start' }}>
                  {/* Recherche produit */}
                  <div style={{ position: 'relative' }}>
                    <input
                      className={styles.input}
                      style={{ paddingLeft: 10, fontSize: 12.5 }}
                      placeholder="Désignation / produit…"
                      value={art.search} disabled={isLoading}
                      autoComplete="off"
                      onChange={e => updateLine(art.id, { search: e.target.value, designation: e.target.value, produit_id: null, showSugg: true })}
                      onFocus={() => updateLine(art.id, { showSugg: true })}
                    />
                    {art.showSugg && suggs.length > 0 && (
                      <div className={styles.suggDropdown}>
                        {suggs.map(p => (
                          <button key={p.sku} type="button" className={styles.suggItem}
                            onClick={() => updateLine(art.id, {
                              produit_id: p.id, designation: p.name, search: p.name,
                              prix: p.cost != null ? String(p.cost) : '',
                              showSugg: false,
                            })}>
                            <div className={styles.thumbSm} style={{ background: p.swatch }}>{p.initial}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--muted-2)', fontFamily: 'monospace' }}>{p.sku}</div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                              {money(p.price)} F
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantité */}
                  <input type="number" min={1} placeholder="Qté" value={art.qty}
                    className={`${styles.input} ${styles.inputMono}`}
                    style={{ textAlign: 'center', fontSize: 12.5, padding: '8px 6px' }}
                    disabled={isLoading}
                    onChange={e => updateLine(art.id, { qty: Number(e.target.value) })}
                  />

                  {/* Prix unitaire */}
                  <input type="number" min={0} placeholder="Prix u." value={art.prix}
                    className={`${styles.input} ${styles.inputMono}`}
                    style={{ textAlign: 'right', fontSize: 12.5, padding: '8px 8px' }}
                    disabled={isLoading}
                    onChange={e => updateLine(art.id, { prix: e.target.value })}
                  />

                  {/* Supprimer */}
                  <button type="button" onClick={() => removeLine(art.id)}
                    disabled={articles.length <= 1 || isLoading}
                    style={{ color: 'var(--muted)', display: 'grid', placeItems: 'center', height: 36, border: 0, background: 'none', cursor: 'pointer', opacity: articles.length <= 1 ? 0.3 : 1, alignSelf: 'center' }}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>Total</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>{money(total)} FCFA</span>
            </div>
          )}
        </div>

        {error && <div className={styles.formError}>{error}</div>}
      </div>

      <div className={styles.drawerFooter}>
        <button className={styles.btn} onClick={onClose} disabled={isLoading}>Annuler</button>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={confirm}
          disabled={!isValid || isLoading}
          style={{ minWidth: 160, justifyContent: 'center', opacity: !isValid && !isLoading ? 0.55 : 1 }}
        >
          {isLoading ? (
            <>
              <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: 99, display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              Enregistrement…
            </>
          ) : '💾 Enregistrer'}
        </button>
      </div>
    </div>
  );
}
