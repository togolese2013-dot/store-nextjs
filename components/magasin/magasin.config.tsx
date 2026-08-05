/* ============================================================
   Magasin AppConfig — connects the interaction layer to real APIs.
   Pass the result of createMagasinConfig() to <UIProvider config={...}>.
   ============================================================ */
import type { AppConfig, NotifItem } from "@/components/interaction-layer";
import { ProductExportModal } from "./ProductExportModal";

interface MagasinConfigOpts {
  onRefresh?: () => void;
  onRefreshMeta?: () => void;
  onVariantChange?: () => void;
}

/* Shared live-data store — updated by setMagasinData() from the DataLoader */
let _data: Record<string, any> = { PRODUCTS: [], CATEGORIES: [], BRANDS: [], SUPPLIERS: [] };

export function setMagasinData(d: Record<string, any>) {
  _data = { ..._data, ...d };
}

export function createMagasinConfig({ onRefresh, onRefreshMeta, onVariantChange }: MagasinConfigOpts = {}): AppConfig {
  return {
    name: "Magasin",
    data: () => _data,

    notifs: () => {
      const items: NotifItem[] = [];
      const transfers = (_data.PENDING_TRANSFERS ?? []) as { product: string; qty: number; timeLabel?: string }[];
      for (const t of transfers) {
        items.push({
          dot:  "var(--accent)",
          t:    `Transfert en attente — ${t.product}`,
          d:    `${t.qty} unité${t.qty > 1 ? "s" : ""} demandée${t.qty > 1 ? "s" : ""}`,
          time: t.timeLabel ?? "",
        });
      }
      const ruptures = (_data.PRODUCTS ?? []).filter((p: any) => Number(p.stock) === 0);
      for (const p of ruptures) {
        items.push({
          dot:  "var(--danger)",
          t:    `Rupture de stock — ${p.name ?? p.nom ?? "Produit"}`,
          d:    "Stock à 0. Réapprovisionnement requis.",
          time: "",
        });
      }
      return items;
    },

    renderExportModal: (scope, onClose) => {
      if (scope !== "Produits") return null;
      const categories = (_data.CATEGORIES ?? []).map((c: any) => ({
        id: String(c.id), name: c.name ?? c.nom ?? "", count: Number(c.products ?? 0),
      }));
      return (
        <ProductExportModal
          scope={scope}
          totalCount={Number(_data.TOTAL_COUNT ?? 0)}
          categories={categories}
          onClose={onClose}
          onExport={({ categoryId }) => {
            const qs = categoryId ? `?category=${encodeURIComponent(categoryId)}` : "";
            window.location.href = `/api/admin/products/export${qs}`;
          }}
        />
      );
    },

    schemas: () => {
      const cats      = (_data.CATEGORIES  ?? []).map((c: any) => c.name ?? c.nom ?? "");
      const brands    = (_data.BRANDS      ?? []).map((b: any) => b.name ?? b.nom ?? "");
      const suppliers = (_data.SUPPLIERS   ?? []).map((s: any) => s.name ?? s.nom ?? "");
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
            { k: "image",           l: "Visuel produit",      t: "image",           full: true },
            { k: "images",          l: "Photos secondaires",  t: "images",          full: true },
            { k: "desc",            l: "Description (visible sur le site)", t: "textarea", ph: "Description affichée sur la fiche produit du site vitrine…", full: true },
            { k: "variant_options", l: "Variantes",           t: "variant-options", full: true },
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
            { k: "lines",     l: "Produits commandés",   t: "lines",  full: true },
            { k: "notes",     l: "Instructions",         t: "textarea", full: true },
          ],
        },
        variant: {
          label: "groupe de variantes", title: "groupe de variantes", eyebrow: "Variantes",
          fields: [
            { k: "name",   l: "Nom du groupe",                   t: "text",     ph: "Taille",       full: true },
            { k: "type",   l: "Type",                             t: "select",   options: ["Texte", "Couleur", "Taille", "Matière", "Style", "Modèle", "Autre"] },
            { k: "values", l: "Valeurs (séparées par virgules)", t: "textarea", ph: "S, M, L, XL",  full: true },
          ],
        },
      };
    },

    detailLabels: {
      product: "produit", supplier: "fournisseur", brand: "marque",
      category: "catégorie", po: "bon d'achat",
      variant: "groupe",
    },

    rowLabels: {
      product: "le produit", supplier: "le fournisseur", brand: "la marque",
      category: "la catégorie", po: "le bon d'achat",
      variant: "le groupe",
    },

    paletteNav: [
      { l: "Vue d'ensemble",  pg: "overview",    ic: "box" },
      { l: "Produits",        pg: "products",    ic: "box" },
      { l: "Catégories",      pg: "categories",  ic: "folder" },
      { l: "Marques",         pg: "brands",      ic: "box" },
      { l: "Variantes",       pg: "variantes",   ic: "box" },
      { l: "Fournisseurs",    pg: "fournisseurs",ic: "box" },
      { l: "Bons d'achat",    pg: "bons-achat",  ic: "file" },
      { l: "Mouvements",      pg: "mouvements",  ic: "box" },
    ],

    paletteActions: (ui) => [
      { l: "Créer un produit",           ic: "plus",     run: () => { window.location.href = "/admin/products/new"; } },
      { l: "Créer un bon d'achat",       ic: "plus",     run: () => ui.openForm("po") },
      { l: "Exporter le catalogue",      ic: "download", run: () => ui.openExport("Produits") },
      { l: "Importer des produits",      ic: "upload",   run: () => { window.location.href = "/admin/magasin?page=products"; } },
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

    buildDetail: (kind, row) => {
      if (kind !== "product") return null;
      return {
        header: {
          color:  row.swatch,
          initial: row.initial,
          name:   row.name,
          sub:    row.sku,
          status: row.status,
          imageUrl: row.imageUrl,
        },
        stats: [
          ["Stock",   `${row.stock}/${row.target}`],
          ["Prix HT", `${row.price?.toLocaleString?.("fr-FR") ?? row.price} F`],
          ["Marge",   `${row.margin ?? 0}%`],
        ],
        rows: [
          ["Catégorie",       row.cat ?? "—"],
          ["Marque",          row.brand ?? "—"],
          ["Prix d'achat",    row.cost != null ? `${row.cost.toLocaleString("fr-FR")} F` : "—"],
          ["Valeur en stock", `${((row.price ?? 0) * (row.stock ?? 0)).toLocaleString("fr-FR")} F`],
          ["Référence",       row.sku],
        ],
        gallery:     row.images,
        description: row.description || undefined,
      };
    },

    /* ── Real API callbacks ── */

    onSubmit: async (kind, mode, values) => {
      if (kind === "product") {
        const vo = values.variant_options as { selectedOptions?: any[]; combinations?: any[] } | undefined;
        const hasCombinations = (vo?.combinations?.length ?? 0) > 0;

        const brandObj = (_data.BRANDS ?? []).find((b: any) => (b.name ?? b.nom) === values.brand);
        const catObj   = (_data.CATEGORIES ?? []).find((c: any) => (c.name ?? c.nom) === values.cat);

        const body: Record<string, any> = {
          nom:            values.name,
          reference:      values.sku,
          prix_unitaire:  Number(values.price) || 0,
          prix_entrepot:  values.cost ? Number(values.cost) : undefined,
          stock_magasin:  hasCombinations ? 0 : (Number(values.stock) || 0),
          actif:          values.status === "Brouillon" ? 0 : 1,
          marque_id:      brandObj?.id ? Number(brandObj.id) : undefined,
          categorie_id:   catObj?.id   ? Number(catObj.id)   : undefined,
          image_url:      values.image || undefined,
          images:         Array.isArray(values.images) ? values.images : undefined,
          description:    values.desc || null,
          options_config: vo?.selectedOptions?.length
            ? JSON.stringify(vo.selectedOptions.map((o: any) => ({ nom: o.nom, valeurs: o.valeurs })))
            : null,
        };
        if (mode === "edit" && values._raw?.id) {
          await fetch(`/api/admin/products/${values._raw.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          const res  = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (data.id && hasCombinations) {
            await Promise.all((vo!.combinations!).map((combo: any) =>
              fetch(`/api/admin/products/${data.id}/variants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nom:   Object.values(combo.combo as Record<string,string>).join(' / '),
                  options: combo.combo,
                  prix:  Number(combo.prix)  || 0,
                  stock: Number(combo.stock) || 0,
                }),
              })
            ));
          }
        }
        onRefresh?.();
        onRefreshMeta?.();
      }
      if (kind === "category") {
        const body = { nom: values.name, description: values.desc || '', color: values.color || null };
        if (mode === "edit" && values._raw?.id) {
          await fetch(`/api/admin/categories/${values._raw.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        } else {
          await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        }
        onRefreshMeta?.();
      }
      if (kind === "brand") {
        const body = { nom: values.name, description: values.desc || '', logo_url: values.logo || null };
        if (mode === "edit" && values._raw?.id) {
          await fetch(`/api/admin/marques/${values._raw.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        } else {
          await fetch("/api/admin/marques", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        }
        onRefreshMeta?.();
      }
      if (kind === "supplier") {
        const body = {
          nom:             values.name,
          email:           values.email || null,
          telephone:       values.phone || null,
          note:            values.notes || null,
          pays:            values.country || null,
          actif:           values.status === 'Inactif' ? 0 : 1,
          delai_livraison: Number(values.delay) || 0,
        };
        if (mode === "edit" && values._raw?.id) {
          await fetch(`/api/admin/fournisseurs/${values._raw.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        } else {
          await fetch("/api/admin/fournisseurs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        }
        onRefreshMeta?.();
      }
      if (kind === "variant") {
        const valeurs = (values.values || '').split(',').map((v: string) => v.trim()).filter(Boolean);
        const body = { nom: values.name, type: values.type || 'Texte', valeurs };
        if (mode === "edit" && values._raw?.id) {
          await fetch(`/api/admin/variant-groups/${values._raw.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        } else {
          await fetch("/api/admin/variant-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        }
        await onVariantChange?.();
      }
      if (kind === "po") {
        const items = (values.lines || []).map((l: any) => ({ nom: l.product, quantite: Number(l.qty) || 1, prix_unitaire: 0 }));
        const body = { date_achat: values.date || new Date().toISOString().slice(0,10), items: items.length ? items : [{ nom: 'Article', quantite: 1, prix_unitaire: 0 }], note: values.notes || null };
        await fetch("/api/admin/achats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        onRefreshMeta?.();
      }
    },

    onDeleteRow: async (kind, row) => {
      if (kind === "product" && row.id) {
        await fetch(`/api/admin/products/${row.id}`, { method: "DELETE" });
        onRefresh?.();
      }
      if (kind === "category" && row.id) {
        await fetch(`/api/admin/categories/${row.id}`, { method: "DELETE" });
        onRefreshMeta?.();
      }
      if (kind === "brand" && row.id) {
        await fetch(`/api/admin/marques/${row.id}`, { method: "DELETE" });
        onRefreshMeta?.();
      }
      if (kind === "supplier" && row.id) {
        await fetch(`/api/admin/fournisseurs/${row.id}`, { method: "DELETE" });
        onRefreshMeta?.();
      }
      if (kind === "po" && row.id) {
        await fetch(`/api/admin/achats/${row.id}`, { method: "DELETE" });
        onRefreshMeta?.();
      }
      if (kind === "variant" && row.id) {
        await fetch(`/api/admin/variant-groups/${row.id}`, { method: "DELETE" });
        await onVariantChange?.();
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
