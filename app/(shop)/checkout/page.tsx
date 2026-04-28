"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { calcPrice } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, Check, MapPin, Phone,
  User, MessageSquare, ChevronDown, Truck, Star, Loader2, Link2, ShieldCheck, Package,
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

/* ── Frais de retrait Moov Money (max de plage) ── */
function moovFees(amount: number): number {
  if (amount <= 500)     return 50;
  if (amount <= 1000)    return 75;
  if (amount <= 5000)    return 100;
  if (amount <= 15000)   return 280;
  if (amount <= 20000)   return 320;
  if (amount <= 50000)   return 600;
  if (amount <= 100000)  return 1000;
  if (amount <= 200000)  return 3356;
  if (amount <= 300000)  return 4195;
  if (amount <= 500000)  return 4381;
  if (amount <= 850000)  return 4568;
  if (amount <= 1000000) return 5407;
  if (amount <= 1500000) return 8110;
  return 9788;
}

/* ── Frais de retrait Mixx by Yas ── */
function yasFees(amount: number): number {
  if (amount <= 500)     return 50;
  if (amount <= 5000)    return 100;
  if (amount <= 20000)   return 300;
  if (amount <= 50000)   return 600;
  if (amount <= 100000)  return 1000;
  if (amount <= 200000)  return 3100;
  if (amount <= 300000)  return 3700;
  if (amount <= 500000)  return 4200;
  if (amount <= 850000)  return 4400;
  if (amount <= 900000)  return 4600;
  if (amount <= 950000)  return 4900;
  if (amount <= 1000000) return 5100;
  if (amount <= 1100000) return 5400;
  if (amount <= 1150000) return 5900;
  if (amount <= 1200000) return 6200;
  if (amount <= 1250000) return 6500;
  if (amount <= 1300000) return 6800;
  if (amount <= 1350000) return 7000;
  if (amount <= 1400000) return 7300;
  if (amount <= 1450000) return 7600;
  if (amount <= 1500000) return 7800;
  return 9700;
}

const MOOV_FEES_TABLE = [
  { tranche: "1 – 500 F",              tarif: "50 F" },
  { tranche: "501 – 1 000 F",          tarif: "75 F" },
  { tranche: "1 001 – 5 000 F",        tarif: "100 F" },
  { tranche: "5 001 – 15 000 F",       tarif: "280 F" },
  { tranche: "15 001 – 20 000 F",      tarif: "320 F" },
  { tranche: "20 001 – 50 000 F",      tarif: "600 F" },
  { tranche: "50 001 – 100 000 F",     tarif: "1 000 F" },
  { tranche: "100 001 – 200 000 F",    tarif: "3 356 F" },
  { tranche: "200 001 – 500 000 F",    tarif: "4 381 F" },
  { tranche: "500 001 – 1 000 000 F",  tarif: "5 407 F" },
  { tranche: "> 1 000 000 F",          tarif: "9 788 F" },
];

