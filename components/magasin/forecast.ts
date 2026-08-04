/**
 * Shared shape for /api/admin/ai/stock-forecast responses — consumed by
 * MouvementsPage and the "Prévisions IA" view in Produits.
 */

export interface Forecast {
  produit_id:      number;
  nom:             string;
  stock:           number;
  ventes_30j:      number;
  jours_restants:  number | null;
  urgence:         'critique' | 'attention' | 'ok';
  recommandation:  string;
  qte_a_commander: number;
}

export const URGENCE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critique: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Critique' },
  attention:{ bg: 'var(--warn-bg)',   color: 'var(--warn)',   label: 'Attention' },
  ok:       { bg: 'var(--ok-bg)',     color: 'var(--ok)',     label: 'OK' },
};
