'use client';
import React, { useEffect, useState } from 'react';
import styles from '../Magasin.module.css';
import { PlusIcon } from '../icons';

interface Brand {
  id: number;
  nom: string;
  description?: string;
}

export default function BrandsView() {
  const [brands, setBrands]     = useState<Brand[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [creating, setCreating] = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [form, setForm]         = useState({ nom: '', description: '' });
  const [saving, setSaving]     = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/marques').then(r => r.json());
      setBrands(r.data ?? []);
    } catch { setError('Erreur de chargement.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.nom.trim()) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await fetch(`/api/admin/marques/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/admin/marques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setForm({ nom: '', description: '' });
      setCreating(false);
      setEditId(null);
      await load();
    } catch { setError('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm('Supprimer cette marque ?')) return;
    await fetch(`/api/admin/marques/${id}`, { method: 'DELETE' });
    await load();
  }

  function startEdit(b: Brand) {
    setEditId(b.id);
    setForm({ nom: b.nom, description: b.description ?? '' });
    setCreating(false);
  }

  function cancel() {
    setEditId(null);
    setCreating(false);
    setForm({ nom: '', description: '' });
  }

  return (
    <div className={styles.subview}>
      <div className={styles.subviewHead}>
        <div className={styles.subviewTitle}>Marques</div>
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => { setCreating(true); setEditId(null); setForm({ nom: '', description: '' }); }}
        >
          <PlusIcon size={14} /> Nouvelle marque
        </button>
      </div>

      {error && <div className={styles.formError}>{error}</div>}

      <div className={styles.subviewTable}>
        {creating && (
          <div className={styles.inlineForm} style={{ flexWrap: 'wrap', gap: '8px' }}>
            <input
              className={styles.inlineInput}
              placeholder="Nom *"
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              style={{ minWidth: '160px', maxWidth: '260px' }}
              autoFocus
            />
            <input
              className={styles.inlineInput}
              placeholder="Description (optionnel)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ flex: 1, minWidth: '160px' }}
            />
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              style={{ padding: '7px 14px', fontSize: '13px' }}
              onClick={save}
              disabled={saving || !form.nom.trim()}
            >
              {saving ? '…' : 'Créer'}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.ghost}`}
              style={{ padding: '7px 12px', fontSize: '13px' }}
              onClick={cancel}
            >
              Annuler
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.spinnerWrap}><span className={styles.spinner} /> Chargement…</div>
        ) : brands.length === 0 && !creating ? (
          <div className={styles.subviewEmpty}>
            <p>Aucune marque. Créez-en une pour catégoriser vos produits par fabricant.</p>
          </div>
        ) : (
          brands.map(b => (
            editId === b.id ? (
              <div key={b.id} className={styles.inlineForm} style={{ flexWrap: 'wrap', gap: '8px' }}>
                <input
                  className={styles.inlineInput}
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  style={{ minWidth: '160px', maxWidth: '260px' }}
                  autoFocus
                />
                <input
                  className={styles.inlineInput}
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ flex: 1, minWidth: '160px' }}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.primary}`}
                  style={{ padding: '7px 14px', fontSize: '13px' }}
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? '…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.ghost}`}
                  style={{ padding: '7px 12px', fontSize: '13px' }}
                  onClick={cancel}
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div key={b.id} className={styles.subviewRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.subviewRowName}>{b.nom}</div>
                  {b.description && <div className={styles.subviewRowMeta}>{b.description}</div>}
                </div>
                <div className={styles.subviewRowActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.ghost}`}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => startEdit(b)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.ghost}`}
                    style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--danger)' }}
                    onClick={() => remove(b.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
