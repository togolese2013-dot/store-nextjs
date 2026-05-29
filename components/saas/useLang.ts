'use client';
import { useState, useEffect, useCallback } from 'react';

export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'afrisika_lang';
const EVENT_NAME  = 'afrisika:lang';

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    // Read saved preference on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') setLangState(saved);

    // Listen for changes from other components
    const handler = (e: Event) => {
      const l = (e as CustomEvent<Lang>).detail;
      if (l === 'fr' || l === 'en') setLangState(l);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: l }));
  }, []);

  return [lang, setLang];
}
