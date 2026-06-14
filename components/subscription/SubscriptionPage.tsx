'use client'
import React, { useState, useEffect } from 'react'
import type { BillingCycle, PlanId, PayMethodId } from './types'
import { PLANS, PAY_METHODS, fmtFCFA } from './data'
import styles from './subscription-page.module.css'

interface BillingInfo {
  shop_id:             number
  nom:                 string
  plan:                PlanId
  subscription_status: 'trial' | 'active' | 'expired' | 'suspended'
  trial_ends_at:       string | null
  current_period_end:  string | null
  merchant_moov:       string
  merchant_yas:        string
  payments: {
    id: number
    plan: string
    amount: number
    duration_months: number
    status: 'pending' | 'paid' | 'failed' | 'cancelled'
    operator: string | null
    mm_reference: string | null
    created_at: string
  }[]
}

interface Props {
  onBack?: () => void
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SubscriptionPage({ onBack }: Props) {
  const [info,         setInfo]        = useState<BillingInfo | null>(null)
  const [loading,      setLoading]     = useState(true)
  const [billing,      setBilling]     = useState<BillingCycle>('monthly')
  const [confirmPlan,  setConfirmPlan] = useState<PlanId | null>(null)
  const [payStep,      setPayStep]     = useState(false)
  const [operator,     setOperator]    = useState<PayMethodId>('moov')
  const [reference,    setReference]   = useState('')
  const [submitting,   setSubmitting]  = useState(false)
  const [payError,     setPayError]    = useState<string | null>(null)
  const [editPayment,  setEditPayment] = useState(false)
  const [toast,        setToast]       = useState<string | null>(null)
  const [downloading,  setDownloading] = useState<Set<number>>(new Set())

  const currentPlanId = info?.plan ?? 'basic'
  const activePlan    = PLANS.find(p => p.id === currentPlanId) ?? PLANS[0]
  const activeMethod  = PAY_METHODS.find(m => m.id === operator)!
  const price         = (p: typeof PLANS[0]) => billing === 'yearly' ? p.priceY : p.priceM
  const isLegacy      = info?.shop_id === 1

  useEffect(() => {
    fetch('/api/admin/billing', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d && !d.error) setInfo(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (payStep)     { setPayStep(false); return }
      if (confirmPlan) { setConfirmPlan(null); return }
      if (editPayment) { setEditPayment(false); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [payStep, confirmPlan, editPayment])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  function openPayStep(planId: PlanId) {
    const plan = PLANS.find(p => p.id === planId)!
    if (plan.priceM === 0) {
      activateFree(planId)
      return
    }
    setConfirmPlan(planId)
    setPayStep(true)
    setReference('')
    setPayError(null)
  }

  async function activateFree(planId: PlanId) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/billing/initiate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, duration_months: 1, operator: 'moov', mm_reference: 'GRATUIT' }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Erreur'); return }
      setConfirmPlan(null)
      showToast('Plan Basic activé gratuitement ✓')
      fetch('/api/admin/billing', { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d && !d.error) setInfo(d) })
        .catch(() => {})
    } catch {
      showToast('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
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
      fetch('/api/admin/billing', { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d && !d.error) setInfo(d) })
        .catch(() => {})
    } catch {
      setPayError('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  function downloadInvoice(index: number) {
    setDownloading(d => new Set([...d, index]))
    setTimeout(() => {
      setDownloading(d => { const s = new Set(d); s.delete(index); return s })
      showToast('Facture téléchargée ✓')
    }, 1200)
  }

  const merchantNum = (id: PayMethodId) =>
    id === 'moov'
      ? (info?.merchant_moov ?? '98000000').replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')
      : (info?.merchant_yas  ?? '90000000').replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')

  const history = (info?.payments ?? []).map(p => ({
    id:       p.id,
    date:     fmtDate(p.created_at),
    plan:     `Plan ${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)} · ${p.duration_months} mois`,
    amount:   p.amount,
    status:   p.status,
    operator: p.operator,
  }))

  const renewalDate = info?.current_period_end ? fmtDate(info.current_period_end) : '—'

  const statusLabel = (() => {
    if (!info) return 'Actif'
    if (info.subscription_status === 'trial') {
      const d = info.trial_ends_at ? Math.ceil((new Date(info.trial_ends_at).getTime() - Date.now()) / 86_400_000) : null
      return d !== null && d > 0 ? `Essai · ${d}j` : 'Essai terminé'
    }
    if (info.subscription_status === 'expired')   return 'Expiré'
    if (info.subscription_status === 'suspended') return 'Suspendu'
    return 'Actif'
  })()

  return (
    <div className={styles.page}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack} aria-label="Retour">
              <ArrowLeftIcon />
            </button>
          )}
          <div>
            <div className={styles.topbarEyebrow}>Paramètres</div>
            <h1 className={styles.topbarTitle}>Abonnement</h1>
          </div>
        </div>
        {toast && (
          <div className={styles.toast}>
            <CheckIcon color="#5DCFA0" />
            {toast}
          </div>
        )}
      </header>

