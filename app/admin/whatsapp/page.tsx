"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Link from "next/link";
import { MessageCircle, Clock, User, RefreshCw, Inbox, Trash2, X, Image, Mic } from "lucide-react";

type Thread = {
  telephone:         string;
  contact_name:      string | null;
  dernier_message:   string;
  dernier_direction: "inbound" | "outbound";
  dernier_type:      string;
  last_at:           string;
  total_messages:    number;
  unread:            number;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function lastMessagePreview(type: string, body: string): { icon: React.ReactNode; text: string } {
  if (type === "image")    return { icon: <Image className="w-3 h-3 inline mr-1" />,  text: "Image" };
  if (type === "audio")    return { icon: <Mic   className="w-3 h-3 inline mr-1" />,  text: "Message vocal" };
  return { icon: null, text: body };
}

export default function WhatsappInboxPage() {
  const [threads,    setThreads]    = useState<Thread[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Thread | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  // Long-press state
  const pressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressActive = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res  = await fetch("/api/admin/whatsapp/threads");
      const data = await res.json();
      setThreads(data.threads ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  function startPress(t: Thread) {
    pressActive.current = false;
    pressTimer.current = setTimeout(() => {
      pressActive.current = true;
      navigator.vibrate?.(60);
      setDeleteTarget(t);
    }, 600);
  }

  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/whatsapp/threads/${encodeURIComponent(deleteTarget.telephone)}`, { method: "DELETE" });
      setThreads(prev => prev.filter(t => t.telephone !== deleteTarget.telephone));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messagerie WhatsApp"
        subtitle="Répondez manuellement aux messages reçus sur votre numéro WhatsApp."
        accent="amber"
        extra={
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Conversations</p>
            <MessageCircle className="w-8 h-8 text-amber-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{threads.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Non lus</p>
            <Inbox className="w-8 h-8 text-red-400 opacity-20" />
          </div>
          <p className={`text-2xl font-bold tabular-nums ${totalUnread > 0 ? "text-red-600" : "text-slate-900"}`}>
            {totalUnread}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <RefreshCw className="w-8 h-8 mb-3 opacity-30 animate-spin" />
          <p className="text-sm font-semibold">Chargement…</p>
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucun message reçu pour l&apos;instant</p>
          <p className="text-xs mt-1">Les messages entrants apparaîtront ici automatiquement</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm">Toutes les conversations</h2>
            <span className="ml-auto text-[10px] text-slate-400">Appui long pour supprimer</span>
          </div>
          <div className="divide-y divide-slate-100">
            {threads.map((t) => {
              const preview = lastMessagePreview(t.dernier_type, t.dernier_message);
              return (
                <Link
                  key={t.telephone}
                  href={`/admin/whatsapp/${encodeURIComponent(t.telephone)}`}
                  onClick={(e) => {
                    if (pressActive.current) { e.preventDefault(); return; }
                    window.dispatchEvent(new CustomEvent("wa-conversation-opened", { detail: { phone: t.telephone } }));
                  }}
                  onMouseDown={() => startPress(t)}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={() => startPress(t)}
                  onTouchEnd={cancelPress}
                  onTouchMove={cancelPress}
                  onContextMenu={(e) => e.preventDefault()}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 active:bg-amber-50 transition-colors select-none"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    {t.unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {t.unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm ${t.unread > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                        {t.contact_name || t.telephone}
                      </span>
                      {t.contact_name && <span className="text-xs text-slate-400">{t.telephone}</span>}
                    </div>
                    <p className={`text-sm truncate ${t.unread > 0 ? "text-slate-800 font-medium" : "text-slate-500"}`}>
                      {t.dernier_direction === "outbound" && <span className="text-slate-400 mr-1">Vous :</span>}
                      {preview.icon}{preview.text}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo(t.last_at)}
                    </span>
                    <span className="text-xs text-slate-400">{t.total_messages} msg</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div>
              <p className="font-bold text-slate-900">Supprimer la conversation ?</p>
              <p className="text-sm text-slate-500 mt-1">
                {deleteTarget.contact_name || deleteTarget.telephone} — {deleteTarget.total_messages} message(s). Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
