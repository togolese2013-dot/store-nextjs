"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { clsx } from "clsx";

const TABS = [
  { label: "Accueil",  href: "/",         icon: Home    },
  { label: "Produits", href: "/products",  icon: Package },
  { label: "Panier",   href: "/cart",      icon: ShoppingBag, cart: true },
  { label: "Compte",   href: "/account",   icon: User    },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-16">
        {TABS.map(({ label, href, icon: Icon, cart }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors",
                active ? "text-brand-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {cart && count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </div>
              <span className={clsx(
                "text-[10px] font-semibold leading-none",
                active ? "text-brand-700" : "text-slate-400"
              )}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-700" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iPhone home indicator */}
      <div className="h-safe-bottom bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}