      {loading ? (
        <div style={{ padding: '80px 40px', textAlign: 'center', color: '#8A8278', fontSize: 14 }}>
          Chargement…
        </div>
      ) : isLegacy ? (
        <div style={{ maxWidth: 640, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
          <div style={{ background: 'white', border: '1px solid #E8E1D4', borderRadius: 20, padding: '40px 32px', color: '#6B635B', fontSize: 14 }}>
            Cette boutique est exempte de facturation.
          </div>
        </div>
      ) : (
        <div className={styles.body}>

          {/* ── Main column ── */}
          <div className={styles.main}>

            {/* Current plan banner */}
            <div className={styles.currentBanner}>
              <div className={styles.bannerLeft}>
                <div className={styles.bannerIcon}><CreditCardIcon /></div>
                <div>
                  <div className={styles.bannerLabel}>Plan actuel</div>
                  <div className={styles.bannerPlan}>
                    Plan <span>{activePlan.name}</span>
                  </div>
                  <div className={styles.bannerMeta}>
                    {activePlan.priceM === 0
                      ? 'Gratuit · sans engagement'
                      : `${fmtFCFA(price(activePlan))} · Renouvellement le ${renewalDate}`}
                  </div>
                </div>
              </div>
              <div className={styles.statusPill}>
                <span className={styles.statusDot} />
                {statusLabel}
              </div>
            </div>

            {/* ── USSD payment step ── */}
            {payStep && confirmPlan && (() => {
              const plan = PLANS.find(p => p.id === confirmPlan)!
              return (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div>
                      <h2 className={styles.sectionTitle}>Payer par Mobile Money</h2>
                      <p className={styles.sectionDesc}>
                        Passage au plan <strong>{plan.name}</strong> — {fmtFCFA(price(plan))}/mois
                      </p>
                    </div>
                  </div>

                  {/* Operator tabs */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    {PAY_METHODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setOperator(m.id)}
                        style={{
                          flex: 1, padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
                          border: `2px solid ${operator === m.id ? m.color : '#E8E1D4'}`,
                          background: operator === m.id ? `${m.color}14` : 'white',
                          fontWeight: 600, fontSize: 13.5,
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
                    background: 'white', border: '1px solid #E8E1D4',
                    borderRadius: 16, padding: '20px 22px', marginBottom: 16,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#8A8278', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: '"Geist Mono", monospace' }}>
                      Instructions
                    </p>
                    <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <li style={{ fontSize: 14, lineHeight: 1.5, color: '#14110E' }}>
                        Compose sur ton téléphone :{' '}
                        <code style={{ background: '#F4EFE6', padding: '2px 8px', borderRadius: 7, fontFamily: 'monospace', fontSize: 13 }}>
                          {activeMethod.ussdCode}
                        </code>
                      </li>
                      <li style={{ fontSize: 14, lineHeight: 1.5, color: '#14110E' }}>
                        Envoie <strong>{fmtFCFA(price(plan))}</strong> au numéro{' '}
                        <strong>+228 {merchantNum(operator)}</strong>
                      </li>
                      <li style={{ fontSize: 14, lineHeight: 1.5, color: '#14110E' }}>
                        Note la <strong>référence SMS</strong> reçue après la transaction
                      </li>
                      <li style={{ fontSize: 14, lineHeight: 1.5, color: '#14110E' }}>
                        Entre cette référence ci-dessous
                      </li>
                    </ol>
                  </div>

                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Référence de transaction — ex : TG2026XXXX"
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 13,
                      border: '1.5px solid #E8E1D4', fontSize: 14, fontFamily: 'inherit',
                      outline: 'none', background: 'white', boxSizing: 'border-box',
                      marginBottom: 12,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#B8501A' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E8E1D4' }}
                  />

                  {payError && (
                    <p style={{ fontSize: 13, color: '#C84B3A', marginBottom: 10 }}>{payError}</p>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className={styles.confirmBtn}
                      onClick={submitPayment}
                      disabled={submitting || !reference.trim()}
                      style={{ flex: 1, opacity: submitting || !reference.trim() ? 0.5 : 1, cursor: submitting ? 'wait' : 'pointer' }}
                    >
                      {submitting ? 'Envoi…' : 'Soumettre la référence'}
                    </button>
                    <button
                      className={styles.cancelBtn}
                      style={{ flexShrink: 0, width: 'auto', padding: '9px 20px' }}
                      onClick={() => { setPayStep(false); setConfirmPlan(null) }}
                    >
                      Annuler
                    </button>
                  </div>
                </section>
              )
            })()}

            {/* ── Plan selection ── */}
            {!payStep && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div>
                    <h2 className={styles.sectionTitle}>Changer de plan</h2>
                    <p className={styles.sectionDesc}>Passez à la formule qui correspond à votre croissance.</p>
                  </div>
                  <div className={styles.billingToggle}>
                    {(['monthly', 'yearly'] as BillingCycle[]).map(b => (
                      <button
                        key={b}
                        className={`${styles.billingBtn} ${billing === b ? styles.billingBtnOn : ''}`}
                        onClick={() => setBilling(b)}
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

                <div className={styles.plansGrid}>
                  {PLANS.map(p => {
                    const isCurrent    = p.id === currentPlanId
                    const isConfirming = p.id === confirmPlan
                    return (
                      <div
                        key={p.id}
                        className={`${styles.planCard} ${isCurrent ? styles.planCardCurrent : ''} ${isConfirming ? styles.planCardConfirming : ''}`}
                        onClick={() => !isCurrent && !isConfirming && setConfirmPlan(p.id as PlanId)}
                      >
                        {isCurrent && <span className={styles.planCurrentBadge}>Actuel</span>}
                        <div className={styles.planName}>{p.name}</div>
                        <div className={styles.planPrice}>
                          {p.priceM === 0 ? 'Gratuit' : fmtFCFA(price(p))}
                          {p.priceM !== 0 && <small>/mois</small>}
                        </div>
                        {billing === 'yearly' && p.priceM > 0 && (
                          <div className={styles.planAnnual}>soit {fmtFCFA(price(p) * 12)}/an</div>
                        )}
                        <ul className={styles.planFeats}>
                          {p.feats.map((f, i) => (
                            <li key={i} className={styles.planFeat}>{f}</li>
                          ))}
                        </ul>
                        {isConfirming ? (
                          <div className={styles.confirmBlock} onClick={e => e.stopPropagation()}>
                            <p className={styles.confirmLabel}>Confirmer le changement ?</p>
                            <button className={styles.confirmBtn} onClick={() => openPayStep(p.id as PlanId)} disabled={submitting}>
                              {p.priceM === 0 ? 'Activer gratuitement' : `Payer ${fmtFCFA(price(p))}`}
                            </button>
                            <button
                              className={styles.cancelBtn}
                              onClick={e => { e.stopPropagation(); setConfirmPlan(null) }}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`${styles.planCta} ${isCurrent ? styles.planCtaActive : ''}`}
                            style={{ pointerEvents: 'none' }}
                          >
                            {isCurrent ? 'Plan actif' : 'Choisir ce plan'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Billing history ── */}
            {history.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div>
                    <h2 className={styles.sectionTitle}>Historique de facturation</h2>
                    <p className={styles.sectionDesc}>Vos paiements Mobile Money.</p>
                  </div>
                </div>
                <div className={styles.historyTable}>
                  <div className={styles.historyHeader}>
                    <span>Date</span>
                    <span>Plan</span>
                    <span>Montant</span>
                    <span>Statut</span>
                    <span />
                  </div>
                  {history.map((h, i) => {
                    const sc = h.status === 'paid'
                      ? { bg: '#E4ECE6', color: '#2D6A4F', label: 'Validé' }
                      : h.status === 'pending'
                      ? { bg: '#FBE9D6', color: '#C9601E', label: 'En attente' }
                      : h.status === 'cancelled'
                      ? { bg: '#F0EBE0', color: '#6B635B', label: 'Annulé' }
                      : { bg: '#F7DCCB', color: '#9C3A14', label: 'Échoué' }
                    return (
                      <div key={h.id} className={styles.historyRow}>
                        <span className={styles.historyDate}>{h.date}</span>
                        <span className={styles.historyPlan}>{h.plan}</span>
                        <span className={styles.historyAmount}>
                          {h.amount === 0 ? '—' : h.amount.toLocaleString('fr-FR') + ' F'}
                        </span>
                        <span className={styles.historyStatus} style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                        <button
                          className={`${styles.downloadBtn} ${downloading.has(i) ? styles.downloadBtnDone : ''}`}
                          onClick={() => downloadInvoice(i)}
                          title="Télécharger"
                        >
                          {downloading.has(i) ? <><CheckIcon /> <span>Téléchargé</span></> : <><DownloadIcon /> <span>Télécharger</span></>}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>

            {/* Payment method */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardTitle}>Moyen de paiement</div>
              <div className={styles.payRow}>
                <div
                  className={styles.payIcon}
                  style={{ background: activeMethod.color, color: 'white' }}
                >
                  {activeMethod.icon}
                </div>
                <div className={styles.payInfo}>
                  <div className={styles.payName}>{activeMethod.label}</div>
                  <div className={styles.payDetail}>{activeMethod.detail}</div>
                </div>
                <span className={styles.payDefault}>Par défaut</span>
              </div>
              <button className={styles.editPayBtn} onClick={() => setEditPayment(v => !v)}>
                {editPayment ? 'Fermer' : 'Changer de moyen de paiement'}
              </button>
              {editPayment && (
                <div className={styles.payList}>
                  {PAY_METHODS.filter(m => m.id !== operator).map(m => (
                    <button
                      key={m.id}
                      className={styles.payOption}
                      onClick={() => { setOperator(m.id); setEditPayment(false); showToast(`${m.label} sélectionné ✓`) }}
                    >
                      <div
                        className={styles.payOptionIcon}
                        style={{ background: m.color, color: 'white' }}
                      >
                        {m.icon}
                      </div>
                      <div>
                        <div className={styles.payName}>{m.label}</div>
                        <div className={styles.payDetail}>{m.label === 'Moov Money (Flooz)' ? '*155#' : '*144#'}</div>
                      </div>
                      <ArrowRightIcon />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardTitle}>Résumé</div>
              <div className={styles.summaryRow}>
                <span>Plan</span>
                <span className={styles.summaryVal}>{activePlan.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Facturation</span>
                <span className={styles.summaryVal}>{billing === 'monthly' ? 'Mensuelle' : 'Annuelle'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Prochain paiement</span>
                <span className={styles.summaryVal}>
                  {info?.subscription_status === 'active' && info.current_period_end
                    ? fmtDate(info.current_period_end)
                    : '—'}
                </span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Montant</span>
                <span className={styles.summaryVal}>
                  {activePlan.priceM === 0 ? 'Gratuit' : fmtFCFA(price(activePlan))}
                </span>
              </div>
            </div>

            <button className={styles.cancelLink}>
              Résilier l'abonnement
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}

/* ── Icons ── */
function CreditCardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="3" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  )
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginLeft: 'auto', color: '#B8501A', flexShrink: 0 }}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
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
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
