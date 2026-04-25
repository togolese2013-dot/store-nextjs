"use client";

import { useEffect } from "react";
import { applyThemeToDOM } from "@/lib/theme-utils";

export default function ThemeLoader() {
  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(({ settings }) => {
        const primary = settings?.theme_primary;
        const accent  = settings?.theme_accent;
        const font    = settings?.theme_font;
        if (primary && accent && font) {
          applyThemeToDOM(primary, accent, font);
        }
      })
      .catch(() => { /* theme fallback to CSS defaults */ });
  }, []);

  return null;
}
