import Link from "next/link";
import { MapPin, Phone, Clock, Instagram, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-950 text-white">
      {/* Top section */}
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
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Votre boutique premium d'électronique et d'accessoires au Togo.
              Livraison rapide, produits de qualité, paiement à la réception.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook,  href: "#", label: "Facebook" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Youtube,   href: "#", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation + Support — côte à côte sur mobile */}
          <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-6 lg:contents">
            <div className="lg:col-auto">
              <h4 className="font-display font-700 text-sm uppercase tracking-widest text-slate-400 mb-5">
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
                      className="text-slate-400 hover:text-white text-sm transition-colors hover:translate-x-1 inline-flex items-center gap-1"
                    >
                      <span className="text-accent-500">›</span> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-auto">
              <h4 className="font-display font-700 text-sm uppercase tracking-widest text-slate-400 mb-5">
                Support
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  ["Mon compte",           "/account"],
                  ["Mes commandes",        "/account/orders"],
                  ["Politique de retour",  "/returns"],
                  ["Livraisons",           "/shipping"],
                  ["Contact",              "/contact"],
                  ["Programme Fidélité ⭐", "/fidelite"],
                  ["Parrainage 🎁",        "/parrainage"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-slate-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                    >
                      <span className="text-accent-500">›</span> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-700 text-sm uppercase tracking-widest text-slate-400 mb-5">
              Contact
            </h4>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
                <span className="text-slate-400">Lomé, Togo</span>
              </li>
              <li className="flex gap-3 text-sm">
                <Phone className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
                <span className="text-slate-400 font-semibold">+228 90 00 00 00</span>
              </li>
              <li className="flex gap-3 text-sm">
                <Clock className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
                <span className="text-slate-400">Lun–Sam · 8h–20h</span>
              </li>
            </ul>

            {/* Guarantees */}
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-semibold text-slate-300 mb-3">Nos garanties</p>
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                <li>✅ Paiement à la livraison</li>
                <li>🔄 Retour sous 7 jours</li>
                <li>🛡️ Produits authentiques</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {year} Togolese Shop — Tous droits réservés</span>
          <span>Fait avec ❤️ au Togo 🇹🇬</span>
        </div>
      </div>
    </footer>
  );
}
