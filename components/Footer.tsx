import Link from "next/link";
import { Zap, MapPin, Phone, Clock, Instagram, Facebook, Youtube } from "lucide-react";

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.054 1.47 5.764L0 24l6.396-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-950 text-white">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-400" fill="currentColor" />
              </div>
              <span className="font-display text-xl font-800">
                Togolese<span className="text-accent-400">Shop</span>
              </span>
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

          {/* Navigation */}
          <div>
            <h4 className="font-display font-700 text-sm uppercase tracking-widest text-slate-400 mb-5">
              Navigation
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                ["Accueil",         "/"],
                ["Tous les produits", "/products"],
                ["Promotions",      "/products?promo=true"],
                ["Nouveautés",      "/products?new=true"],
                ["Mon panier",      "/cart"],
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

          {/* Support */}
          <div>
            <h4 className="font-display font-700 text-sm uppercase tracking-widest text-slate-400 mb-5">
              Support
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                ["Mon compte",       "/account"],
                ["Mes commandes",    "/account/orders"],
                ["Politique de retour", "/returns"],
                ["Livraisons",       "/shipping"],
                ["Contact",          "/contact"],
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
              <li>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                  target="_blank" rel="noreferrer"
                  className="flex gap-3 text-sm text-[#25D366] hover:text-[#4ade80] transition-colors"
                >
                  <WaIcon />
                  <span className="font-semibold">+228 90 00 00 00</span>
                </a>
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
