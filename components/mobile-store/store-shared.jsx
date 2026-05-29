// store-shared.jsx — Shared tokens, icons, and UI primitives for mobile store
const { useState } = React;

const C = {
  white: '#fff', bg: '#FBF7F1', bgElev: '#FEFCF9',
  ink: '#14110E', ink2: '#2A2522',
  muted: '#6B635B', muted2: '#8A8278',
  border: '#E8E1D4', borderSoft: 'rgba(20,17,14,0.08)',
  accent: '#3B6A8F', accentBg: '#E8F0F7',
  brand: '#E07A2C', brandBg: '#FBE9D6',
  ok: '#2D6A4F', okBg: '#DDEBE2',
};

const FONTS = {
  sans: '"Geist", system-ui, -apple-system, sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  mono: '"Geist Mono", ui-monospace, monospace',
};

const fmt = n => n.toLocaleString('fr-FR') + ' F';

const PRODUCTS = [
  { id:1, name:'Pagne wax — Indigo Royal',  brand:'Studio Wax',     price:18000, swatch:'#1F3D6E', cat:'Textile',      badge:'Nouveau'    },
  { id:2, name:'Beurre de karité · 250g',  brand:'Karité Pure',   price:4500,  swatch:'#D4B483', cat:'Cosmétique',  badge:'Bio'        },
  { id:3, name:'Bogolan brodé — Mopti',     brand:'Atelier Bamako', price:12000, swatch:'#3A2F25', cat:'Textile',      badge:'Bestseller' },
  { id:4, name:'Collier perles wax · doré', brand:'Maison Diallo',  price:8500,  swatch:'#B8501A', cat:'Accessoire',   badge:null         },
  { id:5, name:'Bissap séché · 500g',  brand:'Maison Diallo',  price:1500,  swatch:'#7A2C3A', cat:'Alimentation', badge:null         },
  { id:6, name:'Café Robusta · 450g',       brand:'Maison Diallo',  price:6800,  swatch:'#5A3520', cat:'Alimentation', badge:null         },
];

// ── Icon system ───────────────────────────────────────────
function SvgIco({ sz=20, col, fill=false, sw=1.85, children }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24"
      fill={fill ? (col||'currentColor') : 'none'}
      stroke={fill ? 'none' : (col||'currentColor')}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display:'block', flexShrink:0 }}>
      {children}
    </svg>
  );
}

