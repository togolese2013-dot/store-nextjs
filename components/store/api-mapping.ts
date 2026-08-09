/**
 * Store — mapping API brute → types front. Partagé entre StoreDataLoader
 * (fetch initial) et CommandesPage (self-fetching paginé).
 */
import type { Order, Coupon, DeliveryZone } from './types';
import { formatDate } from '@/lib/format-date';

export const STATUS_MAP: Record<string, Order['status']> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  shipped:   'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const SWATCHES = ['#3B6A8F', '#2D6A4F', '#7A2C3A', '#D4A437', '#B8501A', '#5C4A88', '#1F3D6E'];
export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function mapApiOrder(o: any, idx: number): Order {
  const name = o.client_nom ?? o.nom ?? `Client ${idx}`;
  return {
    id:             Number(o.id),
    ref:            o.reference ?? o.id ?? `CMD-${idx}`,
    client:         name,
    init:           name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    color:          SWATCHES[hashStr(name) % SWATCHES.length],
    date:           o.created_at ? formatDate(o.created_at) : '—',
    products:       Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? i.qty ?? 1), 0) : (o.items_count ?? 1),
    amount:         Number(o.total ?? o.montant ?? 0),
    status:         STATUS_MAP[o.status ?? ''] ?? 'En attente',
    zone:           o.delivery_zone ?? o.zone ?? '—',
    telephone:      o.client_tel ?? o.telephone ?? '',
    adresse:        o.adresse ?? o.address ?? '',
    fraisLivraison: Number(o.delivery_fee ?? 0) || undefined,
    statutPaiement: o.statut_paiement ?? null,
    paymentMode:    o.payment_mode ?? null,
    items: Array.isArray(o.items) ? o.items.map((i: any, j: number) => ({
      id:   String(i.id ?? j),
      nom:  i.nom ?? i.name ?? `Produit ${j}`,
      qty:  Number(i.quantity ?? i.qty ?? 1),
      prix: Number(i.prix_unitaire ?? i.price ?? 0),
    })) : undefined,
  };
}

export function mapApiCoupon(c: any): Coupon {
  const expires = c.expires_at ? formatDate(c.expires_at) : '—';
  const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
  return {
    id:     Number(c.id),
    code:   c.code,
    type:   c.type === 'percent' ? '%' : 'F',
    value:  Number(c.valeur ?? 0),
    used:   Number(c.uses_count ?? 0),
    limit:  Number(c.max_uses ?? 0) || null,
    expiry: expires,
    status: !c.actif ? 'Inactif' : isExpired ? 'Expiré' : 'Actif',
  };
}

export function mapApiZone(z: any): DeliveryZone {
  return {
    id:       String(z.id),
    name:     z.nom ?? z.name ?? '—',
    coverage: z.couverture ?? z.coverage ?? '—',
    color:    SWATCHES[hashStr(z.nom ?? '') % SWATCHES.length],
    price:    Number(z.fee ?? 0),
    delay:    z.delai ?? z.delay ?? '—',
    orders:   Number(z.orders_count ?? 0),
    active:   Boolean(z.actif ?? z.active ?? true),
  };
}
