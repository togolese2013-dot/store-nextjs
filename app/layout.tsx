import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import ThemeVars from "@/components/ThemeVars";
import { getSettings } from "@/lib/admin-db";
import "./globals.css";

const FALLBACK_NAME    = "Togolese Shop";
const FALLBACK_TAGLINE = "Boutique Premium au Togo";
const FALLBACK_IMAGE   = "https://togolese.tg/icons/icon-512.png";
const SITE_URL         = "https://togolese.tg";

export async function generateMetadata(): Promise<Metadata> {
  const s        = await getSettings().catch(() => ({} as Record<string, string>));
  const name     = s.site_name    || FALLBACK_NAME;
  const tagline  = s.site_tagline || FALLBACK_TAGLINE;
  const ogImage  = s.site_logo    || FALLBACK_IMAGE;
  const fullTitle = `${name} — ${tagline}`;

  return {
    title:       { default: fullTitle, template: `%s | ${name}` },
    description: tagline,
    authors:     [{ name }],
    robots:      { index: true, follow: true },
    openGraph: {
      type:        "website",
      locale:      "fr_TG",
      url:         SITE_URL,
      siteName:    name,
      title:       fullTitle,
      description: tagline,
      images:      [{ url: ogImage }],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeVars />
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
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-LBCJQRWZT6" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-LBCJQRWZT6');
        `}</Script>
        {children}
      </body>
    </html>
  );
}
