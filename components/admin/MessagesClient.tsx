"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WaMessage } from "@/lib/admin-db";
import { MessageCircle, Send, Loader2, RefreshCw, Paperclip, X } from "lucide-react";
import { clsx } from "clsx";

export default function MessagesClient() {
  const [messages,   setMessages]   = useState<WaMessage[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<WaMessage | null>(null);
  const [reply,      setReply]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (silent = true) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/whatsapp/messages");
      if (res.ok) {
        const data = await res.json() as { messages: WaMessage[] };
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { refresh(true); }, [refresh]);

  // Auto-poll every 15 s
  useEffect(() => {
    const t = setInterval(() => refresh(true), 15_000);
    return () => clearInterval(t);
  }, [refresh]);

  // Scroll to bottom when selected thread changes or new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected, messages]);

  /* Group by contact number — messages come DESC from API, reverse for chronological display */
  const threads = messages.reduce<Record<string, WaMessage[]>>((acc, m) => {
    const key = m.direction === "in" ? m.from_number : m.to_number;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // Sort contacts by most recent message first (messages[0] = most recent, from DESC query)
  const contacts = Object.entries(threads).sort(
    ([, a], [, b]) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
  );

  // For display: oldest → newest (ASC) per thread
  const threadAsc = (key: string) => [...(threads[key] ?? [])].reverse();

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendReply() {
    if (!selected || (!reply.trim() && !imageFile)) return;
    setSending(true);
    const to = selected.direction === "in" ? selected.from_number : selected.to_number;

    if (imageFile) {
      // Upload image then send
      const form = new FormData();
      form.append("file", imageFile);
      const upRes  = await fetch("/api/admin/whatsapp/upload-media", { method: "POST", body: form });
      const upData = await upRes.json() as { mediaId?: string; error?: string };
      if (upData.mediaId) {
        const mediaType = imageFile.type.startsWith("audio/") ? "audio" : "image";
        await fetch("/api/admin/whatsapp/send", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ to, mediaId: upData.mediaId, mediaType, message: reply }),
        });
      }
      clearImage();
    } else {
      await fetch("/api/admin/whatsapp/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ to, message: reply }),
      });
    }

    setReply(""); setSending(false);
    await refresh(false);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
        <p className="text-sm">Chargement des messages…</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
        <MessageCircle className="w-14 h-14 mb-4 opacity-20" />
        <p className="font-semibold">Aucun message reçu</p>
        <p className="text-sm mt-1">Les messages arriveront ici une fois le webhook configuré.</p>
        <button onClick={() => refresh(false)} disabled={refreshing}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          Vérifier maintenant
        </button>
      </div>
    );
  }

  const selectedNumber = selected
    ? (selected.direction === "in" ? selected.from_number : selected.to_number)
    : null;
  const selectedThread = selectedNumber ? threadAsc(selectedNumber) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex" style={{ height: "70vh" }}>
      {/* Contact list */}
      <div className="w-72 shrink-0 border-r border-slate-100 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-700">
            {contacts.length} conversation{contacts.length > 1 ? "s" : ""}
          </span>
          <button onClick={() => refresh(false)} disabled={refreshing} title="Rafraîchir"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(([number, msgs]) => {
            const last   = msgs[0];
            const unread = msgs.filter(m => m.direction === "in" && !m.read_at).length;
            const name   = last.contact_name || number;
            return (
              <button key={number} onClick={() => setSelected(last)}
                className={clsx(
                  "w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors",
                  selectedNumber === number && "bg-indigo-50 border-l-4 border-l-indigo-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-sm shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-slate-900 truncate">{name}</p>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{last.content || (last as any).body || ""}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-sm">
              {(selected.contact_name || selectedNumber || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">{selected.contact_name || selectedNumber}</p>
              <p className="text-xs text-slate-400">{selectedNumber}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 flex flex-col">
            {[...selectedThread].map(msg => (
              <div key={msg.id} className={clsx("max-w-[70%]", msg.direction === "out" ? "ml-auto" : "mr-auto")}>
                <div className={clsx(
                  "rounded-2xl text-sm overflow-hidden",
                  msg.direction === "out"
                    ? "bg-indigo-700 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-900 rounded-bl-md"
                )}>
                  {msg.type === "image" && msg.media_url ? (
                    <a href={`/api/admin/whatsapp/media/${msg.media_url}`} target="_blank" rel="noreferrer">
                      <img
                        src={`/api/admin/whatsapp/media/${msg.media_url}`}
                        alt="image"
                        className="max-w-[240px] max-h-[240px] object-cover block"
                        loading="lazy"
                      />
                    </a>
                  ) : msg.type === "audio" && msg.media_url ? (
                    <div className="px-3 py-2.5">
                      <audio controls src={`/api/admin/whatsapp/media/${msg.media_url}`}
                        className="h-9 max-w-[240px]" preload="none" />
                    </div>
                  ) : null}
                  {(msg.content || (msg as any).body) ? (
                    <p className="px-4 py-2.5">{msg.content || (msg as any).body}</p>
                  ) : (msg.type !== "image" && msg.type !== "audio") ? (
                    <p className="px-4 py-2.5 opacity-50 italic text-xs">
                      {msg.type === "video" ? "🎬 Vidéo" : msg.type === "document" ? "📄 Document" : "Message"}
                    </p>
                  ) : null}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-100">
            {/* File preview */}
            {imagePreview && imageFile && (
              <div className="px-4 pt-3 flex items-start gap-2">
                <div className="relative">
                  {imageFile.type.startsWith("audio/") ? (
                    <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 text-sm text-slate-600">
                      🎵 <span className="truncate max-w-[180px]">{imageFile.name}</span>
                    </div>
                  ) : (
                    <img src={imagePreview} alt="aperçu" className="h-20 w-20 object-cover rounded-xl border border-slate-200" />
                  )}
                  <button onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="px-4 py-3 flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*,audio/*" className="hidden" onChange={pickImage} />
              <button onClick={() => fileInputRef.current?.click()} disabled={sending}
                className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors disabled:opacity-50 shrink-0"
                title="Envoyer une image"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text" value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                placeholder={imageFile ? "Légende (optionnel)…" : "Écrire un message…"}
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-sans"
              />
              <button onClick={sendReply} disabled={sending || (!reply.trim() && !imageFile)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#25D366] text-white hover:bg-[#1da851] transition-colors disabled:opacity-50 shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}
