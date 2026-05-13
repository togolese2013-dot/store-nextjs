"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Send, RefreshCw, Phone, Trash2, X,
  Image as ImageIcon, Mic, MicOff, Play, Square,
} from "lucide-react";

type Message = {
  id:           number;
  direction:    "inbound" | "outbound";
  body:         string;
  sent_by:      string | null;
  contact_name: string | null;
  lu:           number;
  media_id:     string | null;
  media_type:   string;
  mime_type:    string | null;
  created_at:   string;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/* ── Bulle image ────────────────────────────────────────────────────────── */
function ImageBubble({ mediaId, caption, outbound }: { mediaId: string; caption: string; outbound: boolean }) {
  const [open, setOpen] = useState(false);
  const src = `/api/admin/whatsapp/media/${mediaId}`;
  return (
    <>
      <div className="space-y-1 cursor-pointer" onClick={() => setOpen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption || "Image"} className="rounded-xl max-w-[220px] max-h-[220px] object-cover" />
        {caption && <p className={`text-xs ${outbound ? "text-amber-100" : "text-slate-500"}`}>{caption}</p>}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={caption || "Image"} className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}

/* ── Bulle audio ────────────────────────────────────────────────────────── */
function AudioBubble({ mediaId, outbound }: { mediaId: string; outbound: boolean }) {
  return (
    <audio
      controls
      src={`/api/admin/whatsapp/media/${mediaId}`}
      className={`h-10 max-w-[220px] ${outbound ? "[color-scheme:dark]" : ""}`}
    />
  );
}

/* ── Bouton micro avec enregistrement ───────────────────────────────────── */
function VoiceButton({ onSend, sending }: { onSend: (blob: Blob, mime: string) => void; sending: boolean }) {
  const [recording, setRecording]   = useState(false);
  const [seconds,   setSeconds]     = useState(0);
  const recRef     = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime   = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const rec    = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size > 500) onSend(blob, mime);
      };
      rec.start(100);
      recRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert("Impossible d'accéder au microphone.");
    }
  }

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  if (recording) {
    return (
      <button
        onClick={stop}
        className="shrink-0 flex items-center gap-1.5 px-3 h-11 rounded-2xl bg-red-500 text-white font-bold text-sm animate-pulse"
      >
        <Square className="w-3.5 h-3.5 fill-white" />
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </button>
    );
  }

  return (
    <button
      onPointerDown={start}
      disabled={sending}
      title="Maintenir pour enregistrer"
      className="shrink-0 w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-amber-100 hover:text-amber-600 transition-colors disabled:opacity-40"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}

/* ── Page principale ────────────────────────────────────────────────────── */
export default function WhatsappChatPage() {
  const params  = useParams();
  const router  = useRouter();
  const phone   = decodeURIComponent(String(params.telefono));

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [body,      setBody]      = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res  = await fetch(`/api/admin/whatsapp/threads/${encodeURIComponent(phone)}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 20_000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Envoi texte ──────────────────────────────────────────────────────── */
  async function handleSendText() {
    if (!body.trim() || sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/threads/${encodeURIComponent(phone)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur");
      setBody("");
      await load(true);
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText(); }
  }

  /* ── Envoi image ──────────────────────────────────────────────────────── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview({ file, url: URL.createObjectURL(file) });
    e.target.value = "";
  }

  async function handleSendImage() {
    if (!imagePreview || sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/threads/${encodeURIComponent(phone)}/send-image`, {
        method:  "POST",
        headers: { "Content-Type": imagePreview.file.type, "x-caption": body.trim() },
        body:    imagePreview.file,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur");
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
      setBody("");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSending(false);
    }
  }

  /* ── Envoi audio ──────────────────────────────────────────────────────── */
  async function handleSendAudio(blob: Blob, mime: string) {
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/threads/${encodeURIComponent(phone)}/send-audio`, {
        method:  "POST",
        headers: { "Content-Type": mime },
        body:    blob,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur envoi vocal");
    } finally {
      setSending(false);
    }
  }

  /* ── Suppression conversation ─────────────────────────────────────────── */
  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/admin/whatsapp/threads/${encodeURIComponent(phone)}`, { method: "DELETE" });
      router.push("/admin/whatsapp");
    } finally {
      setDeleting(false);
    }
  }

  const contactName = messages.find(m => m.contact_name)?.contact_name ?? null;
  const displayName = contactName ?? phone;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 shrink-0">
        <Link href="/admin/whatsapp" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{displayName}</p>
          {contactName && <p className="text-xs text-slate-400">{phone}</p>}
        </div>
        <button onClick={() => load(true)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={() => setShowDelete(true)} className="p-2 rounded-xl hover:bg-red-50 text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-slate-400 text-sm">Aucun message</div>
        ) : messages.map((msg) => {
          const out = msg.direction === "outbound";
          return (
            <div key={msg.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
              <div className={[
                "max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm",
                out
                  ? "bg-amber-500 text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm",
              ].join(" ")}>
                {msg.media_type === "image" && msg.media_id
                  ? <ImageBubble mediaId={msg.media_id} caption={msg.body !== "[Image]" ? msg.body : ""} outbound={out} />
                  : msg.media_type === "audio" && msg.media_id
                  ? <AudioBubble mediaId={msg.media_id} outbound={out} />
                  : <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                }
                <p className={`text-[10px] mt-1.5 ${out ? "text-amber-100" : "text-slate-400"}`}>
                  {out ? `Vous${msg.sent_by ? ` · ${msg.sent_by}` : ""}` : (contactName ?? phone)} · {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Aperçu image avant envoi */}
      {imagePreview && (
        <div className="shrink-0 mb-2 flex items-end gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview.url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Légende (optionnel)"
              className="w-full text-base rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button onClick={() => { URL.revokeObjectURL(imagePreview.url); setImagePreview(null); }} className="p-1.5 rounded-xl bg-slate-200 text-slate-600">
            <X className="w-4 h-4" />
          </button>
          <button onClick={handleSendImage} disabled={sending} className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center disabled:opacity-40">
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Zone saisie */}
      {!imagePreview && (
        <div className="shrink-0 pt-3 border-t border-slate-200">
          {error && (
            <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            {/* Image */}
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-amber-100 hover:text-amber-600 transition-colors"
              title="Envoyer une image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {/* Texte */}
            <textarea
              ref={inputRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez un message…"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />

            {/* Vocal */}
            <VoiceButton onSend={handleSendAudio} sending={sending} />

            {/* Envoyer texte */}
            <button
              onClick={handleSendText}
              disabled={!body.trim() || sending}
              className="shrink-0 w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">
            ⚠️ Fenêtre de 24h après le dernier message du client.
          </p>
        </div>
      )}

      {/* Modal suppression */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Supprimer la conversation ?</p>
              <p className="text-sm text-slate-500 mt-1">Tous les messages avec {displayName} seront supprimés définitivement.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">Annuler</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50">
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
