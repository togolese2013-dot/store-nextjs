import type { Metadata } from "next";
import Link from "next/link";
import {
  ShoppingBag, BarChart3, MessageCircle, Package, Truck,
  Tag, Users, CreditCard, Zap, CheckCircle, Star,
  ArrowRight, Globe, Shield, Smartphone, TrendingUp,
  ChevronRight, Menu,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ShopSaaS — Gérez votre boutique en ligne simplement",
  description:
    "La plateforme tout-en-un pour lancer et gérer votre boutique en ligne : stock, commandes, WhatsApp CRM, finances et livraisons. Démarrez gratuitement.",
};

/* ─── Data ─────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Boutique en ligne",
    desc: "Créez votre catalogue produits, gérez les variantes, les prix et les promotions. Vos clients commandent 24h/24.",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Package,
    title: "Gestion des stocks",
    desc: "Suivez votre stock en temps réel, configurez les seuils d'alerte et synchronisez boutique & entrepôt automatiquement.",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp CRM",
    desc: "Communiquez avec vos clients via WhatsApp. Envoyez des notifications automatiques à chaque commande ou livraison.",
    color: "from-green-500 to-green-600",
    bg: "bg-green-50",
  },
  {
    icon: BarChart3,
    title: "Finance & Rapports",
    desc: "Tableau de bord financier complet : recettes, dépenses, solde net par mode de paiement. Rapports exportables.",
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Truck,
    title: "Livraisons",
    desc: "Gérez vos zones et frais de livraison, suivez les livraisons en cours et notifiez vos livreurs en temps réel.",
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Tag,
    title: "Coupons & Fidélité",
    desc: "Créez des codes promo, des remises en pourcentage ou montant fixe. Programme de fidélité intégré.",
    color: "from-pink-500 to-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: Users,
    title: "Gestion clients",
    desc: "Base clients centralisée, historique d'achats, soldes, notes. Connaissez chaque client comme votre meilleur ami.",
    color: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    icon: CreditCard,
    title: "Paiements flexibles",
    desc: "Cash, mobile money (Flooz, T-Money), virement, paiement en plusieurs fois. Gérez les acomptes et les soldes.",
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Créez votre boutique",
    desc: "Inscrivez-vous, choisissez votre plan et configurez votre boutique en quelques minutes. Pas de code requis.",
    icon: Globe,
  },
  {
    num: "02",
    title: "Ajoutez vos produits",
    desc: "Importez votre catalogue, définissez vos prix, vos stocks et vos zones de livraison. C'est tout.",
    icon: Package,
  },
  {
    num: "03",
    title: "Commencez à vendre",
    desc: "Partagez votre lien boutique sur WhatsApp, Facebook ou Instagram. Les commandes arrivent automatiquement.",
    icon: TrendingUp,
  },
];

const PLANS = [
  {
    name: "Gratuit",
    price: "0",
    period: "toujours",
    desc: "Pour tester et démarrer",
    features: [
      "Jusqu'à 20 produits",
      "50 commandes / mois",
      "1 utilisateur admin",
      "Gestion de stock basique",
      "Support par email",
    ],
    cta: "Démarrer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "9 900",
    period: "/ mois (FCFA)",
    desc: "Pour les boutiques actives",
    features: [
      "Produits illimités",
      "Commandes illimitées",
      "5 utilisateurs admin",
      "WhatsApp CRM inclus",
      "Finance & rapports",
      "Coupons & fidélité",
      "Support prioritaire",
    ],
    cta: "Essayer 14 jours gratuit",
    highlighted: true,
  },
  {
    name: "Business",
    price: "24 900",
    period: "/ mois (FCFA)",
    desc: "Pour les équipes et revendeurs",
    features: [
      "Tout du plan Pro",
      "Utilisateurs illimités",
      "Multi-entrepôts",
      "API & webhooks",
      "Marque blanche",
      "Gestionnaire dédié",
      "SLA 99.9%",
    ],
    cta: "Nous contacter",
    highlighted: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Akosua M.",
    role: "Boutique mode & accessoires, Lomé",
    text: "En 2 jours j'avais tout configuré. Mes clients reçoivent automatiquement leur confirmation WhatsApp. Je gagne 3h par jour sur les suivis.",
    stars: 5,
  },
  {
    name: "Koffi D.",
    role: "Électronique & gaming, Accra",
    text: "Le tableau de bord finance est impressionnant. Je sais exactement combien j'ai en caisse, en mobile money, et ce que je dois à mes fournisseurs.",
    stars: 5,
  },
  {
    name: "Fatou S.",
    role: "Cosmétiques & beauté, Abidjan",
    text: "L'alerte stock m'a sauvé plusieurs fois. Plus jamais de rupture surprise. Et mes livreurs reçoivent leur feuille de route directement sur WhatsApp.",
    stars: 5,
  },
];

const STATS = [
  { value: "500+", label: "Boutiques actives" },
  { value: "50 000+", label: "Commandes traitées" },
  { value: "98%", label: "Satisfaction clients" },
  { value: "< 5 min", label: "Pour démarrer" },
];

/* ─── Components ────────────────────────────────────────────────────────── */

