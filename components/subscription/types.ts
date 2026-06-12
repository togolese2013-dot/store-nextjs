export type BillingCycle = 'monthly' | 'yearly'
export type PlanId = 'basic' | 'pro' | 'business'
export type PayMethodId = 'moov' | 'yas'

export interface Plan {
  id: PlanId
  name: string
  priceM: number
  priceY: number
  feats: string[]
}

export interface PayMethod {
  id: PayMethodId
  label: string
  detail: string
  icon: string
  color: string
  ussdCode: string
}

export interface InvoiceEntry {
  id: number
  date: string
  plan: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
}
