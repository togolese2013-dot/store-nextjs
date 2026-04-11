"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, ShoppingBag, User, Menu, X,
  Phone, Package, Tag, Home, Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { useCart } from "@/context/CartContext";

const NAV = [
  { label: "Accueil",    href: "/",                   icon: Home },
  { label: "Produits",   href: "/products",            icon: Package },
  { label: "Promos",     href: "/products?promo=true", icon: Tag, hot: true },
];

export default function Header() {
  const { count: cartCount } = useCart();
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState("");
  const [searchFocus, setFocus] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setFocus(false);
    }
  };

  return (
    <>
      {/* ── Sticky header ── */}
      <header
        className={clsx(
          "sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-shadow duration-200",
          scrolled ? "shadow-md border-b border-brand-50" : "border-b border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
              <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center shadow-brand">
                <Zap className="w-5 h-5 text-accent-400" fill="currentColor" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-800 text-lg leading-none text-brand-900">
                  Togolese
                </span>
                <span className="font-display font-800 text-lg leading-none text-accent-500">
                  Shop
                </span>
              </div>
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg relative">
              <div className={clsx(
                "flex items-center w-full rounded-2xl border-2 transition-all duration-200 bg-slate-50",
                searchFocus
                  ? "border-brand-600 bg-white shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              )}>
                <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  placeholder="Rechercher un produit…"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-slate-800 placeholder:text-slate-400 font-sans"
                />
                {search && (
                  <button type="submit"
                    className="mr-2 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-xs font-semibold hover:bg-brand-800 transition-colors"
                  >
                    OK
                  </button>
                )}
              </div>
            </form>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 mx-2">
              {NAV.map(({ label, href, icon: Icon, hot }) => (
                <Link
                  key={label} href={href}
                  className={clsx(
                    "relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    pathname === href
                      ? "bg-brand-50 text-brand-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {hot && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent-500" />
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Mobile search icon */}
              <button className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                onClick={() => inputRef.current?.focus()}
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link href="/cart"
                className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label={`Panier (${cartCount})`}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link href="/account"
                className="hidden sm:flex p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label="Mon compte"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Hamburger */}
              <button
                onClick={() => setOpen(!open)}
                className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label="Menu"
                aria-expanded={open}
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-100 rounded-2xl border-2 border-transparent focus:border-brand-600 focus:bg-white outline-none transition-all font-sans"
              />
            </form>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {open && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-2 shadow-lg">
            {NAV.map(({ label, href, icon: Icon, hot }) => (
              <Link
                key={label} href={href}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-slate-50 hover:bg-brand-50 hover:text-brand-900 text-slate-700 font-semibold transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
                {hot && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-500 text-white text-xs font-bold">
                    SOLDES
                  </span>
                )}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link href="/account"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:border-brand-300 transition-colors"
              >
                <User className="w-4 h-4" /> Mon compte
              </Link>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] text-white font-bold text-sm"
              >
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
