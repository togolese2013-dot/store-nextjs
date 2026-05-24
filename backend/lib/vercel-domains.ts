/**
 * Vercel REST API — custom domain management.
 * Docs: https://vercel.com/docs/rest-api/endpoints/projects#add-a-domain-to-a-project
 *
 * Required env vars:
 *   VERCEL_TOKEN       — personal access token (Settings → Tokens)
 *   VERCEL_PROJECT_ID  — project ID (Project → Settings → General)
 *   VERCEL_TEAM_ID     — optional, if project belongs to a team
 */

const TOKEN      = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID    = process.env.VERCEL_TEAM_ID;

function vercelApi(path: string, opts: RequestInit = {}) {
  const teamParam = TEAM_ID ? `?teamId=${TEAM_ID}` : "";
  return fetch(`https://api.vercel.com${path}${teamParam}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
}

export interface VercelDomainResult {
  ok:     boolean;
  error?: string;
  /** Verification records the client must add to DNS (for domains not yet verified) */
  verification?: { type: string; domain: string; value: string; reason: string }[];
}

/** Add a domain to the Vercel project. Returns verification records if DNS ownership check required. */
export async function addVercelDomain(domain: string): Promise<VercelDomainResult> {
  if (!TOKEN || !PROJECT_ID) {
    console.warn("[vercel-domains] VERCEL_TOKEN or VERCEL_PROJECT_ID not set — skipping");
    return { ok: true }; // non-fatal: domain still stored in DB, Vercel step skipped
  }
  try {
    const res = await vercelApi(`/v10/projects/${PROJECT_ID}/domains`, {
      method: "POST",
      body:   JSON.stringify({ name: domain }),
    });
    const data = await res.json();
    if (!res.ok) {
      // 409 = domain already exists in project — not an error
      if (res.status === 409) return { ok: true };
      return { ok: false, error: data?.error?.message ?? `Vercel error ${res.status}` };
    }
    // Domain may require DNS verification
    if (data.verification?.length) {
      return { ok: true, verification: data.verification };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Vercel API unreachable" };
  }
}

/** Remove a domain from the Vercel project. */
export async function removeVercelDomain(domain: string): Promise<void> {
  if (!TOKEN || !PROJECT_ID) return;
  try {
    await vercelApi(`/v10/projects/${PROJECT_ID}/domains/${encodeURIComponent(domain)}`, {
      method: "DELETE",
    });
  } catch { /* best-effort */ }
}

/** Check domain configuration status on Vercel. */
export async function checkVercelDomain(domain: string): Promise<{
  configured: boolean;
  verification?: { type: string; domain: string; value: string }[];
}> {
  if (!TOKEN || !PROJECT_ID) return { configured: true };
  try {
    const res  = await vercelApi(`/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(domain)}`);
    const data = await res.json();
    if (!res.ok) return { configured: false };
    return {
      configured:   data.verified ?? false,
      verification: data.verification ?? [],
    };
  } catch {
    return { configured: false };
  }
}
