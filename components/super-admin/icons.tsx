/* Super Admin — icon set. Lucide-compatible stroke icons.
   If you use lucide-react you can map most of these to: Gauge, Store,
   CreditCard, Layers, LifeBuoy, Activity, History, Settings, HelpCircle,
   Search, Bell, Plus, Download, Filter, MoreVertical, ChevronDown,
   ChevronLeft, TrendingUp, TrendingDown, Check, Shield, Server, Database,
   Waves, MessageCircle, Cloud, AlertTriangle, Coins, BarChart3, Users, X,
   Trash2, Pause, Play, Pencil, Send, RefreshCw, UserPlus — and delete this. */
import React from 'react';

type IconProps = { size?: number };
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const Ic = ({ d, size = 16, vb = '0 0 24 24' }: { d: React.ReactNode; size?: number; vb?: string }) =>
  <svg width={size} height={size} viewBox={vb} {...S}>{typeof d === 'string' ? <path d={d} /> : d}</svg>;

export const I = {
  gauge:  (p?: IconProps) => <Ic size={p?.size} d={<><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></>} />,
  store:  (p?: IconProps) => <Ic size={p?.size} d={<><path d="M2 7l1.5-4h17L22 7" /><path d="M2 7h20v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" /><path d="M4 11v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" /></>} />,
  card:   (p?: IconProps) => <Ic size={p?.size} d={<><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>} />,
  layers: (p?: IconProps) => <Ic size={p?.size} d={<><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>} />,
  life:   (p?: IconProps) => <Ic size={p?.size} d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5 5 4.5 4.5M14.5 14.5 19 19M19 5l-4.5 4.5M9.5 14.5 5 19" /></>} />,
  activity:(p?: IconProps) => <Ic size={p?.size} d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  history:(p?: IconProps) => <Ic size={p?.size} d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>} />,
  cog:    (p?: IconProps) => <Ic size={p?.size} d={<><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="3" /></>} />,
  help:   (p?: IconProps) => <Ic size={p?.size} d={<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />,
  search: (p?: IconProps) => <Ic size={p?.size} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />,
  bell:   (p?: IconProps) => <Ic size={p?.size} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />,
  plus:   (p?: IconProps) => <svg width={p?.size || 14} height={p?.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  download:(p?: IconProps) => <Ic size={p?.size || 14} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>} />,
  filter: (p?: IconProps) => <Ic size={p?.size} d="M22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3Z" />,
  more:   (p?: IconProps) => <Ic size={p?.size} d={<><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>} />,
  chevD:  (p?: IconProps) => <Ic size={p?.size || 12} d="m6 9 6 6 6-6" />,
  chevL:  (p?: IconProps) => <Ic size={p?.size || 14} d="m15 18-6-6 6-6" />,
  trend:  (p?: IconProps) => <svg width={p?.size || 10} height={p?.size || 10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
  down:   (p?: IconProps) => <svg width={p?.size || 10} height={p?.size || 10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>,
  check:  (p?: IconProps) => <Ic size={p?.size} d="M20 6 9 17l-5-5" />,
  shield: (p?: IconProps) => <Ic size={p?.size} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  server: (p?: IconProps) => <Ic size={p?.size} d={<><rect x="2" y="3" width="20" height="8" rx="2" /><rect x="2" y="13" width="20" height="8" rx="2" /><line x1="6" y1="7" x2="6.01" y2="7" /><line x1="6" y1="17" x2="6.01" y2="17" /></>} />,
  db:     (p?: IconProps) => <Ic size={p?.size} d={<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></>} />,
  wave:   (p?: IconProps) => <Ic size={p?.size} d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />,
  msg:    (p?: IconProps) => <Ic size={p?.size} d={<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" /></>} />,
  cloud:  (p?: IconProps) => <Ic size={p?.size} d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 6.5 19Z" />,
  alert:  (p?: IconProps) => <Ic size={p?.size} d={<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />,
  coins:  (p?: IconProps) => <Ic size={p?.size} d={<><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" /></>} />,
  chart:  (p?: IconProps) => <Ic size={p?.size} d={<><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>} />,
  users:  (p?: IconProps) => <Ic size={p?.size} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  x:      (p?: IconProps) => <Ic size={p?.size} d="M18 6 6 18M6 6l12 12" />,
  trash:  (p?: IconProps) => <Ic size={p?.size} d={<><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>} />,
  pause:  (p?: IconProps) => <Ic size={p?.size} d={<><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>} />,
  play:   (p?: IconProps) => <Ic size={p?.size} d="M6 4l14 8-14 8V4Z" />,
  edit:   (p?: IconProps) => <Ic size={p?.size} d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>} />,
  send:   (p?: IconProps) => <Ic size={p?.size} d={<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>} />,
  refresh:(p?: IconProps) => <Ic size={p?.size} d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>} />,
  userPlus:(p?: IconProps) => <Ic size={p?.size} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>} />,
};

export function initials(n: string): string {
  return n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}
