"use client";

import { useState, useEffect, useCallback } from "react";
import type { WaMessage } from "@/lib/admin-db";
import { MessageCircle, Send, Loader2, RefreshCw } from "lucide-react";
import { clsx } from "clsx";

export default function MessagesClient() {
  const [messages,   setMessages]   = useState<WaMessage[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<WaMessage | null>(null);
  const [reply,      setReply]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  /* Group by contact number */
  const threads = messages.reduce<Record<string, WaMessage[]>>((acc, m) => {
    const key = m.direction === "in" ? m.from_number : m.to_number;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const contacts = Object.entries(threads).sort(
    ([, a], [, b]) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
  );

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const to = selected.direction === "in" ? selected.from_number : selected.to_number;
    await fetch("/api/admin/whatsapp/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ to, message: reply }),
    });
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
  const selectedThread = selectedNumber ? (threads[selectedNumber] ?? []) : [];

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

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 flex flex-col-reverse">
            {[...selectedThread].reverse().map(msg => (
              <div key={msg.id} className={clsx("max-w-[70%]", msg.direction === "out" ? "ml-auto" : "mr-auto")}>
                <div className={clsx(
                  "px-4 py-2.5 rounded-2xl text-sm",
                  msg.direction === "out"
                    ? "bg-indigo-700 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-900 rounded-bl-md"
                )}>
                  {msg.content || (msg as any).body || ""}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
            <input
              type="text" value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
              placeholder="Écrire un message…"
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-sans"
            />
            <button onClick={sendReply} disabled={sending || !reply.trim()}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#25D366] text-white hover:bg-[#1da851] transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
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
