'use client';
import React, { useEffect, useState } from 'react';
import styles from '../Magasin.module.css';
import { PlusIcon } from '../icons';

interface Category {
  id: number;
  nom: string;
  description?: string;
  product_count?: number;
}

export default function CategoriesView() {
  const [cats, setCats]         = useState<Category[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [creating, setCreating] = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [form, setForm]         = useState({ nom: '', description: '' });
  const [saving, setSaving]     = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/categories').then(r => r.json());
      setCats(r.data ?? []);
    } catch { setError('Erreur de chargement.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.nom.trim()) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await fetch(`/api/admin/categories/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/admin/categories', {
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
    if (!confirm('Supprimer cette catégorie ?')) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    await load();
  }

  function startEdit(c: Category) {
    setEditId(c.id);
    setForm({ nom: c.nom, description: c.description ?? '' });
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
        <div className={styles.subviewTitle}>Catégories</div>
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => { setCreating(true); setEditId(null); setForm({ nom: '', description: '' }); }}
        >
          <PlusIcon size={14} /> Nouvelle catégorie
        </button>
      </div>

      {error && <div className={styles.formError}>{error}</div>}

      <div className={styles.subviewTable}>
        {/* Inline create form */}
        {creating && (
          <InlineForm
            form={form}
            onChange={setForm}
            onSave={save}
            onCancel={cancel}
            saving={saving}
            label="Nouvelle catégorie"
          />
        )}

        {loading ? (
          <div className={styles.spinnerWrap}><span className={styles.spinner} /> Chargement…</div>
        ) : cats.length === 0 && !creating ? (
          <div className={styles.subviewEmpty}>
            <p>Aucune catégorie. Créez-en une pour organiser vos produits.</p>
          </div>
        ) : (
          cats.map(c => (
            editId === c.id ? (
              <InlineForm
                key={c.id}
                form={form}
                onChange={setForm}
                onSave={save}
                onCancel={cancel}
                saving={saving}
                label="Modifier"
              />
            ) : (
              <div key={c.id} className={styles.subviewRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.subviewRowName}>{c.nom}</div>
                  {c.description && <div className={styles.subviewRowMeta}>{c.description}</div>}
                </div>
                {c.product_count !== undefined && (
                  <span className={styles.tag}>{c.product_count} produit{c.product_count !== 1 ? 's' : ''}</span>
                )}
                <div className={styles.subviewRowActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.ghost}`}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => startEdit(c)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.ghost}`}
                    style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--danger)' }}
                    onClick={() => remove(c.id)}
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

function InlineForm({
  form, onChange, onSave, onCancel, saving, label,
}: {
  form: { nom: string; description: string };
  onChange: (f: { nom: string; description: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className={styles.inlineForm} style={{ flexWrap: 'wrap', gap: '8px' }}>
      <input
        className={styles.inlineInput}
        placeholder="Nom *"
        value={form.nom}
        onChange={e => onChange({ ...form, nom: e.target.value })}
        style={{ minWidth: '160px', maxWidth: '260px' }}
        autoFocus
      />
      <input
        className={styles.inlineInput}
        placeholder="Description (optionnel)"
        value={form.description}
        onChange={e => onChange({ ...form, description: e.target.value })}
        style={{ flex: 1, minWidth: '160px' }}
      />
      <button
        type="button"
        className={`${styles.btn} ${styles.primary}`}
        style={{ padding: '7px 14px', fontSize: '13px' }}
        onClick={onSave}
        disabled={saving || !form.nom.trim()}
      >
        {saving ? '…' : label}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.ghost}`}
        style={{ padding: '7px 12px', fontSize: '13px' }}
        onClick={onCancel}
      >
        Annuler
      </button>
    </div>
  );
}
