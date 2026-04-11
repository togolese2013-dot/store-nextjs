/**
 * Server component — reads theme settings from DB and injects inline CSS variables.
 * This allows admin theme changes to apply immediately without a rebuild.
 *
 * Usage: place <ThemeVars /> inside <head> in app/layout.tsx
 */
import { getSetting } from "@/lib/admin-db";
import { buildRamp, fontUrl } from "@/lib/theme-utils";

export default async function ThemeVars() {
  let primary = "#0A2463";
  let accent  = "#F4623A";
  let font    = "Montserrat";

  try {
    [primary, accent, font] = await Promise.all([
      getSetting("theme_primary"),
      getSetting("theme_accent"),
      getSetting("theme_font"),
    ]);
    primary = primary || "#0A2463";
    accent  = accent  || "#F4623A";
    font    = font    || "Montserrat";
  } catch {
    // DB not available — fall back to defaults (static CSS already handles this)
  }

  const brandRamp  = buildRamp(primary);
  const accentRamp = buildRamp(accent);

  const cssVars = [
    ...Object.entries(brandRamp).map(([s, v])  => `  --color-brand-${s}: rgb(${v});`),
    ...Object.entries(accentRamp).map(([s, v]) => `  --color-accent-${s}: rgb(${v});`),
    `  --font-display: "${font}", ui-sans-serif, system-ui, sans-serif;`,
    `  --font-sans:    "${font}", ui-sans-serif, system-ui, sans-serif;`,
  ].join("\n");

  const css = `:root {\n${cssVars}\n}`;

  return (
    <>
      {font !== "Montserrat" && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontUrl(font)} />
      )}
      {/* Inline style tag overrides static CSS tokens */}
      <style id="ts-theme" dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
