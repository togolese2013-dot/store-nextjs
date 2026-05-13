"use strict";
/* Shared types & pure utility functions — safe for client AND server */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrice = exports.finalPrice = void 0;
const finalPrice = (p) => p.remise > 0 ? Math.max(0, p.prix_unitaire - p.remise) : p.prix_unitaire;
exports.finalPrice = finalPrice;
const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " FCFA";
exports.formatPrice = formatPrice;
