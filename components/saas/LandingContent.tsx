'use client';

import Link from 'next/link';
import {
  ShoppingBag, BarChart3, MessageCircle, Package, Truck, Tag, Users,
  CreditCard, Zap, CheckCircle, Star, ArrowRight, Globe, Shield,
  Smartphone, TrendingUp, Play,
} from 'lucide-react';
import { useLang } from './useLang';

/* ─── Tints ─────────────────────────────────────────────────────────────── */
const TINTS: Record<string, { bg: string; fg: string }> = {
  amber:  { bg: '#FCEBD6', fg: '#B8501A' },
  forest: { bg: '#E4ECE6', fg: '#1F3D2E' },
  green:  { bg: '#E4F1EA', fg: '#1E5C3E' },
  plum:   { bg: '#ECE5F1', fg: '#5A3B7A' },
  rose:   { bg: '#F8E1DD', fg: '#9B3A2F' },
  teal:   { bg: '#DDEEEC', fg: '#1F5A55' },
};

/* ─── Translations ───────────────────────────────────────────────────────── */
const T = {
  fr: {
    nav: {
      features:   'Fonctionnalités',
      howItWorks: 'Comment ça marche',
      pricing:    'Tarifs',
      preview:    'Aperçu',
      login:      'Connexion',
      cta:        'Démarrer gratuitement',
    },
    hero: {
      eyebrow: "Conçu pour l'Afrique de l'Ouest",
      h1a: 'La solution adaptée aux',
      h1b: 'commerçants africains',
      h1c: '',
      p: "Boutique en ligne, gestion de stock multi-points, caisse & Finance, CRM, notification WhatsApp auto et livraison — réunis dans une seule plateforme pensée pour le terrain.",
      cta1: 'Créer ma boutique',
      cta2: 'Voir la démo',
      trust: 'Plus de 500 commerçants nous font confiance',
    },
    stats: [
      { value: '500+',     label: 'Boutiques actives' },
      { value: '50 000+', label: 'Commandes traitées' },
      { value: '98%',     label: 'Satisfaction clients' },
      { value: '< 5 min', label: 'Pour démarrer' },
    ],
    featuresSection: {
      eyebrow: 'Fonctionnalités',
      h2a: "Tout ce qu'il faut pour",
      h2b: 'gérer votre commerce.',
      p:    "Huit modules natifs, pensés pour le quotidien d'un commerçant en Afrique de l'Ouest. Pas de plug-ins, pas de bricolage — tout fonctionne ensemble dès le premier jour.",
      more: 'En savoir plus',
    },
    features: [
      { title: 'Boutique en ligne',   tint: 'amber',  tag: 'E-Commerce',  desc: "Créez votre catalogue produits, gérez les variantes, les prix et les promotions. Vos clients commandent 24h/24." },
      { title: 'Gestion des stocks',  tint: 'forest', tag: 'Inventaire',   desc: "Suivez votre stock en temps réel, configurez les seuils d'alerte et synchronisez boutique & entrepôt automatiquement." },
      { title: 'WhatsApp CRM',        tint: 'green',  tag: 'CRM',          desc: "Communiquez avec vos clients via WhatsApp. Envoyez des notifications automatiques à chaque commande ou livraison." },
      { title: 'Finance & Rapports',  tint: 'plum',   tag: 'Finance',      desc: "Tableau de bord financier complet : recettes, dépenses, solde net par mode de paiement. Rapports exportables." },
      { title: 'Livraisons',          tint: 'amber',  tag: 'Logistique',   desc: "Gérez vos zones et frais de livraison, suivez les livraisons en cours et notifiez vos livreurs en temps réel." },
      { title: 'Coupons & Fidélité',  tint: 'rose',   tag: 'Marketing',    desc: "Créez des codes promo, des remises en pourcentage ou montant fixe. Programme de fidélité intégré." },
      { title: 'Gestion clients',     tint: 'teal',   tag: 'Clients',      desc: "Base clients centralisée, historique d'achats, soldes, notes. Connaissez chaque client comme votre meilleur ami." },
      { title: 'Paiements flexibles', tint: 'forest', tag: 'Paiements',    desc: "Cash, mobile money (Flooz, T-Money), virement, paiement en plusieurs fois. Gérez les acomptes et les soldes." },
    ],
    stepsSection: {
      eyebrow: 'Comment ça marche',
      h2a: 'Lancez-vous en',
      h2b: '3 étapes',
      p:   "Aucune compétence technique requise. Si vous savez utiliser WhatsApp, vous savez utiliser Afrisika.",
    },
    steps: [
      { title: 'Créez votre boutique', desc: "Inscrivez-vous, choisissez votre plan et configurez votre boutique en quelques minutes. Pas de code requis." },
      { title: 'Ajoutez vos produits', desc: "Importez votre catalogue, définissez vos prix, vos stocks et vos zones de livraison. C'est tout." },
      { title: 'Commencez à vendre',   desc: "Partagez votre lien boutique sur WhatsApp, Facebook ou Instagram. Les commandes arrivent automatiquement." },
    ],
    pricingSection: {
      eyebrow:   'Tarifs simples · FCFA',
      h2a:       "Choisissez l'offre qui",
      h2b:       'grandit avec vous.',
      p:         "Pas de frais cachés. Pas de carte bancaire pour démarrer. Annulez quand vous voulez.",
      note:      "Paiement par mobile money (Flooz, T-Money, Wave, Orange Money) ou virement bancaire. Pas de carte requise.",
      mostPop:   'Le plus choisi',
    },
    plans: [
      {
        name: 'Gratuit', price: '0', period: 'toujours',
        desc: 'Pour tester et démarrer.',
        cta: 'Démarrer gratuitement', highlighted: false,
        href: '/saas/onboarding', external: false,
        features: ["Jusqu'à 20 produits", '50 commandes / mois', '1 utilisateur admin', 'Gestion de stock basique', 'Support par email'],
      },
      {
        name: 'Pro', price: '9 900', period: '/ mois (FCFA)',
        desc: 'La plupart de nos commerçants commencent ici.',
        cta: 'Essayer 14 jours gratuit', highlighted: true, tag: true,
        href: '/saas/onboarding?plan=basic', external: false,
        features: ['Produits illimités', 'Commandes illimitées', '5 utilisateurs admin', 'WhatsApp CRM inclus', 'Finance & rapports', 'Coupons & fidélité', 'Support prioritaire WhatsApp'],
      },
      {
        name: 'Business', price: '24 900', period: '/ mois (FCFA)',
        desc: 'Pour chaînes, grossistes & revendeurs.',
        cta: 'Nous contacter', highlighted: false,
        href: `https://wa.me/22890527912?text=${encodeURIComponent('Bonjour, je suis intéressé par le plan Business de Afrisika')}`,
        external: true,
        features: ['Tout du plan Pro', 'Utilisateurs illimités', 'Multi-entrepôts', 'API & webhooks', 'Marque blanche', 'Gestionnaire dédié', 'SLA 99,9%'],
      },
    ],
    previewSection: {
      eyebrow: 'Aperçu produit',
      h2a:     'Un admin pensé pour',
      h2b:     'le terrain africain.',
      p:       "Interface épurée, rapide sur mobile, conçue pour gérer votre commerce en quelques clics — même avec une connexion limitée.",
      kpis: [
        { label: 'Ventes du jour', value: '248 500 F', trend: '↑ 12%',      color: '#E07A2C' },
        { label: 'Commandes',      value: '34',        trend: '5 nouvelles', color: '#2D8A5F' },
        { label: 'Stock faible',   value: '6 articles', trend: '⚠ alerte',  color: '#C9601E' },
        { label: 'Clients actifs', value: '1 824',     trend: '↑ 8%',       color: '#5A3B7A' },
      ],
      recentOrders: 'Commandes récentes',
      viewAll:      'Voir tout →',
      orders: [
        { ref: 'CMD-2847', client: 'Fatou Koné',  montant: '89 000 F',  statut: 'Livré',      color: '#2D8A5F', bg: '#E4F1EA' },
        { ref: 'CMD-2846', client: 'Koffi Adu',   montant: '34 500 F',  statut: 'En cours',   color: '#B8501A', bg: '#FCEBD6' },
        { ref: 'CMD-2845', client: 'Akosua M.',   montant: '127 000 F', statut: 'Confirmé',   color: '#5A3B7A', bg: '#ECE5F1' },
        { ref: 'CMD-2844', client: 'Ibrahim Sow', montant: '18 200 F',  statut: 'En attente', color: '#6B635B', bg: '#F0EBE0' },
      ],
      stockTitle:  'Gestion des stocks',
      outOfStock:  'Épuisé',
      remaining:   'restants',
      financeTitle: 'Finance — Ce mois',
      vsLastMonth:  'vs mois dernier',
    },
    trust: [
      { title: 'Données sécurisées', desc: 'Hébergement sécurisé, sauvegardes quotidiennes, accès par rôles.' },
      { title: 'Mobile-first',        desc: 'Interface optimisée pour mobile. Gérez votre boutique depuis votre téléphone.' },
      { title: 'Support réactif',     desc: 'Équipe disponible par WhatsApp. Réponse en moins de 2h en jours ouvrés.' },
    ],
    ctaSection: {
      h2a:  'Prêt à digitaliser',
      h2b:  'votre commerce ?',
      p:    "Rejoignez les commerçants qui vendent plus et gèrent mieux avec Afrisika. 14 jours gratuits, sans engagement.",
      cta1: 'Démarrer gratuitement',
      cta2: 'Nous contacter sur WhatsApp',
    },
    footer: {
      tagline:   "Afrisika construit l'infrastructure du commerce africain. Une boutique, un stock, une caisse, un paiement — pensés pour ici.",
      copyright: 'Tous droits réservés',
      madeWith:  "Fait avec ❤︎ pour les commerçants d'Afrique de l'Ouest",
      cols: [
        { h: 'Produit',  links: ['Fonctionnalités', 'Tarifs', 'Mises à jour', 'Feuille de route'] },
        { h: 'Support',  links: ['Documentation', 'WhatsApp', 'Email', 'FAQ'] },
        { h: 'Légal',    links: ["Conditions d'utilisation", 'Politique de confidentialité', 'Mentions légales'] },
      ],
    },
  },
  en: {
    nav: {
      features:   'Features',
      howItWorks: 'How it works',
      pricing:    'Pricing',
      preview:    'Preview',
      login:      'Login',
      cta:        'Get started free',
    },
    hero: {
      eyebrow: 'Built for West Africa',
      h1a: 'The system',
      h1b: 'for African',
      h1c: 'businesses.',
      p: "Online store, multi-warehouse inventory, POS, mobile payments, and delivery — all in one platform built for the field.",
      cta1: 'Create my store',
      cta2: 'Watch demo',
      trust: 'Trusted by 500+ merchants',
    },
    stats: [
      { value: '500+',     label: 'Active stores' },
      { value: '50 000+', label: 'Orders processed' },
      { value: '98%',     label: 'Customer satisfaction' },
      { value: '< 5 min', label: 'To get started' },
    ],
    featuresSection: {
      eyebrow: 'Features',
      h2a:    'Everything you need to',
      h2b:    'run your business.',
      p:      "Eight native modules designed for everyday merchant life in West Africa. No plug-ins, no workarounds — everything works together from day one.",
      more:   'Learn more',
    },
    features: [
      { title: 'Online Store',         tint: 'amber',  tag: 'E-Commerce', desc: "Build your product catalog, manage variants, prices, and promotions. Your customers order 24/7." },
      { title: 'Inventory Management', tint: 'forest', tag: 'Inventory',  desc: "Track your stock in real time, set alert thresholds, and sync store & warehouse automatically." },
      { title: 'WhatsApp CRM',         tint: 'green',  tag: 'CRM',        desc: "Communicate with your customers via WhatsApp. Send automatic notifications for every order or delivery." },
      { title: 'Finance & Reports',    tint: 'plum',   tag: 'Finance',    desc: "Full financial dashboard: revenue, expenses, net balance by payment method. Exportable reports." },
      { title: 'Deliveries',           tint: 'amber',  tag: 'Logistics',  desc: "Manage your delivery zones and fees, track ongoing deliveries, and notify your drivers in real time." },
      { title: 'Coupons & Loyalty',    tint: 'rose',   tag: 'Marketing',  desc: "Create promo codes, percentage or fixed discounts. Built-in loyalty program." },
      { title: 'Customer Management',  tint: 'teal',   tag: 'Customers',  desc: "Centralized customer base, purchase history, balances, notes. Know every customer like a friend." },
      { title: 'Flexible Payments',    tint: 'forest', tag: 'Payments',   desc: "Cash, mobile money (Flooz, T-Money), wire transfer, installments. Manage deposits and balances." },
    ],
    stepsSection: {
      eyebrow: 'How it works',
      h2a:    'Get started in',
      h2b:    '3 steps',
      p:      "No technical skills required. If you know how to use WhatsApp, you know how to use Afrisika.",
    },
    steps: [
      { title: 'Create your store',    desc: "Sign up, choose your plan, and configure your store in minutes. No code required." },
      { title: 'Add your products',    desc: "Import your catalog, set your prices, stock levels, and delivery zones. That's all." },
      { title: 'Start selling',        desc: "Share your store link on WhatsApp, Facebook, or Instagram. Orders come in automatically." },
    ],
    pricingSection: {
      eyebrow:   'Simple pricing · FCFA',
      h2a:       'Choose the plan that',
      h2b:       'grows with you.',
      p:         "No hidden fees. No credit card to get started. Cancel anytime.",
      note:      "Pay by mobile money (Flooz, T-Money, Wave, Orange Money) or wire transfer. No card required.",
      mostPop:   'Most popular',
    },
    plans: [
      {
        name: 'Free', price: '0', period: 'forever',
        desc: 'To test and get started.',
        cta: 'Get started free', highlighted: false,
        href: '/saas/onboarding', external: false,
        features: ['Up to 20 products', '50 orders / month', '1 admin user', 'Basic inventory management', 'Email support'],
      },
      {
        name: 'Pro', price: '9 900', period: '/ month (FCFA)',
        desc: 'Most of our merchants start here.',
        cta: 'Try free for 14 days', highlighted: true, tag: true,
        href: '/saas/onboarding?plan=basic', external: false,
        features: ['Unlimited products', 'Unlimited orders', '5 admin users', 'WhatsApp CRM included', 'Finance & reports', 'Coupons & loyalty', 'Priority WhatsApp support'],
      },
      {
        name: 'Business', price: '24 900', period: '/ month (FCFA)',
        desc: 'For chains, wholesalers & resellers.',
        cta: 'Contact us', highlighted: false,
        href: `https://wa.me/22890527912?text=${encodeURIComponent('Hello, I am interested in the Afrisika Business plan')}`,
        external: true,
        features: ['Everything in Pro', 'Unlimited users', 'Multi-warehouse', 'API & webhooks', 'White label', 'Dedicated manager', '99.9% SLA'],
      },
    ],
    previewSection: {
      eyebrow: 'Product preview',
      h2a:    'An admin built for',
      h2b:    'the African field.',
      p:      "Clean interface, fast on mobile, designed to manage your business in a few clicks — even on a limited connection.",
      kpis: [
        { label: "Today's sales", value: '248 500 F', trend: '↑ 12%',   color: '#E07A2C' },
        { label: 'Orders',        value: '34',        trend: '5 new',    color: '#2D8A5F' },
        { label: 'Low stock',     value: '6 items',   trend: '⚠ alert',  color: '#C9601E' },
        { label: 'Active clients', value: '1 824',    trend: '↑ 8%',     color: '#5A3B7A' },
      ],
      recentOrders: 'Recent orders',
      viewAll:      'View all →',
      orders: [
        { ref: 'CMD-2847', client: 'Fatou Koné',  montant: '89 000 F',  statut: 'Delivered', color: '#2D8A5F', bg: '#E4F1EA' },
        { ref: 'CMD-2846', client: 'Koffi Adu',   montant: '34 500 F',  statut: 'In progress', color: '#B8501A', bg: '#FCEBD6' },
        { ref: 'CMD-2845', client: 'Akosua M.',   montant: '127 000 F', statut: 'Confirmed',  color: '#5A3B7A', bg: '#ECE5F1' },
        { ref: 'CMD-2844', client: 'Ibrahim Sow', montant: '18 200 F',  statut: 'Pending',    color: '#6B635B', bg: '#F0EBE0' },
      ],
      stockTitle:   'Inventory',
      outOfStock:   'Out of stock',
      remaining:    'remaining',
      financeTitle: 'Finance — This month',
      vsLastMonth:  'vs last month',
    },
    trust: [
      { title: 'Secure data',         desc: 'Secure hosting, daily backups, role-based access.' },
      { title: 'Mobile-first',        desc: 'Mobile-optimized interface. Manage your store from your phone.' },
      { title: 'Responsive support',  desc: 'Team available on WhatsApp. Response within 2 hours on business days.' },
    ],
    ctaSection: {
      h2a:  'Ready to digitize',
      h2b:  'your business?',
      p:    "Join merchants who sell more and manage better with Afrisika. 14 days free, no commitment.",
      cta1: 'Get started free',
      cta2: 'Contact us on WhatsApp',
    },
    footer: {
      tagline:   "Afrisika builds the infrastructure for African commerce. One store, one inventory, one POS, one payment — built for here.",
      copyright: 'All rights reserved',
      madeWith:  'Made with ❤︎ for West African merchants',
      cols: [
        { h: 'Product', links: ['Features', 'Pricing', 'Updates', 'Roadmap'] },
        { h: 'Support', links: ['Documentation', 'WhatsApp', 'Email', 'FAQ'] },
        { h: 'Legal',   links: ['Terms of Service', 'Privacy Policy', 'Legal Notice'] },
      ],
    },
  },
} as const;

