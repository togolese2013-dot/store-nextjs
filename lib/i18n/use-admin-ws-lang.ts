'use client';

/**
 * Client-only language resolver for the Admin workspace (components/admin-ws).
 * Mirrors the safety pattern used by `lib/format-date.ts`: fetch
 * /api/admin/settings once, cache the resolved language in a module
 * singleton, and read it from every 'use client' component afterwards.
 * Safe because these are all client modules (per-browser-tab), never
 * shared across concurrent server requests.
 */

import { useEffect, useState } from 'react';
import { dict, type Lang, type DictKey } from './admin-ws';

let cachedLang: Lang | null = null;

export function useAdminWsLang(): Lang {
  const [lang, setLang] = useState<Lang>(cachedLang ?? 'fr');

  useEffect(() => {
    if (cachedLang) { setLang(cachedLang); return; }
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(r => r.json())
      .then(cfg => {
        const l: Lang = cfg.pref_langue === 'English' ? 'en' : 'fr';
        cachedLang = l;
        setLang(l);
      })
      .catch(() => { /* keep default 'fr' */ });
  }, []);

  return lang;
}

export function useT() {
  const lang = useAdminWsLang();
  return (key: DictKey): string => dict[lang][key] ?? dict.fr[key] ?? key;
}
