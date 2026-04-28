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
      { id: "products",     label: "Produits" },
      { id: "categories",   label: "Catégories" },
      { id: "fournisseurs", label: "Fournisseurs" },
      { id: "achats",       label: "Achats" },
    ],
  },
  boutique: {
    label: "Boutique",
    color: "amber",
    pages: [
      { id: "ventes",                label: "Ventes" },
      { id: "livraisons",            label: "Livraisons" },
      { id: "stock-boutique",        label: "Stock boutique" },
      { id: "proforma",              label: "Proforma" },
      { id: "finance",               label: "Finance" },
      { id: "boutique-clients",      label: "Clients boutique" },
      { id: "boutique-segmentation", label: "Segmentation" },
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
      { id: "whatsapp",        label: "Diffusion WhatsApp" },
      { id: "fidelite",        label: "Fidélité" },
      { id: "parrainage",      label: "Parrainage" },
      { id: "newsletter",      label: "Newsletter" },
      { id: "comptes-clients", label: "Comptes clients" },
    ],
  },
  admin: {
    label: "Admin",
    color: "violet",
    pages: [
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
  if (role === "super_admin") return Object.keys(ADMIN_MODULES) as ModuleKey[];
  if (!permissions) return [];
  return (Object.keys(permissions) as ModuleKey[]).filter(k => k in ADMIN_MODULES);
}
