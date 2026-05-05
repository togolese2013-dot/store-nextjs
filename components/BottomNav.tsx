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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/96 backdrop-blur-md border-t border-slate-100 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-end h-[58px] px-2 pb-1">
        {TABS.map(({ label, href, icon: Icon, cart }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className="flex-1 flex flex-col items-center justify-end pb-1 gap-0.5 relative"
            >
              <div className={clsx(
                "flex flex-col items-center gap-1 w-full py-1.5 rounded-2xl transition-all duration-200",
                active ? "bg-brand-50" : ""
              )}>
                <div className="relative">
                  <Icon
                    className={clsx("w-[22px] h-[22px]", active ? "text-brand-800" : "text-slate-400")}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {cart && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </div>
                <span className={clsx(
                  "text-[10px] font-semibold leading-none",
                  active ? "text-brand-800" : "text-slate-400"
                )}>
                  {label}
                </span>
              </div>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-700" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}
