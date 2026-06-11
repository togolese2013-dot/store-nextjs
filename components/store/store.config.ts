/* ============================================================
   Store AppConfig — connects the interaction layer to real APIs.
   ============================================================ */
import type { AppConfig } from "@/components/interaction-layer";

interface StoreConfigOpts {
  onRefresh?: () => void;
}

let _data: Record<string, any> = { ORDERS: [], COUPONS: [], ZONES: [] };

export function setStoreData(d: Record<string, any>) {
  _data = { ..._data, ...d };
}

const STATUS_FR_TO_API: Record<string, string> = {
  "En attente": "pending",
  "Confirmée": "confirmed",
  "Expédiée": "shipped",
  "Livrée": "delivered",
  "Annulée": "cancelled",
};

export function createStoreConfig({ onRefresh }: StoreConfigOpts = {}): AppConfig {
  return {
    name: "Store",
    data: () => _data,

    schemas: () => {
      const zones  = (_data.ZONES  ?? []).map((z: any) => z.name ?? z.nom ?? "");
      const coupons= (_data.COUPONS ?? []).map((c: any) => c.code ?? "");

      return {
        order: {
          label: "commande", title: "commande", eyebrow: "Commandes",
          fields: [
            { k: "client",    l: "Nom client",   t: "text",   ph: "Amara Diallo", full: true },
            { k: "telephone", l: "Téléphone",    t: "text",   ph: "+228 90 …" },
            { k: "status",    l: "Statut",       t: "seg",    options: ["En attente", "Confirmée", "Expédiée", "Livrée", "Annulée"] },
            { k: "zone",      l: "Zone livraison",t: "select", options: zones },
            { k: "adresse",   l: "Adresse",      t: "textarea", full: true },
            { k: "coupon",    l: "Code promo",   t: "select", options: ["— Aucun", ...coupons] },
            { k: "notes",     l: "Notes internes",t: "textarea", full: true },
          ],
        },
        coupon: {
          label: "coupon", title: "coupon", eyebrow: "Promotions",
          fields: [
            { k: "code",    l: "Code promo",    t: "text",   ph: "PROMO10",  mono: true, full: true },
            { k: "type",    l: "Type de remise", t: "seg",   options: ["Pourcentage (%)", "Montant fixe (F)"] },
            { k: "valeur",  l: "Valeur",        t: "number" },
            { k: "min",     l: "Commande min (F)",t:"number"},
            { k: "max_uses",l: "Utilisations max",t:"number",ph:"0 = illimité" },
            { k: "expiry",  l: "Expire le",     t: "text",   ph: "31 déc. 2026" },
            { k: "active",  l: "Actif",         t: "toggle", full: true },
          ],
        },
        zone: {
          label: "zone de livraison", title: "zone", eyebrow: "Livraisons",
          fields: [
            { k: "name",     l: "Nom de la zone",  t: "text",   ph: "Lomé centre", full: true },
            { k: "coverage", l: "Couverture",       t: "text",   ph: "Délimitée par le Boulevard…", full: true },
            { k: "price",    l: "Frais (FCFA)",     t: "price" },
            { k: "delay",    l: "Délai estimé",     t: "text",   ph: "J+1" },
            { k: "active",   l: "Zone active",      t: "toggle", full: true },
          ],
        },
      };
    },

    detailLabels: {
      order: "commande", coupon: "coupon", zone: "zone",
    },

    rowLabels: {
      order: "la commande", coupon: "le coupon", zone: "la zone",
    },

    paletteNav: [
      { l: "Vue d'ensemble", pg: "overview",   ic: "box" },
      { l: "Commandes",      pg: "commandes",  ic: "file" },
      { l: "Coupons",        pg: "coupons",    ic: "adj" },
      { l: "Livraisons",     pg: "livraisons", ic: "pin" },
      { l: "Paiements",      pg: "paiements",  ic: "store" },
      { l: "Réglages",       pg: "settings",   ic: "cog" },
    ],

    paletteActions: (ui) => [
      { l: "Voir les commandes",     ic: "file",     run: () => ui.navigate("commandes") },
      { l: "Nouveau coupon promo",   ic: "plus",     run: () => ui.openForm("coupon") },
      { l: "Nouvelle zone livraison",ic: "plus",     run: () => ui.openForm("zone") },
      { l: "Exporter les commandes", ic: "download", run: () => ui.openExport("Commandes") },
      { l: "Suggestions IA",         ic: "sparkles", run: () => ui.openAI() },
    ],

    searchGroup: (ui) => ({
      title: "Commandes",
      items: (_data.ORDERS ?? []).slice(0, 15).map((o: any) => ({
        label: `${o.ref} — ${o.client}`,
        sub: o.status,
        icon: "file" as const,
        onClick: () => ui.openDetail("order", o),
      })),
    }),

    filters: [
      { t: "Statut",   opts: ["En attente", "Confirmée", "Expédiée", "Livrée", "Annulée"] },
      { t: "Paiement", opts: ["Wave", "Orange Money", "Carte", "Espèces"] },
    ],

    /* ── Real API callbacks ── */

    onSubmit: async (kind, mode, values) => {
      if (kind === "order" && values._raw?.ref) {
        const statusApi = STATUS_FR_TO_API[values.status] ?? "pending";
        await fetch(`/api/admin/orders/${values._raw.ref}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusApi }),
        });
        onRefresh?.();
      }
      if (kind === "coupon") {
        const body = {
          code:      values.code,
          type:      values.type?.includes("%") ? "percent" : "fixed",
          valeur:    Number(values.valeur) || 0,
          min_order: Number(values.min) || 0,
          max_uses:  Number(values.max_uses) || 0,
          actif:     values.active ? 1 : 0,
        };
        await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        onRefresh?.();
      }
      if (kind === "zone") {
        const body = {
          nom:        values.name,
          fee:        Number(values.price) || 0,
          actif:      values.active ? 1 : 0,
          prix_libre: 0,
        };
        await fetch("/api/admin/delivery-zones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        onRefresh?.();
      }
    },

    onDeleteRow: async (kind, row) => {
      if (kind === "coupon" && row.id) {
        await fetch(`/api/admin/coupons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.id, _delete: true }),
        });
        onRefresh?.();
      }
      if (kind === "zone" && row.id) {
        await fetch(`/api/admin/delivery-zones/${row.id}`, { method: "DELETE" });
        onRefresh?.();
      }
    },
  };
}
