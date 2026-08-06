/**
 * Shared facture -> Sale mapping.
 * Used by BoutiqueDataLoader (recent sales preview) and VentesPage (full register, own fetch).
 */
import type { Sale } from './types';
import { formatDateTime } from '@/lib/format-date';

export const SWATCHES = [
  '#3B6A8F', '#2D6A4F', '#7A2C3A', '#D4A437', '#B8501A',
  '#5C4A88', '#1F3D6E', '#C9601E', '#5A3520', '#1F1612',
];

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '';
}

export type ApiPaymentMode = 'especes' | 'moov_money' | 'tmoney' | 'virement_bancaire' | 'wave' | null;

export function mapPaymentMode(mode: ApiPaymentMode): Sale['payment'] {
  const map: Record<string, Sale['payment']> = {
    especes:           'Espèces',
    moov_money:        'Orange M.',
    tmoney:            'Orange M.',
    virement_bancaire: 'Carte',
    wave:              'Wave',
  };
  return mode ? (map[mode] ?? 'Espèces') : 'Espèces';
}

export interface ApiFacture {
  id: number;
  reference: string;
  client_nom: string | null;
  items: string;
  total: number;
  mode_paiement: ApiPaymentMode;
  created_at: string;
  vendeur?: string | null;
}

export function mapFacture(f: ApiFacture): Sale {
  const parsed = (() => {
    try { return typeof f.items === 'string' ? JSON.parse(f.items) : (f.items ?? []); }
    catch { return []; }
  })();
  const name = f.client_nom || '—';
  const isAnon = !f.client_nom;
  const itemNames = Array.isArray(parsed)
    ? parsed.map((i: { nom?: string }) => i.nom ?? '').filter(Boolean).join(' · ')
    : '';
  return {
    id:        f.reference,
    numericId: f.id,
    client:    name,
    init:      isAnon ? '' : initials(name),
    color:     isAnon ? '#8A8278' : SWATCHES[hashStr(name) % SWATCHES.length],
    time:      formatDateTime(f.created_at),
    isoDate:   f.created_at,
    products:  Array.isArray(parsed) ? parsed.length : 0,
    amount:    Number(f.total),
    payment:   mapPaymentMode(f.mode_paiement),
    items:     itemNames || '—',
    vendeur:   f.vendeur ?? null,
  };
}
