'use client';
import React, { useEffect, useState } from 'react';
import styles from '../Magasin.module.css';

interface ApiProduct {
  id: number;
  nom: string;
  reference: string;
  stock_boutique?: number;
}

const MOTIFS = [
  'Inventaire',
  'Casse / Perte',
  'Retour fournisseur',
  'Don / Échantillon',
  'Correction saisie',
  'Autre',
];

export default function AdjustmentsView() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  const [form, setForm] = useState({
    produit_id: '',
    quantite: '',
    motif: '',
    customMotif: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/products?limit=500').then(r => r.json()).then(r => {
      setProducts(r.products ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find(p => String(p.id) === form.produit_id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const motif = form.motif === 'Autre' ? form.customMotif.trim() : form.motif;
    if (!form.produit_id || form.quantite === '' || !motif) {
      setError('Produit, nouvelle quantité et motif sont requis.');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/admin/stock/ajustement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: Number(form.produit_id),
          quantite:   Number(form.quantite),
          motif,
        }),
      }).then(r => r.json());

      if (r.error) { setError(r.error); return; }

      setSuccess(`Stock ajusté à ${form.quantite} unités pour "${selectedProduct?.nom ?? ''}".`);
      setForm({ produit_id: '', quantite: '', motif: '', customMotif: '' });

      // Refresh product list to update displayed stock
      fetch('/api/admin/products?limit=500').then(r => r.json()).then(r => {
        setProducts(r.products ?? []);
      });
    } catch (err) {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.subview}>
      <div className={styles.subviewHead}>
        <div className={styles.subviewTitle}>Ajustement de stock</div>
      </div>

      <div style={{ maxWidth: '560px' }}>
        {error   && <div className={styles.formError}   style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div className={styles.formSuccess} style={{ marginBottom: '16px' }}>{success}</div>}

        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Ajuster la quantité en boutique</div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Product selector */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Produit <span className={styles.formReq}>*</span>
              </label>
              {loading ? (
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Chargement des produits…</div>
              ) : (
                <select
                  className={styles.formSelect}
                  value={form.produit_id}
                  onChange={e => setForm({ ...form, produit_id: e.target.value, quantite: e.target.value ? String(products.find(p => String(p.id) === e.target.value)?.stock_boutique ?? 0) : '' })}
                  required
                >
                  <option value="">— Sélectionner un produit —</option>
                  {products.map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nom} ({p.reference}) — stock actuel : {p.stock_boutique ?? 0}
                    </option>
                  ))}
                </select>
              )}
              {selectedProduct && (
                <div className={styles.formHint}>
                  Stock boutique actuel : <strong>{selectedProduct.stock_boutique ?? 0}</strong>
                </div>
              )}
            </div>

            {/* New quantity */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Nouvelle quantité <span className={styles.formReq}>*</span>
              </label>
              <input
                type="number"
                min="0"
                className={styles.formInput}
                value={form.quantite}
                onChange={e => setForm({ ...form, quantite: e.target.value })}
                placeholder="Ex. 25"
                required
              />
              {form.quantite !== '' && selectedProduct && (
                <div className={styles.formHint}>
                  Différence :&nbsp;
                  <strong style={{ color: Number(form.quantite) >= (selectedProduct.stock_boutique ?? 0) ? 'var(--ok)' : 'var(--warn)' }}>
                    {Number(form.quantite) >= (selectedProduct.stock_boutique ?? 0) ? '+' : ''}
                    {Number(form.quantite) - (selectedProduct.stock_boutique ?? 0)}
                  </strong>
                </div>
              )}
            </div>

            {/* Motif */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Motif <span className={styles.formReq}>*</span>
              </label>
              <select
                className={styles.formSelect}
                value={form.motif}
                onChange={e => setForm({ ...form, motif: e.target.value })}
                required
              >
                <option value="">— Choisir un motif —</option>
                {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {form.motif === 'Autre' && (
                <input
                  className={styles.formInput}
                  style={{ marginTop: '8px' }}
                  placeholder="Précisez le motif…"
                  value={form.customMotif}
                  onChange={e => setForm({ ...form, customMotif: e.target.value })}
                  required
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.ghost}`}
                onClick={() => { setForm({ produit_id: '', quantite: '', motif: '', customMotif: '' }); setError(''); setSuccess(''); }}
              >
                Réinitialiser
              </button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.primary}`}
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : 'Appliquer l\'ajustement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