const IcSearch  = ({s=20}) => <SvgIco sz={s}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></SvgIco>;
const IcBag     = ({s=22}) => <SvgIco sz={s}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></SvgIco>;
const IcHome    = ({s=22}) => <SvgIco sz={s}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SvgIco>;
const IcGrid    = ({s=22}) => <SvgIco sz={s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></SvgIco>;
const IcUser    = ({s=22}) => <SvgIco sz={s}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></SvgIco>;
const IcBack    = ({s=22}) => <SvgIco sz={s} sw={2.2}><path d="m15 18-6-6 6-6"/></SvgIco>;
const IcShare   = ({s=20}) => <SvgIco sz={s}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></SvgIco>;
const IcFilter  = ({s=20}) => <SvgIco sz={s}><path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z"/></SvgIco>;
const IcPlus    = ({s=16}) => <SvgIco sz={s} sw={2.4}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></SvgIco>;
const IcMinus   = ({s=16}) => <SvgIco sz={s} sw={2.4}><line x1="5" y1="12" x2="19" y2="12"/></SvgIco>;
const IcTrash   = ({s=17}) => <SvgIco sz={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></SvgIco>;
const IcTruck   = ({s=18}) => <SvgIco sz={s}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></SvgIco>;
const IcCard    = ({s=20}) => <SvgIco sz={s}><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></SvgIco>;
const IcChevD   = ({s=14}) => <SvgIco sz={s} sw={2}><path d="m6 9 6 6 6-6"/></SvgIco>;
const IcCheck   = ({s=22, col}) => <SvgIco sz={s} col={col} sw={2.5}><polyline points="20 6 9 17 4 12"/></SvgIco>;
const IcPhone   = ({s=18}) => <SvgIco sz={s}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></SvgIco>;
const IcLoc     = ({s=16}) => <SvgIco sz={s}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></SvgIco>;
const IcWave    = ({s=18}) => <SvgIco sz={s}><path d="M2 12c0 0 3.5-5 10-5s10 5 10 5-3.5 5-10 5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></SvgIco>;
const IcX       = ({s=16}) => <SvgIco sz={s} sw={2.2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></SvgIco>;

const IcHeart = ({ s=18, f=false }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"
    fill={f ? C.brand : 'none'} stroke={f ? C.brand : 'currentColor'}
    strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"
    style={{ display:'block', flexShrink:0 }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IcStar = ({ s=11, f=true }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"
    fill={f ? '#E07A2C' : 'none'} stroke={f ? '#E07A2C' : '#C8BBAA'}
    strokeWidth="1.5" strokeLinejoin="round"
    style={{ display:'block', flexShrink:0 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Product image placeholder ─────────────────────────────
function PImg({ swatch='#E8E1D4', h=180, radius=0, label='product shot' }) {
  const hex = swatch.replace('#','');
  const pid = 'ssp' + hex;
  const rv = parseInt(hex.slice(0,2),16);
  const gv = parseInt(hex.slice(2,4),16);
  const bv = parseInt(hex.slice(4,6),16);
  return (
    <div style={{ height:h, borderRadius:radius, overflow:'hidden', position:'relative', flexShrink:0, background:`rgba(${rv},${gv},${bv},0.13)`, width:'100%' }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position:'absolute', inset:0 }}>
        <defs>
          <pattern id={pid} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke={swatch} strokeWidth="1" strokeOpacity="0.28"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`}/>
        <text x="50%" y="100%" dy="-10" textAnchor="middle" fontSize="9" fontFamily="monospace" fill={swatch} fillOpacity="0.6">{label}</text>
      </svg>
    </div>
  );
}

// ── Promo banner ──────────────────────────────────────────
function PromoBanner() {
  return (
    <div style={{ background:C.brand, color:'#fff', padding:'8px 16px', textAlign:'center', fontSize:11.5, fontFamily:FONTS.sans, fontWeight:500, lineHeight:1.35, letterSpacing:'0.005em' }}>
      🎁&nbsp; Livraison offerte dès 15&thinsp;000&thinsp;F&ensp;&middot;&ensp;Free delivery from 15,000&thinsp;F
    </div>
  );
}

// ── Bottom nav bar ────────────────────────────────────────
function BottomNav({ active='home', cartCount=3 }) {
  const tabs = [
    { id:'home',      label:'Accueil',   Ic: () => <IcHome s={22}/> },
    { id:'catalogue', label:'Catalogue', Ic: () => <IcGrid s={22}/> },
    { id:'cart',      label:'Panier',    Ic: () => <IcBag  s={22}/>, badge: cartCount },
    { id:'account',   label:'Compte',    Ic: () => <IcUser s={22}/> },
  ];
  return (
    <div style={{ background:'rgba(255,255,255,0.94)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderTop:`1px solid ${C.border}`, display:'flex', paddingTop:10, paddingBottom:26, paddingLeft:4, paddingRight:4 }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <div key={t.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, color:on ? C.ink : C.muted2, cursor:'pointer', position:'relative' }}>
            <div style={{ position:'relative' }}>
              <t.Ic />
              {t.badge > 0 && (
                <div style={{ position:'absolute', top:-4, right:-6, minWidth:16, height:16, borderRadius:99, background:C.brand, color:'#fff', fontSize:9, fontWeight:700, display:'grid', placeItems:'center', padding:'0 3px', fontFamily:FONTS.mono }}>
                  {t.badge}
                </div>
              )}
            </div>
            <span style={{ fontSize:10, fontWeight:on?600:400, letterSpacing:'-0.01em' }}>{t.label}</span>
            {on && <div style={{ width:4, height:4, borderRadius:99, background:C.ink, marginTop:1 }}/>}
          </div>
        );
      })}
    </div>
  );
}

// ── Stars row ─────────────────────────────────────────────
function Stars({ n=4, count, size=11 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(i => <IcStar key={i} s={size} f={i <= n}/>)}
      {count && <span style={{ fontSize:11, color:C.muted2, marginLeft:4, fontFamily:FONTS.sans }}>{n.toFixed(1)} · {count} avis</span>}
    </div>
  );
}

// ── Badge pill ────────────────────────────────────────────
function Badge({ label, color=C.brand }) {
  return (
    <div style={{ background:color, color:'#fff', fontSize:8.5, fontWeight:700, padding:'3px 7px', borderRadius:99, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:FONTS.sans }}>
      {label}
    </div>
  );
}

Object.assign(window, {
  C, FONTS, fmt, PRODUCTS,
  PImg, PromoBanner, BottomNav, Stars, Badge,
  SvgIco, IcSearch, IcBag, IcHome, IcGrid, IcUser, IcHeart, IcBack, IcShare,
  IcFilter, IcPlus, IcMinus, IcTrash, IcTruck, IcCard, IcChevD, IcCheck,
  IcPhone, IcLoc, IcWave, IcX, IcStar,
});
