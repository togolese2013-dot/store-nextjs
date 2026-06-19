// transferStore.ts
//
// Framework-agnostic store — keeps Boutique and Magasin in sync via localStorage.
// Cross-tab sync via the `storage` event.
//
// TO REPLACE IN PRODUCTION:
//   request()  -> POST /api/admin/transfer-requests
//   approve()  -> POST /api/admin/transfer-requests/:id/approve  (server creates movement)
//   reject()   -> POST /api/admin/transfer-requests/:id/reject
//   pending()  -> GET  /api/admin/transfer-requests?status=pending

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

export interface StockMovement {
  date:     string;
  product:  string;
  sku:      string;
  type:     string;
  qty:      number;
  from:     string;
  to:       string;
  auto?:    boolean;
  reqId?:   string;
}

export interface CreateTransferInput {
  product:  string;
  sku?:     string;
  qty:      number | string;
  from?:    string;
  note?:    string;
}

const REQ_KEY  = 'shopsaas_transfer_requests';
const MOV_KEY  = 'shopsaas_boutique_movements';
const SEQ_KEY  = 'shopsaas_transfer_seq';
export const TRANSFER_EVENT = 'shopsaas-transfer-change';

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; }
  catch { return []; }
}

function write<T>(key: string, val: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(val));
  emit();
}

function emit(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TRANSFER_EVENT));
}

const MOIS = ['jan','fév','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];

function nowLabel(): string {
  const d  = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MOIS[d.getMonth()]}, ${hh}h${mm}`;
}

// cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === REQ_KEY || e.key === MOV_KEY) emit();
  });
}

export const TransferStore = {
  requests:  (): TransferRequest[]  => read<TransferRequest>(REQ_KEY),
  pending:   (): TransferRequest[]  => read<TransferRequest>(REQ_KEY).filter(r => r.status === 'pending'),
  byStatus:  (s: TransferStatus)    => read<TransferRequest>(REQ_KEY).filter(r => r.status === s),
  movements: (): StockMovement[]    => read<StockMovement>(MOV_KEY),

  request(data: CreateTransferInput): TransferRequest {
    const list = read<TransferRequest>(REQ_KEY);
    const n    = (parseInt(localStorage.getItem(SEQ_KEY) || '1240', 10)) + 1;
    localStorage.setItem(SEQ_KEY, String(n));
    const rec: TransferRequest = {
      id:          'TR-' + n,
      product:     data.product || 'Produit',
      sku:         data.sku || '—',
      qty:         Math.abs(parseInt(String(data.qty), 10)) || 1,
      from:        data.from || 'Lomé Central',
      note:        data.note || '',
      destination: 'Boutique',
      requestedBy: 'Boutique',
      status:      'pending',
      createdAt:   Date.now(),
      timeLabel:   nowLabel(),
    };
    list.unshift(rec);
    write(REQ_KEY, list);
    return rec;
  },

  approve(id: string): TransferRequest | null {
    const list = read<TransferRequest>(REQ_KEY);
    const r    = list.find(x => x.id === id);
    if (!r || r.status !== 'pending') return null;
    r.status       = 'approved';
    r.resolvedAt   = Date.now();
    r.resolvedLabel = nowLabel();
    write(REQ_KEY, list);

    const movs = read<StockMovement>(MOV_KEY);
    movs.unshift({
      date:    nowLabel(),
      product: r.product,
      sku:     r.sku,
      type:    'Sortie',
      qty:     -r.qty,
      from:    r.from,
      to:      'Boutique',
      auto:    true,
      reqId:   r.id,
    });
    write(MOV_KEY, movs);
    return r;
  },

  reject(id: string): TransferRequest | null {
    const list = read<TransferRequest>(REQ_KEY);
    const r    = list.find(x => x.id === id);
    if (!r || r.status !== 'pending') return null;
    r.status        = 'rejected';
    r.resolvedAt    = Date.now();
    r.resolvedLabel = nowLabel();
    write(REQ_KEY, list);
    return r;
  },

  subscribe(cb: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(TRANSFER_EVENT, cb);
    return () => window.removeEventListener(TRANSFER_EVENT, cb);
  },

  reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REQ_KEY);
    localStorage.removeItem(MOV_KEY);
    emit();
  },
};
