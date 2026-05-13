import { getAdminSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Message = { role: string; content: string; timestamp: string };

async function fetchConversation(telefono: string): Promise<Message[]> {
  const url = process.env.SERENA_API_URL;
  const key = process.env.SERENA_API_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/api/conversations/${encodeURIComponent(telefono)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (res.status === 404) return [];
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages ?? [];
  } catch {
    return [];
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ telefono: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { telefono } = await params;
  const decoded = decodeURIComponent(telefono);
  const messages = await fetchConversation(decoded);

  if (!messages.length) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/whatsapp"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux conversations
      </Link>

      <PageHeader
        title={decoded}
        subtitle={`${messages.length} messages`}
        accent="indigo"
      />

      <div className="space-y-3 max-w-2xl pb-10">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={[
                "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                msg.role === "user"
                  ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                  : "bg-indigo-600 text-white rounded-tr-sm",
              ].join(" ")}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-slate-400" : "text-indigo-200"}`}>
                {msg.role === "user" ? "Client" : "Séréna"} · {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
