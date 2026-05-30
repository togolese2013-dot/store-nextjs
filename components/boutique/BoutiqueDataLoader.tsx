'use client';

import { useEffect, useState } from 'react';
import BoutiqueShell from './BoutiqueShell';
import type { Sale, BoutiqueStock, CashMovement, BoutiqueClient } from './types';

const SWATCHES = [
  '#3B6A8F', '#2D6A4F', '#7A2C3A', '#D4A437', '#B8501A',
  '#5C4A88', '#1F3D6E', '#C9601E', '#5A3520', '#1F1612',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '';
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
      ', ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch { return dateStr; }
}

type ApiPaymentMode = 'especes' | 'moov_money' | 'tmoney' | 'virement_bancaire' | 'wave' | null;

function mapPaymentMode(mode: ApiPaymentMode): Sale['payment'] {
  const map: Record<string, Sale['payment']> = {
    especes:         'Espèces',
    moov_money:      'Orange M.',
    tmoney:          'Orange M.',
    virement_bancaire: 'Carte',
    wave:            'Wave',
  };
  return mode ? (map[mode] ?? 'Espèces') : 'Espèces';
}

interface ApiFacture {
  reference: string;
  client_nom: string | null;
  items: string;
  total: number;
  mode_paiement: ApiPaymentMode;
  created_at: string;
}

interface ApiStockItem {
  produit_id: number;
  nom: string;
  reference: string;
  categorie_nom: string;
  quantite: number;
  seuil_alerte: number;
}

interface ApiFinanceEntry {
  reference: string;
  type: 'caisse' | 'depense' | 'rentree' | 'vente' | 'transfert';
  description: string | null;
  montant: number;
  date_entree: string;
}

interface ApiBoutiqueClient {
  id: number;
  nom: string;
  telephone: string | null;
  type_client: 'particulier' | 'professionnel';
  solde: number;
  created_at: string;
}

function mapFacture(f: ApiFacture): Sale {
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
    id:       f.reference,
    client:   name,
    init:     isAnon ? '' : initials(name),
    color:    isAnon ? '#8A8278' : SWATCHES[hashStr(name) % SWATCHES.length],
    time:     formatTime(f.created_at),
    products: Array.isArray(parsed) ? parsed.length : 0,
    amount:   Number(f.total),
    payment:  mapPaymentMode(f.mode_paiement),
    items:    itemNames || '—',
  };
}

function mapStockItem(item: ApiStockItem, idx: number): BoutiqueStock {
  return {
    sku:      item.reference || `PRD-${item.produit_id}`,
    name:     item.nom,
    cat:      item.categorie_nom || '—',
    boutique: Number(item.quantite),
    seuil:    Number(item.seuil_alerte) || 5,
    swatch:   SWATCHES[hashStr(item.nom ?? String(idx)) % SWATCHES.length],
    init:     (item.nom?.[0] ?? 'P').toUpperCase(),
  };
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

function mapBoutiqueClient(c: ApiBoutiqueClient): BoutiqueClient {
  const abs = Math.abs(Number(c.solde));
  let status: BoutiqueClient['status'] = 'Nouveau';
  if (c.type_client === 'professionnel' || abs > 100000) status = 'VIP';
  else if (abs > 50000) status = 'Fidèle';
  else if (abs > 10000) status = 'Régulier';

  return {
    name:   c.nom,
    init:   initials(c.nom),
    color:  SWATCHES[hashStr(c.nom) % SWATCHES.length],
    visits: 0,
    last:   new Date(c.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
    total:  abs,
    status,
  };
}

interface Props {
  onSwitchWorkspace?: () => void;
  onNewSale?: () => void;
  userName?: string;
  userRole?: string;
  shopName?: string;
}

export default function BoutiqueDataLoader({
  onSwitchWorkspace,
  onNewSale,
  userName,
  userRole,
  shopName,
}: Props) {
  const [sales,     setSales]     = useState<Sale[]>([]);
  const [stock,     setStock]     = useState<BoutiqueStock[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [clients,   setClients]   = useState<BoutiqueClient[]>([]);

  useEffect(() => {
    fetch('/api/admin/ventes/factures?limit=50')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) setSales((d.items as ApiFacture[]).map(mapFacture));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/stock-boutique')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) setStock((d.items as ApiStockItem[]).map(mapStockItem));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/finance?limit=50')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) setMovements(mapFinanceEntries(d.items as ApiFinanceEntry[]));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/boutique-clients?limit=30')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.data)) setClients((d.data as ApiBoutiqueClient[]).map(mapBoutiqueClient));
      })
      .catch(() => {});
  }, []);

  return (
    <BoutiqueShell
      sales={sales}
      stock={stock}
      movements={movements}
      clients={clients}
      onSwitchWorkspace={onSwitchWorkspace}
      onNewSale={onNewSale}
      userName={userName}
      userRole={userRole}
      shopName={shopName}
    />
  );
}
