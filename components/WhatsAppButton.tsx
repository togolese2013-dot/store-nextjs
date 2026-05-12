"use client";

import { useEffect } from "react";

export default function WhatsAppButton() {
  useEffect(() => {
    // CSS via proxy same-origin → pas de problème de chargement
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "/static/widget.css";
    link.id   = "serena-widget-css";
    document.head.appendChild(link);

    // Script via proxy same-origin → widget détecte apiUrl = site courant
    // → appelle /chat sur même domaine → rewrité vers Railway côté serveur
    const script = document.createElement("script");
    script.src = "/static/widget.js";
    document.body.appendChild(script);

    return () => {
      document.getElementById("serena-widget-css")?.remove();
      document.getElementById("serena-widget")?.remove();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  return null;
}
