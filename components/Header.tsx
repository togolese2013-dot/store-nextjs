"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, ShoppingBag, User, Menu, X,
  Package, Tag, Home, Heart, Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { useCart } from "@/context/CartContext";
import { type Product, finalPrice, formatPrice } from "@/lib/utils";
import AccountDropdown, { type ClientUser } from "@/components/AccountDropdown";

function useWishlistCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const read = () => {
      try { setCount(JSON.parse(localStorage.getItem("ts_wishlist") || "[]").length); } catch { setCount(0); }
    };
    read();
    window.addEventListener("wishlist-updated", read);
    return () => window.removeEventListener("wishlist-updated", read);
  }, []);
  return count;
}

const NAV = [
  { label: "Accueil",    href: "/",                   icon: Home },
  { label: "Produits",   href: "/products",            icon: Package },
  { label: "Promos",     href: "/products?promo=true", icon: Tag, hot: true },
];

export default function Header() {
  const { count: cartCount } = useCart();
  const wishlistCount = useWishlistCount();
  const [open, setOpen]               = useState(false);
  const [search, setSearch]           = useState("");
  const [searchFocus, setFocus]       = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [sugLoading, setSugLoading]   = useState(false);
  const [showSug, setShowSug]         = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  // Avatar data — synced from localStorage and refreshed on login/logout
  const [avatarNom,   setAvatarNom]   = useState<string | null>(null);
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);

  const inputRef          = useRef<HTMLInputElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const accountRef        = useRef<HTMLDivElement>(null);
  const router      = useRouter();
  const pathname    = usePathname();

  /* Instant search — debounced 300ms */
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setShowSug(false); return; }
    setSugLoading(true);
    try {
      const res  = await fetch(`/api/products?q=${encodeURIComponent(q.trim())}&limit=6`);
      const json = await res.json();
      setSuggestions(json.data ?? []);
      setShowSug(true);
    } catch { setSuggestions([]); }
    finally { setSugLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchSuggestions]);

  /* Read avatar from localStorage (synced after login/logout) */
  const readAvatar = useCallback(() => {
    try {
      const raw = localStorage.getItem("ts_profil");
      if (raw) {
        const p = JSON.parse(raw);
        setAvatarNom(p.nom ?? null);
        setAvatarPhoto(p.photo_url ?? null);
      } else {
        setAvatarNom(null);
        setAvatarPhoto(null);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    readAvatar();
    window.addEventListener("profil-updated", readAvatar);
    return () => window.removeEventListener("profil-updated", readAvatar);
  }, [readAvatar]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSug(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

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

  /* Called by AccountDropdown after login or logout */
  function handleUserChange(user: ClientUser | null) {
    if (user) {
      setAvatarNom(user.nom);
      setAvatarPhoto(user.photo_url ?? null);
    } else {
      setAvatarNom(null);
      setAvatarPhoto(null);
    }
  }

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
          {/* ── Mobile top bar (logo centered) ── */}
          <div className="lg:hidden flex items-center h-14 relative">
            {/* Hamburger — left */}
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo — absolutely centered */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <img
                src="/logo-togolese-shop.svg"
                alt="Togolese Shop"
                className="h-6 w-auto"
              />
            </Link>

            {/* Icons — right */}
            <div className="flex items-center gap-0.5 ml-auto">
              <Link href="/wishlist"
                className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label={`Favoris (${wishlistCount})`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>
              <Link href="/cart"
                className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label={`Panier (${cartCount})`}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* ── Desktop top bar ── */}
          <div className="hidden lg:flex items-center h-14 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 mr-2">
              <img
                src="/logo-togolese-shop.svg"
                alt="Togolese Shop"
                className="h-7 w-auto"
              />
            </Link>

            {/* Search bar — desktop */}
            <div ref={dropdownRef} className="flex flex-1 max-w-lg relative">
              <form onSubmit={handleSearch} className="w-full">
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
                    onFocus={() => { setFocus(true); if (suggestions.length) setShowSug(true); }}
                    onBlur={() => setFocus(false)}
                    placeholder="Rechercher un produit…"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-slate-800 placeholder:text-slate-400 font-sans"
                  />
                  {sugLoading && <Loader2 className="w-4 h-4 text-slate-400 mr-3 animate-spin" />}
                  {search && !sugLoading && (
                    <button type="submit"
                      className="mr-2 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-xs font-semibold hover:bg-brand-800 transition-colors"
                    >
                      OK
                    </button>
                  )}
                </div>
              </form>

              {/* Instant search dropdown */}
              {showSug && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                  {suggestions.map(p => {
                    const price   = finalPrice(p);
                    const isPromo = p.remise > 0;
                    const imgSrc  = p.image_url
                      ? p.image_url.startsWith("http") ? p.image_url : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${p.image_url}`
                      : null;
                    return (
                      <Link
                        key={p.id}
                        href={`/products/${p.reference}`}
                        onClick={() => { setShowSug(false); setSearch(""); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {imgSrc
                            ? <Image src={imgSrc} alt={p.nom} width={40} height={40} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">📷</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 line-clamp-1">{p.nom}</p>
                          {p.categorie_nom && <p className="text-xs text-slate-400">{p.categorie_nom}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={clsx("text-sm font-800", isPromo ? "text-accent-600" : "text-slate-900")}>
                            {formatPrice(price)}
                          </p>
                          {isPromo && <p className="text-xs text-slate-400 line-through">{formatPrice(p.prix_unitaire)}</p>}
                        </div>
                      </Link>
                    );
                  })}
                  <Link
                    href={`/products?q=${encodeURIComponent(search)}`}
                    onClick={() => { setShowSug(false); setSearch(""); }}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
                  >
                    Voir tous les résultats pour « {search} » →
                  </Link>
                </div>
              )}
            </div>

            {/* Desktop nav */}
            <nav className="flex items-center gap-1 mx-2">
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

              {/* Wishlist */}
              <Link href="/wishlist"
                className="relative p-1.5 sm:p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label={`Favoris (${wishlistCount})`}
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart"
                className="relative p-1.5 sm:p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label={`Panier (${cartCount})`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-accent-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Account dropdown */}
              <div ref={accountRef} className="hidden sm:block relative">
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  className={clsx(
                    "flex items-center gap-1.5 p-1.5 rounded-xl transition-colors",
                    accountOpen ? "bg-brand-50 text-brand-800" : "hover:bg-slate-100 text-slate-700"
                  )}
                  aria-label="Mon compte"
                  aria-expanded={accountOpen}
                >
                  {/* Avatar : photo > initiale > icône */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                    {avatarPhoto ? (
                      <Image
                        src={avatarPhoto}
                        alt={avatarNom ?? "Avatar"}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : avatarNom ? (
                      <div className="w-full h-full bg-brand-900 text-white flex items-center justify-center text-xs font-800">
                        {avatarNom.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-200 text-slate-500 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  {/* Show name next to avatar when logged in */}
                  {avatarNom && (
                    <span className="hidden xl:block text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                      {avatarNom.split(" ")[0]}
                    </span>
                  )}
                </button>

                <AccountDropdown
                  open={accountOpen}
                  onClose={() => setAccountOpen(false)}
                  onUserChange={handleUserChange}
                />
              </div>

            </div>
          </div>

          {/* Mobile/tablet search bar + dropdown */}
          <div ref={mobileDropdownRef} className="lg:hidden pt-1 pb-2 relative">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => { if (suggestions.length) setShowSug(true); }}
                placeholder="Rechercher…"
                className="w-full pl-8 pr-4 py-1.5 text-[16px] bg-slate-100 rounded-xl border-2 border-transparent focus:border-brand-600 focus:bg-white outline-none transition-all font-sans"
                style={{ fontSize: "16px" }}
              />
            </form>

            {showSug && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                {suggestions.map(p => {
                  const price   = finalPrice(p);
                  const isPromo = p.remise > 0;
                  const imgSrc  = p.image_url
                    ? p.image_url.startsWith("http") ? p.image_url : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${p.image_url}`
                    : null;
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.reference}`}
                      onClick={() => { setShowSug(false); setSearch(""); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        {imgSrc
                          ? <Image src={imgSrc} alt={p.nom} width={40} height={40} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">📷</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 line-clamp-1">{p.nom}</p>
                        {p.categorie_nom && <p className="text-xs text-slate-400">{p.categorie_nom}</p>}
                      </div>
                      <p className={clsx("text-sm font-bold shrink-0", isPromo ? "text-accent-600" : "text-slate-900")}>
                        {formatPrice(price)}
                      </p>
                    </Link>
                  );
                })}
                <Link
                  href={`/products?q=${encodeURIComponent(search)}`}
                  onClick={() => { setShowSug(false); setSearch(""); }}
                  className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  Voir tous les résultats →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {open && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-2 shadow-lg max-h-[70vh] overflow-y-auto">
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
            <div className="mt-2 space-y-2">
              <Link href="/account"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:border-brand-300 transition-colors"
              >
                <User className="w-4 h-4" />
                {avatarNom ? `Mon compte — ${avatarNom.split(" ")[0]}` : "Mon compte"}
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account/commandes"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-brand-50 hover:text-brand-800 transition-colors"
                >
                  <Package className="w-4 h-4" /> Commandes
                </Link>
                <Link href="/wishlist"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <Heart className="w-4 h-4" /> Favoris
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
