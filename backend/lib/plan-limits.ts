// Plan-based product limits for SaaS multi-tenant
export const PLAN_LIMITS: Record<string, number> = {
  free:  50,
  basic: 500,
  pro:   Infinity,
};

export function planLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? 50; // unknown plan defaults to free
}

export function planLimitLabel(plan: string): string {
  const limit = planLimit(plan);
  return limit === Infinity ? "illimité" : String(limit);
}
