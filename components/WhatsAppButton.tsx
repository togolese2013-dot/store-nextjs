"use client";

import { useEffect } from "react";

export default function WhatsAppButton() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://serena-togolese-production.up.railway.app/static/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