/* ─── Icon map for features (same order as T.fr.features / T.en.features) ─── */
const FEATURE_ICONS = [ShoppingBag, Package, MessageCircle, BarChart3, Truck, Tag, Users, CreditCard];
const STEP_ICONS    = [Globe, Package, TrendingUp];
const TRUST_ICONS   = [Shield, Smartphone, Zap];

/* ─── Small helpers ─────────────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#B8501A]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#E07A2C]" />
      {children}
    </span>
  );
}

function StarRating({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-[#E07A2C] text-[#E07A2C]" />
      ))}
    </div>
  );
}

function HeroMock({ lang }: { lang: 'fr' | 'en' }) {
  return (
    <div className="relative w-full aspect-[1/0.9]">
      {/* Stat card (back) */}
      <div
        className="absolute top-0 right-0 w-[92%] aspect-[1/0.6] bg-white border border-[#E8E1D4] rounded-2xl overflow-hidden"
        style={{
          transform: 'rotate(-1deg)',
          boxShadow: '0 0.5px 0 0 rgba(255,255,255,0.6) inset, 0 1px 0 rgba(20,17,14,0.04), 0 14px 40px -18px rgba(20,17,14,0.18)',
        }}
      >
        <div className="p-6 flex flex-col gap-4 h-full">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-[#6B635B]">
                {lang === 'fr' ? 'Cette semaine' : 'This week'}
              </div>
              <div className="text-[28px] font-medium tracking-tight mt-1 leading-none text-[#14110E]">
                4 248 500 <span className="text-base font-normal text-[#6B635B]">F CFA</span>
              </div>
              <div className="text-xs text-[#2D8A5F] mt-1 font-medium">
                ↑ 18,2% {lang === 'fr' ? 'vs semaine passée' : 'vs last week'}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B635B] px-2.5 py-1 bg-[#F6EFE2] rounded-full">
              <span className="relative w-2 h-2 rounded-full bg-[#2D8A5F]">
                <span className="absolute -inset-1 rounded-full bg-[#2D8A5F] opacity-30 animate-ping" />
              </span>
              {lang === 'fr' ? 'En direct' : 'Live'}
            </div>
          </div>
          <div className="flex-1 flex items-end gap-1">
            {[40, 55, 30, 70, 60, 88, 95, 75, 100, 120, 105, 138, 130, 158].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[3px]"
                style={{
                  height: `${(v / 158) * 100}%`,
                  background: i > 9 ? 'linear-gradient(180deg,#F2A765,#E07A2C)' : '#E8E1D4',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Receipt card (front) */}
      <div
        className="absolute bottom-0 left-0 w-[62%] bg-white border border-[#E8E1D4] rounded-2xl overflow-hidden"
        style={{
          transform: 'rotate(1.5deg)',
          boxShadow: '0 1px 0 rgba(20,17,14,0.04), 0 24px 60px -20px rgba(20,17,14,0.18)',
        }}
      >
        <div className="px-4 py-3 border-b border-[#F0EBE0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md" style={{ background: 'linear-gradient(135deg,#F2A765,#B8501A)' }} />
            <div className="text-[13px] font-semibold text-[#14110E]">Ticket #2847</div>
          </div>
          <div className="text-[11px] text-[#6B635B] font-mono">14:32</div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {[
            { n: 'Pagne wax · 6 yds', q: 2, p: 18000 },
            { n: 'Bissap 500g',        q: 3, p: 1500  },
            { n: 'Karité 250g',        q: 1, p: 4500  },
          ].map((it, i) => (
            <div key={i} className="flex justify-between text-[12.5px]">
              <span className="text-[#2A2522]">{it.q}× {it.n}</span>
              <span className="text-[#14110E] font-medium">
                {(it.q * it.p).toLocaleString('fr-FR').replace(/,/g, ' ')} F
              </span>
            </div>
          ))}
          <div className="border-t border-dashed border-[#E8E1D4] pt-2 mt-1 flex justify-between items-center">
            <span className="text-[13px] font-medium">Total</span>
            <span className="text-[20px] font-medium tracking-tight">53 100 F</span>
          </div>
          <div className="bg-[#E4F1EA] border border-[#B5DCC4] rounded-lg px-2.5 py-2 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#1E5C3E]" />
            <span className="text-[12px] text-[#1E5C3E] font-medium">
              {lang === 'fr' ? 'Payé · Wave · +228 90 ••• 28' : 'Paid · Wave · +228 90 ••• 28'}
            </span>
          </div>
        </div>
      </div>

      {/* WhatsApp notification (floating) */}
      <div
        className="absolute top-[38%] right-[-3%] bg-[#14110E] text-white rounded-2xl px-3.5 py-3 flex items-center gap-2.5"
        style={{ transform: 'rotate(2deg)', boxShadow: '0 20px 50px -15px rgba(20,17,14,0.4)' }}
      >
        <div className="w-7 h-7 rounded-lg bg-[#E07A2C] grid place-items-center">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-[12px] font-medium">
            {lang === 'fr' ? 'Nouvelle commande' : 'New order'}
          </div>
          <div className="text-[10.5px] text-white/60">Fatou · WhatsApp · 12 500 F</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function LandingContent() {
  const [lang] = useLang();
  const t = T[lang];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[60px] pb-[60px] sm:pt-[80px] sm:pb-[80px]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(60% 50% at 80% 0%, rgba(224,122,44,0.12) 0%, transparent 70%), radial-gradient(50% 40% at 0% 100%, rgba(31,61,46,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
            <div className="max-w-[620px]">
              <div className="mb-5"><Eyebrow>{t.hero.eyebrow}</Eyebrow></div>
              <h1 className="font-medium tracking-[-0.035em] leading-[0.98] text-[44px] sm:text-[64px] lg:text-[80px] mb-5">
                {t.hero.h1a}
                <br />
                <span
                  className="font-normal italic tracking-[-0.02em]"
                  style={{
                    fontFamily: 'var(--af-serif)',
                    background: 'linear-gradient(96deg,#E07A2C 0%,#F2A765 40%,#B8501A 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {t.hero.h1b}
                </span>{' '}
                {t.hero.h1c}
              </h1>
              <p className="text-[18px] lg:text-[20px] text-[#6B635B] leading-[1.5] max-w-[56ch] mb-8">
                {t.hero.p}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/saas/onboarding"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[14.5px] font-medium text-white bg-[#14110E] hover:bg-black transition-all hover:-translate-y-px"
                  style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 16px -8px rgba(20,17,14,0.5)' }}
                >
                  {t.hero.cta1}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="#fonctionnalites"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[14.5px] font-medium text-[#14110E] bg-transparent border border-[#E8E1D4] hover:bg-white transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {t.hero.cta2}
                </a>
              </div>
              <div className="mt-9 flex items-center gap-4 text-[13.5px] text-[#6B635B]">
                <div className="flex">
                  {[
                    'linear-gradient(135deg,#E07A2C,#B8501A)',
                    'linear-gradient(135deg,#2D5240,#1F3D2E)',
                    'linear-gradient(135deg,#F2A765,#E07A2C)',
                    'linear-gradient(135deg,#3a2f25,#14110E)',
                  ].map((bg, i) => (
                    <span
                      key={i}
                      className="w-7 h-7 rounded-full -ml-2.5 first:ml-0 border-[2px] border-[#FBF7F1]"
                      style={{ background: bg }}
                    />
                  ))}
                </div>
                {t.hero.trust}
              </div>
            </div>
            <div className="relative w-full">
              <HeroMock lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="py-9 border-t border-b border-[#E8E1D4] bg-[#FBF7F1]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6">
            {t.stats.map((s, i) => (
              <div key={s.label} className={`text-center ${i > 0 ? 'md:border-l border-[#E8E1D4]' : ''}`}>
                <div className="text-[28px] sm:text-[34px] font-medium tracking-[-0.03em] text-[#14110E] leading-none">{s.value}</div>
                <div className="text-[12.5px] text-[#6B635B] mt-2 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-[100px]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-10 mb-14 items-end">
            <div>
              <div className="mb-5"><Eyebrow>{t.featuresSection.eyebrow}</Eyebrow></div>
              <h2 className="text-[34px] sm:text-[44px] lg:text-[52px] font-medium tracking-[-0.03em] leading-[1.02]">
                {t.featuresSection.h2a}{' '}
                <span className="font-normal italic" style={{ fontFamily: 'var(--af-serif)' }}>
                  {t.featuresSection.h2b}
                </span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {t.features.map((f, idx) => {
              const Icon = FEATURE_ICONS[idx];
              const tint = TINTS[f.tint];
              return (
                <div
                  key={f.title}
                  className="group relative bg-white border border-[#E8E1D4] rounded-[18px] flex flex-col transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_28px_-10px_rgba(20,17,14,0.14)] hover:border-[#14110E]/15 overflow-hidden"
                  style={{ boxShadow: '0 1px 0 rgba(20,17,14,0.03)' }}
                >
                  {/* Card body */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col">
                    {/* Header row: icon tile + tag pill */}
                    <div className="flex items-start justify-between mb-[22px]">
                      <div
                        className="w-[42px] h-[42px] rounded-[11px] grid place-items-center shrink-0"
                        style={{ background: tint.bg, color: tint.fg }}
                      >
                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
                      </div>
                      <span
                        className="text-[10.5px] font-medium tracking-[0.04em] uppercase px-2 py-1 rounded-full"
                        style={{
                          fontFamily: 'var(--af-mono)',
                          background: tint.bg,
                          color: tint.fg,
                        }}
                      >
                        {'tag' in f ? (f as { tag: string }).tag : ''}
                      </span>
                    </div>

                    {/* Title + desc */}
                    <h3 className="text-[15.5px] font-semibold tracking-[-0.02em] text-[#14110E] leading-[1.2] mb-2">
                      {f.title}
                    </h3>
                    <p className="text-[13.5px] text-[#6B635B] leading-[1.55]">{f.desc}</p>
                  </div>

                  {/* Footer row */}
                  <div className="border-t border-dashed border-[#E8E1D4] px-5 sm:px-6 py-3 flex items-center justify-between">
                    <span className="text-[12.5px] font-medium text-[#6B635B]">
                      {t.featuresSection.more}
                    </span>
                    <span
                      className="w-[30px] h-[30px] rounded-full border border-[#E8E1D4] grid place-items-center transition-all duration-200 group-hover:bg-[#14110E] group-hover:border-[#14110E]"
                    >
                      <ArrowRight className="w-3 h-3 text-[#6B635B] transition-colors group-hover:text-white" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section
        id="comment"
        className="py-[100px] text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #FBF7F1 0%, #F6EFE2 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(224,122,44,0.06), transparent 70%)' }}
        />
        <div className="relative max-w-[1080px] mx-auto px-5 sm:px-8">
          <div className="max-w-[720px] mx-auto mb-16 sm:mb-20 flex flex-col items-center gap-4">
            <Eyebrow>{t.stepsSection.eyebrow}</Eyebrow>
            <h2 className="text-[34px] sm:text-[44px] lg:text-[52px] font-medium tracking-[-0.03em] leading-[1.02] max-w-[16ch]">
              {t.stepsSection.h2a}{' '}
              <span
                className="font-normal italic"
                style={{
                  fontFamily: 'var(--af-serif)',
                  background: 'linear-gradient(96deg,#E07A2C 0%,#F2A765 40%,#B8501A 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {t.stepsSection.h2b}
              </span>
              .
            </h2>
            <p className="text-[17px] lg:text-[19px] text-[#6B635B] leading-[1.5] max-w-[52ch]">
              {t.stepsSection.p}
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-7 md:gap-10 max-w-[1080px] mx-auto">
            <div
              className="hidden md:block absolute top-[50px] left-[17%] right-[17%] h-px z-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #E8E1D4 8%, #E8E1D4 92%, transparent 100%)' }}
            />
            {t.steps.map((s, idx) => {
              const Icon = STEP_ICONS[idx];
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center px-3">
                  <div className="relative mb-5">
                    <div
                      className="w-[100px] h-[100px] rounded-[22px] bg-white border border-[#E8E1D4] grid place-items-center text-[#B8501A]"
                      style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 0 rgba(20,17,14,0.04), 0 18px 40px -16px rgba(20,17,14,0.16), 0 4px 14px -6px rgba(224,122,44,0.18)' }}
                    >
                      <Icon className="w-7 h-7" strokeWidth={1.7} />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-[30px] h-[30px] rounded-full text-white grid place-items-center font-mono text-[13px] font-semibold"
                      style={{ background: 'linear-gradient(180deg,#ED8A38,#C9601E)', boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 6px 14px -4px rgba(184,80,26,0.55)' }}
                    >
                      {idx + 1}
                    </div>
                  </div>
                  <h4 className="text-[22px] font-medium tracking-[-0.02em] mb-2.5">{s.title}</h4>
                  <p className="text-[14.5px] text-[#6B635B] leading-[1.55] max-w-[32ch]">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="tarifs" className="py-[100px]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-10 mb-12 items-end">
            <div>
              <div className="mb-5"><Eyebrow>{t.pricingSection.eyebrow}</Eyebrow></div>
              <h2 className="text-[34px] sm:text-[44px] lg:text-[52px] font-medium tracking-[-0.03em] leading-[1.02]">
                {t.pricingSection.h2a}{' '}
                <span className="font-normal italic" style={{ fontFamily: 'var(--af-serif)' }}>
                  {t.pricingSection.h2b}
                </span>
              </h2>
            </div>
            <p className="text-[17px] lg:text-[19px] text-[#6B635B] leading-[1.5] max-w-[54ch]">
              {t.pricingSection.p}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[1080px] mx-auto">
            {t.plans.map((plan) => {
              const dark = plan.highlighted;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-[28px] p-8 flex flex-col gap-6 border ${dark ? 'bg-[#14110E] border-[#14110E] text-white' : 'bg-white border-[#E8E1D4]'}`}
                  style={{ boxShadow: dark ? '0 24px 60px -20px rgba(20,17,14,0.4)' : '0 1px 0 rgba(20,17,14,0.03)' }}
                >
                  {'tag' in plan && plan.tag && (
                    <span
                      className="absolute top-4 right-4 text-[11px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-full"
                      style={{
                        background: dark ? 'rgba(242,167,101,0.18)' : '#FCEBD6',
                        color: dark ? '#F2A765' : '#B8501A',
                      }}
                    >
                      {t.pricingSection.mostPop}
                    </span>
                  )}
                  <div>
                    <h3 className={`text-[18px] font-medium tracking-tight ${dark ? 'text-white' : 'text-[#14110E]'}`}>{plan.name}</h3>
                    <p className={`text-[14px] mt-1.5 ${dark ? 'text-white/70' : 'text-[#6B635B]'}`}>{plan.desc}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-[48px] font-medium tracking-[-0.04em] leading-none ${dark ? 'text-white' : 'text-[#14110E]'}`}>{plan.price}</span>
                    <span className={`text-[14px] ml-1 ${dark ? 'text-white/70' : 'text-[#6B635B]'}`}>{plan.period}</span>
                  </div>
                  {plan.external ? (
                    <a
                      href={plan.href}
                      target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 w-full h-11 rounded-full text-[14.5px] font-medium transition-all hover:-translate-y-px ${dark ? 'text-white' : 'bg-transparent border border-[#E8E1D4] text-[#14110E] hover:bg-[#FBF7F1]'}`}
                      style={dark ? { background: 'linear-gradient(180deg,#ED8A38,#C9601E)', boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 20px -8px rgba(184,80,26,0.55)' } : undefined}
                    >
                      {plan.cta}
                      {dark && <ArrowRight className="w-3.5 h-3.5" />}
                    </a>
                  ) : (
                    <Link
                      href={plan.href}
                      className={`inline-flex items-center justify-center gap-2 w-full h-11 rounded-full text-[14.5px] font-medium transition-all hover:-translate-y-px ${dark ? 'text-white' : 'bg-transparent border border-[#E8E1D4] text-[#14110E] hover:bg-[#FBF7F1]'}`}
                      style={dark ? { background: 'linear-gradient(180deg,#ED8A38,#C9601E)', boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 20px -8px rgba(184,80,26,0.55)' } : undefined}
                    >
                      {plan.cta}
                      {dark && <ArrowRight className="w-3.5 h-3.5" />}
                    </Link>
                  )}
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-[14px] leading-[1.4]">
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: dark ? '#F2A765' : '#E07A2C' }} />
                        <span className={dark ? 'text-white/80' : 'text-[#2A2522]'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[#8A8278] text-[13px] mt-10">{t.pricingSection.note}</p>
        </div>
      </section>

      {/* ── Product preview ───────────────────────────────────────────── */}
      <section id="apercu" className="py-[100px] border-t border-[#E8E1D4]" style={{ background: '#F6EFE2' }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-10 mb-12 items-end">
            <div>
              <div className="mb-5"><Eyebrow>{t.previewSection.eyebrow}</Eyebrow></div>
              <h2 className="text-[34px] sm:text-[44px] lg:text-[52px] font-medium tracking-[-0.03em] leading-[1.02]">
                {t.previewSection.h2a}{' '}
                <span className="font-normal italic" style={{ fontFamily: 'var(--af-serif)' }}>
                  {t.previewSection.h2b}
                </span>
              </h2>
            </div>
            <p className="text-[17px] lg:text-[19px] text-[#6B635B] leading-[1.5] max-w-[54ch]">
              {t.previewSection.p}
            </p>
          </div>

          {/* Dashboard mockup */}
          <div
            className="bg-white rounded-[20px] border border-[#E8E1D4] overflow-hidden mb-4"
            style={{ boxShadow: '0 1px 0 rgba(20,17,14,0.04), 0 24px 60px -20px rgba(20,17,14,0.14)' }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0EBE0] bg-[#FEFCF8]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#E8E1D4]" />
                <div className="w-3 h-3 rounded-full bg-[#E8E1D4]" />
                <div className="w-3 h-3 rounded-full bg-[#E07A2C]" />
              </div>
              <div className="flex-1 max-w-xs mx-auto bg-[#F6EFE2] rounded-md px-3 h-6 flex items-center justify-center">
                <span className="text-[11px] text-[#6B635B] font-mono">maboutique.afrisika.app/admin</span>
              </div>
            </div>
            <div className="p-5 sm:p-6 bg-[#FAFAF8]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {t.previewSection.kpis.map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-xl p-4 border border-[#E8E1D4]">
                    <div className="text-[11px] text-[#6B635B] mb-1.5">{kpi.label}</div>
                    <div className="text-[17px] font-semibold text-[#14110E] leading-none">{kpi.value}</div>
                    <div className="text-[11px] mt-1.5 font-medium" style={{ color: kpi.color }}>{kpi.trend}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-[#E8E1D4] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F0EBE0] flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#14110E]">{t.previewSection.recentOrders}</span>
                  <span className="text-[11px] text-[#E07A2C] font-medium">{t.previewSection.viewAll}</span>
                </div>
                <div className="divide-y divide-[#F6EFE2]">
                  {t.previewSection.orders.map((order) => (
                    <div key={order.ref} className="px-4 py-3 flex items-center justify-between gap-3">
                      <span className="text-[11.5px] font-mono text-[#6B635B] hidden sm:block">{order.ref}</span>
                      <span className="text-[13px] font-medium text-[#14110E] flex-1">{order.client}</span>
                      <span className="text-[13px] font-medium text-[#14110E]">{order.montant}</span>
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0" style={{ color: order.color, background: order.bg }}>
                        {order.statut}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3 mini mockups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stock */}
            <div className="bg-white rounded-[18px] border border-[#E8E1D4] overflow-hidden" style={{ boxShadow: '0 1px 0 rgba(20,17,14,0.03)' }}>
              <div className="px-5 py-4 border-b border-[#F0EBE0]">
                <div className="text-[13px] font-medium text-[#14110E]">{t.previewSection.stockTitle}</div>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { nom: 'Pagne wax 6 yds',  stock: 24, max: 50, alert: false },
                  { nom: 'Karité 250g',       stock: 3,  max: 30, alert: true  },
                  { nom: 'Bissap 500g',       stock: 0,  max: 20, alert: true  },
                  { nom: 'Shea butter 100ml', stock: 18, max: 40, alert: false },
                ].map((p) => (
                  <div key={p.nom}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12.5px] text-[#2A2522]">{p.nom}</span>
                      <span className="text-[12px] font-medium" style={{ color: p.alert ? '#C9601E' : '#2D8A5F' }}>
                        {p.stock === 0 ? t.previewSection.outOfStock : `${p.stock} ${t.previewSection.remaining}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F0EBE0] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, (p.stock / p.max) * 100)}%`, background: p.alert ? '#E07A2C' : '#2D8A5F' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finance */}
            <div className="bg-white rounded-[18px] border border-[#E8E1D4] overflow-hidden" style={{ boxShadow: '0 1px 0 rgba(20,17,14,0.03)' }}>
              <div className="px-5 py-4 border-b border-[#F0EBE0]">
                <div className="text-[13px] font-medium text-[#14110E]">{t.previewSection.financeTitle}</div>
              </div>
              <div className="p-5">
                <div className="text-[32px] font-medium tracking-[-0.03em] text-[#14110E] leading-none mb-1">4,8M F</div>
                <div className="text-[12px] text-[#2D8A5F] font-medium mb-5">↑ 22% {t.previewSection.vsLastMonth}</div>
                <div className="space-y-3">
                  {[
                    { label: 'Mobile Money', pct: 51 },
                    { label: lang === 'fr' ? 'Cash' : 'Cash', pct: 38 },
                    { label: lang === 'fr' ? 'Virement' : 'Wire transfer', pct: 11 },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[12px] text-[#6B635B]">{m.label}</span>
                        <span className="text-[12px] font-medium text-[#14110E]">{m.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F0EBE0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: 'linear-gradient(90deg,#F2A765,#E07A2C)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp CRM */}
            <div className="bg-white rounded-[18px] border border-[#E8E1D4] overflow-hidden" style={{ boxShadow: '0 1px 0 rgba(20,17,14,0.03)' }}>
              <div className="px-5 py-4 border-b border-[#F0EBE0] flex items-center justify-between">
                <div className="text-[13px] font-medium text-[#14110E]">WhatsApp CRM</div>
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D8A5F] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D8A5F]" />
                </span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { name: 'Fatou Koné', msg: lang === 'fr' ? 'Ma commande est arrivée ?' : 'Has my order arrived?',         time: '14:32', unread: true  },
                  { name: 'Koffi Adu',  msg: lang === 'fr' ? 'Vous avez le modèle noir ?' : 'Do you have the black model?', time: '13:15', unread: true  },
                  { name: 'Akosua M.',  msg: lang === 'fr' ? 'Merci beaucoup !' : 'Thank you so much!',                    time: '11:04', unread: false },
                  { name: 'Ibrahim S.', msg: lang === 'fr' ? 'Livraison demain possible ?' : 'Delivery tomorrow possible?', time: '10:22', unread: false },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: '#FCEBD6', color: '#B8501A' }}>
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12.5px] font-medium text-[#14110E]">{c.name}</span>
                        <span className="text-[10.5px] text-[#6B635B]">{c.time}</span>
                      </div>
                      <span className="text-[12px] text-[#6B635B] truncate block">{c.msg}</span>
                    </div>
                    {c.unread && <div className="w-2 h-2 rounded-full bg-[#E07A2C] shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────── */}
      <section className="py-[80px] border-t border-[#E8E1D4]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {t.trust.map((it, idx) => {
            const Icon = TRUST_ICONS[idx];
            return (
              <div key={it.title} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FCEBD6] grid place-items-center text-[#B8501A]">
                  <Icon className="w-5 h-5" strokeWidth={1.7} />
                </div>
                <h3 className="font-medium text-[17px] text-[#14110E]">{it.title}</h3>
                <p className="text-[14px] text-[#6B635B] leading-[1.55] max-w-[34ch]">{it.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-[120px] text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(40% 50% at 50% 0%, rgba(224,122,44,0.16), transparent 70%), radial-gradient(40% 50% at 50% 100%, rgba(31,61,46,0.10), transparent 70%)' }}
        />
        <div className="relative max-w-[860px] mx-auto px-5 sm:px-8">
          <h2 className="text-[34px] sm:text-[44px] lg:text-[56px] font-medium tracking-[-0.03em] leading-[1.02] max-w-[16ch] mx-auto mb-6">
            {t.ctaSection.h2a}{' '}
            <span className="font-normal italic" style={{ fontFamily: 'var(--af-serif)' }}>
              {t.ctaSection.h2b}
            </span>
          </h2>
          <p className="text-[17px] lg:text-[19px] text-[#6B635B] leading-[1.5] max-w-[54ch] mx-auto mb-9">
            {t.ctaSection.p}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/saas/onboarding"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[14.5px] font-medium text-white bg-[#14110E] hover:bg-black transition-all hover:-translate-y-px"
              style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 16px -8px rgba(20,17,14,0.5)' }}
            >
              {t.ctaSection.cta1}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href={`https://wa.me/22890527912?text=${encodeURIComponent(lang === 'fr' ? 'Bonjour, je voudrais en savoir plus sur Afrisika' : 'Hello, I would like to learn more about Afrisika')}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[14.5px] font-medium text-[#14110E] bg-transparent border border-[#E8E1D4] hover:bg-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t.ctaSection.cta2}
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-[#14110E] text-white/70 pt-[80px] pb-7">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 pb-14 border-b border-white/10">
            <div className="col-span-2 md:col-span-1 max-w-[340px]">
              <Link href="/saas" className="flex items-center gap-2.5 text-white">
                <span
                  className="w-8 h-8 rounded-[9px] grid place-items-center"
                  style={{ background: 'radial-gradient(120% 120% at 20% 20%, #F2A765 0%, #E07A2C 45%, #B8501A 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 4px 10px -4px rgba(184,80,26,0.55)' }}
                >
                  <ShoppingBag className="w-[15px] h-[15px] text-[#14110E]" strokeWidth={2.4} />
                </span>
                <span className="font-semibold text-[17px] tracking-tight">Afrisika</span>
              </Link>
              <p className="text-[13.5px] text-white/55 mt-4 leading-[1.55]">{t.footer.tagline}</p>
              <div className="text-[12px] text-white/40 mt-4 tracking-[0.04em]">Lomé · Accra · Abidjan · Cotonou</div>
            </div>
            {t.footer.cols.map((col) => (
              <div key={col.h}>
                <h5 className="text-white text-[12px] font-semibold uppercase tracking-[0.08em] mb-4">{col.h}</h5>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-[14px] text-white/65 hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-7 text-[12.5px] text-white/45">
            <div>© {new Date().getFullYear()} Afrisika · {t.footer.copyright}</div>
            <div>{t.footer.madeWith}</div>
          </div>
        </div>
      </footer>
    </>
  );
}
