"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, ShoppingBag, X } from "lucide-react";
import { useAdminSSE } from "./useAdminSSE";

interface WaToast {
  id:        number;
  type:      "message" | "order";
  from:      string;
  nom:       string;
  body:      string;
  reference?: string;
  total?:    number;
}

const AudioCtxClass =
  typeof window !== "undefined"
    ? (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    : undefined;

let _ctx: AudioContext | null = null;
let _unlocked = false;

function getCtx(): AudioContext | null {
  if (!AudioCtxClass) return null;
  if (!_ctx) { try { _ctx = new AudioCtxClass(); } catch { return null; } }
  return _ctx;
}

// iOS/Android : jouer un buffer silencieux PENDANT le geste déverrouille l'audio
// pour tous les appels futurs (même hors geste).
function unlockAudioOnGesture() {
  if (_unlocked) return;
  const ctx = getCtx();
  if (!ctx) return;
  ctx.resume().then(() => {
    const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    _unlocked = true;
  }).catch(() => {});
}

async function playMessageSound() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    const beep = (freq: number, t: number, dur: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur);
    };
    beep(660,  0,    0.12);
    beep(880,  0.15, 0.12);
    beep(1100, 0.30, 0.18);
  } catch { /* blocked */ }
}

function showNativeNotification(nom: string, body: string, phone: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification("💬 Nouveau message WhatsApp", {
      body:     `${nom} : ${body}`,
      icon:     "/icons/icon-192.png",
      tag:      `wa-${phone}`,
      renotify: true,
    } as NotificationOptions);
    n.onclick = () => {
      window.focus();
      window.location.href = `/admin/whatsapp/${encodeURIComponent(phone)}`;
      n.close();
    };
  } catch { /* blocked */ }
}

function showOrderNotification(reference: string, nom: string, total: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification("🛍️ Nouvelle commande !", {
      body:     `${reference} — ${nom} — ${total.toLocaleString("fr-FR")} F CFA`,
      icon:     "/icons/icon-192.png",
      tag:      `order-${reference}`,
      renotify: true,
    } as NotificationOptions);
    n.onclick = () => {
      window.focus();
      window.location.href = "/admin/orders";
      n.close();
    };
  } catch { /* blocked */ }
}

export default function MessageNotifier() {
  const [toasts,  setToasts]  = useState<WaToast[]>([]);
  const [unread,  setUnread]  = useState(0);
  const toastIdRef            = useRef(0);
  const { subscribe }         = useAdminSSE();

  // Déverrouille l'audio + demande permission notification au premier geste
  useEffect(() => {
    // `once: false` — on écoute plusieurs gestes au cas où le premier échoue
    const onGesture = () => unlockAudioOnGesture();
    window.addEventListener("click",      onGesture, { passive: true });
    window.addEventListener("touchstart", onGesture, { passive: true });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      window.addEventListener("click", () => Notification.requestPermission(), { once: true });
    }

    return () => {
      window.removeEventListener("click",      onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
  }, []);

  // Badge on title
  useEffect(() => {
    const base = document.title.replace(/^\[💬\d+\]\s/, "");
    document.title = unread > 0 ? `[💬${unread}] ${base}` : base;
  }, [unread]);

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

  // Ferme le toast quand la conversation correspondante est ouverte (depuis la page inbox)
  useEffect(() => {
    const handler = (e: Event) => {
      const phone = (e as CustomEvent<{ phone: string }>).detail?.phone;
      if (!phone) return;
      setToasts(prev => prev.filter(t => t.from !== phone));
    };
    window.addEventListener("wa-conversation-opened", handler);
    return () => window.removeEventListener("wa-conversation-opened", handler);
  }, []);

  useEffect(() => {
    return subscribe((data) => {
      // Inbound WhatsApp message
      if (data.type === "message" && data.from && data.type_action !== "sent") {
        const from = String(data.from ?? "");
        const nom  = String(data.nom  ?? from);
        const body = String(data.body ?? "");

        playMessageSound();
        showNativeNotification(nom, body, from);

        if (document.visibilityState !== "visible") setUnread(prev => prev + 1);

        const toastId = ++toastIdRef.current;
        setToasts(prev => [...prev, { id: toastId, type: "message", from, nom, body }]);
      }

      // New order
      if (data.type === "commande" && data.reference) {
        const reference = String(data.reference ?? "");
        const nom       = String(data.nom   ?? "Client");
        const total     = Number(data.total ?? 0);

        playMessageSound();
        showOrderNotification(reference, nom, total);

        if (document.visibilityState !== "visible") setUnread(prev => prev + 1);

        const toastId = ++toastIdRef.current;
        setToasts(prev => [...prev, { id: toastId, type: "order", from: reference, nom, body: `${total.toLocaleString("fr-FR")} F CFA`, reference, total }]);
        setTimeout(() => removeToast(toastId), 8000);
      }
    });
  }, [subscribe, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 right-5 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-3.5 w-80 animate-fade-up"
        >
          {toast.type === "order" ? (
            <>
              <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-0.5">
                  Nouvelle commande !
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">{toast.reference}</p>
                <p className="text-xs text-slate-500 truncate">{toast.nom} — {toast.body}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0 items-end">
                <button onClick={() => removeToast(toast.id)} aria-label="Fermer"
                  className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
                <a href="/admin/orders" onClick={() => removeToast(toast.id)}
                  className="text-[10px] font-bold text-emerald-600 hover:underline">
                  Voir →
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-0.5">
                  Message WhatsApp
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">{toast.nom}</p>
                <p className="text-xs text-slate-500 truncate">{toast.body}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0 items-end">
                <button onClick={() => removeToast(toast.id)} aria-label="Fermer"
                  className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
                <a href={`/admin/whatsapp/${encodeURIComponent(toast.from)}`} onClick={() => removeToast(toast.id)}
                  className="text-[10px] font-bold text-amber-600 hover:underline">
                  Répondre →
                </a>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
