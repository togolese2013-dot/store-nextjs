"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Truck, MapPin, Phone, Clock, Check, Loader2,
  Package, RefreshCw, User, Link as LinkIcon,
} from "lucide-react";
import type { LivraisonAdmin, Livreur } from "@/lib/admin-db";

const STATUTS_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente",  color: "bg-slate-100 text-slate-600" },
  acceptee:   { label: "Acceptée",    color: "bg-blue-100 text-blue-700" },
  en_cours:   { label: "En cours",    color: "bg-amber-100 text-amber-700" },
  livre:      { label: "Livré",       color: "bg-emerald-100 text-emerald-700" },
  echoue:     { label: "Échoué",      color: "bg-red-100 text-red-700" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function LivreurPage() {
  const { code }  = useParams<{ code: string }>();
  const [livreur, setLivreur]       = useState<Livreur | null>(null);
  const [livraisons, setLivraisons] = useState<LivraisonAdmin[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState("");
  const [flash,   setFlash]         = useState("");
  const [accepting, setAccepting]   = useState<number | null>(null);
  const [montants,  setMontants]    = useState<Record<number, string>>({});

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 3000); }

  const fetchCourses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res  = await fetch(`/api/livreur/${code}/courses`);
    const data = await res.json();
    if (res.ok) {
      setLivreur(data.livreur);
      setLivraisons(data.livraisons);
      setError("");
    } else {
      setError(data.error ?? "Erreur");
    }
    if (!silent) setLoading(false);
  }, [code]);

  useEffect(() => {
    fetchCourses();
    // Poll every 15s for new deliveries
    const interval = setInterval(() => fetchCourses(true), 15000);
    return () => clearInterval(interval);
  }, [fetchCourses]);

  async function accepter(livraisonId: number) {
    setAccepting(livraisonId);
    const montant = montants[livraisonId] ? Number(montants[livraisonId]) : undefined;
    const res  = await fetch(`/api/livreur/${code}/accepter`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ livraison_id: livraisonId, montant_livraison: montant }),
    });
    const data = await res.json();
    if (res.ok) {
      showFlash("Course acceptée ! Bonne livraison 🚀");
      fetchCourses(true);
    } else {
      showFlash(data.error ?? "Erreur");
    }
    setAccepting(null);
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-semibold">Chargement…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center max-w-sm">
          <Package className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <h2 className="font-bold text-slate-800 text-lg mb-2">Accès refusé</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const disponibles = livraisons.filter(l => l.statut === "en_attente");
  const mesCourses  = livraisons.filter(l => l.livreur_id === livreur?.id && l.statut !== "en_attente");

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Flash */}
      {flash && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-semibold whitespace-nowrap">
          {flash}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{livreur?.nom}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${livreur?.statut === "disponible" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {livreur?.statut === "disponible" ? "Disponible" : "Indisponible"}
            </span>
          </div>
        </div>
        <button
          onClick={() => fetchCourses(true)}
          className="p-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-700 transition-all"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ── Livraisons disponibles ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-slate-800">Courses disponibles</h2>
            {disponibles.length > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{disponibles.length}</span>
            )}
          </div>

          {disponibles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Aucune course disponible</p>
              <p className="text-xs mt-1">Actualisation automatique toutes les 15s</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disponibles.map(liv => (
                <div key={liv.id} className="bg-white rounded-3xl border-2 border-amber-200 shadow-sm p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-slate-400">{liv.reference}</p>
                      <p className="font-bold text-slate-900 text-lg">{liv.client_nom}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                      Nouvelle course
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-600">
                    {liv.client_tel && (
                      <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 shrink-0" />{liv.client_tel}</p>
                    )}
                    {liv.adresse && (
                      <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />{liv.adresse}</p>
                    )}
                    {liv.contact_livraison && (
                      <p className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400 shrink-0" />{liv.contact_livraison}</p>
                    )}
                    {liv.lien_localisation && (
                      <a href={liv.lien_localisation} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-indigo-500 hover:underline font-semibold">
                        <LinkIcon className="w-4 h-4 shrink-0" />Ouvrir sur la carte
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />{formatDate(liv.created_at)}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500">Montant de livraison (FCFA)</label>
                    <input
                      type="number"
                      min="0"
                      value={montants[liv.id] ?? ""}
                      onChange={e => setMontants(m => ({ ...m, [liv.id]: e.target.value }))}
                      placeholder="Ex : 1500"
                      className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-indigo-400 outline-none"
                      style={{ fontSize: "16px" }}
                    />
                    <button
                      onClick={() => accepter(liv.id)}
                      disabled={accepting === liv.id}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all"
                    >
                      {accepting === liv.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4" />
                      }
                      Accepter cette course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Mes courses en cours ── */}
        {mesCourses.length > 0 && (
          <section>
            <h2 className="font-bold text-slate-800 mb-3">Mes courses</h2>
            <div className="space-y-3">
              {mesCourses.map(liv => {
                const s = STATUTS_LABELS[liv.statut];
                return (
                  <div key={liv.id} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{liv.client_nom}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s?.color ?? "bg-slate-100 text-slate-600"}`}>
                        {s?.label ?? liv.statut}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 space-y-1">
                      {liv.adresse && <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />{liv.adresse}</p>}
                      {liv.lien_localisation && (
                        <a href={liv.lien_localisation} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-500 hover:underline font-semibold text-xs">
                          <LinkIcon className="w-3.5 h-3.5" />Voir sur la carte
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
