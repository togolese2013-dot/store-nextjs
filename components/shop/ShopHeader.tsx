"use client";

import Link from "next/link";
import { ShoppingBag, Search } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface Props {
  siteName: string;
}

export default function ShopHeader({ siteName }: Props) {
  const { count } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#FBF7F1]/95 backdrop-blur-md border-b border-[#E8E1D4]">
      <div className="flex items-center justify-between px-5 h-14">
        {/* Brand name */}
        <Link href="/" className="flex flex-col leading-none">
          <span
            style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic" }}
            className="text-[21px] text-[#14110E] tracking-[-0.01em] leading-none"
          >
            {siteName}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <Link href="/products" className="p-2 text-[#14110E] grid place-items-center">
            <Search className="w-5 h-5" strokeWidth={1.85} />
          </Link>
          <Link href="/cart" className="p-2 text-[#14110E] relative grid place-items-center">
            <ShoppingBag className="w-[22px] h-[22px]" strokeWidth={1.85} />
            {count > 0 && (
              <span className="absolute top-1 right-1 w-[15px] h-[15px] rounded-full bg-[#E07A2C] text-white text-[8.5px] font-bold grid place-items-center leading-none">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
