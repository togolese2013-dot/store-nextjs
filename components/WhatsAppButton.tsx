"use client";

import { useEffect } from "react";

const BASE = "https://serena-togolese-production.up.railway.app";

export default function WhatsAppButton() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = `${BASE}/static/widget.css`;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src   = `${BASE}/static/widget.js`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.head.contains(link))   document.head.removeChild(link);
      if (document.body.contains(script)) document.body.removeChild(script);
      const widget = document.getElementById("serena-widget");
      if (widget) widget.remove();
    };
  }, []);

  return null;
}