function StarRating({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function SaasLanding() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ShopSaaS</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#fonctionnalites" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
            <a href="#comment" className="hover:text-blue-600 transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-blue-600 transition-colors">Tarifs</a>
            <a href="#temoignages" className="hover:text-blue-600 transition-colors">Témoignages</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden md:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Connexion
            </Link>
            <a
              href="#tarifs"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Démarrer gratuitement
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-20 pb-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Plateforme de gestion de boutique tout-en-un
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
            Gérez votre boutique.<br />
            <span className="text-blue-600">Vendez plus.</span> Sans stress.
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stock, commandes, WhatsApp CRM, finances, livraisons — tout au même endroit.
            Lancez votre boutique en 5 minutes, aucune compétence technique requise.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#tarifs"
              className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Créer ma boutique gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#fonctionnalites"
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl text-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              Voir les fonctionnalités
            </a>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-gray-700 rounded-md h-6 max-w-sm mx-auto flex items-center px-3">
                  <span className="text-gray-400 text-xs">app.shopsaas.com/admin</span>
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="grid grid-cols-4 gap-3 p-6 bg-gray-900">
                {[
                  { label: "Ventes du jour", value: "127 500 FCFA", trend: "+12%", color: "bg-blue-500" },
                  { label: "Commandes", value: "23", trend: "+5", color: "bg-emerald-500" },
                  { label: "Stock faible", value: "4 produits", trend: "⚠️", color: "bg-amber-500" },
                  { label: "Clients actifs", value: "1 248", trend: "+8%", color: "bg-violet-500" },
                ].map((card) => (
                  <div key={card.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className={`w-8 h-1 rounded-full ${card.color} mb-3`} />
                    <div className="text-xs text-gray-400 mb-1">{card.label}</div>
                    <div className="text-white font-bold text-sm">{card.value}</div>
                    <div className="text-xs text-emerald-400 mt-1">{card.trend}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 px-6 pb-6 bg-gray-900">
                <div className="col-span-2 bg-gray-800 rounded-xl p-4 border border-gray-700 h-24">
                  <div className="text-xs text-gray-400 mb-2">Commandes récentes</div>
                  {["CMD-240512 • Kofi A. • 45 000 FCFA", "CMD-240511 • Fatou B. • 12 500 FCFA", "CMD-240511 • Ama K. • 89 000 FCFA"].map(row => (
                    <div key={row} className="text-xs text-gray-300 border-b border-gray-700 py-0.5 last:border-0">{row}</div>
                  ))}
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 h-24 flex flex-col justify-between">
                  <div className="text-xs text-gray-400">Stock critique</div>
                  <div className="space-y-1">
                    {["iPhone 15 • 2 restants", "AirPods Pro • 0"].map(item => (
                      <div key={item} className="text-xs text-amber-400">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Shadow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-blue-200 blur-2xl opacity-40 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-blue-200 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-4">
              Tout ce dont vous avez besoin,<br />
              <span className="text-blue-600">dans une seule plateforme</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Fini les outils dispersés. ShopSaaS centralise tout votre business pour vous faire gagner du temps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all bg-white"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="comment" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Comment ça marche</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-4">
              Lancez-vous en <span className="text-blue-600">3 étapes</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Aucune compétence technique requise. Si vous savez utiliser WhatsApp, vous savez utiliser ShopSaaS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-blue-100" />

            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-blue-100 shadow-sm flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="tarifs" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Tarifs</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-4">
              Simple, transparent, <span className="text-blue-600">sans surprise</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Commencez gratuitement, évoluez selon vos besoins. Annulez à tout moment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.highlighted
                    ? "bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full">
                    ⭐ Plus populaire
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`font-bold text-xl mb-1 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? "text-blue-200" : "text-gray-500"}`}>{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm pb-1 ${plan.highlighted ? "text-blue-200" : "text-gray-500"}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-blue-300" : "text-emerald-500"}`}
                      />
                      <span className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-600"}`}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            Paiement par mobile money (Flooz, T-Money) ou virement bancaire. Pas de carte bancaire requise.
          </p>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section id="temoignages" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Témoignages</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">
              Ils ont lancé leur boutique.<br />
              <span className="text-blue-600">Voici ce qu'ils en pensent.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <StarRating n={t.stars} />
                <blockquote className="text-gray-700 leading-relaxed my-4 text-sm">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Why ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, title: "Données sécurisées", desc: "Hébergement sécurisé, sauvegardes quotidiennes, accès par rôles." },
              { icon: Smartphone, title: "Mobile-first", desc: "Interface optimisée pour mobile. Gérez votre boutique depuis votre téléphone." },
              { icon: Zap, title: "Support réactif", desc: "Équipe disponible par WhatsApp. Réponse en moins de 2h en jours ouvrés." },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="text-blue-200 text-xl mb-10">
            Rejoignez 500+ commerçants qui gèrent leur business simplement avec ShopSaaS.
            Aucune carte bancaire requise pour démarrer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#tarifs"
              className="group flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Créer ma boutique — c&apos;est gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={`https://wa.me/22891000000?text=${encodeURIComponent("Bonjour, je voudrais en savoir plus sur ShopSaaS")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-blue-400 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:border-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Nous contacter sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-lg">ShopSaaS</span>
              </div>
              <p className="text-sm leading-relaxed">
                La plateforme de gestion de boutique conçue pour l&apos;Afrique de l&apos;Ouest.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Produit</h4>
              <ul className="space-y-2 text-sm">
                {["Fonctionnalités", "Tarifs", "Mises à jour", "Feuille de route"].map(l => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm">
                {["Documentation", "WhatsApp", "Email", "FAQ"].map(l => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Légal</h4>
              <ul className="space-y-2 text-sm">
                {["Conditions d'utilisation", "Politique de confidentialité", "Mentions légales"].map(l => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} ShopSaaS. Tous droits réservés.</p>
            <p>Fait avec ❤️ pour les commerçants d&apos;Afrique de l&apos;Ouest</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
