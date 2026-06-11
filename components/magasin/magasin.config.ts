/* ============================================================
   Magasin AppConfig — connects the interaction layer to real APIs.
   Pass the result of createMagasinConfig() to <UIProvider config={...}>.
   ============================================================ */
import type { AppConfig } from "@/components/interaction-layer";

interface MagasinConfigOpts {
  /** Called after successful form submit — use to refresh product list */
  onRefresh?: () => void;
}

/* Shared live-data store — updated by setMagasinData() from the DataLoader */
let _data: Record<string, any> = { PRODUCTS: [], CATEGORIES: [], BRANDS: [], SUPPLIERS: [], WAREHOUSES: [] };

export function setMagasinData(d: Record<string, any>) {
  _data = { ..._data, ...d };
}

export function createMagasinConfig({ onRefresh }: MagasinConfigOpts = {}): AppConfig {
  return {
    name: "Magasin",
    data: () => _data,

    schemas: () => {
      const cats      = (_data.CATEGORIES  ?? []).map((c: any) => c.name ?? c.nom ?? "");
      const brands    = (_data.BRANDS      ?? []).map((b: any) => b.name ?? b.nom ?? "");
      const suppliers = (_data.SUPPLIERS   ?? []).map((s: any) => s.name ?? s.nom ?? "");
      const warehouses= (_data.WAREHOUSES  ?? []).map((w: any) => w.name ?? w.nom ?? "");
      const prods     = (_data.PRODUCTS    ?? []).map((p: any) => p.name ?? p.nom ?? "");
      const countries = ["Togo", "Sénégal", "Côte d'Ivoire", "Ghana", "Mali", "Burkina Faso", "Bénin", "Niger"];

      return {
        product: {
          label: "produit", title: "produit", eyebrow: "Catalogue",
          fields: [
            { k: "name",     l: "Nom du produit",     t: "text",     ph: "Micro boya MM1", full: true },
            { k: "sku",      l: "SKU / Référence",     t: "text",     mono: true, ph: "PROD-001" },
            { k: "status",   l: "Statut",              t: "seg",      options: ["Actif", "Brouillon", "Rupture"] },
            { k: "cat",      l: "Catégorie",           t: "select",   options: cats },
            { k: "brand",    l: "Marque",              t: "select",   options: brands },
            { k: "price",    l: "Prix de vente (FCFA)",t: "price" },
            { k: "cost",     l: "Prix d'achat (FCFA)", t: "price" },
            { k: "stock",    l: "Stock actuel",        t: "number" },
            { k: "target",   l: "Stock cible",         t: "number" },
            { k: "supplier", l: "Fournisseur",         t: "select",   options: suppliers, full: true },
            { k: "image",    l: "Visuel produit",      t: "image",    full: true },
            { k: "desc",     l: "Description",         t: "textarea", ph: "Notes internes, composition…", full: true },
          ],
        },
        category: {
          label: "catégorie", title: "catégorie", eyebrow: "Classement",
          fields: [
            { k: "name",   l: "Nom de la catégorie", t: "text",   ph: "Électronique", full: true },
            { k: "parent", l: "Catégorie parente",   t: "select", options: ["— Aucune (racine)", ...cats] },
            { k: "color",  l: "Couleur",             t: "color",  full: true },
            { k: "desc",   l: "Description",         t: "textarea", full: true },
          ],
        },
        brand: {
          label: "marque", title: "marque", eyebrow: "Référencement",
          fields: [
            { k: "name",    l: "Nom de la marque", t: "text",   ph: "Samsung", full: true },
            { k: "country", l: "Pays d'origine",   t: "select", options: countries },
            { k: "status",  l: "Statut",           t: "seg",    options: ["Actif", "Inactif"] },
            { k: "email",   l: "Email contact",    t: "text",   ph: "contact@marque.com" },
            { k: "phone",   l: "Téléphone",        t: "text",   ph: "+228 …" },
            { k: "logo",    l: "Logo",             t: "image",  full: true },
            { k: "desc",    l: "Présentation",     t: "textarea", full: true },
          ],
        },
        supplier: {
          label: "fournisseur", title: "fournisseur", eyebrow: "Approvisionnement",
          fields: [
            { k: "name",    l: "Nom du fournisseur",     t: "text",   ph: "Lomé Négoce", full: true },
            { k: "country", l: "Pays",                   t: "select", options: countries },
            { k: "status",  l: "Statut",                 t: "seg",    options: ["Actif", "Inactif"] },
            { k: "email",   l: "Email",                  t: "text",   ph: "commande@fournisseur.com" },
            { k: "phone",   l: "Téléphone",              t: "text",   ph: "+228 …" },
            { k: "delay",   l: "Délai livraison (jours)",t: "number" },
            { k: "terms",   l: "Conditions",             t: "select", options: ["Comptant", "30 jours", "60 jours", "90 jours"] },
            { k: "notes",   l: "Notes",                  t: "textarea", full: true },
          ],
        },
        po: {
          label: "bon d'achat", title: "bon d'achat", eyebrow: "Approvisionnement",
          fields: [
            { k: "supplier",  l: "Fournisseur",          t: "select", options: suppliers, full: true },
            { k: "date",      l: "Date prévue",           t: "text",   ph: "30 juin 2026" },
            { k: "warehouse", l: "Entrepôt destination", t: "select", options: warehouses },
            { k: "lines",     l: "Produits commandés",   t: "lines",  full: true },
            { k: "notes",     l: "Instructions",         t: "textarea", full: true },
          ],
        },
        warehouse: {
          label: "entrepôt", title: "entrepôt", eyebrow: "Logistique",
          fields: [
            { k: "name",     l: "Nom de l'entrepôt", t: "text",   ph: "Lomé Central", full: true },
            { k: "location", l: "Localisation",      t: "text",   ph: "Adidogomé, Lomé", full: true },
            { k: "capacity", l: "Capacité (unités)", t: "number" },
            { k: "manager",  l: "Responsable",       t: "text",   ph: "K. Diallo" },
            { k: "color",    l: "Couleur repère",    t: "color",  full: true },
          ],
        },
        adjustment: {
          label: "ajustement", title: "ajustement", eyebrow: "Stock",
          fields: [
            { k: "product",   l: "Produit",    t: "select", options: prods, full: true },
            { k: "type",      l: "Type",       t: "seg",    options: ["Entrée", "Sortie", "Transfert"] },
            { k: "qty",       l: "Quantité",   t: "number" },
            { k: "warehouse", l: "Entrepôt",   t: "select", options: warehouses },
            { k: "reason",    l: "Raison",     t: "select", options: ["Réception fournisseur", "Casse / détérioré", "Ajustement inventaire", "Transfert entrepôt", "Vente comptoir", "Retour client"] },
            { k: "note",      l: "Commentaire",t: "textarea", full: true },
          ],
        },
        alert: {
          label: "alerte", title: "alerte", eyebrow: "Stock",
          fields: [
            { k: "name",       l: "Nom de la règle",          t: "text",     ph: "Stock critique Bissap", full: true },
            { k: "targetType", l: "Cibler",                   t: "seg",      options: ["Produit", "Catégorie"] },
            { k: "target",     l: "Cible",                    t: "select",   options: [...prods, ...cats] },
            { k: "threshold",  l: "Seuil de déclenchement",   t: "number" },
            { k: "channels",   l: "Canaux de notification",   t: "channels", full: true },
            { k: "active",     l: "Activer immédiatement",    t: "toggle",   full: true },
          ],
        },
      };
    },

    detailLabels: {
      product: "produit", supplier: "fournisseur", brand: "marque",
      category: "catégorie", warehouse: "entrepôt", po: "bon d'achat",
      variant: "groupe", alert: "alerte", adjustment: "ajustement",
    },

    rowLabels: {
      product: "le produit", supplier: "le fournisseur", brand: "la marque",
      category: "la catégorie", warehouse: "l'entrepôt", po: "le bon d'achat",
      variant: "le groupe", alert: "l'alerte", adjustment: "l'ajustement",
    },

    paletteNav: [
      { l: "Vue d'ensemble",  pg: "overview",    ic: "box" },
      { l: "Produits",        pg: "products",    ic: "box" },
      { l: "Catégories",      pg: "categories",  ic: "folder" },
      { l: "Marques",         pg: "brands",      ic: "box" },
      { l: "Variantes",       pg: "variantes",   ic: "box" },
      { l: "Fournisseurs",    pg: "fournisseurs",ic: "box" },
      { l: "Bons d'achat",    pg: "bons-achat",  ic: "file" },
      { l: "Entrepôts",       pg: "entrepots",   ic: "box" },
      { l: "Ajustements",     pg: "ajustements", ic: "adj" },
      { l: "Mouvements",      pg: "mouvements",  ic: "box" },
      { l: "Alertes stock",   pg: "alertes",     ic: "alert" },
    ],

    paletteActions: (ui) => [
      { l: "Créer un produit",           ic: "plus",     run: () => ui.openForm("product") },
      { l: "Créer un bon d'achat",       ic: "plus",     run: () => ui.openForm("po") },
      { l: "Nouvel ajustement de stock", ic: "adj",      run: () => ui.openForm("adjustment") },
      { l: "Exporter le catalogue",      ic: "download", run: () => ui.openExport("Produits") },
      { l: "Importer des produits",      ic: "upload",   run: () => ui.openImport("Produits") },
      { l: "Suggestions IA",             ic: "sparkles", run: () => ui.openAI() },
    ],

    searchGroup: (ui) => ({
      title: "Produits",
      items: (_data.PRODUCTS ?? []).slice(0, 20).map((p: any) => ({
        label: p.name ?? p.nom ?? "",
        sub: p.sku ?? p.reference ?? "",
        icon: "box" as const,
        onClick: () => ui.openDetail("product", p),
      })),
    }),

    filters: [
      { t: "Statut",          opts: ["Actif", "Brouillon", "Rupture", "Archivé"] },
      { t: "Niveau de stock", opts: ["En stock", "Stock bas", "Rupture"] },
    ],

    /* ── Real API callbacks ── */

    onSubmit: async (kind, mode, values) => {
      if (kind === "product") {
        const body: Record<string, any> = {
          nom:            values.name,
          reference:      values.sku,
          prix_unitaire:  Number(values.price) || 0,
          stock_magasin:  Number(values.stock) || 0,
          actif:          values.status === "Actif" ? 1 : 0,
        };
        if (mode === "edit" && values._raw?.id) {
          await fetch(`/api/admin/products/${values._raw.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        onRefresh?.();
      }
      /* category, brand, supplier, warehouse: extend here as APIs are ready */
    },

    onDeleteRow: async (kind, row) => {
      if (kind === "product" && row.id) {
        await fetch(`/api/admin/products/${row.id}`, { method: "DELETE" });
        onRefresh?.();
      }
    },

    onArchiveRow: async (kind, row) => {
      if (kind === "product" && row.id) {
        const newActif = row.status === "Archivé" ? 1 : 0;
        await fetch(`/api/admin/products/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actif: newActif }),
        });
        onRefresh?.();
      }
    },
  };
}
