import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title:       { default: "Togolese Shop — Boutique Premium au Togo", template: "%s | Togolese Shop" },
  description: "Découvrez Togolese Shop, votre boutique d'électronique et accessoires premium. Livraison rapide à Lomé, paiement à la réception.",
  keywords:    ["boutique en ligne", "Togo", "électronique", "accessoires", "Lomé", "livraison rapide"],
  authors:     [{ name: "Togolese Shop" }],
  robots:      { index: true, follow: true },
  openGraph: {
    type:        "website",
    locale:      "fr_TG",
    url:         "https://store.togolese.net",
    siteName:    "Togolese Shop",
    title:       "Togolese Shop — Boutique Premium au Togo",
    description: "Électronique, accessoires et plus — livraison rapide au Togo.",
    images:      [{ url: "https://store.togolese.net/uploads/ad/logo.png", width: 1200, height: 630 }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#14532d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Togolese Shop" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        {/* Service Worker registration — nonce required by CSP */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
