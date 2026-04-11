/** Shared theme utilities — usable both server-side and client-side */

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

const STEPS: [number, number][] = [
  [50,   0.92], [100, 0.84], [200, 0.68], [300, 0.52], [400, 0.36],
  [500,  0.20], [600, 0.10], [700, 0.02], [800, -0.12], [900, -0.24], [950, -0.36],
];

/** Derive a full 50-950 ramp from a base hex color */
export function buildRamp(base: string): Record<string, string> {
  const rgb = hexToRgb(base);
  if (!rgb) return {};
  const { r, g, b } = rgb;
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)));

  return Object.fromEntries(
    STEPS.map(([shade, blend]) => {
      const mix = blend >= 0
        ? (c: number) => clamp(c + (255 - c) * blend)
        : (c: number) => clamp(c * (1 + blend));
      return [shade, `${mix(r)} ${mix(g)} ${mix(b)}`];
    })
  );
}

/** Map font name to Google Fonts import URL */
export function fontUrl(font: string): string {
  const slug = font.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${slug}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap`;
}

/** Apply theme variables directly to document.documentElement (client-side only) */
export function applyThemeToDOM(primary: string, accent: string, font: string) {
  if (typeof document === "undefined") return;

  const brandRamp  = buildRamp(primary);
  const accentRamp = buildRamp(accent);
  const root = document.documentElement;

  for (const [shade, val] of Object.entries(brandRamp)) {
    root.style.setProperty(`--color-brand-${shade}`, `rgb(${val})`);
  }
  for (const [shade, val] of Object.entries(accentRamp)) {
    root.style.setProperty(`--color-accent-${shade}`, `rgb(${val})`);
  }
  root.style.setProperty("--font-display", `"${font}", ui-sans-serif, system-ui, sans-serif`);
  root.style.setProperty("--font-sans",    `"${font}", ui-sans-serif, system-ui, sans-serif`);

  // Update or add Google Fonts link
  const existingLink = document.getElementById("ts-gfont") as HTMLLinkElement | null;
  if (font === "Montserrat") {
    existingLink?.remove();
  } else {
    const href = fontUrl(font);
    if (existingLink) {
      existingLink.href = href;
    } else {
      const link = document.createElement("link");
      link.id   = "ts-gfont";
      link.rel  = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }
}
