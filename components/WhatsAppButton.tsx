"use client";

import { useEffect } from "react";

const BASE = "https://serena-togolese-production.up.railway.app";

export default function WhatsAppButton() {
  useEffect(() => {
    // Inline the CSS immediately — no async loading, no URL detection issue
    const style = document.createElement("style");
    style.id = "serena-widget-style";
    style.textContent = `
/* Séréna Chat Widget — Togolese */
#serena-widget*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
#serena-btn{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:#1C1C1E;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:9999;transition:transform .2s ease,box-shadow .2s ease}
#serena-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.4)}
#serena-btn svg{width:28px;height:28px;fill:#E8A320}
#serena-badge{position:absolute;top:-2px;right:-2px;width:18px;height:18px;background:#E8A320;border-radius:50%;border:2px solid #fff;display:none}
#serena-window{position:fixed;bottom:96px;right:24px;width:360px;height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;z-index:9998;overflow:hidden;transform:scale(.85) translateY(20px);opacity:0;pointer-events:none;transition:all .25s cubic-bezier(.34,1.56,.64,1)}
#serena-window.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
#serena-header{background:#1C1C1E;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0}
#serena-avatar{width:40px;height:40px;border-radius:50%;background:#E8A320;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
#serena-header-info{flex:1}
#serena-header-name{color:#fff;font-weight:600;font-size:15px}
#serena-header-status{color:#8E8E93;font-size:12px;display:flex;align-items:center;gap:4px}
#serena-header-status::before{content:'';width:7px;height:7px;background:#30D158;border-radius:50%;display:inline-block}
#serena-close{background:none;border:none;color:#8E8E93;cursor:pointer;padding:4px;display:flex;align-items:center;border-radius:6px;transition:color .15s}
#serena-close:hover{color:#fff}
#serena-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F2F2F7;scroll-behavior:smooth}
#serena-messages::-webkit-scrollbar{width:4px}
#serena-messages::-webkit-scrollbar-track{background:transparent}
#serena-messages::-webkit-scrollbar-thumb{background:#C7C7CC;border-radius:2px}
.serena-msg{max-width:82%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}
.serena-msg.bot{background:#fff;color:#1C1C1E;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.serena-msg.user{background:#1C1C1E;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.serena-typing{display:flex;align-items:center;gap:5px;padding:10px 14px;background:#fff;border-radius:16px;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.serena-typing span{width:7px;height:7px;background:#C7C7CC;border-radius:50%;animation:serena-bounce 1.2s infinite}
.serena-typing span:nth-child(2){animation-delay:.2s}
.serena-typing span:nth-child(3){animation-delay:.4s}
@keyframes serena-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px);background:#E8A320}}
#serena-input-area{padding:12px;background:#fff;border-top:1px solid #E5E5EA;display:flex;gap:8px;align-items:flex-end;flex-shrink:0}
#serena-input{flex:1;border:1.5px solid #E5E5EA;border-radius:20px;padding:9px 14px;font-size:14px;color:#1C1C1E;outline:none;resize:none;max-height:80px;line-height:1.4;transition:border-color .15s;background:#F2F2F7}
#serena-input:focus{border-color:#E8A320;background:#fff}
#serena-input::placeholder{color:#8E8E93}
#serena-send{width:38px;height:38px;border-radius:50%;background:#E8A320;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .15s}
#serena-send:hover{background:#d4941c;transform:scale(1.05)}
#serena-send:disabled{background:#C7C7CC;cursor:not-allowed;transform:none}
#serena-send svg{width:16px;height:16px;fill:#fff}
#serena-welcome{text-align:center;color:#8E8E93;font-size:12px;padding:4px 0 8px}
@media(max-width:420px){#serena-window{width:calc(100vw - 20px);right:10px;bottom:84px}#serena-btn{right:16px;bottom:16px}}
    `;
    document.head.appendChild(style);

    // Load script after CSS is guaranteed in DOM
    const script = document.createElement("script");
    script.src = `${BASE}/static/widget.js`;
    document.body.appendChild(script);

    return () => {
      document.getElementById("serena-widget-style")?.remove();
      document.getElementById("serena-widget")?.remove();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  return null;
}
