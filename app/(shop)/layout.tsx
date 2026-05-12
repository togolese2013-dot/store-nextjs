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

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ThemeLoader />
      {/* Detect ?ref= param and set cookie */}
      <Suspense fallback={null}>
        <RefDetector />
      </Suspense>
      <ReferralBanner />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </CartProvider>
  );
}
