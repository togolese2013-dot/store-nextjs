"use client";

import { useEffect, useState } from "react";
import {
  Globe, CheckCircle, XCircle, AlertTriangle,
  Trash2, RefreshCw, Copy, ExternalLink, Info,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface DomainInfo {
  custom_domain: string | null;
  slug:          string;
  vercel: {
    configured:    boolean;
    verification?: { type: string; domain: string; value: string }[];
  };
}

interface VerificationRecord {
  type:   string;
  domain: string;
  value:  string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className="ml-2 text-gray-400 hover:text-indigo-600 transition">
      {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DomainePage() {
  const [info,        setInfo]        = useState<DomainInfo | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [removing,    setRemoving]    = useState(false);
  const [domain,      setDomain]      = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationRecord[]>([]);

  async function fetchInfo() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/api/admin/settings/domain`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setInfo(data);
      if (data.custom_domain) setDomain(data.custom_domain);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInfo(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    setVerification([]);
    try {
      const res  = await fetch(`${API}/api/admin/settings/domain`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (data.verification?.length) {
        setVerification(data.verification);
        setSuccess("Domaine enregistré. Ajoutez les enregistrements DNS ci-dessous pour valider.");
      } else {
        setSuccess("Domaine configuré avec succès !");
      }
      await fetchInfo();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Supprimer le domaine personnalisé ?")) return;
    setRemoving(true);
    setError(null);
    setSuccess(null);
    try {
      const res  = await fetch(`${API}/api/admin/settings/domain`, {
        method:      "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setSuccess("Domaine supprimé.");
      setDomain("");
      setVerification([]);
      await fetchInfo();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setRemoving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Globe size={20} className="text-indigo-600" />
          Domaine personnalisé
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connectez votre propre domaine (ex: <code className="bg-gray-100 px-1 rounded">monshop.com</code>) à votre boutique.
        </p>
      </div>

      {/* Current status */}
      {!loading && info && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          info.custom_domain
            ? info.vercel.configured
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
            : "bg-gray-50 border-gray-200"
        }`}>
          {info.custom_domain ? (
            info.vercel.configured
              ? <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
              : <AlertTriangle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
          ) : (
            <Info size={18} className="text-gray-400 mt-0.5 shrink-0" />
          )}
          <div className="text-sm">
            {info.custom_domain ? (
              <>
                <p className="font-medium text-gray-800">
                  {info.custom_domain}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    info.vercel.configured
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {info.vercel.configured ? "✓ Actif" : "DNS en attente"}
                  </span>
                </p>
                <p className="text-gray-500 mt-0.5">
                  Sous-domaine : <code className="bg-white px-1 rounded border">{info.slug}.togolese.tg</code>
                </p>
              </>
            ) : (
              <p className="text-gray-500">
                Aucun domaine personnalisé. Votre boutique est accessible via{" "}
                <code className="bg-white px-1 rounded border">{info.slug}.togolese.tg</code>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Votre domaine</span>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="monshop.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="submit"
              disabled={saving || !domain.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
              {saving ? "En cours…" : "Configurer"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Sans http:// ni www. — ex: <code>monshop.com</code></p>
        </label>

        {error   && <p className="text-sm text-red-600 flex items-center gap-1"><XCircle size={14} />{error}</p>}
        {success && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={14} />{success}</p>}
      </form>

      {/* DNS instructions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Configuration DNS requise</h2>
        <p className="text-xs text-gray-500">
          Ajoutez ces enregistrements chez votre registrar (Gandi, OVH, Namecheap, Cloudflare…)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Type</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Nom</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Valeur</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-3 py-2 font-mono font-semibold text-indigo-700">CNAME</td>
                <td className="px-3 py-2 font-mono text-gray-700">
                  @ <span className="text-gray-400">(ou www)</span>
                </td>
                <td className="px-3 py-2 font-mono text-gray-700 flex items-center">
                  cname.vercel-dns.com
                  <CopyBtn text="cname.vercel-dns.com" />
                </td>
              </tr>
              {/* Dynamic verification records (if Vercel requires ownership check) */}
              {verification.map((v, i) => (
                <tr key={i} className="border-b border-gray-100 bg-yellow-50">
                  <td className="px-3 py-2 font-mono font-semibold text-yellow-700">{v.type}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{v.domain}<CopyBtn text={v.domain} /></td>
                  <td className="px-3 py-2 font-mono text-gray-700">{v.value}<CopyBtn text={v.value} /></td>
                </tr>
              ))}
              {/* Show pending verification from DB */}
              {!verification.length && info?.vercel.verification?.map((v, i) => (
                <tr key={i} className="border-b border-gray-100 bg-yellow-50">
                  <td className="px-3 py-2 font-mono font-semibold text-yellow-700">{v.type}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{v.domain}<CopyBtn text={v.domain} /></td>
                  <td className="px-3 py-2 font-mono text-gray-700">{v.value}<CopyBtn text={v.value} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>La propagation DNS peut prendre jusqu&apos;à 48h. Le SSL est automatiquement activé par Vercel une fois validé.</span>
        </div>
      </div>

      {/* Remove domain */}
      {info?.custom_domain && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">Supprimer le domaine personnalisé</p>
            <p className="text-xs text-red-500 mt-0.5">La boutique redeviendra accessible uniquement via le sous-domaine.</p>
          </div>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {removing ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Supprimer
          </button>
        </div>
      )}

      {/* External links */}
      <div className="text-xs text-gray-400 flex gap-4">
        <a
          href="https://vercel.com/docs/projects/domains/add-a-domain"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1 hover:text-indigo-600"
        >
          <ExternalLink size={11} /> Docs Vercel — Domaines
        </a>
      </div>
    </div>
  );
}
