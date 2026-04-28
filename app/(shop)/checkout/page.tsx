"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { calcPrice } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, Check, MapPin, Phone,
  User, MessageSquare, ChevronDown, Truck, Star, Loader2, Link2,
} from "lucide-react";
import { clsx } from "clsx";

const PHONE_PREFIXES = [
  { code: "+228", flag: "🇹🇬", label: "Togo" },
  { code: "+225", flag: "🇨🇮", label: "Côte d'Ivoire" },
  { code: "+229", flag: "🇧🇯", label: "Bénin" },
  { code: "+226", flag: "🇧🇫", label: "Burkina Faso" },
  { code: "+233", flag: "🇬🇭", label: "Ghana" },
  { code: "+221", flag: "🇸🇳", label: "Sénégal" },
  { code: "+234", flag: "🇳🇬", label: "Nigeria" },
  { code: "+237", flag: "🇨🇲", label: "Cameroun" },
  { code: "+33",  flag: "🇫🇷", label: "France" },
  { code: "+1",   flag: "🇺🇸", label: "USA / Canada" },
];

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
  nom:               string;
  adresse:           string;
  zone:              string;
  note:              string;
  lien_localisation: string;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();

  const [selectedItems, setSelectedItems] = useState<typeof items>(items);

  useEffect(() => {
    const stored = sessionStorage.getItem("cart_selected");
    if (stored) {
      const keys = new Set<string>(JSON.parse(stored) as string[]);
      const filtered = items.filter(i => keys.has(i.cartKey));
      setSelectedItems(filtered.length > 0 ? filtered : items);
      sessionStorage.removeItem("cart_selected");
    } else {
      setSelectedItems(items);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTotal = selectedItems.reduce((sum, i) => sum + calcPrice(i) * i.qty, 0);

  const [form, setForm] = useState<Form>({
    nom: "", adresse: "", zone: "", note: "", lien_localisation: "",
  });
  const [phonePrefix,  setPhonePrefix]  = useState("+228");
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [submitted,    setSubmitted]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<Partial<Form & { telephone: string }>>({});
  const [submitError,  setSubmitError]  = useState("");
  const [orderedItems, setOrderedItems] = useState<typeof items>([]);
  const [orderedTotal, setOrderedTotal] = useState(0);
  const [orderRef,     setOrderRef]     = useState("");
  const [refCode,      setRefCode]      = useState<string | null>(null);
  const [nbTranches,   setNbTranches]   = useState<0 | 2 | 3 | 4>(0); // 0 = comptant

  useEffect(() => {
    const match = document.cookie?.match?.(/ts_ref=([^;]+)/);
    if (match) setRefCode(decodeURIComponent(match[1]));
  }, []);

  const selectedZone   = ZONES.find(z => z.label === form.zone);
  const deliveryFee    = selectedZone?.fee ?? 0;
  const grandTotal     = selectedTotal + deliveryFee;
  const montantTranche = nbTranches > 0
    ? Math.round((grandTotal / nbTranches) * 100) / 100
    : grandTotal;

  function trancheDate(index: number) {
    const d = new Date();
    d.setDate(d.getDate() + index * 7);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function validate(): boolean {
    const e: Partial<Form & { telephone: string }> = {};
    if (!form.nom.trim())       e.nom       = "Votre nom est requis.";
    if (!phoneNumber.trim())    e.telephone = "Votre numéro est requis.";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (selectedItems.length === 0) return;
    setLoading(true);
    setSubmitError("");
    try {
      const telephone = `${phonePrefix} ${phoneNumber.trim()}`;
      const orderItems = selectedItems.map(i => ({
        id:           i.id,
        nom:          i.nom,
        reference:    i.reference,
        prix_unitaire: calcPrice(i),
        qty:          i.qty,
        total:        calcPrice(i) * i.qty,
      }));
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nom:               form.nom,
          telephone,
          adresse:           form.adresse,
          zone_livraison:    form.zone,
          delivery_fee:      deliveryFee,
          note:              form.note,
          lien_localisation: form.lien_localisation || null,
          items:             orderItems,
          subtotal:          selectedTotal,
          total:             grandTotal,
          ref_code:          refCode ?? undefined,
          payment_mode:      nbTranches > 0 ? `${nbTranches}x` : "comptant",
          nb_tranches:       nbTranches > 0 ? nbTranches : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Erreur lors de la commande."); return; }
      setOrderedItems([...selectedItems]);
      setOrderedTotal(grandTotal);
      setOrderRef(data.reference ?? "");
      setSubmitted(true);
      clearCart();
    } catch {
      setSubmitError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  /* Empty cart guard */
  if (selectedItems.length === 0 && !submitted) {
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
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display text-2xl font-800 text-slate-900 mb-3">Commande confirmée !</h1>
        {orderRef && (
          <p className="text-xs font-mono bg-slate-100 text-slate-600 inline-block px-3 py-1 rounded-lg mb-4">
            Réf. {orderRef}
          </p>
        )}
        <p className="text-slate-600 text-sm max-w-sm mx-auto mb-6">
          Votre commande a bien été enregistrée. Notre équipe vous contactera très bientôt pour confirmer la livraison.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-100 text-brand-800 text-sm font-semibold mb-8">
          <Star className="w-4 h-4 text-brand-600" fill="currentColor" />
          ~{Math.floor(orderedTotal / 100)} points fidélité à recevoir après livraison
          <Link href="/fidelite" className="text-xs text-brand-600 hover:underline ml-1">En savoir plus →</Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
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

        {orderedItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                ))}
              </div>
              <h2 className="font-display font-800 text-slate-900 text-base">Votre avis compte !</h2>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Dès réception de votre commande, partagez votre expérience — cela aide d'autres clients à mieux choisir.
            </p>
            <div className="flex flex-col gap-2">
              {orderedItems.map(item => (
                <Link key={item.id} href={`/products/${item.reference}#avis`}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all group"
                >
                  <span className="text-sm text-slate-800 font-medium line-clamp-1">{item.nom}</span>
                  <span className="shrink-0 text-xs font-bold text-amber-600 group-hover:underline">
                    Laisser un avis →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Input style — text-base (16px) prevents iOS zoom */
  const inputCls = (err?: string) => clsx(
    "w-full px-4 py-3 rounded-2xl border-2 text-base outline-none transition-all font-sans bg-white",
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

                  {/* Nom */}
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

                  {/* Téléphone : indicatif + numéro */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />Numéro de téléphone *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative shrink-0">
                        <select
                          value={phonePrefix}
                          onChange={e => setPhonePrefix(e.target.value)}
                          className="h-full pl-3 pr-7 py-3 rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none text-base bg-white appearance-none cursor-pointer font-semibold text-slate-800"
                        >
                          {PHONE_PREFIXES.map(p => (
                            <option key={p.code} value={p.code}>
                              {p.flag} {p.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => { setPhoneNumber(e.target.value); setErrors(err => ({ ...err, telephone: undefined })); }}
                        placeholder="90 00 00 00"
                        className={clsx(inputCls(errors.telephone), "flex-1 min-w-0")}
                        autoComplete="tel-national"
                      />
                    </div>
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

                  {/* Adresse */}
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

                  {/* Lien de localisation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <Link2 className="w-3.5 h-3.5 inline mr-1" />Lien de localisation (optionnel)
                    </label>
                    <div className="relative">
                      <input
                        type="url" name="lien_localisation" value={form.lien_localisation}
                        onChange={handleChange}
                        placeholder="Coller un lien Google Maps, Apple Maps…"
                        className={clsx(inputCls(), "pr-24")}
                        autoComplete="off"
                      />
                      {form.lien_localisation && (
                        <a
                          href={form.lien_localisation}
                          target="_blank" rel="noreferrer"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
                        >
                          <MapPin className="w-3.5 h-3.5" /> Voir
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Partagez votre position depuis Google Maps — s'ouvre dans l'application</p>
                  </div>

                  {/* Zone */}
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

                  {/* Note */}
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

              {/* Mode de paiement */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <h2 className="font-display font-800 text-slate-900 text-base mb-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-900 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  Mode de paiement
                </h2>

                {/* Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {([
                    { v: 0, label: "Comptant",  sub: "En une fois" },
                    { v: 2, label: "2 fois",    sub: `${formatPrice(Math.round(grandTotal / 2 * 100) / 100)} / sem.` },
                    { v: 3, label: "3 fois",    sub: `${formatPrice(Math.round(grandTotal / 3 * 100) / 100)} / sem.` },
                    { v: 4, label: "4 fois",    sub: `${formatPrice(Math.round(grandTotal / 4 * 100) / 100)} / sem.` },
                  ] as { v: 0|2|3|4; label: string; sub: string }[]).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setNbTranches(opt.v)}
                      className={clsx(
                        "flex flex-col items-center gap-0.5 px-3 py-3 rounded-2xl border-2 text-center transition-all",
                        nbTranches === opt.v
                          ? "border-brand-600 bg-brand-50 text-brand-900"
                          : "border-slate-200 text-slate-600 hover:border-brand-300"
                      )}
                    >
                      <span className="font-bold text-sm">{opt.label}</span>
                      <span className="text-[10px] text-slate-400">{opt.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Comptant info */}
                {nbTranches === 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-100">
                    <div className="w-8 h-8 rounded-xl bg-brand-900 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-brand-900 text-sm">Paiement à la livraison</p>
                      <p className="text-brand-700 text-xs mt-0.5 leading-relaxed">
                        Espèces ou Mobile Money (Flooz / T-Money) à la réception. Aucune info bancaire requise.
                      </p>
                    </div>
                  </div>
                )}

                {/* Échéancier */}
                {nbTranches > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">
                      Votre échéancier — {nbTranches} versements hebdomadaires
                    </p>
                    <div className="space-y-2">
                      {Array.from({ length: nbTranches }, (_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={clsx(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                              i === 0 ? "bg-amber-500 text-white" : "bg-amber-200 text-amber-700"
                            )}>
                              {i + 1}
                            </div>
                            <span className="text-xs text-slate-600">
                              {i === 0 ? "Aujourd'hui" : trancheDate(i)}
                              {i === 0 && <span className="ml-1 text-amber-600 font-semibold">← à payer pour confirmer</span>}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{formatPrice(montantTranche)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-3 leading-snug">
                      ⚠️ Le produit sera livré après le dernier versement confirmé par notre équipe.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Summary ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sticky top-24">
                <h2 className="font-display font-800 text-slate-900 text-lg mb-5">Votre commande</h2>

                {/* Items */}
                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                  {selectedItems.map(item => {
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
                    <span className="font-semibold">{formatPrice(selectedTotal)}</span>
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

                <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 mb-5">
                  <span className="font-display font-800 text-slate-900">Total</span>
                  <span className="font-display font-800 text-2xl text-brand-900">{formatPrice(grandTotal)}</span>
                </div>

                {submitError && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-brand-900 text-white font-bold text-base hover:bg-brand-800 transition-all disabled:opacity-60"
                >
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours…</>
                    : <><Check className="w-5 h-5" /> Confirmer ma commande</>
                  }
                </button>

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
