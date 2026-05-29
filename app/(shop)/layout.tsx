export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopBottomNav from "@/components/shop/ShopBottomNav";
import AnnouncementBar from "@/components/AnnouncementBar";
import ReferralBanner from "@/components/ReferralBanner";
import RefDetector from "@/components/RefDetector";
import ThemeLoader from "@/components/ThemeLoader";
import { getSiteName } from "@/lib/site-settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const siteName = await getSiteName().catch(() => "Notre Boutique");

  return (
    <CartProvider>
      <ThemeLoader />
      <Suspense fallback={null}>
        <RefDetector />
      </Suspense>

      {/* Warm shop theme wrapper */}
      <div className="min-h-screen flex flex-col" style={{ background: "#FBF7F1" }}>
        <ReferralBanner />
        <AnnouncementBar />
        <ShopHeader siteName={siteName} />

        {/* Main content — offset for fixed header (56px) + bottom nav (64px) */}
        <main className="flex-1 pt-14 pb-20">
          {children}
        </main>

        <ShopBottomNav />
      </div>
    </CartProvider>
  );
}
