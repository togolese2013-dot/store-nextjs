import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import ThemeVars from "@/components/ThemeVars";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import PwaRegister from "@/components/PwaRegister";
import { getSettings } from "@/lib/admin-db";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "@/components/interaction-layer/ui-core.css";

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
    verification: { google: "06319e170dac5f7a" },
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
    <html lang="fr" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <ThemeVars />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap" />
<link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14532d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Togolese Shop" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AnalyticsTracker />
        <PwaRegister />
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive" nonce={nonce}>{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','976648604746563');
          fbq('track','PageView');
        `}</Script>
        <noscript>
          <img height="1" width="1" style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=976648604746563&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
