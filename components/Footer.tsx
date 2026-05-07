import Link from "next/link";
import { MapPin, Phone, Clock, Instagram, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-950 text-white">
      {/* Top */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <img
                src="/logo-togolese-shop-white.svg"
                alt="Togolese Shop"
                className="h-7 w-auto"
              />
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
              Votre boutique spécialisée en accessoires photographiques au Togo.
              Livraison le jour même, produits de qualité, paiement à la réception.
            </p>
            <div className="flex gap-2.5">
              {[
                { icon: Facebook,  href: "#", label: "Facebook" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Youtube,   href: "#", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/6 hover:bg-white/14 flex items-center justify-center transition-colors border border-white/8"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation + Support */}
          <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-6 lg:contents">
            <div className="lg:col-auto">
              <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 mb-5">
                Navigation
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  ["Accueil",           "/"],
                  ["Tous les produits", "/products"],
                  ["Promotions",        "/products?promo=true"],
                  ["Nouveautés",        "/products?new=true"],
                  ["Mon panier",        "/cart"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-white/70 hover:text-white text-sm transition-colors inline-flex items-center gap-1.5 hover:translate-x-0.5 duration-150"
                    >
                      <span className="text-brand-400 text-xs">›</span> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-auto">
              <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 mb-5">
                Support
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  ["Mon compte",          "/account"],
                  ["Mes commandes",       "/account/commandes"],
                  ["Politique de retour", "/politique-retour"],
                  ["Programme Fidélité",  "/fidelite"],
                  ["Parrainage",          "/parrainage"],
                  ["Suivi de commande",   "/suivi-commande"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-white/70 hover:text-white text-sm transition-colors inline-flex items-center gap-1.5 duration-150"
                    >
                      <span className="text-brand-400 text-xs">›</span> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 mb-5">
              Contact
            </h4>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3 text-sm">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span className="text-white/70">Lomé, Togo</span>
              </li>
              <li className="flex gap-3 text-sm">
                <Phone className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span className="text-white/70 font-semibold">+228 90 52 79 12 · +228 90 22 64 91</span>
              </li>
              <li className="flex gap-3 text-sm">
                <Clock className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span className="text-white/70">Lun–Sam · 8h–18h30</span>
              </li>
            </ul>

            {/* Garanties */}
            <div className="hidden lg:block mt-6 p-4 rounded-2xl bg-white/4 border border-white/8">
              <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-widest">Nos garanties</p>
              <ul className="flex flex-col gap-2 text-xs text-white/70">
                <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> Paiement à la livraison</li>
                <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> Retour sous 7 jours</li>
                <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> Produits authentiques</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70">
          <span>©2020–{year} Togolese Group (Vente-distribution) — Tous droits réservés</span>
          <div className="flex gap-4">
            <Link href="/cgu" className="hover:text-white transition-colors">CGU & Mentions légales</Link>
            <Link href="/politique-retour" className="hover:text-white transition-colors">Retours</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
