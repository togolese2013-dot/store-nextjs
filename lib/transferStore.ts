// transferStore.ts
//
// API-backed store for Magasin ⇄ Boutique stock transfer requests.
// Persisted server-side (`transfer_requests` table) — approval executes the
// real stock movement via createStockSortie (backend/routes/admin/transfer-requests.ts).

export type TransferStatus = 'pending' | 'approved' | 'rejected';

export interface TransferRequest {
  id:             string;
  product:        string;
  sku:            string;
  qty:            number;
  from:           string;
  note:           string;
  destination:    string;
  requestedBy:    string;
  status:         TransferStatus;
  createdAt:      number;
  timeLabel:      string;
  resolvedAt?:    number;
  resolvedLabel?: string;
}

export interface CreateTransferInput {
  produit_id: number;
  product:    string;
  sku?:       string;
  qty:        number | string;
  from?:      string;
  note?:      string;
}

interface ApiTransferRequest {
  id:            number;
  produit_nom:   string;
  reference_sku: string | null;
  quantite:      number;
  note:          string | null;
  requested_by:  string | null;
  status:        TransferStatus;
  created_at:    string;
  resolved_at:   string | null;
}

const MOIS = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

function fmtLabel(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MOIS[d.getMonth()]}, ${hh}h${mm}`;
}

function mapRequest(r: ApiTransferRequest): TransferRequest {
  return {
    id:            'TR-' + r.id,
    product:       r.produit_nom,
    sku:           r.reference_sku || '—',
    qty:           r.quantite,
    from:          'Magasin',
    note:          r.note ?? '',
    destination:   'Boutique',
    requestedBy:   r.requested_by ?? 'Boutique',
    status:        r.status,
    createdAt:     new Date(r.created_at).getTime(),
    timeLabel:     fmtLabel(r.created_at),
    resolvedAt:    r.resolved_at ? new Date(r.resolved_at).getTime() : undefined,
    resolvedLabel: r.resolved_at ? fmtLabel(r.resolved_at) : undefined,
  };
}

export const TransferStore = {
  async byStatus(status: TransferStatus): Promise<TransferRequest[]> {
    const res = await fetch(`/api/admin/transfer-requests?status=${status}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.requests) ? (data.requests as ApiTransferRequest[]).map(mapRequest) : [];
  },

  pending(): Promise<TransferRequest[]> {
    return TransferStore.byStatus('pending');
  },

  async request(data: CreateTransferInput): Promise<TransferRequest> {
    const res = await fetch('/api/admin/transfer-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produit_id:    data.produit_id,
        produit_nom:   data.product || 'Produit',
        reference_sku: data.sku ?? null,
        quantite:      Math.abs(parseInt(String(data.qty), 10)) || 1,
        note:          data.note ?? '',
      }),
    });
    const created = await res.json();
    if (!res.ok) throw new Error(created.error ?? 'Erreur lors de la demande de transfert.');
    return {
      id:          'TR-' + created.id,
      product:     data.product || 'Produit',
      sku:         data.sku || '—',
      qty:         Math.abs(parseInt(String(data.qty), 10)) || 1,
      from:        data.from || 'Magasin',
      note:        data.note || '',
      destination: 'Boutique',
      requestedBy: 'Boutique',
      status:      'pending',
      createdAt:   Date.now(),
      timeLabel:   fmtLabel(new Date().toISOString()),
    };
  },

  async approve(id: string): Promise<TransferRequest | null> {
    const numId = id.replace(/^TR-/, '');
    const res = await fetch(`/api/admin/transfer-requests/${numId}/approve`, { method: 'POST' });
    if (!res.ok) return null;
    const list = await TransferStore.byStatus('approved');
    return list.find(r => r.id === id) ?? null;
  },

  async reject(id: string): Promise<TransferRequest | null> {
    const numId = id.replace(/^TR-/, '');
    const res = await fetch(`/api/admin/transfer-requests/${numId}/reject`, { method: 'POST' });
    if (!res.ok) return null;
    const list = await TransferStore.byStatus('rejected');
    return list.find(r => r.id === id) ?? null;
  },
};
