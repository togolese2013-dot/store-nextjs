export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import WhatsAppButton from "@/components/WhatsAppButton";
import ReferralBanner from "@/components/ReferralBanner";
import RefDetector from "@/components/RefDetector";
import ThemeLoader from "@/components/ThemeLoader";
import { getSiteName, getSiteLogo } from "@/lib/site-settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [siteName, logoUrl] = await Promise.all([getSiteName(), getSiteLogo()]);

  return (
    <CartProvider>
      <ThemeLoader />
      {/* Detect ?ref= param and set cookie */}
      <Suspense fallback={null}>
        <RefDetector />
      </Suspense>
      <ReferralBanner />
      <AnnouncementBar />
      <Header siteName={siteName} logoUrl={logoUrl} />
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
      <Footer siteName={siteName} logoUrl={logoUrl} />
      <WhatsAppButton />
    </CartProvider>
  );
}
