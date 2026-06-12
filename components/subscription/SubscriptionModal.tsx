'use client'
import React, { useState, useEffect } from 'react'
import type { BillingCycle, PlanId, PayMethodId, InvoiceEntry } from './types'
import { PLANS, PAY_METHODS, fmtFCFA } from './data'
import styles from './subscription.module.css'

interface BillingInfo {
  nom:                 string
  plan:                PlanId
  subscription_status: string
  trial_ends_at:       string | null
  current_period_end:  string | null
  merchant_moov:       string
  merchant_yas:        string
  payments:            {
    id: number
    plan: string
    amount: number
    duration_months: number
    status: string
    operator: string | null
    created_at: string
  }[]
}

interface Props {
  open: boolean
  onClose: () => void
  shopPlan?: string
  shopStatus?: string
  shopTrialEndsAt?: string | null
  shopPeriodEnd?: string | null
}

export function SubscriptionModal({ open, onClose, shopPlan = 'basic' }: Props) {
  const [billing,      setBillingCycle] = useState<BillingCycle>('monthly')
  const [confirmPlan,  setConfirmPlan]  = useState<PlanId | null>(null)
  const [payStep,      setPayStep]      = useState(false)
  const [operator,     setOperator]     = useState<PayMethodId>('moov')
  const [reference,    setReference]    = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [payError,     setPayError]     = useState<string | null>(null)
  const [toast,        setToast]        = useState<string | null>(null)
  const [info,         setInfo]         = useState<BillingInfo | null>(null)
  const [loading,      setLoading]      = useState(false)

  const currentPlanId = (info?.plan ?? shopPlan) as PlanId
  const activePlan    = PLANS.find(p => p.id === currentPlanId) ?? PLANS[0]
  const price         = (p: typeof PLANS[0]) => billing === 'yearly' ? p.priceY : p.priceM
  const activeMethod  = PAY_METHODS.find(m => m.id === operator)!

  /* ── Fetch billing info on open ─── */
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/admin/billing', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d && !d.error) setInfo(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  /* ── ESC to close ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (payStep)    { setPayStep(false); return }
      if (confirmPlan){ setConfirmPlan(null); return }
      onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, payStep, confirmPlan, onClose])

  /* ── Reset on close ─── */
  useEffect(() => {
    if (!open) {
      setConfirmPlan(null)
      setPayStep(false)
      setReference('')
      setPayError(null)
    }
  }, [open])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openPayStep(planId: PlanId) {
    setConfirmPlan(planId)
    setPayStep(true)
    setReference('')
    setPayError(null)
  }

  async function submitPayment() {
    if (!confirmPlan || !reference.trim()) return
    setSubmitting(true)
    setPayError(null)
    const plan = PLANS.find(p => p.id === confirmPlan)!
    try {
      const res = await fetch('/api/admin/billing/initiate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: confirmPlan,
          duration_months: 1,
          operator,
          mm_reference: reference.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPayError(data.error ?? 'Erreur'); setSubmitting(false); return }
      setPayStep(false)
      setConfirmPlan(null)
      setReference('')
      showToast(`Paiement ${plan.name} soumis — en attente de validation ✓`)
    } catch {
      setPayError('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── History entries ─── */
  const history: InvoiceEntry[] = (info?.payments ?? []).map(p => ({
    id:     p.id,
    date:   new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    plan:   `Plan ${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)} · ${p.duration_months} mois`,
    amount: p.amount,
    status: p.status as InvoiceEntry['status'],
  }))

  const merchantNum = (id: PayMethodId) =>
    id === 'moov' ? (info?.merchant_moov ?? '98000000') : (info?.merchant_yas ?? '90000000')

  return (
    <div
      className={`${styles.subBackdrop} ${open ? styles.on : ''}`}
      onClick={() => { setConfirmPlan(null); setPayStep(false); onClose() }}
    >
      <div className={styles.subDrawer} onClick={e => e.stopPropagation()}>
        <div className={styles.subDrawerHandle} />

        {/* Toast */}
        {toast && (
          <div className={styles.subToastWrap}>
            <div className={styles.subToast}>
              <CheckIcon color="#5DCFA0" />
              {toast}
            </div>
          </div>
        )}

        {/* Header */}
        <div className={styles.subDrawerHead}>
          <span className={styles.subDrawerTitle}>Gérer l'abonnement</span>
          <button className={styles.subClose} onClick={onClose}><CloseIcon /></button>
        </div>

        {loading ? (
          <div style={{ padding: '40px 28px', textAlign: 'center', color: '#8A8278', fontSize: 13 }}>
            Chargement…
          </div>
        ) : (
          <>
            {/* ── Current plan ── */}
            <div className={styles.subSection}>
              <div className={styles.subSectionLabel}>Plan actuel</div>
              <div className={styles.subCurrentPlan}>
                <div className={styles.subPlanBadge}>
                  <div className={styles.subPlanIcon}><CreditCardIcon /></div>
                  <div>
                    <div className={styles.subPlanName}>
                      Plan <span>{activePlan.name}</span>
                    </div>
                    <div className={styles.subPlanMeta}>
                      {activePlan.priceM === 0
                        ? 'Gratuit · sans engagement'
                        : `${fmtFCFA(price(activePlan))} · Renouvellement${info?.current_period_end ? ` le ${new Date(info.current_period_end).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}`
                      }
                    </div>
                  </div>
                </div>
                <div className={styles.subStatusPill}>
                  <span className={styles.subStatusDot} />
                  Actif
                </div>
              </div>
            </div>

            {/* ── USSD payment step ── */}
            {payStep && confirmPlan && (
              <div className={styles.subSection}>
                <div className={styles.subSectionLabel}>Payer par Mobile Money</div>

                {/* Operator tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {PAY_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setOperator(m.id)}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                        border: `2px solid ${operator === m.id ? m.color : '#E8E1D4'}`,
                        background: operator === m.id ? `${m.color}12` : 'white',
                        fontWeight: 600, fontSize: 13,
                        color: operator === m.id ? m.color : '#6B635B',
                        transition: 'all .15s ease', fontFamily: 'inherit',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Instructions */}
                <div style={{
                  background: 'white', border: '1px solid #E8E1D4', borderRadius: 14,
                  padding: '16px 18px', marginBottom: 14,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8A8278', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Instructions
                  </p>
                  <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ fontSize: 13.5, color: '#14110E', lineHeight: 1.5 }}>
                      Compose sur ton téléphone :{' '}
                      <code style={{ background: '#F4EFE6', padding: '2px 7px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>
                        {activeMethod.ussdCode}
                      </code>
                    </li>
                    <li style={{ fontSize: 13.5, color: '#14110E', lineHeight: 1.5 }}>
                      Envoie{' '}
                      <strong>{fmtFCFA(price(PLANS.find(p => p.id === confirmPlan)!))}</strong>
                      {' '}au{' '}
                      <strong>+228 {merchantNum(operator).replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')}</strong>
                    </li>
                    <li style={{ fontSize: 13.5, color: '#14110E', lineHeight: 1.5 }}>
                      Note la <strong>référence SMS</strong> reçue
                    </li>
                    <li style={{ fontSize: 13.5, color: '#14110E', lineHeight: 1.5 }}>
                      Entre cette référence ci-dessous
                    </li>
                  </ol>
                </div>

                {/* Reference input */}
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Référence transaction — ex : TG2026XXXX"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    border: '1.5px solid #E8E1D4', fontSize: 14, fontFamily: 'inherit',
                    outline: 'none', background: 'white', boxSizing: 'border-box',
                    marginBottom: 10,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#B8501A' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E8E1D4' }}
                />

                {payError && (
                  <p style={{ fontSize: 12.5, color: '#C84B3A', marginBottom: 8 }}>{payError}</p>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={styles.subConfirmBtn}
                    onClick={submitPayment}
                    disabled={submitting || !reference.trim()}
                    style={{ flex: 1, opacity: submitting || !reference.trim() ? 0.5 : 1, cursor: submitting ? 'wait' : 'pointer' }}
                  >
                    {submitting ? 'Envoi…' : 'Soumettre la référence'}
                  </button>
                  <button
                    className={styles.subCancelBtn}
                    onClick={() => { setPayStep(false); setConfirmPlan(null) }}
                    style={{ flexShrink: 0 }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* ── Plan options ── */}
            {!payStep && (
              <div className={styles.subSection}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className={styles.subSectionLabel} style={{ margin: 0 }}>Changer de plan</div>
                  <div className={styles.billingToggle}>
                    {(['monthly', 'yearly'] as BillingCycle[]).map(b => (
                      <button
                        key={b}
                        className={`${styles.billingBtn} ${billing === b ? styles.billingBtnOn : ''}`}
                        onClick={() => setBillingCycle(b)}
                      >
                        {b === 'monthly' ? 'Mensuel' : 'Annuel'}
                        {b === 'yearly' && (
                          <span className={`${styles.billingBadge} ${billing === 'yearly' ? styles.billingBadgeOn : ''}`}>
                            −20%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.subPlansGrid}>
                  {PLANS.map(p => {
                    const isCurrent    = p.id === currentPlanId
                    const isConfirming = p.id === confirmPlan && !payStep
                    return (
                      <div
                        key={p.id}
                        className={`${styles.subPlanOpt} ${isCurrent ? styles.subPlanOptCurrent : ''}`}
                        style={isConfirming ? { borderColor: '#14110E', boxShadow: '0 0 0 3px rgba(20,17,14,0.08)' } : {}}
                        onClick={() => !isCurrent && !isConfirming && setConfirmPlan(p.id as PlanId)}
                      >
                        {isCurrent && <span className={styles.subCurrentBadge}>Actuel</span>}
                        <div className={styles.subPlanOptName}>{p.name}</div>
                        <div className={styles.subPlanOptPrice}>
                          {p.priceM === 0 ? 'Gratuit' : fmtFCFA(price(p))}
                          {p.priceM !== 0 && <small>/mois</small>}
                        </div>
                        {billing === 'yearly' && p.priceM > 0 && (
                          <div className={styles.subPlanOptAnnual}>soit {fmtFCFA(price(p) * 12)}/an</div>
                        )}
                        <div className={styles.subPlanOptFeats}>
                          {p.feats.map((f, i) => (
                            <div key={i} className={styles.subPlanOptFeat}>{f}</div>
                          ))}
                        </div>
                        {isConfirming ? (
                          <div className={styles.subConfirmBlock} onClick={e => e.stopPropagation()}>
                            <div className={styles.subConfirmLabel}>Confirmer le changement ?</div>
                            <button className={styles.subConfirmBtn} onClick={() => openPayStep(p.id as PlanId)}>
                              Payer {fmtFCFA(price(p))}
                            </button>
                            <button
                              className={styles.subCancelBtn}
                              onClick={e => { e.stopPropagation(); setConfirmPlan(null) }}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`${styles.subPlanOptCta} ${isCurrent ? styles.subPlanOptCtaActive : ''}`}
                            style={{ pointerEvents: 'none' }}
                          >
                            {isCurrent ? 'Plan actif' : 'Choisir'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Billing history ── */}
            {history.length > 0 && (
              <div className={styles.subSection}>
                <div className={styles.subSectionLabel}>Historique de facturation</div>
                {history.map((h, i) => {
                  const statusColor = h.status === 'paid' ? { bg: '#E4ECE6', color: '#2D6A4F', label: 'Payé' }
                    : h.status === 'pending'   ? { bg: '#FBE9D6', color: '#C9601E', label: 'En attente' }
                    : h.status === 'cancelled' ? { bg: '#F0EBE0', color: '#6B635B', label: 'Annulé' }
                    : { bg: '#F7DCCB', color: '#9C3A14', label: 'Échoué' }
                  return (
                    <div key={h.id} className={styles.subHistoryRow}>
                      <span className={styles.subHistoryDate}>{h.date}</span>
                      <span className={styles.subHistoryPlan}>{h.plan}</span>
                      <span className={styles.subHistoryAmount}>
                        {h.amount === 0 ? '—' : h.amount.toLocaleString('fr-FR') + ' F'}
                      </span>
                      <span
                        className={styles.subHistoryStatus}
                        style={{ background: statusColor.bg, color: statusColor.color }}
                      >
                        {statusColor.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Cancel ── */}
            <div className={styles.subCancelSection}>
              <a href="/admin/billing" className={styles.subCancelLink}>
                Voir la page abonnement complète →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Icons ─────────────────────────────────── */
function CreditCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="3" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function CheckIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
