import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

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

export default function SaasLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} ${serif.variable}`}>
      {children}
    </div>
  );
}
