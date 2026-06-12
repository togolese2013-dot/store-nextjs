import type { Plan, PayMethod } from './types'

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceM: 0,
    priceY: 0,
    feats: ['50 produits', '1 point de vente', 'Paiement mobile', 'Support email'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceM: 9900,
    priceY: 7900,
    feats: [
      'Produits illimités',
      '3 points de vente',
      'POS + stats avancées',
      'Équipe 5 users',
      'Support WhatsApp',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    priceM: 24900,
    priceY: 19900,
    feats: ['PDV illimités', 'Multi-entrepôts', 'API & compta', 'Account manager', 'SLA 99,9%'],
  },
]

export const PAY_METHODS: PayMethod[] = [
  { id: 'moov', label: 'Moov Money (Flooz)', detail: '+228 98 ••• •••', icon: 'M', color: '#0066CC', ussdCode: '*155#' },
  { id: 'yas',  label: 'Mixx by Yas',        detail: '+228 90 ••• •••', icon: 'Y', color: '#E63B2E', ussdCode: '*144#' },
]

export function fmtFCFA(n: number): string {
  if (n === 0) return 'Gratuit'
  return n.toLocaleString('fr-FR').replace(/,/g, ' ') + ' F CFA'
}
