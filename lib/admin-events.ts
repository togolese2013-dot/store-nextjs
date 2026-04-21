import "server-only";
import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var __adminEmitter: EventEmitter | undefined;
}

// Singleton shared across all API route modules in the same Node.js process
export const adminEmitter: EventEmitter =
  globalThis.__adminEmitter ??
  (globalThis.__adminEmitter = new EventEmitter().setMaxListeners(200));

export type AdminEventType =
  | "stock"
  | "achat"
  | "vente"
  | "commande"
  | "produit"
  | "finance"
  | "livraison";

export function emitAdminEvent(type: AdminEventType) {
  adminEmitter.emit("admin", { type, ts: Date.now() });
}
