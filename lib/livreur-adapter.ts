// Bridges existing /api/livreur/* endpoints to the LivreurDashboard API contract.

function initials(nom: string): string {
  return nom.trim().split(/\s+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "L";
}

function encodeId(source: string, id: number): string {
  return `${source}:${id}`;
}

function decodeId(composite: string): { source: string; id: number } {
  const [source, idStr] = composite.split(":");
  return { source: source || "order", id: Number(idStr) };
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

// Tracks delivery step index client-side (0=pickup, 1=enroute, 2=arrived).
const stepMap = new Map<string, number>();

export const realAdapter = {
  async getDriver() {
    const [profile, stats] = await Promise.all([
      fetch("/api/livreur/profile", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
      fetch("/api/livreur/stats",   { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    return {
      id:              `LV-${String(profile?.id ?? "").slice(-4).padStart(4, "0")}`,
      name:            profile?.nom ?? "Livreur",
      vehicle:         profile?.numero_plaque ?? profile?.poste ?? "—",
      avatar:          initials(profile?.nom ?? "L"),
      rating:          Number(((stats?.tauxReussite ?? 0) / 20).toFixed(1)),
      deliveriesTotal: stats?.total ?? 0,
    };
  },

  async getShop() {
    return { name: "Togolese Shop", address: "Lomé, Togo" };
  },

  async getStats() {
    const s = await fetch("/api/livreur/stats", { credentials: "include" }).then(r => r.json()).catch(() => ({}));
    return {
      deliveries:    s?.today         ?? 0,
      earnings:      s?.gainToday     ?? 0,
      tips:          0,
      successRate:   s?.tauxReussite  ?? 0,
      weekDeliveries: s?.week         ?? 0,
    };
  },

  async listAvailable() {
    const res = await fetch("/api/livreur/orders/available", { credentials: "include" }).then(r => r.json()).catch(() => ({}));
    const items: any[] = res?.data ?? [];
    return items.map(o => ({
      id:       encodeId(o.source, o.id),
      client:   o.nom || "Client",
      address:  [o.adresse, o.zone_livraison].filter(Boolean).join(" · "),
      distance: 0,
      eta:      0,
      amount:   o.total ?? 0,
      tip:      o.delivery_fee ?? 0,
      payment:  "Espèces",
      items:    [],
      note:     o.lien_localisation ? `📍 Localisation disponible` : undefined,
      placedAt: timeAgo(o.created_at),
    }));
  },

  async getOngoing() {
    const res = await fetch("/api/livreur/orders/mine", { credentials: "include" }).then(r => r.json()).catch(() => ({}));
    const mine: any[] = res?.data ?? [];
    if (!mine.length) return null;
    const o   = mine[0];
    const id  = encodeId(o.source, o.id);
    if (!stepMap.has(id)) stepMap.set(id, 0);
    const idx   = stepMap.get(id) ?? 0;
    const steps = ["pickup", "enroute", "arrived"] as const;
    return {
      id,
      client:   o.nom || "Client",
      address:  [o.adresse, o.zone_livraison].filter(Boolean).join(" · "),
      distance: 0,
      eta:      0,
      amount:   o.total ?? 0,
      tip:      o.delivery_fee ?? 0,
      payment:  "Espèces",
      items:    [],
      step:     steps[idx],
    };
  },

  async listHistory() {
    const res = await fetch("/api/livreur/orders/history?limit=30", { credentials: "include" }).then(r => r.json()).catch(() => ({}));
    const items: any[] = res?.data ?? [];
    return items.map(o => ({
      id:      encodeId(o.source, o.id),
      date:    new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      client:  o.nom || "Client",
      address: o.adresse ?? "",
      amount:  o.delivery_fee ?? o.total ?? 0,
      status:  o.livraison_statut === "livre" ? "Livrée" : o.livraison_statut === "echec" ? "Refusée" : "Livrée",
    }));
  },

  async setOnline(_online: boolean) {
    // No backend endpoint for online toggle — handled client-side only.
  },

  async accept(compositeId: string) {
    const { source, id } = decodeId(compositeId);
    const src = source === "livraison" ? "?src=livraison" : "";
    const res = await fetch(`/api/livreur/orders/${id}/accept${src}`, { method: "PATCH", credentials: "include" });
    if (!res.ok) throw new Error("Erreur lors de l'acceptation");
    stepMap.set(compositeId, 0);
    return { id: compositeId, client: "", address: "", distance: 0, eta: 0, amount: 0, tip: 0, payment: "Espèces", items: [], step: "pickup" as const };
  },

  async advance(compositeId: string) {
    const stepIdx = stepMap.get(compositeId) ?? 0;
    if (stepIdx >= 2) {
      // Last step (arrived) → deliver
      const { source, id } = decodeId(compositeId);
      const src = source === "livraison" ? "?src=livraison" : "";
      await fetch(`/api/livreur/orders/${id}/deliver${src}`, { method: "PATCH", credentials: "include" }).catch(() => {});
      stepMap.delete(compositeId);
      return null;
    }
    stepMap.set(compositeId, stepIdx + 1);
    return null;
  },

  async call(_compositeId: string) {
    // Phone call is handled via the tel: link on the delivery card.
  },
};
