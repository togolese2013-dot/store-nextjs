'use client';

/**
 * StoreDataLoader — fetches real API data and wraps StoreShell with UIProvider.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UIProvider, useUI } from '@/components/interaction-layer';
import { createStoreConfig, setStoreData } from './store.config';
import StoreShell from './StoreShell';
import type { Order, Coupon, DeliveryZone, Payment } from './types';
import { SAMPLE_PAYMENTS } from './sample-data';

/* ── Status mapping API → FR ── */
const STATUS_MAP: Record<string, Order['status']> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  shipped:   'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const SWATCHES = ['#3B6A8F', '#2D6A4F', '#7A2C3A', '#D4A437', '#B8501A', '#5C4A88', '#1F3D6E'];
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mapApiOrder(o: any, idx: number): Order {
  const name = o.client_nom ?? o.nom ?? `Client ${idx}`;
  return {
    ref:            o.reference ?? o.id ?? `CMD-${idx}`,
    client:         name,
    init:           name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    color:          SWATCHES[hashStr(name) % SWATCHES.length],
    date:           o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—',
    products:       Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? i.qty ?? 1), 0) : (o.items_count ?? 1),
    amount:         Number(o.total ?? o.montant ?? 0),
    status:         STATUS_MAP[o.status ?? ''] ?? 'En attente',
    zone:           o.delivery_zone ?? o.zone ?? '—',
    telephone:      o.client_tel ?? o.telephone ?? '',
    adresse:        o.adresse ?? o.address ?? '',
    couponCode:     o.coupon_code ?? undefined,
    couponRemise:   Number(o.coupon_remise ?? 0) || undefined,
    fraisLivraison: Number(o.delivery_fee ?? 0) || undefined,
    items: Array.isArray(o.items) ? o.items.map((i: any, j: number) => ({
      id:   String(i.id ?? j),
      nom:  i.nom ?? i.name ?? `Produit ${j}`,
      qty:  Number(i.quantity ?? i.qty ?? 1),
      prix: Number(i.prix_unitaire ?? i.price ?? 0),
    })) : undefined,
  };
}

function mapApiCoupon(c: any): Coupon {
  const expires = c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
  return {
    code:   c.code,
    type:   c.type === 'percent' ? '%' : 'F',
    value:  Number(c.valeur ?? 0),
    used:   Number(c.uses_count ?? 0),
    limit:  Number(c.max_uses ?? 0) || null,
    expiry: expires,
    status: !c.actif ? 'Inactif' : isExpired ? 'Expiré' : 'Actif',
  };
}

function mapApiZone(z: any): DeliveryZone {
  return {
    id:       String(z.id),
    name:     z.nom ?? z.name ?? '—',
    coverage: z.couverture ?? z.coverage ?? '—',
    color:    SWATCHES[hashStr(z.nom ?? '') % SWATCHES.length],
    price:    Number(z.fee ?? 0),
    delay:    z.delai ?? z.delay ?? 'J+1',
    orders:   Number(z.orders_count ?? 0),
    active:   Boolean(z.actif ?? z.active ?? true),
  };
}

interface Props {
  onSwitchWorkspace?: () => void;
  userName?: string;
  userRole?: string;
}

export default function StoreDataLoader({ onSwitchWorkspace, userName, userRole }: Props) {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [coupons,  setCoupons]  = useState<Coupon[]>([]);
  const [zones,    setZones]    = useState<DeliveryZone[]>([]);
  const [payments, setPayments] = useState<Payment[]>(SAMPLE_PAYMENTS);

  const refresh = useCallback(async () => {
    try {
      const [ordRes, couRes, zonRes] = await Promise.all([
        fetch('/api/admin/orders?limit=100').then(r => r.json()),
        fetch('/api/admin/coupons').then(r => r.json()),
        fetch('/api/public/delivery-zones').then(r => r.json()),
      ]);

      const mappedOrders  = (ordRes.orders ?? ordRes.data ?? []).map(mapApiOrder);
      const mappedCoupons = (couRes.data   ?? couRes      ?? []).map(mapApiCoupon);
      const mappedZones   = (zonRes.data   ?? zonRes      ?? []).map(mapApiZone);

      setOrders(mappedOrders);
      setCoupons(mappedCoupons);
      setZones(mappedZones);
      setStoreData({ ORDERS: mappedOrders, COUPONS: mappedCoupons, ZONES: mappedZones });
    } catch { /* keep current data */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const config = useMemo(() => createStoreConfig({ onRefresh: refresh }), [refresh]);

  return (
    <UIProvider config={config} onNavigate={() => {}}>
      <StoreShellWithUI
        orders={orders}
        coupons={coupons}
        zones={zones}
        payments={payments}
        onSwitchWorkspace={onSwitchWorkspace}
        userName={userName}
        userRole={userRole}
      />
    </UIProvider>
  );
}

/* ── Inner shell: consumes useUI() ── */
function StoreShellWithUI({
  orders, coupons, zones, payments, onSwitchWorkspace, userName, userRole,
}: {
  orders: Order[];
  coupons: Coupon[];
  zones: DeliveryZone[];
  payments: Payment[];
  onSwitchWorkspace?: () => void;
  userName?: string;
  userRole?: string;
}) {
  const ui = useUI();

  return (
    <StoreShell
      orders={orders}
      coupons={coupons}
      zones={zones}
      payments={payments}
      onSwitchWorkspace={onSwitchWorkspace}
      onCreateOrder={() => ui.openForm('order')}
      userName={userName}
      userRole={userRole}
    />
  );
}
