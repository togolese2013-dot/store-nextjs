import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import Link from "next/link";
import { MessageCircle, Clock, User } from "lucide-react";

export const metadata = { title: "Conversations Séréna" };

type Conversation = {
  telefono:        string;
  dernier_message: string;
  role:            string;
  last_at:         string;
  total_messages:  number;
};

async function fetchConversations(): Promise<Conversation[]> {
  const url = process.env.SERENA_API_URL;
  const key = process.env.SERENA_API_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/api/conversations`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations ?? [];
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

export default async function WhatsappConversationsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const conversations = await fetchConversations();
  const configured = !!(process.env.SERENA_API_URL && process.env.SERENA_API_KEY);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations Séréna"
        subtitle="Historique des échanges gérés par l'agent IA Séréna."
        accent="indigo"
      />

      {!configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <strong>Configuration manquante</strong> — Ajoutez{" "}
          <code className="bg-amber-100 px-1 rounded">SERENA_API_URL</code> et{" "}
          <code className="bg-amber-100 px-1 rounded">SERENA_API_KEY</code> dans votre{" "}
          <code className="bg-amber-100 px-1 rounded">.env.local</code>.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm max-w-xs">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total conversations</p>
          <MessageCircle className="w-8 h-8 text-indigo-500 opacity-20" />
        </div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{conversations.length}</p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucune conversation pour l&apos;instant</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-slate-900 text-sm">Toutes les conversations</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {conversations.map((c) => (
              <Link
                key={c.telefono}
                href={`/admin/serena/${encodeURIComponent(c.telefono)}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-indigo-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900 text-sm">{c.telefono}</span>
                    {c.role === "user" && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wide">
                        client
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{c.dernier_message}</p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(c.last_at)}
                  </span>
                  <span className="text-xs text-slate-400">{c.total_messages} msg</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
