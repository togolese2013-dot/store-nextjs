"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle,
  Loader2, RefreshCw, ZoomIn,
} from "lucide-react";
import { clsx } from "clsx";

interface Verification {
  id: number;
  user_id: number;
  nom: string;
  email: string | null;
  telephone: string | null;
  id_card_url: string;
  selfie_url: string;
  statut: "en_attente" | "verifie" | "rejete";
  note_admin: string | null;
  created_at: string;
}

function StatutBadge({ statut }: { statut: Verification["statut"] }) {
  if (statut === "verifie")    return <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" />Vérifié</span>;
  if (statut === "en_attente") return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full"><Clock className="w-3 h-3" />En attente</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full"><XCircle className="w-3 h-3" />Refusé</span>;
}

export default function VerificationsManager() {
  const [list,     setList]     = useState<Verification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const [noteMap,  setNoteMap]  = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/verifications", { credentials: "include" });
      const d = await r.json();
      setList(d.verifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id: number, statut: "verifie" | "rejete") {
    setProcessing(id);
    try {
      await fetch(`/api/admin/verifications/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ statut, note_admin: noteMap[id] ?? null }),
      });
      await load();
    } finally {
      setProcessing(null);
    }
  }

  const pending  = list.filter(v => v.statut === "en_attente");
  const resolved = list.filter(v => v.statut !== "en_attente");

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh]">
            <Image src={lightbox} alt="Document" width={800} height={600} className="object-contain rounded-2xl w-full h-auto max-h-[85vh]" />
            <button onClick={() => setLightbox(null)} className="absolute top-3 right-3 bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/40 transition-colors text-lg font-bold">×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-brand-700" />
          <h2 className="font-display font-bold text-slate-900 text-lg">Vérifications d'identité</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">{pending.length}</span>
          )}
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="text-center py-12">
          <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Aucune demande de vérification.</p>
        </div>
      )}

      {/* En attente */}
      {!loading && pending.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">En attente ({pending.length})</p>
          {pending.map(v => (
            <VerifCard
              key={v.id} v={v}
              note={noteMap[v.id] ?? ""}
              onNote={n => setNoteMap(m => ({ ...m, [v.id]: n }))}
              onApprove={() => decide(v.id, "verifie")}
              onReject={() => decide(v.id, "rejete")}
              processing={processing === v.id}
              onZoom={setLightbox}
            />
          ))}
        </div>
      )}

      {/* Traités */}
      {!loading && resolved.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4">Traités ({resolved.length})</p>
          {resolved.map(v => (
            <VerifCard
              key={v.id} v={v}
              note={noteMap[v.id] ?? ""}
              onNote={n => setNoteMap(m => ({ ...m, [v.id]: n }))}
              onApprove={() => decide(v.id, "verifie")}
              onReject={() => decide(v.id, "rejete")}
              processing={processing === v.id}
              onZoom={setLightbox}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VerifCard({
  v, note, onNote, onApprove, onReject, processing, onZoom,
}: {
  v: Verification;
  note: string;
  onNote: (n: string) => void;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  onZoom: (url: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      {/* Client info */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{v.nom}</p>
          <p className="text-xs text-slate-400">{v.email ?? v.telephone ?? "—"}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">{new Date(v.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <StatutBadge statut={v.statut} />
      </div>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { url: v.id_card_url, label: "Pièce d'identité" },
          { url: v.selfie_url,  label: "Selfie" },
        ].map(({ url, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => onZoom(url)}
            className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-[4/3]"
          >
            <Image src={url} alt={label} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white bg-black/50 px-2 py-0.5 rounded-full">{label}</span>
          </button>
        ))}
      </div>

      {/* Note + actions si en attente */}
      {v.statut === "en_attente" && (
        <div className="space-y-3 pt-1">
          <input
            type="text"
            value={note}
            onChange={e => onNote(e.target.value)}
            placeholder="Note pour le client (optionnel — affichée si refus)"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              disabled={processing}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all",
                "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              )}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approuver
            </button>
            <button
              onClick={onReject}
              disabled={processing}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all",
                "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50"
              )}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* Note affichée si rejeté */}
      {v.statut === "rejete" && v.note_admin && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          Motif : {v.note_admin}
        </p>
      )}

      {/* Ré-approuver / ré-rejeter si déjà traité */}
      {v.statut !== "en_attente" && (
        <div className="flex gap-2 pt-1">
          {v.statut !== "verifie" && (
            <button onClick={onApprove} disabled={processing} className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-all">
              {processing ? "…" : "Approuver quand même"}
            </button>
          )}
          {v.statut !== "rejete" && (
            <button onClick={onReject} disabled={processing} className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-all">
              {processing ? "…" : "Révoquer"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
