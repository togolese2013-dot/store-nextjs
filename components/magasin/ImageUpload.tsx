'use client';
import React, { useRef, useState } from 'react';
import styles from './Magasin.module.css';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [drag,    setDrag]    = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Fichier non supporté. JPEG, PNG, WebP ou GIF uniquement.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await toBase64(file);
      const res  = await fetch('/api/admin/upload', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ file: { data, type: file.type, name: file.name } }),
      });
      const json = await res.json();
      if (!res.ok || json.errors?.length) {
        setError(json.errors?.[0] ?? json.error ?? 'Erreur upload');
        return;
      }
      onChange(json.urls?.[0] ?? '');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className={styles.imgUploadWrap}>
      {/* Preview */}
      {value ? (
        <div className={styles.imgPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Aperçu"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            type="button"
            className={styles.imgRemoveBtn}
            onClick={() => onChange('')}
            aria-label="Supprimer l'image"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.imgDropzone} ${drag ? styles.imgDropzoneDrag : ''} ${loading ? styles.imgDropzoneLoading : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              <span>Upload en cours…</span>
            </>
          ) : (
            <>
              {/* Upload icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className={styles.imgDropzoneLabel}>Cliquer ou glisser une image</span>
              <span className={styles.imgDropzoneHint}>JPEG · PNG · WebP · GIF — max 10 Mo</span>
            </>
          )}
        </button>
      )}

      {error && <div className={styles.formError} style={{ marginTop: 6 }}>{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
