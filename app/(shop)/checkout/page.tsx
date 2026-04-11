"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { calcPrice } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, Check, MapPin, Phone,
  User, MessageSquare, ChevronDown, Truck,
} from "lucide-react";
import { clsx } from "clsx";

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.054 1.47 5.764L0 24l6.396-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.016-1.378l-.36-.214-3.72.846.862-3.636-.235-.373A9.775 9.775 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.423 0 9.818 4.396 9.818 9.818 0 5.423-4.395 9.818-9.818 9.818z" />
  </svg>
);

const ZONES = [
  { label: "Lomé (Tokoin / Adidogomé / Bè)",     fee: 1000  },
  { label: "Lomé (Agoè / Cacaveli / Wété)",       fee: 1500  },
  { label: "Kpalimé",                              fee: 5000  },
  { label: "Atakpamé",                             fee: 6000  },
  { label: "Sokodé",                               fee: 8000  },
  { label: "Kara",                                 fee: 9000  },
  { label: "Dapaong",                              fee: 12000 },
  { label: "Autre ville / À préciser",             fee: 0     },
];

interface Form {
  nom:        string;
  telephone:  string;
  adresse:    string;
  zone:       string;
  note:       string;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();

  const [form, setForm] = useState<Form>({
    nom: "", telephone: "", adresse: "", zone: "", note: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors,    setErrors]    = useState<Partial<Form>>({});

  const selectedZone = ZONES.find(z => z.label === form.zone);
  const deliveryFee  = selectedZone?.fee ?? 0;
  const grandTotal   = total + deliveryFee;

  function validate(): boolean {
    const e: Partial<Form> = {};
    if (!form.nom.trim())       e.nom       = "Votre nom est requis.";
    if (!form.telephone.trim()) e.telephone = "Votre numéro est requis.";
    if (!form.adresse.trim())   e.adresse   = "Votre adresse est requise.";
    if (!form.zone)             e.zone      = "Choisissez une zone de livraison.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [name]: undefined }));
  }

  function buildWhatsAppText() {
    const lines = items.map(i =>
      `• ${i.nom} × ${i.qty}  →  ${formatPrice(calcPrice(i) * i.qty)}`
    ).join("\n");
    return encodeURIComponent(
      `🛒 *NOUVELLE COMMANDE*\n\n` +
      `👤 *Nom :* ${form.nom}\n` +
      `📞 *Téléphone :* ${form.telephone}\n` +
      `📍 *Adresse :* ${form.adresse}\n` +
      `🚚 *Zone :* ${form.zone}\n` +
      (form.note ? `📝 *Note :* ${form.note}\n` : "") +
      `\n*Articles :*\n${lines}\n\n` +
      `💰 Sous-total : ${formatPrice(total)}\n` +
      `🚚 Livraison : ${deliveryFee === 0 ? "À confirmer" : formatPrice(deliveryFee)}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `*TOTAL : ${formatPrice(grandTotal)}*`
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;

    const url = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${buildWhatsAppText()}`;
    window.open(url, "_blank", "noreferrer");
    setSubmitted(true);
    clearCart();
  }

  /* Empty cart guard */
  if (items.length === 0 && !submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <ShoppingBag className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-xl font-800 text-slate-900 mb-2">Panier vide</h1>
        <p className="text-slate-500 text-sm mb-7">Ajoutez des articles avant de passer commande.</p>
        <Link href="/products"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
        >
          Voir les produits <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  /* Success screen */
  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display text-2xl font-800 text-slate-900 mb-3">Commande envoyée !</h1>
        <p className="text-slate-600 text-sm max-w-sm mb-2">
          Votre commande a été transmise sur WhatsApp. Notre équipe vous confirmera la livraison très bientôt.
        </p>
        <p className="text-slate-400 text-xs mb-8">
          Si la fenêtre WhatsApp ne s'est pas ouverte, appuyez sur le bouton ci-dessous.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/"
            className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-brand-300 transition-colors"
          >
            Retour à l'accueil
          </Link>
          <Link href="/products"
            className="px-6 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
          >
            Continuer les achats
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = (err?: string) => clsx(
    "w-full px-4 py-3 rounded-2xl border-2 text-sm outline-none transition-all font-sans bg-white",
    err
      ? "border-red-400 focus:border-red-500"
      : "border-slate-200 focus:border-brand-500"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-brand-700 transition-colors">Panier</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Commande</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-2xl font-800 text-slate-900 mb-7">Finaliser ma commande</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid lg:grid-cols-3 gap-8 items-start">

            {/* ── Form ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Contact */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <h2 className="font-display font-800 text-slate-900 text-base mb-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-900 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                  Vos coordonnées
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <User className="w-3.5 h-3.5 inline mr-1" />Nom complet *
                    </label>
                    <input
                      type="text" name="nom" value={form.nom}
                      onChange={handleChange} placeholder="Ex : Kossi Amavi"
                      className={inputCls(errors.nom)}
                      autoComplete="name"
                    />
                    {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />Numéro de téléphone *
                    </label>
                    <input
                      type="tel" name="telephone" value={form.telephone}
                      onChange={handleChange} placeholder="Ex : +228 90 00 00 00"
                      className={inputCls(errors.telephone)}
                      autoComplete="tel"
                    />
                    {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <h2 className="font-display font-800 text-slate-900 text-base mb-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-900 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                  Livraison
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />Adresse de livraison *
                    </label>
                    <input
                      type="text" name="adresse" value={form.adresse}
                      onChange={handleChange} placeholder="Quartier, rue, description du lieu…"
                      className={inputCls(errors.adresse)}
                      autoComplete="street-address"
                    />
                    {errors.adresse && <p className="text-xs text-red-500 mt-1">{errors.adresse}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <Truck className="w-3.5 h-3.5 inline mr-1" />Zone de livraison *
                    </label>
                    <div className="relative">
                      <select
                        name="zone" value={form.zone}
                        onChange={handleChange}
                        className={clsx(inputCls(errors.zone), "appearance-none pr-10 cursor-pointer")}
                      >
                        <option value="">-- Choisir une zone --</option>
                        {ZONES.map(z => (
                          <option key={z.label} value={z.label}>
                            {z.label}{z.fee > 0 ? ` — ${formatPrice(z.fee)}` : " — Frais à confirmer"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.zone && <p className="text-xs text-red-500 mt-1">{errors.zone}</p>}
                    {selectedZone && (
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-brand-500" />
                        Frais de livraison : {selectedZone.fee > 0 ? formatPrice(selectedZone.fee) : "sera confirmé par notre équipe"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Note / instructions (optionnel)
                    </label>
                    <textarea
                      name="note" value={form.note}
                      onChange={handleChange}
                      placeholder="Indications supplémentaires pour la livraison…"
                      rows={3}
                      className={clsx(inputCls(), "resize-none")}
                    />
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div className="bg-brand-50 rounded-3xl border border-brand-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-900 text-sm mb-1">Paiement à la livraison</h3>
                    <p className="text-brand-700 text-xs leading-relaxed">
                      Vous ne payez qu'à la réception de votre colis. Aucune information bancaire requise.
                      Paiement en espèces, Mobile Money (Flooz / T-Money) acceptés.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Summary ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sticky top-24">
                <h2 className="font-display font-800 text-slate-900 text-lg mb-5">
                  Votre commande
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                  {items.map(item => {
                    const imgSrc = item.image_url
                      ? item.image_url.startsWith("http")
                        ? item.image_url
                        : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/uploads/${item.image_url}`
                      : null;
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden relative shrink-0">
                          {imgSrc ? (
                            <Image src={imgSrc} alt={item.nom} fill className="object-contain p-1" sizes="48px" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                              <ShoppingBag className="w-5 h-5" strokeWidth={1} />
                            </div>
                          )}
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-900 text-white text-[10px] font-bold flex items-center justify-center">
                            {item.qty}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.nom}</p>
                          <p className="text-xs text-slate-500">{formatPrice(calcPrice(item) * item.qty)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Sous-total</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Livraison</span>
                    <span className={deliveryFee > 0 ? "font-semibold" : "text-slate-400"}>
                      {selectedZone
                        ? deliveryFee > 0 ? formatPrice(deliveryFee) : "À confirmer"
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 mb-6">
                  <span className="font-display font-800 text-slate-900">Total</span>
                  <span className="font-display font-800 text-2xl text-brand-900">{formatPrice(grandTotal)}</span>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[#25D366] text-white font-bold text-base hover:bg-[#1da851] transition-all hover:shadow-lg"
                >
                  <WaIcon />
                  Confirmer sur WhatsApp
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Votre commande sera envoyée directement sur WhatsApp
                </p>

                <Link href="/cart"
                  className="mt-3 flex items-center justify-center w-full py-2.5 rounded-2xl text-sm text-slate-500 hover:text-brand-700 transition-colors"
                >
                  ← Modifier le panier
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
