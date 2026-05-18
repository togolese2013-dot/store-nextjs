// api.js — contrat de l'API et adaptateur par défaut (mock).
//
// Le composant ne dépend QUE de cet objet `api`. Pour brancher votre
// back-office, écrivez un adaptateur qui implémente les méthodes ci-dessous
// puis enveloppez-le avec `createApi(adapter)`.
//
// Voir le README pour un exemple.

/**
 * @typedef {Object} Driver
 * @property {string} id          ex. "LV-0427"
 * @property {string} name        ex. "Komla A."
 * @property {string} vehicle     ex. "Scooter · KP-2284"
 * @property {string} avatar      2-3 caractères, ex. "KA"
 * @property {number} rating      0..5
 * @property {number} deliveriesTotal
 */

/**
 * @typedef {Object} Shop
 * @property {string} name
 * @property {string} address
 */

/**
 * @typedef {Object} DeliveryItem
 * @property {number} qty
 * @property {string} name
 */

/**
 * @typedef {Object} Delivery
 * @property {string} id
 * @property {string} client
 * @property {string} address
 * @property {number} distance       en km
 * @property {number} eta            en minutes
 * @property {number} amount         total à percevoir, en F CFA
 * @property {number} tip            pourboire potentiel
 * @property {"Espèces"|"TMoney"|"Flooz"|"Carte"|string} payment
 * @property {DeliveryItem[]} items
 * @property {string} [note]
 * @property {string} [placedAt]     ex. "il y a 2 min"
 * @property {"pickup"|"enroute"|"arrived"} [step]  uniquement pour la course en cours
 */

/**
 * @typedef {Object} TodayStats
 * @property {number} deliveries
 * @property {number} earnings
 * @property {number} tips
 * @property {number} successRate
 * @property {number} weekDeliveries
 */

/**
 * @typedef {Object} HistoryItem
 * @property {string} id
 * @property {string} date
 * @property {string} client
 * @property {string} address
 * @property {number} amount
 * @property {"Livrée"|"Refusée"|"Annulée"|string} status
 */

/**
 * @typedef {Object} Adapter
 * @property {() => Promise<Driver>}            getDriver
 * @property {() => Promise<Shop>}              getShop
 * @property {() => Promise<TodayStats>}        getStats
 * @property {() => Promise<Delivery[]>}        listAvailable
 * @property {() => Promise<Delivery|null>}     getOngoing
 * @property {() => Promise<HistoryItem[]>}     listHistory
 * @property {(online: boolean) => Promise<void>} setOnline
 * @property {(deliveryId: string) => Promise<Delivery>}        accept
 * @property {(deliveryId: string) => Promise<Delivery|null>}   advance
 * @property {(deliveryId: string) => Promise<void>}            call
 */

/**
 * Valide un adaptateur et renvoie un objet api typé.
 * @param {Adapter} adapter
 * @returns {Adapter}
 */
export function createApi(adapter) {
  const required = [
    "getDriver", "getShop", "getStats", "listAvailable", "getOngoing",
    "listHistory", "setOnline", "accept", "advance", "call",
  ];
  for (const m of required) {
    if (typeof adapter?.[m] !== "function") {
      throw new Error(`[livreur-app] adapter is missing required method "${m}"`);
    }
  }
  return adapter;
}

// ─── Adaptateur mock — utile pour la preview / les tests ────────────────────
// Branche par défaut si vous montez le composant sans passer d'api={...}.

const MOCK = {
  driver: {
    id: "LV-0427", name: "Komla A.", vehicle: "Scooter · KP-2284",
    avatar: "KA", rating: 4.9, deliveriesTotal: 312,
  },
  shop: { name: "Togolese Shop", address: "12 av. de la Libération, Lomé" },
  available: [
    {
      id: "TS-7842", client: "Adjoa Mensah",
      address: "Quartier Bè · Rue 42, Lomé",
      distance: 2.1, eta: 12, amount: 8500, tip: 500, payment: "Espèces",
      items: [{ qty: 1, name: "Pagne Wax 6 yards" }, { qty: 2, name: "Foulards en bazin" }],
      note: "Sonner deux fois — portail bleu", placedAt: "il y a 2 min",
    },
    {
      id: "TS-7843", client: "Yao K.",
      address: "Tokoin Hôpital · Imm. Akato",
      distance: 3.6, eta: 18, amount: 14200, tip: 0, payment: "TMoney",
      items: [{ qty: 1, name: "Set bijoux argent" }, { qty: 1, name: "Sac cuir tressé" }],
      placedAt: "il y a 5 min",
    },
    {
      id: "TS-7844", client: "Sika A.",
      address: "Agoè Cacavéli · derrière la pharmacie",
      distance: 5.4, eta: 24, amount: 6300, tip: 1000, payment: "Flooz",
      items: [{ qty: 3, name: "Savons noirs artisanaux" }, { qty: 1, name: "Beurre de karité 250g" }],
      note: "Appeler en arrivant", placedAt: "il y a 7 min",
    },
  ],
  stats: { deliveries: 4, earnings: 9200, tips: 1500, successRate: 98, weekDeliveries: 23 },
  history: [
    { id: "TS-7821", date: "Aujourd’hui · 11:42", client: "Ama D.",     address: "Hédzranawoé", amount: 4800,  status: "Livrée" },
    { id: "TS-7820", date: "Aujourd’hui · 10:18", client: "Bénédicte",  address: "Adidogomé",   amount: 12300, status: "Livrée" },
    { id: "TS-7815", date: "Aujourd’hui · 09:05", client: "Mawuli",     address: "Nyékonakpoè", amount: 7500,  status: "Livrée" },
    { id: "TS-7799", date: "Hier · 17:22",        client: "Kossi",      address: "Tokoin",      amount: 5200,  status: "Livrée" },
    { id: "TS-7798", date: "Hier · 14:40",        client: "Edem",       address: "Bè",          amount: 9800,  status: "Refusée" },
  ],
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** @type {Adapter} */
export const mockAdapter = {
  async getDriver()      { await delay(80);  return { ...MOCK.driver }; },
  async getShop()        { await delay(40);  return { ...MOCK.shop }; },
  async getStats()       { await delay(120); return { ...MOCK.stats }; },
  async listAvailable()  { await delay(220); return MOCK.available.map((d) => ({ ...d })); },
  async getOngoing()     { await delay(40);  return null; },
  async listHistory()    { await delay(120); return MOCK.history.map((h) => ({ ...h })); },

  async setOnline(_)     { await delay(80); },
  async accept(id) {
    await delay(200);
    const found = MOCK.available.find((d) => d.id === id);
    if (!found) throw new Error("delivery not found");
    return { ...found, step: "pickup" };
  },
  async advance(id) {
    await delay(150);
    return { id, step: "enroute" }; /* le hook gère la séquence d'étapes côté UI */
  },
  async call(_id)        { await delay(60); },
};

export const mockApi = createApi(mockAdapter);
