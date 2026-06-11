/* ============================================================
   Icon set — stroke-based, currentColor.
   Faithful 1:1 port of the prototype's UI_I map.
   ============================================================ */
import React, { ReactNode } from "react";
import type { IconName, IconComponent, IconProps } from "./types";

const STROKE: React.SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/** Base wrapper: pass a path string or a fragment of shapes. */
function Glyph({ d, size = 16, vb = "0 0 24 24" }: { d: ReactNode | string; size?: number; vb?: string }) {
  return (
    <svg width={size} height={size} viewBox={vb} {...STROKE}>
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );
}

export const Icons: Record<IconName, IconComponent> = {
  close: (p) => <Glyph size={p.size} d={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />,
  check: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  chevD: (p) => <Glyph size={p.size || 14} d="m6 9 6 6 6-6" />,
  eye: (p) => <Glyph size={p.size} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>} />,
  edit: (p) => <Glyph size={p.size} d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>} />,
  copy: (p) => <Glyph size={p.size} d={<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>} />,
  archive: (p) => <Glyph size={p.size} d={<><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>} />,
  trash: (p) => <Glyph size={p.size} d={<><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />,
  download: (p) => <Glyph size={p.size || 14} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>} />,
  upload: (p) => <Glyph size={p.size || 14} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>} />,
  file: (p) => <Glyph size={p.size} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /></>} />,
  sparkles: (p) => <Glyph size={p.size || 14} d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />,
  search: (p) => <Glyph size={p.size} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />,
  arrowR: (p) => <Glyph size={p.size || 14} d={<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>} />,
  cog: (p) => <Glyph size={p.size} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>} />,
  user: (p) => <Glyph size={p.size} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  logout: (p) => <Glyph size={p.size} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>} />,
  store: (p) => <Glyph size={p.size} d={<><path d="m2 7 1.5-4h17L22 7" /><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" /><path d="M2 7h20" /><path d="M12 11v6" /></>} />,
  swap: (p) => <Glyph size={p.size} d={<><path d="m17 2 4 4-4 4" /><path d="M3 6h18" /><path d="m7 22-4-4 4-4" /><path d="M21 18H3" /></>} />,
  alert: (p) => <Glyph size={p.size} d={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />,
  bell: (p) => <Glyph size={p.size} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />,
  plus: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  box: (p) => <Glyph size={p.size} d={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>} />,
  adj: (p) => <Glyph size={p.size} d={<><line x1="4" y1="6" x2="11" y2="6" /><line x1="14" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="17" y1="12" x2="20" y2="12" /><circle cx="12.5" cy="6" r="1.6" fill="currentColor" /><circle cx="15.5" cy="12" r="1.6" fill="currentColor" /></>} />,
  folder: (p) => <Glyph size={p.size} d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />,
  pin: (p) => <Glyph size={p.size} d={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>} />,
  more: (p) => <Glyph size={p.size} d={<><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>} />,
};

/** Render an icon by name, e.g. <Icon name="trash" size={16} /> */
export function Icon({ name, size }: { name: IconName } & IconProps) {
  const C = Icons[name];
  return <C size={size} />;
}

export const COLORS = ["#1F3D6E", "#2D6A4F", "#C8962A", "#B8501A", "#5C4A88", "#3B6A8F", "#7A2C3A", "#3A2F25"];

export function money(n: unknown): string {
  return typeof n === "number" ? n.toLocaleString("fr-FR") : String(n ?? "");
}
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
