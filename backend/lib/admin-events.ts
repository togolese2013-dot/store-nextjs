import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var __adminEmitter: EventEmitter | undefined;
}

export const adminEmitter: EventEmitter =
  globalThis.__adminEmitter ??
  (globalThis.__adminEmitter = new EventEmitter().setMaxListeners(200));

export type AdminEventType =
  | "stock" | "achat" | "vente" | "commande" | "produit" | "finance" | "livraison";

export function emitAdminEvent(type: AdminEventType, payload?: Record<string, unknown>) {
  adminEmitter.emit("admin", { type, ts: Date.now(), ...(payload ?? {}) });
}
