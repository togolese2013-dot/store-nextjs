"use client";

import { useEffect } from "react";

const WIDGET_CSS = `
/* ── Séréna Widget — Togolese Design ─────────────────────── */
#serena-widget * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;
}

/* ── Bouton flottant ───────────────────────────────────────── */
#serena-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(21,128,61,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#serena-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(21,128,61,0.55);
}
#serena-btn svg { width: 26px; height: 26px; fill: #ffffff; }

/* ── Badge ─────────────────────────────────────────────────── */
#serena-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #f59e0b;
  border-radius: 50%;
  border: 2px solid #fff;
  display: none;
}

/* ── Fenêtre de chat ───────────────────────────────────────── */
#serena-window {
  position: fixed;
  bottom: 92px;
  right: 24px;
  width: 360px;
  height: 520px;
  max-height: calc(100dvh - 110px);
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 48px rgba(21,128,61,0.18), 0 2px 12px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  z-index: 9998;
  overflow: hidden;
  transform: scale(0.88) translateY(16px);
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(21,128,61,0.12);
}
#serena-window.open {
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: all;
}

/* ── En-tête ───────────────────────────────────────────────── */
#serena-header {
  background: linear-gradient(135deg, #14532d 0%, #15803d 60%, #16a34a 100%);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
#serena-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.3);
}
#serena-header-info { flex: 1; min-width: 0; }
#serena-header-name {
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
}
#serena-header-status {
  color: rgba(255,255,255,0.75);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 1px;
}
#serena-header-status::before {
  content: '';
  width: 7px;
  height: 7px;
  background: #4ade80;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(74,222,128,0.3);
}
#serena-close {
  background: rgba(255,255,255,0.15);
  border: none;
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
#serena-close:hover {
  background: rgba(255,255,255,0.25);
  color: #fff;
}

/* ── Messages ──────────────────────────────────────────────── */
#serena-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafb;
  scroll-behavior: smooth;
}
#serena-messages::-webkit-scrollbar { width: 4px; }
#serena-messages::-webkit-scrollbar-track { background: transparent; }
#serena-messages::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 4px; }

.serena-msg {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.55;
  word-wrap: break-word;
  word-break: break-word;
}
.serena-msg.bot {
  background: #fff;
  color: #0f1629;
  align-self: flex-start;
  border-bottom-left-radius: 5px;
  box-shadow: 0 1px 4px rgba(21,128,61,0.08);
  border: 1px solid rgba(21,128,61,0.08);
}
.serena-msg.user {
  background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 5px;
  box-shadow: 0 2px 8px rgba(21,128,61,0.25);
}

/* ── Indicateur frappe ─────────────────────────────────────── */
.serena-typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 18px;
  border-bottom-left-radius: 5px;
  align-self: flex-start;
  box-shadow: 0 1px 4px rgba(21,128,61,0.08);
  border: 1px solid rgba(21,128,61,0.08);
}
.serena-typing span {
  width: 7px;
  height: 7px;
  background: #86efac;
  border-radius: 50%;
  animation: serena-bounce 1.2s infinite;
}
.serena-typing span:nth-child(2) { animation-delay: 0.2s; }
.serena-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes serena-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); background: #16a34a; }
}

/* ── Saisie ────────────────────────────────────────────────── */
#serena-input-area {
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid rgba(21,128,61,0.1);
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
}
#serena-input {
  flex: 1;
  border: 1.5px solid #dcfce7;
  border-radius: 20px;
  padding: 9px 14px;
  font-size: 14px;
  color: #0f1629;
  outline: none;
  resize: none;
  max-height: 80px;
  line-height: 1.4;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #f0fdf4;
}
#serena-input:focus {
  border-color: #16a34a;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(21,128,61,0.1);
}
#serena-input::placeholder { color: #86efac; }

#serena-send {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #15803d, #16a34a);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(21,128,61,0.3);
}
#serena-send:hover { opacity: 0.9; transform: scale(1.06); }
#serena-send:disabled { background: #dcfce7; box-shadow: none; cursor: not-allowed; transform: none; }
#serena-send svg { width: 16px; height: 16px; fill: #fff; }
#serena-send:disabled svg { fill: #86efac; }

/* ── Message bienvenue ─────────────────────────────────────── */
#serena-welcome {
  text-align: center;
  color: #86efac;
  font-size: 12px;
  padding: 2px 0 6px;
}

/* ── Mobile ────────────────────────────────────────────────── */
@media (max-width: 480px) {
  #serena-btn {
    bottom: 16px;
    right: 16px;
    width: 52px;
    height: 52px;
  }
  #serena-window {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    bottom: 0;
    right: 0;
    border-radius: 0;
    border-radius: 20px 20px 0 0;
    transform: translateY(100%);
    opacity: 1;
  }
  #serena-window.open {
    transform: translateY(0);
  }
}
`;

export default function WhatsAppButton() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "serena-widget-css";
    style.textContent = WIDGET_CSS;
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.src = "/static/widget.js";
    document.body.appendChild(script);

    return () => {
      document.getElementById("serena-widget-css")?.remove();
      document.getElementById("serena-widget")?.remove();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  return null;
}
