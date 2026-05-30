export type ModuleKey = "magasin" | "boutique" | "store" | "crm" | "admin";

export type AdminPermissions = {
  [K in ModuleKey]?: string[] | "all";
};

export interface ModulePage {
  id:    string;
  label: string;
}

export interface ModuleDef {
  label: string;
  color: string;
  pages: ModulePage[];
}

export const ADMIN_MODULES: Record<ModuleKey, ModuleDef> = {
  magasin: {
    label: "Magasin",
    color: "brand",
    pages: [
      { id: "products",        label: "Produits" },
      { id: "categories",      label: "Catégories" },
      { id: "fournisseurs",    label: "Fournisseurs" },
      { id: "achats",          label: "Achats" },
      { id: "entrepots",        label: "Produits externes" },
      { id: "delete_product",  label: "Supprimer un produit" },
      { id: "generate_slugs",  label: "Générer les slugs" },
      { id: "export_csv",      label: "Exporter CSV" },
    ],
  },
  boutique: {
    label: "Boutique",
    color: "amber",
    pages: [
      { id: "ventes",                label: "Ventes" },
      { id: "livraisons",            label: "Livraisons" },
      { id: "livreurs",              label: "Livreurs (demandes)" },
      { id: "stock-boutique",        label: "Stock boutique" },
      { id: "proforma",              label: "Proforma" },
      { id: "finance",               label: "Finance" },
      { id: "boutique-clients",      label: "Clients boutique" },
      { id: "boutique-segmentation", label: "Segmentation" },
      { id: "whatsapp",              label: "WhatsApp" },
      { id: "delete_vente",          label: "Supprimer une vente" },
      { id: "create_vente",          label: "Créer une vente" },
      { id: "edit_vente",            label: "Modifier une vente" },
      { id: "add_paiement",          label: "Enregistrer un paiement" },
      { id: "stock_ajustement",      label: "Ajuster le stock boutique" },
    ],
  },
  store: {
    label: "Store",
    color: "emerald",
    pages: [
      { id: "store",             label: "Dashboard" },
      { id: "orders",            label: "Commandes" },
      { id: "coupons",           label: "Coupons" },
      { id: "reviews",           label: "Avis clients" },
      { id: "paiements",         label: "Paiements échelonnés" },
      { id: "verifications",     label: "Vérifications KYC" },
      { id: "settings/delivery", label: "Zones de livraison" },
      { id: "settings/payment",  label: "Paiements config" },
    ],
  },
  crm: {
    label: "CRM",
    color: "indigo",
    pages: [
      { id: "crm",             label: "Clients" },
      { id: "messages",        label: "Messages" },
      { id: "serena",          label: "Conversations Séréna" },
      { id: "fidelite",        label: "Fidélité" },
      { id: "parrainage",      label: "Parrainage" },
      { id: "newsletter",      label: "Newsletter" },
      { id: "comptes-clients", label: "Comptes clients" },
      { id: "social",          label: "Réseaux Sociaux" },
    ],
  },
  admin: {
    label: "Admin",
    color: "violet",
    pages: [
      { id: "analytics",         label: "Analytics site" },
      { id: "rapports",          label: "Rapports" },
      { id: "tendances",         label: "Tendances ventes" },
      { id: "settings",          label: "Réglages généraux" },
      { id: "settings/hero",     label: "Hero & Bannières" },
      { id: "settings/theme",    label: "Apparence" },
      { id: "settings/domain",   label: "Domaine & URL" },
      { id: "settings/whatsapp", label: "WhatsApp API" },
      { id: "users",             label: "Utilisateurs" },
    ],
  },
};

export function hasModuleAccess(
  role: string,
  permissions: AdminPermissions | null | undefined,
  module: ModuleKey,
): boolean {
  if (role === "super_admin") return true;
  if (!permissions) return false;
  return module in permissions;
}

export function hasPageAccess(
  role: string,
  permissions: AdminPermissions | null | undefined,
  module: ModuleKey,
  pageId: string,
): boolean {
  if (role === "super_admin") return true;
  if (!permissions) return false;
  const perm = permissions[module];
  if (!perm) return false;
  if (perm === "all") return true;
  return (perm as string[]).some(p => pageId === p || pageId.startsWith(p + "/"));
}

export function getAccessibleModules(
  role: string,
  permissions: AdminPermissions | null | undefined,
): ModuleKey[] {
  // super_admin and admin (shop owner) without explicit restrictions get full access
  if (role === "super_admin" || role === "admin") return Object.keys(ADMIN_MODULES) as ModuleKey[];
  if (!permissions) return [];
  return (Object.keys(permissions) as ModuleKey[]).filter(k => k in ADMIN_MODULES);
}
