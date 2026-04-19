import { listNewsletterSubscribers } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";
import NewsletterTable from "@/components/admin/NewsletterTable";
import { Mail } from "lucide-react";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  let subscribers: Awaited<ReturnType<typeof listNewsletterSubscribers>> = [];
  try { subscribers = await listNewsletterSubscribers(); } catch { /* table may not exist */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        subtitle="Gestion des abonnés à la newsletter."
        accent="indigo"
      />

      {/* KPI */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm max-w-xs">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total abonnés</p>
          <Mail className="w-8 h-8 text-indigo-500 opacity-20" />
        </div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{subscribers.length}</p>
      </div>

      {subscribers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <Mail className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucun abonné pour l'instant</p>
        </div>
      ) : (
        <NewsletterTable initialSubscribers={subscribers} />
      )}
    </div>
  );
}
