'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/components/magasin/Magasin.module.css';
import { ChevLeftIcon } from '@/components/magasin/icons';

interface Category { id: number; nom: string; }
interface Brand    { id: number; nom: string; }

export default function NouveauProduitPage() {
  const router = useRouter();

  const [cats,   setCats]   = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [form, setForm] = useState({
    nom:            '',
    reference:      '',
    description:    '',
    categorie_id:   '',
    marque_id:      '',
    prix_unitaire:  '',
    stock_boutique: '0',
    stock_magasin:  '0',
    remise:         '0',
    neuf:           true,
    actif:          true,
    image_url:      '',
  });

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then(r => r.json()),
      fetch('/api/admin/marques').then(r => r.json()),
    ]).then(([cRes, bRes]) => {
      setCats(cRes.data ?? []);
      setBrands(bRes.data ?? []);
    }).catch(() => {});
  }, []);

  function set(key: string, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.nom.trim() || !form.prix_unitaire) {
      setError('Nom et prix sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        nom:            form.nom.trim(),
        reference:      form.reference.trim() || undefined,
        description:    form.description.trim() || undefined,
        categorie_id:   form.categorie_id ? Number(form.categorie_id) : undefined,
        marque_id:      form.marque_id    ? Number(form.marque_id)    : undefined,
        prix_unitaire:  Number(form.prix_unitaire),
        stock_boutique: Number(form.stock_boutique),
        stock_magasin:  Number(form.stock_magasin),
        remise:         Number(form.remise),
        neuf:           form.neuf,
        actif:          form.actif,
        image_url:      form.image_url.trim() || undefined,
      };

      const r = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (r.error) { setError(r.error); return; }
      router.push('/admin/magasin');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.formPage}>
      {/* Header */}
      <header className={styles.formHeader}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => router.push('/admin/magasin')}
          aria-label="Retour"
        >
          <ChevLeftIcon size={16} />
        </button>
        <div className={styles.formHeaderTitle}>Nouveau produit</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => router.push('/admin/magasin')}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="product-form"
            className={`${styles.btn} ${styles.primary}`}
            disabled={saving}
          >
            {saving ? 'Création…' : 'Créer le produit'}
          </button>
        </div>
      </header>

      {/* Body */}
      <form id="product-form" onSubmit={submit}>
        <div className={styles.formBody}>
          {/* Left column */}
          <div className={styles.formLeft}>
            {error && <div className={styles.formError}>{error}</div>}

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
                  placeholder="Ex. Pagne wax Indigo Royal"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Référence (SKU)</label>
                <input
                  className={styles.formInput}
                  value={form.reference}
                  onChange={e => set('reference', e.target.value)}
                  placeholder="Auto-générée si vide (ex. PROD-42)"
                />
                <div className={styles.formHint}>Laissez vide pour auto-générer.</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description courte</label>
                <textarea
                  className={styles.formTextarea}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Description affichée dans le catalogue…"
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
                    type="number"
                    min="0"
                    className={styles.formInput}
                    value={form.prix_unitaire}
                    onChange={e => set('prix_unitaire', e.target.value)}
                    placeholder="Ex. 12500"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Remise (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={styles.formInput}
                    value={form.remise}
                    onChange={e => set('remise', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock boutique</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.formInput}
                    value={form.stock_boutique}
                    onChange={e => set('stock_boutique', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock magasin</label>
                  <input
                    type="number"
                    min="0"
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>URL de l'image</label>
                <input
                  className={styles.formInput}
                  value={form.image_url}
                  onChange={e => set('image_url', e.target.value)}
                  placeholder="https://res.cloudinary.com/…"
                />
                <div className={styles.formHint}>Cloudinary ou chemin relatif uniquement.</div>
              </div>
              {form.image_url && (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', marginTop: '4px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image_url}
                    alt="Aperçu"
                    style={{ width: '100%', height: '160px', objectFit: 'contain', background: 'var(--bg-2)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
