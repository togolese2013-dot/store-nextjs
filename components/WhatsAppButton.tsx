"use client";

import Script from "next/script";

export default function WhatsAppButton() {
  return (
    <Script
      src="https://serena-togolese-production.up.railway.app/static/widget.js"
      strategy="afterInteractive"
    />
  );
}
