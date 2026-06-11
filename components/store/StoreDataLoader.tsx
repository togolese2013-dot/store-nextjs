'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StoreShell from './StoreShell';
import type { Order, Coupon, DeliveryZone, Payment, OrderStatus } from './types';

const SWATCHES = [
  '#3B6A8F', '#2D6A4F', '#7A2C3A', '#D4A437', '#B8501A',
  '#5C4A88', '#1F3D6E', '#C9601E', '#5A3520', '#1F1612',
];
const ZONE_COLORS = ['#2D6A4F', '#3B6A8F', '#5C4A88', '#B8501A', '#1F3D6E', '#C8962A'];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
      ', ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch { return dateStr; }
}

const STATUS_MAP: Record<string, OrderStatus> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  shipped:   'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

interface ApiOrder {
  reference: string;
  nom: string;
  zone_livraison: string;
  items: string;
  total: number;
  status: string;
  created_at: string;
}

interface ApiCoupon {
  code: string;
  type: 'percent' | 'fixed';
  valeur: number;
  uses_count: number;
  max_uses: number;
  expires_at: string | null;
  actif: number | boolean;
}

interface ApiZone {
  id: number;
  nom: string;
  fee: number;
  actif: number | boolean;
  prix_libre: boolean;
}

function mapOrder(o: ApiOrder): Order {
  const parsed = (() => {
    try { return typeof o.items === 'string' ? JSON.parse(o.items) : (o.items ?? []); }
    catch { return []; }
  })();
  const name = o.nom || 'Client anonyme';
  return {
    ref:      o.reference,
    client:   name,
    init:     o.nom ? initials(o.nom) : '?',
    color:    o.nom ? SWATCHES[hashStr(o.nom) % SWATCHES.length] : '#8A8278',
    date:     formatDate(o.created_at),
    products: Array.isArray(parsed) ? parsed.length : 0,
    amount:   Number(o.total),
    status:   STATUS_MAP[o.status] ?? 'En attente',
    zone:     o.zone_livraison || '—',
  };
}

function mapCoupon(c: ApiCoupon): Coupon {
  const now    = new Date();
  const exp    = c.expires_at ? new Date(c.expires_at) : null;
  const active = c.actif === 1 || c.actif === true;
  let status: Coupon['status'] = 'Actif';
  if (!active) status = 'Inactif';
  else if (exp && exp < now) status = 'Expiré';
  else if (Number(c.max_uses) > 0 && Number(c.uses_count) >= Number(c.max_uses)) status = 'Expiré';
  return {
    code:   c.code,
    type:   c.type === 'percent' ? '%' : 'F',
    value:  Number(c.valeur),
    used:   Number(c.uses_count),
    limit:  Number(c.max_uses) > 0 ? Number(c.max_uses) : null,
    expiry: exp
      ? exp.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—',
    status,
  };
}

function mapZone(z: ApiZone, idx: number): DeliveryZone {
  return {
    id:       String(z.id),
    name:     z.nom,
    coverage: z.nom,
    color:    ZONE_COLORS[idx % ZONE_COLORS.length],
    price:    Number(z.fee),
    delay:    z.prix_libre ? 'À confirmer' : Number(z.fee) === 0 ? 'Gratuit' : 'Standard',
    orders:   0,
    active:   Boolean(z.actif),
  };
}

interface Props {
  onSwitchWorkspace?: () => void;
  onCreateOrder?: () => void;
  userName?: string;
  userRole?: string;
}

export default function StoreDataLoader({
  onSwitchWorkspace,
  onCreateOrder,
  userName,
  userRole,
}: Props) {
  const router = useRouter();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [coupons,  setCoupons]  = useState<Coupon[]>([]);
  const [zones,    setZones]    = useState<DeliveryZone[]>([]);
  const [payments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch('/api/admin/orders?limit=50')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.data)) setOrders((d.data as ApiOrder[]).map(mapOrder)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCoupons((d as ApiCoupon[]).map(mapCoupon)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/delivery-zones')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setZones((d as ApiZone[]).map((z, i) => mapZone(z, i)));
      })
      .catch(() => {});
  }, []);

  return (
    <StoreShell
      orders={orders}
      coupons={coupons}
      zones={zones}
      payments={payments}
      onSwitchWorkspace={onSwitchWorkspace}
      onCreateOrder={onCreateOrder ?? (() => router.push('/admin/orders/new'))}
      userName={userName}
      userRole={userRole}
    />
  );
}
