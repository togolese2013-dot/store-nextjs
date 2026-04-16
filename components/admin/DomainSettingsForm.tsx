"use client";

import { useState } from "react";
import { Loader2, Save, Copy, CheckCircle, Globe, Server, AlertCircle } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-sans";
const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";

interface DnsRecord {
  type:  string;
  name:  string;
  value: string;
  ttl:   string;
}

export default function DomainSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [siteUrl,    setSiteUrl]    = useState(settings.site_url      ?? "https://store.togolese.net");
  const [customDomain, setCustomDomain] = useState(settings.custom_domain ?? "");
  const [serverIp,   setServerIp]   = useState(settings.server_ip    ?? "");
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState("");
  const [copied,     setCopied]     = useState<string | null>(null);

  const domainToUse = (customDomain || siteUrl).replace(/^https?:\/\//, "").split("/")[0];

  const dnsRecords: DnsRecord[] = [
    {
      type:  "A",
      name:  "@",
      value: serverIp || "IP_DE_VOTRE_SERVEUR",
      ttl:   "3600",
    },
    {
      type:  "A",
      name:  "www",
      value: serverIp || "IP_DE_VOTRE_SERVEUR",
      ttl:   "3600",
    },
    {
      type:  "CNAME",
      name:  "store",
      value: "cname.vercel-dns.com",
      ttl:   "3600",
    },
  ];

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        site_url:      siteUrl,
        custom_domain: customDomain,
        server_ip:     serverIp,
      }),
    });
    setLoading(false);
    setMsg(res.ok ? "Réglages sauvegardés ✓" : "Erreur lors de la sauvegarde");
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {/* URL Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-700" /> URL du site
        </h2>

        <div>
          <label className={labelCls}>URL principale (production)</label>
          <input type="url" value={siteUrl}
            onChange={e => setSiteUrl(e.target.value)}
            placeholder="https://store.togolese.net"
            className={inputCls}
          />
          <p className="text-xs text-slate-400 mt-1">Utilisée pour les métadonnées Open Graph, les sitemap et les liens dans les e-mails.</p>
        </div>

        <div>
          <label className={labelCls}>Nom de domaine personnalisé (optionnel)</label>
          <input type="text" value={customDomain}
            onChange={e => setCustomDomain(e.target.value)}
            placeholder="shop.mondomaine.tg"
            className={inputCls}
          />
          <p className="text-xs text-slate-400 mt-1">Entrez uniquement le domaine, sans http://</p>
        </div>

        <div>
          <label className={labelCls}>Adresse IP du serveur (pour les enregistrements DNS)</label>
          <input type="text" value={serverIp}
            onChange={e => setServerIp(e.target.value)}
            placeholder="185.XXX.XXX.XXX"
            className={inputCls}
          />
        </div>
      </div>

      {/* DNS Instructions */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-brand-700" /> Enregistrements DNS
        </h2>

        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-bold">Configuration chez votre registrar DNS</p>
            <p className="mt-0.5">Ajoutez ces enregistrements dans l'interface de gestion DNS de votre nom de domaine
              (OVH, Namecheap, Gandi, etc.). La propagation peut prendre jusqu'à 48 h.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left font-bold text-slate-500 pb-2 pr-4">Type</th>
                <th className="text-left font-bold text-slate-500 pb-2 pr-4">Nom</th>
                <th className="text-left font-bold text-slate-500 pb-2 pr-4">Valeur</th>
                <th className="text-left font-bold text-slate-500 pb-2">TTL</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dnsRecords.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                      rec.type === "A"     ? "bg-blue-50 text-blue-700" :
                      rec.type === "CNAME" ? "bg-purple-50 text-purple-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{rec.type}</span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-slate-700">{rec.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-700 max-w-[180px] truncate">{rec.value}</td>
                  <td className="py-2.5 text-slate-500">{rec.ttl}</td>
                  <td className="py-2.5 pl-2">
                    <button
                      onClick={() => copyToClipboard(rec.value, `${i}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      title="Copier la valeur"
                    >
                      {copied === `${i}` ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <p className="text-xs font-bold text-slate-600 mb-2">Domaine concerné</p>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-mono text-sm font-bold text-brand-800">{domainToUse}</span>
            <button
              onClick={() => copyToClipboard(domainToUse, "domain")}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
            >
              {copied === "domain" ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* SSL Note */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Certificat SSL</h2>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">HTTPS automatique via Vercel / Let's Encrypt</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Une fois le DNS propagé et le domaine ajouté dans votre projet Vercel (ou votre hébergeur),
              le certificat SSL est provisionné automatiquement. Aucune action manuelle requise.
            </p>
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-500 space-y-1 pl-11">
          <p className="font-semibold text-slate-700">Étapes pour Vercel :</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Ouvrez votre projet sur <span className="font-mono">vercel.com</span></li>
            <li>Allez dans <strong>Settings → Domains</strong></li>
            <li>Ajoutez votre domaine personnalisé</li>
            <li>Vercel affichera les enregistrements DNS à configurer</li>
            <li>Une fois propagé, HTTPS est activé automatiquement</li>
          </ol>
        </div>
      </div>

      <button onClick={save} disabled={loading}
        className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? "Enregistrement…" : "Sauvegarder"}
      </button>
    </div>
  );
}
