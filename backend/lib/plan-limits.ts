// Plan-based product limits for SaaS multi-tenant
export const PLAN_LIMITS: Record<string, number> = {
  basic:    20,
  pro:      Infinity,
  business: Infinity,
};

export function planLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? 20; // unknown plan defaults to basic
}

export function planLimitLabel(plan: string): string {
  const limit = planLimit(plan);
  return limit === Infinity ? "illimité" : String(limit);
}
