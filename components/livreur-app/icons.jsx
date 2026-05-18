// icons.jsx — SVG icons utilisées par le dashboard.
// Pas de dépendance externe : tout est inline pour rester drop-in.

export function IconBell({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5v1.2M3.5 8a5.5 5.5 0 0 1 11 0c0 3.5 1.5 4.5 1.5 4.5h-14S3.5 11.5 3.5 8z"/>
      <path d="M7 15.5a2 2 0 0 0 4 0"/>
    </svg>
  );
}

export function IconPin({ size = 11 }) {
  return (
    <svg width={size} height={size * 14 / 11} viewBox="0 0 11 14" fill="none"
         stroke="currentColor" strokeWidth="1.6">
      <path d="M5.5 1c2.5 0 4 1.8 4 4 0 3-4 8-4 8s-4-5-4-8c0-2.2 1.5-4 4-4z"/>
      <circle cx="5.5" cy="5" r="1.4"/>
    </svg>
  );
}

export function IconStar({ size = 9, fill = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 9 9" fill={fill}>
      <path d="M4.5 0l1.2 2.7L8.5 3l-2 2 .5 3-2.5-1.5L2 8l.5-3-2-2 2.8-.3z"/>
    </svg>
  );
}

export function IconStarLarge({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="currentColor">
      <path d="M5.5 0l1.5 3.3 3.6.3-2.7 2.4.8 3.5L5.5 7.8 2.3 9.5l.8-3.5L.4 3.6l3.6-.3z"/>
    </svg>
  );
}

export function IconRefresh({ size = 12, spinning }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
         style={spinning ? { animation: "lv-spin 700ms linear" } : undefined}>
      <path d="M10 4a4 4 0 1 0 .8 3M10 1.5v2.5H7.5"/>
    </svg>
  );
}

export function IconPhone({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 9v1.8c0 .6-.5 1.1-1.1 1-5-.5-9-4.5-9.5-9.5C.8 1.7 1.3 1.2 1.9 1.2H3.7c.5 0 1 .4 1.1.9.1.7.2 1.4.5 2 .2.4.1.9-.2 1.2L4.3 6.2c1.1 2.1 2.8 3.8 4.9 4.9l.9-.8c.3-.3.8-.4 1.2-.2.6.2 1.3.4 2 .5.5.1.9.5.9 1z"/>
    </svg>
  );
}

export function IconBox({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L3 5.5v9L10 18l7-3.5v-9L10 2zM3 5.5L10 9m0 0l7-3.5M10 9v9"/>
    </svg>
  );
}

export function IconTruck({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 5.5h10v8h-10zM11.5 8h4l2.5 3v2.5h-6.5zM5 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14.5 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    </svg>
  );
}

export function IconChart({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16V9M10 16V5M16 16v-4"/>
    </svg>
  );
}

export function IconUser({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3.2"/>
      <path d="M3.5 17.5c1-3 3.5-4.5 6.5-4.5s5.5 1.5 6.5 4.5"/>
    </svg>
  );
}

export function IconBoxLarge({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M11 2L3 6v10l8 4 8-4V6l-8-4zM3 6l8 4m0 0l8-4M11 10v10"/>
    </svg>
  );
}
