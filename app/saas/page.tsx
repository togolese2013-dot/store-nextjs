import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import AfrisakaNavbar from "@/components/saas/AfrisakaNavbar";
import LandingContent from "@/components/saas/LandingContent";

/* ─── Fonts ─────────────────────────────────────────────────────────────── */
const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--af-sans",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--af-mono",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--af-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Afrisika — Le système des commerces d'Afrique de l'Ouest",
  description:
    "Boutique en ligne, gestion de stock multi-points, caisse, paiement mobile et livraison — réunis dans une seule plateforme pensée pour le terrain.",
};

export default function SaasLanding() {
  return (
    <div
      className={`${geist.variable} ${geistMono.variable} ${serif.variable} min-h-screen text-[#14110E] antialiased`}
      style={{ background: "#FBF7F1", fontFamily: "var(--af-sans)", letterSpacing: "-0.005em" }}
    >
      <AfrisakaNavbar />
      <LandingContent />
    </div>
  );
}
