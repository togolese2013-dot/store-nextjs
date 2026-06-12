'use client'
import React from 'react'
import styles from './subscription.module.css'

interface Props {
  plan: string
  status: string
  trialEndsAt?: string | null
  periodEnd?: string | null
  onClick: () => void
}

function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function planLabel(p: string): string {
  if (p === 'business') return 'Business'
  if (p === 'pro') return 'Pro'
  return 'Basic'
}

export function SubscriptionCard({ plan, status, trialEndsAt, periodEnd, onClick }: Props) {
  const isTrial   = status === 'trial'
  const isExpired = status === 'expired' || status === 'suspended'
  const days      = isTrial ? daysUntil(trialEndsAt) : daysUntil(periodEnd)
  const isWarn    = !isExpired && days !== null && days <= 14

  let accentColor: string
  let tintBg: string
  let statusLine: string
  let ctaLabel: string

  if (isExpired) {
    accentColor = '#9C3A14'; tintBg = '#F7DCCB'
    statusLine  = 'Expiré — accès restreint'
    ctaLabel    = 'Renouveler'
  } else if (isTrial) {
    accentColor = '#C9601E'; tintBg = '#FBE9D6'
    const d = days ?? 0
    statusLine = d > 0 ? `${d} jour${d > 1 ? 's' : ''} d'essai restant` : 'Essai terminé'
    ctaLabel   = 'Choisir un plan'
  } else if (isWarn) {
    accentColor = '#C9601E'; tintBg = '#FBE9D6'
    statusLine  = periodEnd ? `Expire le ${fmtDate(periodEnd)}` : `Expire dans ${days} jour${(days ?? 0) > 1 ? 's' : ''}`
    ctaLabel    = 'Renouveler'
  } else {
    if (plan === 'business') { accentColor = '#5C4A88'; tintBg = '#E6E0F0' }
    else if (plan === 'pro') { accentColor = '#3B6A8F'; tintBg = '#E8F0F7' }
    else                     { accentColor = '#6B635B'; tintBg = '#EBE4D6' }
    statusLine = periodEnd ? `Renouvellement · ${fmtDate(periodEnd)}` : 'Actif'
    ctaLabel   = 'Gérer'
  }

  return (
    <button
      className={`${styles.wsCard} ${styles.subCard}`}
      style={{ '--accent': accentColor, '--tint-bg': tintBg } as React.CSSProperties}
      onClick={onClick}
      aria-label="Gérer votre abonnement"
    >
      {/* Top row */}
      <div className={styles.wsTop}>
        <div className={styles.wsIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="3" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <div className={styles.wsTag}>Abonnement</div>
      </div>

      {/* Plan name */}
      <div style={{ marginBottom: 6 }}>
        <h3 className={styles.wsName} style={{ margin: 0 }}>
          Plan <span style={{ color: accentColor }}>{planLabel(plan)}</span>
        </h3>
      </div>

      {/* Status line */}
      <p className={`${styles.wsDesc} ${styles.subRenew}`}>{statusLine}</p>

      {/* Footer */}
      <div className={styles.wsFoot}>
        <div className={styles.wsCount}>
          <span className={styles.dot} />
          <span>{ctaLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={styles.subChangeBtn}>Changer de plan</span>
          <div className={styles.wsCta} aria-hidden>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  )
}
