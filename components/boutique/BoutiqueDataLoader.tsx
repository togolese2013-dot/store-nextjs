'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BoutiqueShell from './BoutiqueShell';
import { useAdminSSE } from '@/components/admin/useAdminSSE';
import { UIProvider } from '@/components/interaction-layer';
import { createBoutiqueConfig, setBoutiqueData } from './boutique.config';
import type { Sale, BoutiqueStock, CashMovement, OverviewStats } from './types';
import { BoutiqueSettingsProvider, buildConfig, type BoutiqueConfig } from './BoutiqueSettingsContext';
import type { StoreState } from './settings/types';
import { formatDateTime } from '@/lib/format-date';
import {
  SWATCHES, hashStr, initials, type ApiFacture, mapFacture, mapPaymentMode, type ApiPaymentMode,
  type ApiStockItem, mapStockItem,
} from './sale-mapping';

interface ApiFinanceEntry {
  reference: string;
  type: 'caisse' | 'depense' | 'rentree' | 'vente' | 'transfert';
  description: string | null;
  montant: number;
  date_entree: string;
}

function mapFinanceEntries(entries: ApiFinanceEntry[]): CashMovement[] {
  const TYPE_SIGN: Record<string, number> = {
    vente: 1, rentree: 1, caisse: 1, depense: -1, transfert: -1,
  };
  const TYPE_LABEL: Record<string, CashMovement['type']> = {
    vente:    'Vente',
    rentree:  'Vente',
    caisse:   'Ouverture',
    depense:  'Sortie',
    transfert:'Sortie',
  };
  // Oldest-first to compute running balance, then reverse for display (newest first)
  let running = 0;
  const withBalance = [...entries].reverse().map(e => {
    const signed = Number(e.montant) * (TYPE_SIGN[e.type] ?? 1);
    running += signed;
    return {
      date:    formatDateTime(e.date_entree),
      type:    TYPE_LABEL[e.type] ?? 'Sortie' as CashMovement['type'],
      label:   e.description || e.reference,
      montant: signed,
      solde:   running,
    };
  });
  return withBalance.reverse();
}

interface Props {
  onSwitchWorkspace?: () => void;
  onNewSale?: () => void;
  onRequestTransfer?: (sku: string) => void;
  userName?: string;
  userRole?: string;
  shopName?: string;
  refreshRef?: { current: (() => void) | null };
}

export default function BoutiqueDataLoader({
  onSwitchWorkspace,
  onNewSale,
  onRequestTransfer,
  userName,
  userRole,
  shopName,
  refreshRef,
}: Props) {
  const [sales,            setSales]            = useState<Sale[]>([]);
  const [stock,            setStock]            = useState<BoutiqueStock[]>([]);
  const [movements,        setMovements]        = useState<CashMovement[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    ventes_jour_count: 0, ventes_jour_montant: 0, ca_total: 0, factures_payees: 0,
    clients_servis_jour: 0, paiements_jour: [], top_produits_jour: [], stock_alertes: [],
  });
  const [boutiqueConfig, setBoutiqueConfig] = useState<BoutiqueConfig>(buildConfig({}));

  const fetchBoutiqueSettings = useCallback(() => {
    fetch('/api/admin/boutique/settings')
      .then(r => r.json())
      .then((data: Record<string, Partial<StoreState>>) => {
        const merged: Partial<StoreState> = {};
        for (const v of Object.values(data)) Object.assign(merged, v);
        setBoutiqueConfig(buildConfig(merged));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchBoutiqueSettings(); }, [fetchBoutiqueSettings]);

  const fetchFactures = useCallback(() => {
    fetch('/api/admin/ventes/factures?limit=50')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) setSales((d.items as ApiFacture[]).map(mapFacture));
        if (d.stats) setOverviewStats({
          ventes_jour_count:   Number(d.stats.ventes_jour_count   ?? 0),
          ventes_jour_montant: Number(d.stats.ventes_jour_montant ?? 0),
          ca_total:            Number(d.stats.ca_total            ?? 0),
          factures_payees:     Number(d.stats.factures_payees     ?? 0),
          clients_servis_jour: Number(d.stats.clients_servis_jour ?? 0),
          paiements_jour: Array.isArray(d.stats.paiements_jour)
            ? d.stats.paiements_jour.map((p: { mode: ApiPaymentMode; montant: number; pct: number }) => ({
                mode: mapPaymentMode(p.mode), montant: Number(p.montant ?? 0), pct: Number(p.pct ?? 0),
              }))
            : [],
          top_produits_jour: Array.isArray(d.stats.top_produits_jour)
            ? d.stats.top_produits_jour.map((p: { nom: string; qty: number; ca: number }) => ({
                nom: p.nom, qty: Number(p.qty ?? 0), ca: Number(p.ca ?? 0),
              }))
            : [],
          stock_alertes: Array.isArray(d.stats.stock_alertes)
            ? d.stats.stock_alertes.map((s: { nom: string; quantite: number; seuil: number }) => ({
                nom: s.nom, quantite: Number(s.quantite ?? 0), seuil: Number(s.seuil ?? 0),
              }))
            : [],
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchFactures(); }, [fetchFactures]);
  useEffect(() => {
    if (refreshRef) { refreshRef.current = fetchFactures; }
    return () => { if (refreshRef) refreshRef.current = null; };
  }, [refreshRef, fetchFactures]);

  const { subscribe } = useAdminSSE();
  useEffect(() => subscribe((e) => {
    if (e.type === 'vente') fetchFactures();
  }), [subscribe, fetchFactures]);

  const fetchStock = useCallback(() => {
    fetch('/api/admin/stock-boutique')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) setStock((d.items as ApiStockItem[]).map(mapStockItem));
      })
      .catch(() => {});
  }, []);
  useEffect(() => { fetchStock(); }, [fetchStock]);

  useEffect(() => subscribe((e) => {
    if (e.type === 'stock_transfer') fetchStock();
  }), [subscribe, fetchStock]);

  useEffect(() => {
    fetch('/api/admin/finance?limit=50')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) setMovements(mapFinanceEntries(d.items as ApiFinanceEntry[]));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setBoutiqueData({ STOCK: stock }); }, [stock]);
  const uiConfig = useMemo(() => createBoutiqueConfig(), []);

  return (
    <UIProvider config={uiConfig} onNavigate={() => {}}>
      <BoutiqueSettingsProvider cfg={boutiqueConfig} refresh={fetchBoutiqueSettings}>
        <BoutiqueShell
          sales={sales}
          movements={movements}
          overviewStats={overviewStats}
          onSwitchWorkspace={onSwitchWorkspace}
          onNewSale={onNewSale}
          onRequestTransfer={onRequestTransfer}
          userName={userName}
          userRole={userRole}
          shopName={shopName}
        />
      </BoutiqueSettingsProvider>
    </UIProvider>
  );
}
