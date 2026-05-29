"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";

export default function ShopBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  const tabs = [
    { id: "home",     href: "/",         label: "Accueil",   Icon: Home },
    { id: "products", href: "/products", label: "Catalogue", Icon: LayoutGrid },
    { id: "cart",     href: "/cart",     label: "Panier",    Icon: ShoppingBag, badge: count },
    { id: "account",  href: "/account",  label: "Compte",    Icon: User },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8E1D4] flex"
      style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map(({ id, href, label, Icon, badge }) => {
        const on = isActive(href);
        return (
          <Link
            key={id}
            href={href}
            className="flex-1 flex flex-col items-center gap-[3px] pt-2.5 pb-2.5 relative"
            style={{ color: on ? "#14110E" : "#8A8278" }}
          >
            <span className="relative">
              <Icon className="w-[22px] h-[22px]" strokeWidth={1.85} />
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-[#E07A2C] text-white text-[9px] font-bold grid place-items-center px-0.5 leading-none">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            <span className="text-[10px] leading-none tracking-[-0.01em]" style={{ fontWeight: on ? 600 : 400 }}>
              {label}
            </span>
            {on && <span className="w-1 h-1 rounded-full bg-[#14110E] mt-0.5" />}
          </Link>
        );
      })}
    </nav>
  );
}
