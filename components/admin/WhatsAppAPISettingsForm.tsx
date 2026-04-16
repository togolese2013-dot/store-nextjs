"use client";

import { useState } from "react";
import { Loader2, Save, ExternalLink, Copy, Check } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans font-mono";
const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";

export default function WhatsAppAPISettingsForm({ settings }: { settings: Record<string, string> }) {
  const [phoneId,   setPhoneId]   = useState(settings.wa_phone_number_id     ?? "");
  const [token,     setToken]     = useState(settings.wa_access_token        ?? "");
  const [verifyTok, setVerifyTok] = useState(settings.wa_webhook_verify_token ?? "");
  const [bizId,     setBizId]     = useState(settings.wa_business_account_id ?? "");
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");
  const [copied,    setCopied]    = useState(false);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/admin/whatsapp/webhook`
    : "/api/admin/whatsapp/webhook";

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        wa_phone_number_id:     phoneId,
        wa_access_token:        token,
        wa_webhook_verify_token: verifyTok,
        wa_business_account_id: bizId,
      }),
    });
    setLoading(false);
    setMsg(res.ok ? "Configuration sauvegardée ✓" : "Erreur lors de la sauvegarde");
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Guide */}
      <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
        <h3 className="font-bold text-brand-900 text-sm mb-2">Comment configurer WhatsApp Cloud API ?</h3>
        <ol className="text-xs text-brand-800 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Créez un compte <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline font-semibold">Meta for Developers</a></li>
          <li>Créez une app Meta → Type : Business → Ajoutez le produit "WhatsApp"</li>
          <li>Dans WhatsApp → Configuration, copiez le <strong>Phone Number ID</strong> et l'<strong>Access Token</strong></li>
          <li>Configurez le Webhook avec l'URL ci-dessous et votre token de vérification</li>
          <li>Abonnez-vous aux événements : <code className="bg-brand-100 px-1 rounded">messages</code></li>
        </ol>
        <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-brand-700 hover:text-brand-900"
        >
          Documentation officielle <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {/* Webhook URL */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">URL du Webhook</h2>
        <div>
          <label className={labelCls}>Copiez cette URL dans Meta Dashboard → Webhook URL</label>
          <div className="flex gap-2">
            <input type="text" readOnly value={webhookUrl}
              className={`${inputCls} bg-slate-50 text-slate-600`}
            />
            <button onClick={copyWebhook}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 transition-colors flex items-center gap-2 shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Identifiants API</h2>
        <div>
          <label className={labelCls}>Phone Number ID</label>
          <input type="text" value={phoneId} onChange={e => setPhoneId(e.target.value)}
            placeholder="123456789012345" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Access Token (Bearer)</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            placeholder="EAAxxxxx…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Business Account ID (WABA ID)</label>
          <input type="text" value={bizId} onChange={e => setBizId(e.target.value)}
            placeholder="123456789012345" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Token de vérification du webhook (choisissez-le vous-même)</label>
          <input type="text" value={verifyTok} onChange={e => setVerifyTok(e.target.value)}
            placeholder="mon-token-secret-2024" className={inputCls} />
        </div>
      </div>

      <button onClick={save} disabled={loading}
        className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? "Enregistrement…" : "Sauvegarder la configuration"}
      </button>
    </div>
  );
}
