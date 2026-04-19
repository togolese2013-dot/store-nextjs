import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getSetting } from "@/lib/admin-db";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const waNumber = await getSetting("whatsapp_number").catch(() => "");

  return (
    <CartProvider>
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      {waNumber && <WhatsAppButton number={waNumber} />}
    </CartProvider>
  );
}
