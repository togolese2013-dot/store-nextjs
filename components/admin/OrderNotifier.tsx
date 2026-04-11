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
    // Two-tone ding: 880Hz then 1100Hz
    playBeep(880,  0,    0.15);
    playBeep(1100, 0.18, 0.2);
  } catch {
    // AudioContext blocked (e.g. no user interaction yet) — silent fail
  }
}

export default function OrderNotifier() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const esRef      = useRef<EventSource | null>(null);
  const sinceRef   = useRef<string>("");
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const order: NewOrder = JSON.parse(e.data);
        // Update since pointer
        sinceRef.current = order.created_at;

        // Play sound
        playNotificationSound();

        // Add toast
        const toastId = ++toastIdRef.current;
        setToasts(prev => [...prev, { id: toastId, order }]);

        // Auto-dismiss after 8s
        setTimeout(() => removeToast(toastId), 8000);
      } catch { /* malformed data */ }
    };

    es.addEventListener("heartbeat", () => {
      // Connection alive — no action needed
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 5s
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
