"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getDevice(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getSessionId(): string {
  const KEY      = "_sid";
  const DURATION = 30 * 60 * 1000;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const { id, ts } = JSON.parse(raw) as { id: string; ts: number };
      if (Date.now() - ts < DURATION) {
        sessionStorage.setItem(KEY, JSON.stringify({ id, ts: Date.now() }));
        return id;
      }
    }
  } catch { /* private browsing */ }
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  try { sessionStorage.setItem(KEY, JSON.stringify({ id, ts: Date.now() })); } catch { /* ignore */ }
  return id;
}

// Persistent visitor ID — survives across sessions (new vs returning)
function getVisitorId(): string {
  const KEY = "_vid";
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
  } catch { /* private browsing */ }
  const id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
  return id;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/livreur")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const referrer = document.referrer
      ? new URL(document.referrer).hostname
      : "";

    fetch("/api/analytics/hit", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page:       pathname,
        referrer:   referrer || null,
        device:     getDevice(),
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
