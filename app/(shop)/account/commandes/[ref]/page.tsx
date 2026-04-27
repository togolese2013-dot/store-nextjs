"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, CheckCircle, Truck,
  Clock, XCircle, MapPin, Phone, User, Loader2,
  Check, ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  nom:           string;
  qty?:          number;
  quantite?:     number;
  prix_unitaire?: number;
  prix?:         number;
  total?:        number;
  image_url?:    string;
}
interface Order {
  reference:         string;
  nom:               string;
  telephone:         string;
  adresse:           string;
  zone_livraison:    string;
  delivery_fee:      number;
  subtotal:          number;
  total:             number;
  status:            string;
  items:             string | OrderItem[];
  created_at:        string;
  lien_localisation?: string;
}
interface Event {
  status:     string;
  note:       string;
  created_at: string;
}

const STATUS_STEPS = [
  { key: "en attente", label: "Reçue",      icon: Clock,        shortLabel: "Reçue"    },
  { key: "confirmée",  label: "Confirmée",   icon: CheckCircle,  shortLabel: "Confirmée" },
  { key: "expédiée",   label: "En route",    icon: Truck,        shortLabel: "En route" },
  { key: "livrée",     label: "Livrée",      icon: CheckCircle,  shortLabel: "Livrée"   },
];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

function parseItems(raw: string | object[]): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  try { return JSON.parse(raw as string); } catch { return []; }
}

export default function CommandeDetailPage() {
  const { ref }             = useParams<{ ref: string }>();
  const [order, setOrder]   = useState<Order | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!ref) return;
    const load = async () => {
      try {
        const res  = await fetch(`/api/account/orders/${ref}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setOrder(json.order);
        setEvents(json.events ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [ref]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
      <Package className="w-12 h-12 text-slate-300" />
      <p className="font-semibold text-slate-600">{error || "Commande introuvable"}</p>
      <Link href="/account/commandes" className="text-sm text-brand-700 underline">
        Retour à mes commandes
      </Link>
    </div>
  );

  const items       = parseItems(order.items);
  const stepIndex   = getStepIndex(order.status);
  const isCancelled = order.status === "annulée";
  const progressPct = stepIndex / (STATUS_STEPS.length - 1);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href="/account/commandes"
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-slate-900 truncate">
              Commande <span className="text-brand-700">#{order.reference}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── Tracker de statut ─────────────────────────────────────── */}
        {!isCancelled ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
              Suivi de livraison
            </p>

            {/* Horizontal stepper */}
            <div className="relative px-4">
              {/* Rail */}
              <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-slate-200" />
              {/* Progress */}
              <div
                className="absolute top-5 left-[calc(12.5%)] h-0.5 bg-brand-900 transition-all duration-700"
                style={{ width: `calc(${progressPct * 100}% * 0.75)` }}
              />

              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const done     = i <= stepIndex;
                  const isActive = i === stepIndex;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2.5 w-1/4">
                      {/* Circle */}
                      <div
                        className={`
                          relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                          border-2 transition-all duration-500
                          ${done
                            ? "bg-brand-900 border-brand-900 text-white shadow-md"
                            : "bg-white border-slate-300 text-slate-300"
                          }
                          ${isActive ? "ring-4 ring-brand-100" : ""}
                        `}
                      >
                        {done && i < stepIndex
                          ? <Check className="w-4 h-4" />
                          : <StepIcon className="w-4 h-4" />
                        }
                      </div>
                      {/* Label */}
                      <div className="text-center">
                        <p className={`text-xs font-semibold leading-tight ${done ? "text-slate-900" : "text-slate-400"}`}>
                          {step.shortLabel}
                        </p>
                        {isActive && (
                          <p className="text-[10px] text-brand-600 font-bold mt-0.5">En cours</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-700">Commande annulée</p>
              {events.find(e => e.note) && (
                <p className="text-xs text-red-500 mt-0.5">{events.find(e => e.note)?.note}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Grille principale ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Articles — span 2 colonnes */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-slate-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Articles commandés
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.nom} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.nom}</p>
                    <p className="text-xs text-slate-400">Qté : {item.qty ?? item.quantite ?? 1}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">
                    {formatPrice(
                      item.total ??
                      ((item.prix_unitaire ?? item.prix ?? 0) * (item.qty ?? item.quantite ?? 1))
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Récapitulatif */}
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Livraison</span>
                <span>{order.delivery_fee === 0 ? "Gratuite" : formatPrice(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200 mt-1">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Colonne droite : livraison + historique */}
          <div className="space-y-4">
            {/* Infos livraison */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Livraison
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{order.nom}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{order.telephone}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    {order.adresse}
                    {order.zone_livraison ? ` — ${order.zone_livraison}` : ""}
                  </span>
                </div>
              </div>
              {order.lien_localisation && (
                <a
                  href={order.lien_localisation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir sur la carte
                </a>
              )}
            </div>

            {/* Historique des événements */}
            {events.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                  Historique
                </p>
                <div className="space-y-3">
                  {[...events].reverse().map((ev, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 capitalize">{ev.status}</p>
                        {ev.note && <p className="text-xs text-slate-500 mt-0.5">{ev.note}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(ev.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
