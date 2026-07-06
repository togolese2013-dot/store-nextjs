/** Curated theme presets — shared between /admin/settings/theme and the onboarding wizard. */
export interface ThemePreset {
  label: string;
  primary: string;
  accent: string;
  footer: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { label: "Orange SaaS (défaut)", primary: "#E07A2C", accent: "#2D8A5F", footer: "#14110E" },
  { label: "Vert forêt",           primary: "#14532d", accent: "#f59e0b", footer: "#052e16" },
  { label: "Vert & Or",            primary: "#1B4332", accent: "#D4A017", footer: "#0a1f17" },
  { label: "Vert vif & Ambre",     primary: "#15803d", accent: "#d97706", footer: "#052e16" },
  { label: "Navy & Terracotta",    primary: "#0A2463", accent: "#F4623A", footer: "#060f2a" },
  { label: "Noir & Orange",        primary: "#111827", accent: "#F97316", footer: "#030712" },
  { label: "Violet & Rose",        primary: "#4C1D95", accent: "#EC4899", footer: "#1e0850" },
];
