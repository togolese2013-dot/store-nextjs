"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_MODULES = void 0;
exports.hasModuleAccess = hasModuleAccess;
exports.hasPageAccess = hasPageAccess;
exports.getAccessibleModules = getAccessibleModules;
exports.ADMIN_MODULES = {
    magasin: {
        label: "Magasin",
        color: "brand",
        pages: [
            { id: "products", label: "Produits" },
            { id: "categories", label: "Catégories" },
            { id: "fournisseurs", label: "Fournisseurs" },
            { id: "achats", label: "Achats" },
        ],
    },
    boutique: {
        label: "Boutique",
        color: "amber",
        pages: [
            { id: "ventes", label: "Ventes" },
            { id: "livraisons", label: "Livraisons" },
            { id: "stock-boutique", label: "Stock boutique" },
            { id: "proforma", label: "Proforma" },
            { id: "finance", label: "Finance" },
            { id: "boutique-clients", label: "Clients boutique" },
            { id: "boutique-segmentation", label: "Segmentation" },
            { id: "whatsapp", label: "WhatsApp" },
        ],
    },
    store: {
        label: "Store",
        color: "emerald",
        pages: [
            { id: "store", label: "Dashboard" },
            { id: "orders", label: "Commandes" },
            { id: "coupons", label: "Coupons" },
            { id: "reviews", label: "Avis clients" },
            { id: "paiements", label: "Paiements échelonnés" },
            { id: "verifications", label: "Vérifications KYC" },
            { id: "settings/delivery", label: "Zones de livraison" },
            { id: "settings/payment", label: "Paiements config" },
        ],
    },
    crm: {
        label: "CRM",
        color: "indigo",
        pages: [
            { id: "crm", label: "Clients" },
            { id: "messages", label: "Messages" },
            { id: "serena", label: "Conversations Séréna" },
            { id: "fidelite", label: "Fidélité" },
            { id: "parrainage", label: "Parrainage" },
            { id: "newsletter", label: "Newsletter" },
            { id: "comptes-clients", label: "Comptes clients" },
        ],
    },
    admin: {
        label: "Admin",
        color: "violet",
        pages: [
            { id: "rapports", label: "Rapports" },
            { id: "tendances", label: "Tendances ventes" },
            { id: "settings", label: "Réglages généraux" },
            { id: "settings/hero", label: "Hero & Bannières" },
            { id: "settings/theme", label: "Apparence" },
            { id: "settings/domain", label: "Domaine & URL" },
            { id: "settings/whatsapp", label: "WhatsApp API" },
            { id: "users", label: "Utilisateurs" },
        ],
    },
};
function hasModuleAccess(role, permissions, module) {
    if (role === "super_admin")
        return true;
    if (!permissions)
        return false;
    return module in permissions;
}
function hasPageAccess(role, permissions, module, pageId) {
    if (role === "super_admin")
        return true;
    if (!permissions)
        return false;
    const perm = permissions[module];
    if (!perm)
        return false;
    if (perm === "all")
        return true;
    return perm.some(p => pageId === p || pageId.startsWith(p + "/"));
}
function getAccessibleModules(role, permissions) {
    if (role === "super_admin")
        return Object.keys(exports.ADMIN_MODULES);
    if (!permissions)
        return [];
    return Object.keys(permissions).filter(k => k in exports.ADMIN_MODULES);
}
