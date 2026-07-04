import { useEffect, useState } from 'react';
import { TransferStore, type TransferRequest } from '@/lib/transferStore';

export interface TransferProduct {
  name: string;
  sku: string;
  stock_magasin?: number;
}

export interface TransferRequestModalProps {
  open: boolean;
  products?: TransferProduct[];
  defaultProduct?: string;
  onClose: () => void;
  onSubmitted?: (record: TransferRequest) => void;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChevronDown = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const ArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

interface FormState {
  product: string;
  qty: string;
  note: string;
}

const emptyState = (defaultProduct?: string): FormState => ({
  product: defaultProduct || '',
  qty: '',
  note: '',
});

interface MagasinProduct {
  id: number;
  nom: string;
  reference: string;
  stock_magasin: number;
}

export default function TransferRequestModal({
  open,
  defaultProduct,
  onClose,
  onSubmitted,
}: TransferRequestModalProps) {
  const [form,          setForm]          = useState<FormState>(() => emptyState(defaultProduct));
  const [magasinProds,  setMagasinProds]  = useState<MagasinProduct[]>([]);
  const [loadingProds,  setLoadingProds]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(emptyState(defaultProduct));
    setLoadingProds(true);
    fetch('/api/admin/products?limit=500')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.products)) {
          setMagasinProds(d.products.map((p: any) => ({
            id:            Number(p.id),
            nom:           String(p.nom),
            reference:     String(p.reference ?? ''),
            stock_magasin: Number(p.stock_magasin ?? 0),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProds(false));
  }, [open, defaultProduct]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    const prod = magasinProds.find(p => p.nom === form.product);
    if (!prod) { setError('Sélectionnez un produit.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const record = await TransferStore.request({
        produit_id: prod.id,
        product: form.product || 'Produit',
        sku: prod.reference || '—',
        qty: form.qty,
        from: 'Magasin',
        note: form.note,
      });
      onSubmitted?.(record);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="tr-backdrop" onMouseDown={onClose} />
      <div className="tr-drawer" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tr-head">
          <div>
            <div className="tr-eyb">Boutique · Stock</div>
            <div className="tr-title">
              Nouveau <span className="tr-serif">transfert</span>
            </div>
          </div>
          <button className="tr-x" onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        <div className="tr-body">
          <p className="tr-note">
            <span className="tr-note-ic">
              <ArrowRight size={13} />
            </span>
            Le stock est prélevé directement sur le stock Magasin. La demande sera envoyée au Magasin
            pour approbation.
          </p>

          <div className="tr-grid">
            <div className="tr-field tr-full">
              <label className="tr-label">Produit (stock magasin)</label>
              <div className="tr-select-wrap">
                {loadingProds ? (
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '10px 0' }}>Chargement…</div>
                ) : (
                  <>
                    <select
                      className="tr-in"
                      value={form.product}
                      onChange={(e) => set('product', e.target.value)}
                    >
                      <option value="" disabled>Sélectionner un produit…</option>
                      {magasinProds.map((p) => (
                        <option key={p.id} value={p.nom}>
                          {p.nom} ({p.reference}) · Stock : {p.stock_magasin}
                        </option>
                      ))}
                    </select>
                    <span className="tr-select-caret">
                      <ChevronDown size={14} />
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="tr-field">
              <label className="tr-label">Quantité demandée</label>
              <input
                className="tr-in mono"
                type="number"
                min={1}
                value={form.qty}
                onChange={(e) => set('qty', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="tr-field tr-full">
              <label className="tr-label">Motif</label>
              <textarea
                className="tr-in"
                value={form.note}
                onChange={(e) => set('note', e.target.value)}
                placeholder="Réapprovisionnement, rupture imminente…"
              />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 12 }}>{error}</p>
          )}
        </div>

        <div className="tr-foot">
          <button className="tr-btn" onClick={onClose}>
            Annuler
          </button>
          <button className="tr-btn tr-pri" onClick={submit} disabled={!form.product || loadingProds || submitting}>
            {submitting ? 'Envoi…' : 'Demander le transfert'}
          </button>
        </div>
      </div>
    </>
  );
}
