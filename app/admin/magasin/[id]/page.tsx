'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '@/components/magasin/Magasin.module.css';
import { ChevLeftIcon } from '@/components/magasin/icons';
import ImageUpload from '@/components/magasin/ImageUpload';

interface Category { id: number; nom: string; }
interface Brand    { id: number; nom: string; }

interface FormState {
  nom:            string;
  reference:      string;
  description:    string;
  categorie_id:   string;
  marque_id:      string;
  prix_unitaire:  string;
  stock_boutique: string;
  stock_magasin:  string;
  remise:         string;
  neuf:           boolean;
  actif:          boolean;
  image_url:      string;
}

const EMPTY: FormState = {
  nom: '', reference: '', description: '',
  categorie_id: '', marque_id: '',
  prix_unitaire: '', stock_boutique: '0', stock_magasin: '0',
  remise: '0', neuf: true, actif: true, image_url: '',
};

export default function EditProduitPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [cats,    setCats]    = useState<Category[]>([]);
  const [brands,  setBrands]  = useState<Brand[]>([]);
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [name,    setName]    = useState('');

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/products/${productId}`).then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()),
      fetch('/api/admin/marques').then(r => r.json()),
    ]).then(([prodRes, cRes, bRes]) => {
      setCats(cRes.data ?? []);
      setBrands(bRes.data ?? []);

      if (prodRes.error) { setError(prodRes.error); return; }

      const p = prodRes.product;
      setName(p.nom ?? '');
      setForm({
        nom:            p.nom            ?? '',
        reference:      p.reference      ?? '',
        description:    p.description    ?? '',
        categorie_id:   p.categorie_id   != null ? String(p.categorie_id)   : '',
        marque_id:      p.marque_id      != null ? String(p.marque_id)      : '',
        prix_unitaire:  p.prix_unitaire  != null ? String(p.prix_unitaire)  : '',
        stock_boutique: p.stock_boutique != null ? String(p.stock_boutique) : '0',
        stock_magasin:  p.stock_magasin  != null ? String(p.stock_magasin)  : '0',
        remise:         p.remise         != null ? String(p.remise)         : '0',
        neuf:           Boolean(p.neuf),
        actif:          p.actif === 1 || p.actif === true,
        image_url:      p.image_url ?? p.image ?? '',
      });
    }).catch(() => setError('Impossible de charger ce produit.'))
    .finally(() => setLoading(false));
  }, [productId]);

  function set(key: keyof FormState, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.nom.trim() || !form.prix_unitaire) {
      setError('Nom et prix sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nom:            form.nom.trim(),
        reference:      form.reference.trim() || undefined,
        description:    form.description.trim() || undefined,
        categorie_id:   form.categorie_id ? Number(form.categorie_id) : null,
        marque_id:      form.marque_id    ? Number(form.marque_id)    : null,
        prix_unitaire:  Number(form.prix_unitaire),
        stock_boutique: Number(form.stock_boutique),
        stock_magasin:  Number(form.stock_magasin),
        remise:         Number(form.remise),
        neuf:           form.neuf ? 1 : 0,
        actif:          form.actif ? 1 : 0,
        image_url:      form.image_url.trim() || null,
      };

      const r = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (r.error) { setError(r.error); return; }

      setSuccess('Produit mis à jour.');
      setName(form.nom);
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.formPage}>
        <div className={styles.spinnerWrap} style={{ paddingTop: '80px' }}>
          <span className={styles.spinner} /> Chargement du produit…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formPage}>
      {/* Header */}
      <header className={styles.formHeader}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => router.push('/admin/magasin?page=products')}
          aria-label="Retour"
        >
          <ChevLeftIcon size={16} />
        </button>
        <div className={styles.formHeaderTitle}>
          Modifier — <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{name || `#${productId}`}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => router.push('/admin/magasin?page=products')}
          >
            Retour
          </button>
          <button
            type="submit"
            form="edit-product-form"
            className={`${styles.btn} ${styles.primary}`}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </header>

      {/* Body */}
      <form id="edit-product-form" onSubmit={submit}>
        <div className={styles.formBody}>
          {/* Left column */}
          <div className={styles.formLeft}>
            {error   && <div className={styles.formError}>{error}</div>}
            {success && <div className={styles.formSuccess}>{success}</div>}

            {/* Infos principales */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>Informations principales</div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Nom du produit <span className={styles.formReq}>*</span>
                </label>
                <input
                  className={styles.formInput}
                  value={form.nom}
                  onChange={e => set('nom', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Référence (SKU)</label>
                <input
                  className={styles.formInput}
                  value={form.reference}
                  onChange={e => set('reference', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description courte</label>
                <textarea
                  className={styles.formTextarea}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
              </div>
            </div>

            {/* Tarification & stock */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>Tarification & stock</div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Prix unitaire (FCFA) <span className={styles.formReq}>*</span>
                  </label>
                  <input
                    type="number" min="0"
                    className={styles.formInput}
                    value={form.prix_unitaire}
                    onChange={e => set('prix_unitaire', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Remise (%)</label>
                  <input
                    type="number" min="0" max="100"
                    className={styles.formInput}
                    value={form.remise}
                    onChange={e => set('remise', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock boutique</label>
                  <input
                    type="number" min="0"
                    className={styles.formInput}
                    value={form.stock_boutique}
                    onChange={e => set('stock_boutique', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock magasin</label>
                  <input
                    type="number" min="0"
                    className={styles.formInput}
                    value={form.stock_magasin}
                    onChange={e => set('stock_magasin', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Catégorisation */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>Catégorisation</div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Catégorie</label>
                  <select
                    className={styles.formSelect}
                    value={form.categorie_id}
                    onChange={e => set('categorie_id', e.target.value)}
                  >
                    <option value="">— Aucune —</option>
                    {cats.map(c => <option key={c.id} value={String(c.id)}>{c.nom}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Marque</label>
                  <select
                    className={styles.formSelect}
                    value={form.marque_id}
                    onChange={e => set('marque_id', e.target.value)}
                  >
                    <option value="">— Aucune —</option>
                    {brands.map(b => <option key={b.id} value={String(b.id)}>{b.nom}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className={styles.formRight}>
            {/* Statut */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>Statut</div>
              <div className={styles.formToggleRow}>
                <div>
                  <div className={styles.formToggleLabel}>Actif</div>
                  <div className={styles.formToggleSub}>Visible dans le catalogue</div>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)} />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              <div className={styles.formToggleRow}>
                <div>
                  <div className={styles.formToggleLabel}>Nouveau</div>
                  <div className={styles.formToggleSub}>Badge "Nouveau" affiché</div>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={form.neuf} onChange={e => set('neuf', e.target.checked)} />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </div>

            {/* Image */}
            <div className={styles.formCard}>
              <div className={styles.formCardTitle}>Image principale</div>
              <ImageUpload
                value={form.image_url}
                onChange={url => set('image_url', url)}
              />
            </div>

            {/* ID info */}
            <div className={styles.formCard} style={{ padding: '14px 16px', gap: '8px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '4px' }}>Informations</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--muted)' }}>ID produit</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>#{productId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--muted)' }}>SKU</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>{form.reference || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
