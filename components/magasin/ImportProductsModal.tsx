/**
 * ImportProductsModal — CSV bulk import (preview then commit).
 * Colonnes attendues : mêmes que l'export (/api/admin/products/export).
 */
'use client';
import React, { useRef, useState } from 'react';
import { Icons } from '@/components/interaction-layer';
import styles from './Magasin.module.css';

interface PreviewRow {
  line:           number;
  action:         'create' | 'update';
  reference:      string;
  nom:            string;
  categorie_nom:  string;
  marque_nom:     string;
  prix_unitaire:  number;
  stock_magasin:  number;
  actif:          number;
}
interface PreviewError { line: number; reason: string; }
interface CommitResult { created: number; updated: number; errors: PreviewError[]; }

interface Props {
  onClose:     () => void;
  onImported?: () => void;
}

export default function ImportProductsModal({ onClose, onImported }: Props) {
  const [step,    setStep]    = useState<'pick' | 'preview' | 'done'>('pick');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [rows,    setRows]    = useState<PreviewRow[]>([]);
  const [errors,  setErrors]  = useState<PreviewError[]>([]);
  const [result,  setResult]  = useState<CommitResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError('');
    try {
      const text = await file.text();
      const res  = await fetch('/api/admin/products/import/preview', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur serveur'); return; }
      setRows(data.rows ?? []);
      setErrors(data.errors ?? []);
      setStep('preview');
    } catch {
      setError('Impossible de lire ce fichier.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/admin/products/import/commit', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur serveur'); return; }
      setResult({ created: data.created ?? 0, updated: data.updated ?? 0, errors: data.errors ?? [] });
      setStep('done');
      onImported?.();
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  const createCount = rows.filter(r => r.action === 'create').length;
  const updateCount = rows.length - createCount;

  return (
    <>
      <div className="ux-backdrop" onMouseDown={onClose} />
      <div className={styles.importCard} onMouseDown={e => e.stopPropagation()}>
        <div className={styles.importHead}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            <Icons.upload size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Importer des produits</div>
            {step === 'pick' && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
                Fichier CSV — mêmes colonnes que l'export : Référence, Nom, Catégorie, Marque, Prix,
                Prix promo, Stock magasin, Stock boutique, Stock minimum, Actif. Une référence déjà
                existante met à jour le produit, sinon un nouveau produit est créé.
              </div>
            )}
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Fermer">
            <Icons.close size={16} />
          </button>
        </div>

        <div className={styles.importBody}>
          {step === 'pick' && (
            <div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <button type="button" className={styles.btn}
                style={{ width: '100%', justifyContent: 'center', padding: '24px', borderStyle: 'dashed' }}
                disabled={loading}
                onClick={() => fileRef.current?.click()}>
                {loading ? 'Analyse…' : 'Choisir un fichier CSV'}
              </button>
              {error && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 9, fontSize: 13 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--ok)', fontWeight: 600 }}>{createCount} à créer</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{updateCount} à mettre à jour</span>
                {errors.length > 0 && (
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    {errors.length} ligne{errors.length > 1 ? 's' : ''} ignorée{errors.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 9, fontSize: 13 }}>
                  {error}
                </div>
              )}

              {errors.length > 0 && (
                <div style={{ maxHeight: 100, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: 'var(--muted)' }}>
                  {errors.map((e, i) => <div key={i}>Ligne {e.line} : {e.reason}</div>)}
                </div>
              )}

              {rows.length > 0 && (
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 9 }}>
                  <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--surface)' }}>
                        <th style={{ padding: '7px 10px' }}>Ligne</th>
                        <th style={{ padding: '7px 10px' }}>Nom</th>
                        <th style={{ padding: '7px 10px' }}>Action</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right' }}>Prix</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 10px', color: 'var(--muted-2)' }}>{r.line}</td>
                          <td style={{ padding: '7px 10px' }}>{r.nom}</td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{
                              fontSize: 11, padding: '2px 7px', borderRadius: 99, fontWeight: 600,
                              background: r.action === 'create' ? 'var(--ok-bg)' : 'var(--accent-bg)',
                              color:      r.action === 'create' ? 'var(--ok)'    : 'var(--accent)',
                            }}>
                              {r.action === 'create' ? 'Nouveau' : 'Mise à jour'}
                            </span>
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: '"Geist Mono",monospace' }}>{r.prix_unitaire}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: '"Geist Mono",monospace' }}>{r.stock_magasin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rows.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>
                  Aucune ligne valide dans ce fichier.
                </div>
              )}
            </>
          )}

          {step === 'done' && result && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--ok)' }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Import terminé</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {result.created} produit{result.created > 1 ? 's' : ''} créé{result.created > 1 ? 's' : ''} ·{' '}
                {result.updated} modifié{result.updated > 1 ? 's' : ''}
                {result.errors.length > 0 && <> · {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''}</>}
              </div>
              {result.errors.length > 0 && (
                <div style={{ marginTop: 12, maxHeight: 100, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: 'var(--muted)', textAlign: 'left' }}>
                  {result.errors.map((e, i) => <div key={i}>Ligne {e.line} : {e.reason}</div>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.importFoot}>
          {step === 'preview' && (
            <>
              <button type="button" className={styles.btn} onClick={onClose}>Annuler</button>
              <button type="button" className={`${styles.btn} ${styles.primary}`} disabled={loading || rows.length === 0} onClick={handleCommit}>
                {loading ? 'Import en cours…' : `Confirmer l'import (${rows.length})`}
              </button>
            </>
          )}
          {step === 'done' && (
            <button type="button" className={`${styles.btn} ${styles.primary}`} style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
              Fermer
            </button>
          )}
          {step === 'pick' && (
            <button type="button" className={styles.btn} onClick={onClose}>Annuler</button>
          )}
        </div>
      </div>
    </>
  );
}
