"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, CheckCircle, Truck,
  Clock, XCircle, MapPin, Phone, User, Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem { nom: string; quantite: number; prix: number; image_url?: string; }
interface Order {
  reference:      string;
  nom:            string;
  telephone:      string;
  adresse:        string;
  zone_livraison: string;
  delivery_fee:   number;
  subtotal:       number;
  total:          number;
  status:         string;
  items:          string | OrderItem[];
  created_at:     string;
}
interface Event {
  status:     string;
  note:       string;
  created_at: string;
}

const STATUS_STEPS = [
  { key: "en attente",  label: "Commande reçue",     icon: Clock,         color: "text-amber-500",  bg: "bg-amber-50"  },
  { key: "confirmée",   label: "Confirmée",           icon: CheckCircle,   color: "text-blue-600",   bg: "bg-blue-50"   },
  { key: "expédiée",    label: "En route",            icon: Truck,         color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "livrée",      label: "Livrée",              icon: CheckCircle,   color: "text-green-600",  bg: "bg-green-50"  },
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
  const { ref }                 = useParams<{ ref: string }>();
  const [order, setOrder]       = useState<Order | null>(null);
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!ref) return;
    (async () => {
      try {
        const res  = await fetch(`/api/account/orders/${ref}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setOrder(json.order);
        setEvents(json.events ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
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

  const items     = parseItems(order.items);
  const stepIndex = getStepIndex(order.status);
  const isCancelled = order.status === "annulée";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <Link href="/account/commandes" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-800 text-slate-900">Commande #{order.reference}</h1>
            <p className="text-sm text-slate-400">
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Delivery timeline */}
        {!isCancelled ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Suivi de livraison</p>
            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100" />
              <div
                className="absolute left-[19px] top-0 w-0.5 bg-brand-600 transition-all duration-700"
                style={{ height: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              <div className="space-y-6">
                {STATUS_STEPS.map((step, i) => {
                  const Icon     = step.icon;
                  const done     = i <= stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <div key={step.key} className="relative flex items-start gap-4 pl-10">
                      <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                        ${done
                          ? `${step.bg} border-brand-300 ${step.color}`
                          : "bg-white border-slate-200 text-slate-300"
                        }
                        ${isActive ? "ring-4 ring-brand-100" : ""}
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className={`pt-2 ${done ? "" : "opacity-40"}`}>
                        <p className={`font-semibold text-sm ${done ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
                        {isActive && (
                          <p className="text-xs text-brand-600 font-semibold mt-0.5">Étape actuelle</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-800 text-red-700 text-sm">Commande annulée</p>
              {events.find(e => e.note) && (
                <p className="text-xs text-red-500 mt-0.5">{events.find(e => e.note)?.note}</p>
              )}
            </div>
          </div>
        )}

        {/* Event history */}
        {events.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Historique</p>
            <div className="space-y-3">
              {[...events].reverse().map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-300 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{ev.status}</p>
                    {ev.note && <p className="text-xs text-slate-500">{ev.note}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(ev.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Articles commandés</p>
          <div className="divide-y divide-slate-50">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 text-xs">
                  ×{item.quantite}
                </div>
                <p className="flex-1 text-sm text-slate-800">{item.nom}</p>
                <p className="text-sm font-800 text-slate-900">{formatPrice(item.prix * item.quantite)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-4 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Livraison</span>
              <span>{order.delivery_fee === 0 ? "Gratuite" : formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-800 text-slate-900 text-base pt-1 border-t border-slate-100 mt-1">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Informations de livraison</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700">{order.nom}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700">{order.telephone}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">{order.adresse}{order.zone_livraison ? ` — ${order.zone_livraison}` : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
