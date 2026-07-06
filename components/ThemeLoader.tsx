"use client";

import { useEffect } from "react";
import { applyThemeToDOM } from "@/lib/theme-utils";

// Default "pro" theme applied when a shop hasn't customized its colors/font yet
// (matches the SaaS platform's own branding — /admin/settings/theme lets a shop override this).
const DEFAULT_PRIMARY = "#E07A2C";
const DEFAULT_ACCENT  = "#2D8A5F";
const DEFAULT_FONT    = "Geist";

export default function ThemeLoader() {
  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(({ settings }) => {
        const primary = settings?.theme_primary || DEFAULT_PRIMARY;
        const accent  = settings?.theme_accent  || DEFAULT_ACCENT;
        const font    = settings?.theme_font    || DEFAULT_FONT;
        applyThemeToDOM(primary, accent, font);
      })
      .catch(() => applyThemeToDOM(DEFAULT_PRIMARY, DEFAULT_ACCENT, DEFAULT_FONT));
  }, []);

  return null;
}
