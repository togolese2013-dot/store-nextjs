/**
 * Admin · Utilisateurs & rôles — set d'icônes (compatible lucide-react).
 *
 * Usage : `import { I } from './icons'` puis `<I.shield size={16} />`.
 *
 * Équivalents lucide-react (si vous préférez la lib, mappez et supprimez ce
 * fichier) :
 *   shield → Shield · userPlus → UserPlus · more → MoreVertical ·
 *   pencil → Pencil · key → Key · userX → UserX · userCheck → UserCheck ·
 *   trash → Trash2 · alert → AlertTriangle · mail → Mail · send → Send ·
 *   plus → Plus · check → Check · x → X
 */
import React from 'react';

type IconProps = { size?: number };

const S = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const Svg = ({ size = 16, sw, children }: { size?: number; sw?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...S} strokeWidth={sw ?? S.strokeWidth}>
    {children}
  </svg>
);

export const I = {
  shield: ({ size }: IconProps) => (
    <Svg size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></Svg>
  ),
  userPlus: ({ size }: IconProps) => (
    <Svg size={size}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </Svg>
  ),
  more: ({ size }: IconProps) => (
    <Svg size={size}>
      <circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </Svg>
  ),
  pencil: ({ size }: IconProps) => (
    <Svg size={size}>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  ),
  key: ({ size }: IconProps) => (
    <Svg size={size}>
      <circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.3-8.3M16 5l3 3M14 7l3 3" />
    </Svg>
  ),
  userX: ({ size }: IconProps) => (
    <Svg size={size}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" />
    </Svg>
  ),
  userCheck: ({ size }: IconProps) => (
    <Svg size={size}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </Svg>
  ),
  trash: ({ size }: IconProps) => (
    <Svg size={size}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
    </Svg>
  ),
  alert: ({ size }: IconProps) => (
    <Svg size={size}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  ),
  mail: ({ size }: IconProps) => (
    <Svg size={size}>
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
    </Svg>
  ),
  send: ({ size }: IconProps) => (
    <Svg size={size}>
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Svg>
  ),
  plus: ({ size = 14 }: IconProps) => (
    <Svg size={size} sw={2}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  ),
  check: ({ size = 14 }: IconProps) => (
    <Svg size={size} sw={2.4}><polyline points="20 6 9 17 4 12" /></Svg>
  ),
  x: ({ size = 18 }: IconProps) => (
    <Svg size={size}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  ),
};

export type IconKey = keyof typeof I;