const YAS_FEES_TABLE = [
  { tranche: "1 – 500 F",              tarif: "50 F" },
  { tranche: "501 – 5 000 F",          tarif: "100 F" },
  { tranche: "5 001 – 20 000 F",       tarif: "300 F" },
  { tranche: "20 001 – 50 000 F",      tarif: "600 F" },
  { tranche: "50 001 – 100 000 F",     tarif: "1 000 F" },
  { tranche: "100 001 – 200 000 F",    tarif: "3 100 F" },
  { tranche: "200 001 – 500 000 F",    tarif: "4 200 F" },
  { tranche: "500 001 – 1 000 000 F",  tarif: "5 100 F" },
  { tranche: "> 1 000 000 F",          tarif: "9 700 F" },
];

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
  const [isVerifie,    setIsVerifie]    = useState<boolean | null>(null);
  const [payMode,      setPayMode]      = useState<"livraison" | "flooz" | "yas" | "echelonne">("livraison");
  const [mmRef,        setMmRef]        = useState("");

  useEffect(() => {
    fetch("/api/account/verification", { credentials: "include" })
      .then(r => r.json())
      .then(d => setIsVerifie(d.statut === "verifie"))
      .catch(() => setIsVerifie(false));
  }, []);


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
          payment_mode:      payMode === "flooz" ? "moov_direct" : payMode === "yas" ? "yas_direct" : payMode === "echelonne" && nbTranches > 0 ? `${nbTranches}x` : "comptant",
          nb_tranches:       nbTranches > 0 ? nbTranches : undefined,
          mm_transaction_ref: (payMode === "flooz" || payMode === "yas") ? mmRef.trim() || null : null,
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

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
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

        {orderRef && (
          <div className="mb-8">
            <Link
              href={`/suivi-commande?ref=${encodeURIComponent(orderRef)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm hover:bg-emerald-100 transition-colors"
            >
              <Package className="w-4 h-4" />
              Suivre ma commande
            </Link>
          </div>
        )}

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

              {/* Mode de paiement — 4 cartes horizontales */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <h2 className="font-display font-800 text-slate-900 text-base mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-900 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  Mode de paiement
                </h2>

                {/* Cards row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {([
                    {
                      id: "livraison",
                      label: "À la livraison",
                      sub: "Espèces / MM",
                      locked: false,
                      logo: (
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-brand-700" />
                        </div>
                      ),
                    },
                    {
                      id: "flooz",
                      label: "Moov Money",
                      sub: "Moov Africa Togo",
                      locked: false,
                      logo: (
                        <img src="/logo-moov-money.svg" alt="Moov Money" className="w-12 h-12 object-contain" />
                      ),
                    },
                    {
                      id: "yas",
                      label: "Mixx by Yas",
                      sub: "Moov Africa Togo",
                      locked: false,
                      logo: (
                        <img src="/logo-mixx-by-yas.svg" alt="Mixx by Yas" className="w-14 h-8 object-contain" />
                      ),
                    },
                    {
                      id: "echelonne",
                      label: "Échelonné",
                      sub: isVerifie ? "2× / 3× / 4×" : "Compte vérifié",
                      locked: isVerifie === false,
                      logo: (
                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", isVerifie === false ? "bg-slate-100" : "bg-amber-50")}>
                          <ShieldCheck className={clsx("w-5 h-5", isVerifie === false ? "text-slate-300" : "text-amber-600")} />
                        </div>
                      ),
                    },
                  ] as { id: string; label: string; sub: string; locked: boolean; logo: React.ReactNode }[]).map(opt => {
                    const selected = payMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={opt.locked}
                        onClick={() => {
                          if (opt.locked) return;
                          setPayMode(opt.id as typeof payMode);
                          if (opt.id === "echelonne" && nbTranches === 0) setNbTranches(2);
                        }}
                        className={clsx(
                          "relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-center",
                          selected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : opt.locked
                            ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                        )}
                      >
                        {selected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                        {opt.locked && (
                          <span className="absolute top-2 right-2 text-[11px]">🔒</span>
                        )}
                        <div className="flex items-center justify-center h-12">
                          {opt.logo}
                        </div>
                        <div>
                          <p className={clsx("text-xs font-bold leading-tight", selected ? "text-blue-900" : "text-slate-800")}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Expanded panel */}
                {payMode && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    {payMode === "livraison" && (
                      <div className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                        <p className="text-xs text-brand-800 leading-relaxed">
                          Payez en espèces ou via Mobile Money directement à la réception. Aucune info bancaire requise.
                        </p>
                      </div>
                    )}

                    {(payMode === "flooz" || payMode === "yas") && (() => {
                      const isMoov        = payMode === "flooz";
                      const merchantNum   = isMoov ? "98165380" : "90226491";
                      const merchantDisp  = isMoov ? "+228 98 16 53 80" : "+228 90 22 64 91";
                      const fees          = isMoov ? moovFees(grandTotal) : yasFees(grandTotal);
                      const totalToSend   = Math.round(grandTotal + fees);
                      const ussdLink      = isMoov
                        ? `tel:*155*1*1*${merchantNum}*${merchantNum}*${totalToSend}*2%23`
                        : `tel:*145*1*${totalToSend}*${merchantNum}*2%23`;
                      const copyText      = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});
                      const feesTable     = isMoov ? MOOV_FEES_TABLE : YAS_FEES_TABLE;
                      const refPlaceholder = isMoov ? "Txn Id: 040584378298" : "Ref: 16974415751";

                      return (
                        <div className="space-y-4">
                          {/* Montant total à envoyer + numéro — desktop uniquement */}
                          <div className="hidden lg:block rounded-xl border border-slate-200 divide-y divide-slate-100">
                            <div className="flex items-center justify-between px-4 py-3">
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Montant à envoyer</p>
                                <p className="text-lg font-bold text-slate-900">{formatPrice(totalToSend)}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {formatPrice(grandTotal)} + {formatPrice(fees)} frais de retrait
                                </p>
                              </div>
                              <button type="button" onClick={() => copyText(String(totalToSend))}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                                Copier
                              </button>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Numéro marchand</p>
                                <p className="text-lg font-bold text-slate-900">{merchantDisp}</p>
                              </div>
                              <button type="button" onClick={() => copyText(merchantNum)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                                Copier
                              </button>
                            </div>
                          </div>

                          {/* Bouton USSD */}
                          <a href={ussdLink}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors">
                            <Phone className="w-4 h-4" />
                            Valider mon paiement
                          </a>
                          <p className="text-[11px] text-slate-400 text-center -mt-2">
                            Sur iPhone : ouvrez votre app {isMoov ? "Moov Money" : "Mixx by Yas"} et transférez manuellement.
                          </p>

                          {/* Grille tarifaire — desktop uniquement */}
                          <details className="hidden lg:block group">
                            <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600 font-medium select-none list-none flex items-center gap-1">
                              <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
                              Voir la grille tarifaire des frais de retrait
                            </summary>
                            <div className="mt-2 rounded-xl border border-slate-100 overflow-hidden text-xs">
                              <div className="grid grid-cols-2 bg-slate-100 px-3 py-1.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                                <span>Tranche</span><span className="text-right">Frais retrait</span>
                              </div>
                              {feesTable.map((row, i) => (
                                <div key={i} className={`grid grid-cols-2 px-3 py-1.5 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                                  <span className="text-slate-600">{row.tranche}</span>
                                  <span className="text-right font-semibold text-slate-800">{row.tarif}</span>
                                </div>
                              ))}
                            </div>
                          </details>

                          {/* Référence transaction */}
                          <div className="pt-2 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                              Référence de transaction reçue par SMS{" "}
                              <span className="text-slate-400 font-normal">(optionnel mais recommandé)</span>
                            </label>
                            <input
                              type="text"
                              value={mmRef}
                              onChange={e => setMmRef(e.target.value)}
                              placeholder={refPlaceholder}
                              className={inputCls()}
                              autoComplete="off"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              Entrez la référence reçue après paiement pour accélérer la vérification.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {payMode === "echelonne" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {([2, 3, 4] as const).map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setNbTranches(n)}
                              className={clsx(
                                "flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                                nbTranches === n
                                  ? "border-blue-600 bg-blue-50 text-blue-900"
                                  : "border-slate-200 text-slate-600 hover:border-blue-300"
                              )}
                            >
                              {n}×
                              <span className="block text-[10px] font-normal text-slate-400">
                                {formatPrice(Math.round(grandTotal / n))} / sem.
                              </span>
                            </button>
                          ))}
                        </div>
                        {nbTranches > 0 && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                            {Array.from({ length: nbTranches }, (_, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className={clsx("w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                                    i === 0 ? "bg-amber-500 text-white" : "bg-amber-200 text-amber-700"
                                  )}>{i + 1}</div>
                                  <span className="text-slate-600">{i === 0 ? "Aujourd'hui" : trancheDate(i)}</span>
                                </div>
                                <span className="font-bold text-slate-900">{formatPrice(Math.round(grandTotal / nbTranches))}</span>
                              </div>
                            ))}
                            <p className="text-[11px] text-amber-700 pt-1">⚠️ Livraison après confirmation du dernier versement.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isVerifie === false && (
                  <p className="text-xs text-amber-700 mt-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Le paiement échelonné nécessite un <Link href="/account/verification" className="underline font-semibold">compte vérifié →</Link></span>
                  </p>
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
