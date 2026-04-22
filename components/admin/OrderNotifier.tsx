"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface NewOrder {
  id:         number;
  reference:  string;
  nom:        string;
  total:      number;
  created_at: string;
}

interface Toast {
  id:    number;
  order: NewOrder;
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const playBeep = (freq: number, start: number, duration: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type      = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playBeep(880,  0,    0.15);
    playBeep(1100, 0.18, 0.2);
  } catch {
    // AudioContext blocked — silent fail
  }
}

function showNativeNotification(order: NewOrder) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification("🛍️ Nouvelle commande", {
      body: `${order.reference} · ${order.nom || "Client"} · ${formatPrice(order.total)}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: `order-${order.id}`,   // replace previous notif for the same order
      renotify: true,
    } as NotificationOptions);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch { /* blocked */ }
}

function vibrate() {
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported */ }
}

export default function OrderNotifier() {
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [unread, setUnread]       = useState(0);
  const toastIdRef                = useRef(0);
  const esRef                     = useRef<EventSource | null>(null);
  const sinceRef                  = useRef<string>("");
  const retryTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalTitleRef          = useRef<string>("");

  // ── Request notification permission once (needs prior user gesture) ──────
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Defer to first user interaction so browsers don't block the prompt
      const requestOnce = () => {
        Notification.requestPermission();
        window.removeEventListener("click", requestOnce);
      };
      window.addEventListener("click", requestOnce, { once: true });
    }
  }, []);

  // ── Badge: update document title with unread count ───────────────────────
  useEffect(() => {
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title;
    }
    if (unread > 0) {
      document.title = `(${unread}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [unread]);

  // ── Reset unread when tab becomes visible ────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setUnread(0);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const since = sinceRef.current || new Date().toISOString().slice(0, 19).replace("T", " ");
    const es = new EventSource(`/api/admin/orders/sse?since=${encodeURIComponent(since)}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === "connected" || !data?.id) return;
        const order: NewOrder = data;
        sinceRef.current = order.created_at;

        // Sound + vibration
        playNotificationSound();
        vibrate();

        // Native browser notification (works hors-onglet)
        showNativeNotification(order);

        // Badge on tab title when hidden
        if (document.visibilityState !== "visible") {
          setUnread(prev => prev + 1);
        }

        // In-page toast
        const toastId = ++toastIdRef.current;
        setToasts(prev => [...prev, { id: toastId, order }]);
        setTimeout(() => removeToast(toastId), 8000);
      } catch { /* malformed data */ }
    };

    es.addEventListener("heartbeat", () => { /* keepalive */ });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      retryTimer.current = setTimeout(connect, 5000);
    };
  }, [removeToast]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [connect]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map(({ id, order }) => (
        <div
          key={id}
          className="pointer-events-auto flex items-start gap-3 bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-3.5 w-80 animate-fade-up"
        >
          {/* Icon */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-0.5">
              Nouvelle commande
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {order.reference}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {order.nom || "Client"} · {formatPrice(order.total)}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => removeToast(id)}
            aria-label="Fermer la notification"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
