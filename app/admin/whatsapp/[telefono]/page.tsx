"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Send, RefreshCw, Phone, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";

type Message = {
  id:           number;
  direction:    "inbound" | "outbound";
  body:         string;
  sent_by:      string | null;
  contact_name: string | null;
  lu:           number;
  created_at:   string;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function WhatsappChatPage() {
  const params  = useParams();
  const phone   = decodeURIComponent(String(params.telefono));

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [body,      setBody]      = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

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
    const interval = setInterval(() => load(true), 20_000);
    return () => clearInterval(interval);
  }, [load]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!body.trim() || sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/whatsapp/threads/${encodeURIComponent(phone)}/send`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ body: body.trim() }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erreur envoi");
      }
      setBody("");
      await load(true);
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'envoi");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const contactName = messages.find(m => m.contact_name)?.contact_name ?? null;
  const displayName = contactName ?? phone;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 shrink-0">
        <Link
          href="/admin/whatsapp"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{displayName}</p>
          {contactName && <p className="text-xs text-slate-400">{phone}</p>}
        </div>
        <button
          onClick={() => load(true)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-slate-400 text-sm">
            Aucun message
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "inbound" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={[
                  "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                  msg.direction === "inbound"
                    ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                    : "bg-amber-500 text-white rounded-tr-sm",
                ].join(" ")}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                <p className={`text-[10px] mt-1.5 ${msg.direction === "inbound" ? "text-slate-400" : "text-amber-100"}`}>
                  {msg.direction === "inbound"
                    ? (contactName ?? phone)
                    : `Vous${msg.sent_by ? ` · ${msg.sent_by}` : ""}`}{" "}
                  · {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-slate-200">
        {error && (
          <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
            rows={2}
            className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="shrink-0 w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 px-1">
          ⚠️ Vous ne pouvez répondre que dans les 24h après le dernier message du client (fenêtre WhatsApp).
        </p>
      </div>
    </div>
  );
}
