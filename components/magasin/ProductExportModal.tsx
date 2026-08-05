/**
 * ProductExportModal — export du catalogue produits.
 *
 * Format et Portée affichent toutes les options (comme la maquette
 * d'origine), mais seul CSV / Tout / Filtré par catégorie sont réels —
 * le backend ne sait faire que ça. Choisir Excel/PDF ou Sélection ne
 * ment pas silencieusement : une note explique ce qui va réellement se
 * passer avant de cliquer "Exporter".
 */
import React, { useState } from 'react';

export interface ExportPayload {
  categoryId?: string;
}

export interface ProductExportModalProps {
  scope: string;
  totalCount: number;
  categories: { id: string; name: string; count: number }[];
  onClose: () => void;
  onExport: (payload: ExportPayload) => void;
}

type Format = 'CSV' | 'Excel' | 'PDF';
type Range  = 'Tout' | 'Filtré' | 'Sélection';

const IconDownload = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconFile = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconClose = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconInfo = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: T[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: '#F3F1EC', border: '1px solid #E4E0D8', borderRadius: 10, padding: 3 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)} style={{
          flex: 1, padding: '7px 10px', fontSize: 12.5, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer',
          background: value === o ? '#fff' : 'transparent', boxShadow: value === o ? '0 1px 3px rgba(20,17,14,.12)' : 'none',
          color: value === o ? '#14110E' : '#8A8278',
        }}>{o}</button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#8A8278' }}>{label}</label>
      {children}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 11px', background: '#FBF0E4', border: '1px solid #EAD9BE', borderRadius: 9, fontSize: 12, color: '#8A5A24', lineHeight: 1.5 }}>
      <IconInfo size={14} />
      <span>{children}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', fontSize: 13, borderRadius: 9, border: '1px solid #E4E0D8', background: '#fff', color: '#14110E', boxSizing: 'border-box',
};

export function ProductExportModal({ scope, totalCount, categories, onClose, onExport }: ProductExportModalProps) {
  const [fmt, setFmt] = useState<Format>('CSV');
  const [range, setRange] = useState<Range>('Tout');
  const [categoryId, setCategoryId] = useState('');

  const selectedCat = categories.find(c => c.id === categoryId);
  const rowCount = range === 'Filtré' && selectedCat ? selectedCat.count : totalCount;
  const filename = range === 'Filtré' && selectedCat
    ? `produits_${selectedCat.name.toLowerCase()}.csv`
    : 'produits.csv';

  const handleExport = () => {
    onExport({ categoryId: range === 'Filtré' && categoryId ? categoryId : undefined });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,17,14,.34)', backdropFilter: 'blur(2px)' }} onMouseDown={onClose} />
      <div style={{ position: 'relative', width: 448, maxWidth: '92vw', background: '#fff', border: '1px solid #E4E0D8', borderRadius: 16, boxShadow: '0 26px 64px rgba(20,17,14,.22)' }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ padding: '20px 22px 0', display: 'flex', gap: 13, alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: '#EDE9E1', color: '#14110E' }}>
            <IconDownload size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-.01em' }}>Exporter — {scope}</div>
            <div style={{ fontSize: 12.5, color: '#8A8278', marginTop: 3, lineHeight: 1.5 }}>Choisissez le format et la portée des données à exporter.</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8278', padding: 4 }}><IconClose /></button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Format"><Segmented value={fmt} onChange={setFmt} options={['CSV', 'Excel', 'PDF']} /></Field>
          {fmt !== 'CSV' && <Notice>Export {fmt} bientôt disponible — un fichier CSV sera téléchargé à la place.</Notice>}

          <Field label="Portée"><Segmented value={range} onChange={setRange} options={['Tout', 'Filtré', 'Sélection']} /></Field>
          {range === 'Sélection' && <Notice>Aucune sélection possible depuis cet écran — le catalogue complet sera exporté.</Notice>}

          {range === 'Filtré' && (
            <Field label="Catégorie">
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                <option value="">Toutes les catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: '#F7F5F0', border: '1px solid #E4E0D8', borderRadius: 10, fontSize: 12.5, color: '#8A8278' }}>
            <IconFile size={16} />
            <span>{filename} · ~{rowCount} ligne{rowCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #E4E0D8', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#F7F5F0', borderRadius: '0 0 16px 16px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, border: '1px solid #E4E0D8', background: '#fff', cursor: 'pointer' }}>Annuler</button>
          <button type="button" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, border: 'none', background: '#14110E', color: '#fff', cursor: 'pointer' }}>
            <IconDownload size={14} /> Exporter
          </button>
        </div>
      </div>
    </div>
  );
}
