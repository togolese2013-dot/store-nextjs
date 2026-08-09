'use client';

/**
 * StoreDataLoader — fetches real API data and wraps StoreShell with UIProvider.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UIProvider } from '@/components/interaction-layer';
import { createStoreConfig, setStoreData } from './store.config';
import StoreShell from './StoreShell';
import type { Order, Coupon, DeliveryZone, Payment, StoreOrderStats } from './types';
import { mapApiOrder, mapApiCoupon, mapApiZone } from './api-mapping';

const EMPTY_STATS: StoreOrderStats = {
  ca_jour: 0, ca_hier: 0, commandes_en_cours: 0, commandes_en_attente: 0,
  commandes_mois: 0, commandes_mois_prec: 0, ca_mois: 0, ca_mois_prec: 0,
  livrees_mois: 0, paye_mois: 0, ca_paye_mois: 0, ca_paye_mois_prec: 0,
  total_toutes: 0, total_pending: 0, total_confirmed: 0, total_shipped: 0,
  total_delivered: 0, total_cancelled: 0,
};

const PAYMENT_MODE_LABEL: Record<string, Payment['method']> = {
  moov_direct: 'Moov Money',
  yas_direct:  'Mixx by Yas',
  '2x': 'Échelonné', '3x': 'Échelonné', '4x': 'Échelonné',
};

/** Derived client-side from orders.payment_mode (checkout site) — pas de table paiements dédiée */
function derivePayments(orders: Order[]): Payment[] {
  return orders
    .filter(o => o.status !== 'Annulée')
    .map(o => ({
      date:   o.date,
      client: o.client,
      method: PAYMENT_MODE_LABEL[o.paymentMode ?? ''] ?? 'Comptant',
      amount: o.amount,
      ref:    o.ref,
      status: (o.statutPaiement === 'paye' || o.statutPaiement === 'paye_total') ? 'Réussi' : 'En attente',
    } as Payment));
}

interface Props {
  onSwitchWorkspace?: () => void;
  shopName?: string;
  userName?: string;
  userRole?: string;
}

export default function StoreDataLoader({ onSwitchWorkspace, shopName, userName, userRole }: Props) {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [zones,   setZones]   = useState<DeliveryZone[]>([]);
  const [stats,   setStats]   = useState<StoreOrderStats>(EMPTY_STATS);
  const payments = useMemo(() => derivePayments(orders), [orders]);

  const refresh = useCallback(async () => {
    try {
      const [ordRes, couRes, zonRes, statRes] = await Promise.all([
        fetch('/api/admin/orders?limit=100').then(r => r.json()),
        fetch('/api/admin/coupons').then(r => r.json()),
        fetch('/api/admin/delivery-zones').then(r => r.json()),
        fetch('/api/admin/orders/stats').then(r => r.json()),
      ]);

      const mappedOrders  = (ordRes.orders ?? ordRes.data ?? []).map(mapApiOrder);
      const mappedCoupons = (couRes.data   ?? couRes      ?? []).map(mapApiCoupon);
      const mappedZones   = (zonRes.data   ?? zonRes      ?? []).map(mapApiZone);

      setOrders(mappedOrders);
      setCoupons(mappedCoupons);
      setZones(mappedZones);
      if (statRes?.data) setStats(statRes.data);
      setStoreData({ ORDERS: mappedOrders, COUPONS: mappedCoupons, ZONES: mappedZones });
    } catch { /* keep current data */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const config = useMemo(() => createStoreConfig({ onRefresh: refresh }), [refresh]);

  return (
    <UIProvider config={config} onNavigate={() => {}}>
      <StoreShell
        orders={orders}
        coupons={coupons}
        zones={zones}
        payments={payments}
        stats={stats}
        onSwitchWorkspace={onSwitchWorkspace}
        shopName={shopName}
        userName={userName}
        userRole={userRole}
        onOrderChanged={refresh}
      />
    </UIProvider>
  );
}
