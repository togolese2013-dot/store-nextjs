/**
 * Central date/time formatting — respects the saved admin preference
 * (Paramètres compte → Préférences : fuseau horaire + format de date).
 *
 * Client components: call `formatDate(x)` with no prefs argument — AdminShell calls
 * `setDatePrefs()` once (client-only useEffect) after fetching /api/admin/settings,
 * and every call reads that in-memory value. Safe because 'use client' modules run
 * per-browser-tab; the module singleton is never mutated during server rendering
 * (effects never run in SSR), so there is no cross-request/cross-user state to leak.
 *
 * Server components / lib modules (no 'use client'): the module singleton is shared
 * across ALL concurrent requests on the long-running Node process (pm2) — NEVER rely
 * on it there. Instead fetch the admin's own settings for that request and pass an
 * explicit override: `formatDate(x, { format: cfg.pref_format_date, timezone: cfg.pref_fuseau })`.
 */

export type DateFormatPref = 'JJ/MM/AAAA' | 'MM/JJ/AAAA' | 'AAAA-MM-JJ';

export interface DatePrefs {
  format:   DateFormatPref;
  timezone: string;
}

export const DEFAULT_DATE_PREFS: DatePrefs = { format: 'JJ/MM/AAAA', timezone: 'Africa/Abidjan' };

let prefs: DatePrefs = { ...DEFAULT_DATE_PREFS };

export function setDatePrefs(partial: { format?: string; timezone?: string }): void {
  const format = (['JJ/MM/AAAA', 'MM/JJ/AAAA', 'AAAA-MM-JJ'] as string[]).includes(partial.format ?? '')
    ? (partial.format as DateFormatPref)
    : prefs.format;
  prefs = { format, timezone: partial.timezone || prefs.timezone };
}

export function getDatePrefs(): DatePrefs {
  return prefs;
}

/** Builds a safe DatePrefs from raw /api/admin/settings values — for server-side explicit overrides. */
export function toDatePrefs(raw: { pref_format_date?: string; pref_fuseau?: string }): DatePrefs {
  const format = (['JJ/MM/AAAA', 'MM/JJ/AAAA', 'AAAA-MM-JJ'] as string[]).includes(raw.pref_format_date ?? '')
    ? (raw.pref_format_date as DateFormatPref)
    : DEFAULT_DATE_PREFS.format;
  return { format, timezone: raw.pref_fuseau || DEFAULT_DATE_PREFS.timezone };
}

function datePartsFor(d: Date, tz: string): { day: string; month: string; year: string } {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric',
  }).formatToParts(d);
  return {
    day:   parts.find(p => p.type === 'day')?.value   ?? '--',
    month: parts.find(p => p.type === 'month')?.value ?? '--',
    year:  parts.find(p => p.type === 'year')?.value  ?? '----',
  };
}

/** Numeric date only, e.g. "07/07/2026" — order follows the format preference (module default, or `override`). */
export function formatDate(input: string | Date | null | undefined, override?: DatePrefs): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '—';
  const p = override ?? prefs;
  const { day, month, year } = datePartsFor(d, p.timezone);
  switch (p.format) {
    case 'MM/JJ/AAAA': return `${month}/${day}/${year}`;
    case 'AAAA-MM-JJ': return `${year}-${month}-${day}`;
    default:           return `${day}/${month}/${year}`;
  }
}

/** Date + time, e.g. "07/07/2026 14:32". */
export function formatDateTime(input: string | Date | null | undefined, override?: DatePrefs): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '—';
  const p = override ?? prefs;
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone: p.timezone, hour: '2-digit', minute: '2-digit' }).format(d);
  return `${formatDate(d, override)} ${time}`;
}

/** Long-form date, e.g. "7 juillet 2026" — used for prose/receipts, not tables. */
export function formatDateLong(input: string | Date | null | undefined, override?: DatePrefs): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '—';
  const p = override ?? prefs;
  return new Intl.DateTimeFormat('fr-FR', { timeZone: p.timezone, day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
