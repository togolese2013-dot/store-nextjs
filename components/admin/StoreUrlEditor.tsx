"use client";

import { useState } from "react";
import {
  Globe, Edit2, Check, X, Copy, CheckCheck,
  ExternalLink, Share2,
} from "lucide-react";

/* ── WhatsApp SVG icon ── */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/>
  </svg>
);

interface Props {
  initialUrl:       string;
  initialShareText: string;
}

export default function StoreUrlEditor({ initialUrl, initialShareText }: Props) {
  const [url,       setUrl]       = useState(initialUrl);
  const [editUrl,   setEditUrl]   = useState(false);
  const [urlDraft,  setUrlDraft]  = useState(initialUrl);
  const [savingUrl, setSavingUrl] = useState(false);

  const [shareText,       setShareText]       = useState(initialShareText);
  const [editShare,       setEditShare]       = useState(false);
  const [shareDraft,      setShareDraft]      = useState(initialShareText);
  const [savingShare,     setSavingShare]     = useState(false);

  const [copied, setCopied] = useState(false);

  async function saveSettings(payload: Record<string, string>) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
  }

  async function handleSaveUrl() {
    setSavingUrl(true);
    await saveSettings({ site_url: urlDraft.trim() });
    setUrl(urlDraft.trim());
    setEditUrl(false);
    setSavingUrl(false);
  }

  async function handleSaveShare() {
    setSavingShare(true);
    await saveSettings({ store_share_text: shareDraft });
    setShareText(shareDraft);
    setEditShare(false);
    setSavingShare(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl  = encodeURIComponent(url);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── URL du site ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-bold text-sm text-slate-800">URL du site</p>
        </div>

        {editUrl ? (
          <div className="space-y-2">
            <input
              type="url"
              value={urlDraft}
              onChange={e => setUrlDraft(e.target.value)}
              placeholder="https://votre-site.com"
              className="w-full px-3 py-2 text-sm rounded-xl border-2 border-emerald-400 focus:outline-none bg-slate-50 font-mono"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveUrl}
                disabled={savingUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                {savingUrl ? "Sauvegarde…" : "Enregistrer"}
              </button>
              <button
                onClick={() => { setEditUrl(false); setUrlDraft(url); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <a
              href={url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-700 font-mono font-semibold hover:underline truncate"
            >
              {url || <span className="text-slate-400 italic">Non défini</span>}
              {url && <ExternalLink className="w-3.5 h-3.5 shrink-0" />}
            </a>
            <button
              onClick={() => { setEditUrl(true); setUrlDraft(url); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              title="Modifier"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Partager le lien ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="font-bold text-sm text-slate-800">Partager le site</p>
          </div>
          {!editShare && (
            <button
              onClick={() => { setEditShare(true); setShareDraft(shareText); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Modifier le texte"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editShare ? (
          <div className="space-y-2">
            <textarea
              value={shareDraft}
              onChange={e => setShareDraft(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border-2 border-emerald-400 focus:outline-none bg-slate-50 resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveShare}
                disabled={savingShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                {savingShare ? "Sauvegarde…" : "Enregistrer"}
              </button>
              <button
                onClick={() => { setEditShare(false); setShareDraft(shareText); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Annuler
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl px-3 py-2 mb-3 min-h-[60px]">
            {shareText || <span className="text-slate-400 italic">Aucun texte défini — cliquez sur modifier</span>}
          </p>
        )}

        {/* Actions de partage */}
        {!editShare && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                copied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié !" : "Copier"}
            </button>

            <a
              href={`https://wa.me/?text=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 flex items-center justify-center transition-colors"
              title="Partager sur WhatsApp"
            >
              <WhatsAppIcon />
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 flex items-center justify-center transition-colors"
              title="Partager sur Facebook"
            >
              <FacebookIcon />
            </a>

            <a
              href={`https://www.tiktok.com/`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCopy}
              className="w-9 h-9 rounded-lg bg-black/5 text-slate-800 hover:bg-black/10 flex items-center justify-center transition-colors"
              title="Copier pour TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        )}
      </div>

    </div>
  );
}
