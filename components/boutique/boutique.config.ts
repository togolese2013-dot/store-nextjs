/* ============================================================
   Boutique AppConfig — connects the interaction layer's shared
   notification bell to real Boutique data.
   ============================================================ */
import type { AppConfig, NotifItem } from "@/components/interaction-layer";

/* Shared live-data store — updated by setBoutiqueData() from the DataLoader */
let _data: Record<string, any> = { STOCK: [] };

export function setBoutiqueData(d: Record<string, any>) {
  _data = { ..._data, ...d };
}

export function createBoutiqueConfig(): AppConfig {
  return {
    name: "Boutique",

    notifs: (): NotifItem[] => {
      const ruptures = (_data.STOCK ?? []).filter((s: any) => Number(s.boutique) === 0);
      return ruptures.map((s: any) => ({
        dot:  "var(--danger)",
        t:    `Rupture de stock — ${s.name}`,
        d:    "Stock boutique à 0. Réapprovisionnement requis.",
        time: "",
      }));
    },
  };
}
