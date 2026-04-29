"use client";

import { useState } from "react";
import { Loader2, Save, ExternalLink, Copy, Check } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans font-mono";
const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";

export default function WhatsAppAPISettingsForm({ settings }: { settings: Record<string, string> }) {
  const [phoneId,   setPhoneId]   = useState(settings.wa_phone_number_id      ?? "");
  const [token,     setToken]     = useState(settings.wa_access_token         ?? "");
  const [verifyTok, setVerifyTok] = useState(settings.wa_webhook_verify_token ?? "");
  const [bizId,     setBizId]     = useState(settings.wa_business_account_id  ?? "");

  // Notifications automatiques
  const [clientEnabled,  setClientEnabled]  = useState(settings.wa_order_client_enabled  === "1");
  const [adminEnabled,   setAdminEnabled]   = useState(settings.wa_order_admin_enabled   === "1");
  const [clientTemplate, setClientTemplate] = useState(settings.wa_order_client_template ?? "");
  const [adminTemplate,  setAdminTemplate]  = useState(settings.wa_order_admin_template  ?? "");
  const [adminNumber,    setAdminNumber]    = useState(settings.wa_order_admin_number     ?? "");
  const [lang,           setLang]           = useState(settings.wa_order_lang             ?? "fr");

  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [copied,  setCopied]  = useState(false);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/admin/whatsapp/webhook`
    : "/api/admin/whatsapp/webhook";

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        wa_phone_number_id:      phoneId,
        wa_access_token:         token,
        wa_webhook_verify_token: verifyTok,
        wa_business_account_id:  bizId,
        wa_order_client_enabled:  clientEnabled  ? "1" : "0",
        wa_order_admin_enabled:   adminEnabled   ? "1" : "0",
        wa_order_client_template: clientTemplate,
        wa_order_admin_template:  adminTemplate,
        wa_order_admin_number:    adminNumber,
        wa_order_lang:            lang,
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

      {/* Notifications automatiques */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">
          Notifications automatiques à la commande
        </h2>

        {/* Langue */}
        <div>
          <label className={labelCls}>Langue des templates</label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            className={inputCls + " font-sans"}>
            <option value="fr">Français (fr)</option>
            <option value="en">Anglais (en)</option>
            <option value="en_US">Anglais US (en_US)</option>
          </select>
        </div>

        {/* ── Client ── */}
        <div className="rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Notification client</p>
              <p className="text-xs text-slate-400 mt-0.5">Envoyée au numéro du client dès qu'il passe commande</p>
            </div>
            <button onClick={() => setClientEnabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${clientEnabled ? "bg-emerald-500" : "bg-slate-200"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${clientEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          {clientEnabled && (
            <div>
              <label className={labelCls}>Nom du template Meta approuvé</label>
              <input type="text" value={clientTemplate} onChange={e => setClientTemplate(e.target.value)}
                placeholder="ex : confirmation_commande" className={inputCls} />
              <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1 font-mono">
                <p className="font-sans font-semibold text-slate-600 mb-1.5">Variables à déclarer dans Meta :</p>
                <p><span className="text-emerald-600">{"{{1}}"}</span> → Référence commande (ex : CMD-12345)</p>
                <p><span className="text-emerald-600">{"{{2}}"}</span> → Nom du client</p>
                <p><span className="text-emerald-600">{"{{3}}"}</span> → Liste des articles (ex : 2x Robe rouge)</p>
                <p><span className="text-emerald-600">{"{{4}}"}</span> → Total (ex : 45 000 FCFA)</p>
                <p><span className="text-emerald-600">{"{{5}}"}</span> → Lien de suivi</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Admin ── */}
        <div className="rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Notification admin</p>
              <p className="text-xs text-slate-400 mt-0.5">Alerte envoyée sur votre numéro WhatsApp à chaque commande</p>
            </div>
            <button onClick={() => setAdminEnabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${adminEnabled ? "bg-emerald-500" : "bg-slate-200"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${adminEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          {adminEnabled && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Numéro WhatsApp admin (avec indicatif, sans +)</label>
                <input type="text" value={adminNumber} onChange={e => setAdminNumber(e.target.value)}
                  placeholder="ex : 22890123456" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nom du template Meta approuvé</label>
                <input type="text" value={adminTemplate} onChange={e => setAdminTemplate(e.target.value)}
                  placeholder="ex : nouvelle_commande_admin" className={inputCls} />
                <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1 font-mono">
                  <p className="font-sans font-semibold text-slate-600 mb-1.5">Variables à déclarer dans Meta :</p>
                  <p><span className="text-emerald-600">{"{{1}}"}</span> → Référence commande</p>
                  <p><span className="text-emerald-600">{"{{2}}"}</span> → Nom du client</p>
                  <p><span className="text-emerald-600">{"{{3}}"}</span> → Téléphone du client</p>
                  <p><span className="text-emerald-600">{"{{4}}"}</span> → Liste des articles</p>
                  <p><span className="text-emerald-600">{"{{5}}"}</span> → Total</p>
                  <p><span className="text-emerald-600">{"{{6}}"}</span> → Lien vers la commande (admin)</p>
                </div>
              </div>
            </div>
          )}
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
