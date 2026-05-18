// ui.jsx — primitives UI : Header, Stats, DeliveryCard, MiniMap, EmptyState,
// Toast, TabBar. Composants présents partout dans le dashboard.
"use client";

import { IconBell, IconBoxLarge, IconBox, IconChart, IconPhone, IconPin, IconRefresh, IconStar, IconStarLarge, IconTruck, IconUser } from "./icons";

// ─── Header ─────────────────────────────────────────────────────────────────
export function Header({ driver, shop, online, onToggleOnline, hasNotif }) {
  return (
    <header className="lv-header">
      <div className="lv-header__top">
        <div className="lv-avatar">{driver.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lv-header__name">{driver.name}</div>
          <div className="lv-header__sub">{shop.name} · {driver.id}</div>
        </div>
        <button className="lv-bell" aria-label="Notifications">
          <IconBell />
          {hasNotif && <span className="lv-bell__dot" />}
        </button>
      </div>
      <button
        className={`lv-online${online ? " lv-online--on" : ""}`}
        onClick={() => onToggleOnline(!online)}
        aria-pressed={online}
      >
        <span className="lv-online__left">
          <span className="lv-online__dot" />
          <span>
            <div className="lv-online__label">{online ? "Vous êtes en ligne" : "Vous êtes hors ligne"}</div>
            <div className="lv-online__sub">{online ? "Vous recevez les nouvelles courses" : "Touchez pour repasser en ligne"}</div>
          </span>
        </span>
        <span className={`lv-toggle${online ? " lv-toggle--on" : ""}`}>
          <span className="lv-toggle__dot" />
        </span>
      </button>
    </header>
  );
}

// ─── Stats row ──────────────────────────────────────────────────────────────
export function StatsRow({ stats }) {
  return (
    <div className="lv-stats">
      <Stat label="Aujourd'hui" value={stats.deliveries}                                           unit="courses" accent />
      <Stat label="Gains"       value={stats.earnings.toLocaleString("fr-FR")}                    unit="F · jour" />
      <Stat label="Pourboires"  value={stats.tips.toLocaleString("fr-FR")}                        unit="F" />
    </div>
  );
}
function Stat({ label, value, unit, accent }) {
  return (
    <div className={`lv-stat${accent ? " lv-stat--accent" : ""}`}>
      <div className="lv-stat__label">{label}</div>
      <div className="lv-stat__value lv-num">{value}</div>
      <div className="lv-stat__unit">{unit}</div>
    </div>
  );
}

// ─── Tab bar ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dispo",   label: "Dispo",      Icon: IconBox },
  { id: "ongoing", label: "En cours",   Icon: IconTruck },
  { id: "history", label: "Historique", Icon: IconChart },
  { id: "profil",  label: "Profil",     Icon: IconUser },
];

export function TabBar({ tab, onChange, counts = {} }) {
  return (
    <nav className="lv-tabbar">
      {TABS.map(({ id, label, Icon }) => {
        const active = id === tab;
        const count = counts[id] || 0;
        return (
          <button key={id} className={`lv-tabbtn${active ? " lv-tabbtn--active" : ""}`} onClick={() => onChange(id)}>
            <span className="lv-tabbtn__icon">
              <Icon />
              {count > 0 && <span className="lv-tabbtn__count" />}
            </span>
            <span className="lv-tabbtn__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Delivery card (available) ──────────────────────────────────────────────
export function DeliveryCard({ delivery: d, onAccept, highlight, compact, index = 0 }) {
  return (
    <article
      className={`lv-card lv-card--enter${highlight ? " lv-card--hi" : ""}${compact ? " lv-card--compact" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {highlight && (
        <div className="lv-card__badge">
          <IconStar />
          <span style={{ marginLeft: 4 }}>Nouvelle</span>
        </div>
      )}
      <div className="lv-card__head">
        <div>
          <div className="lv-card__client">{d.client}</div>
          <div className="lv-card__addr"><IconPin /> <span>{d.address}</span></div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="lv-card__amount lv-num">
            {d.amount.toLocaleString("fr-FR")}
            <span className="lv-card__amount-unit">F</span>
          </div>
          {d.tip > 0 && <div className="lv-card__tip lv-num">+{d.tip} pourboire</div>}
        </div>
      </div>
      <div className="lv-meta">
        <span className="lv-chip"><b className="lv-num">{d.distance.toFixed(1)}</b> km</span>
        <span className="lv-chip"><b className="lv-num">{d.eta}</b> min</span>
        <span className="lv-chip">{d.payment}</span>
        {d.placedAt && <span className="lv-chip lv-chip--bare">{d.placedAt}</span>}
      </div>
      <div className="lv-items">
        {d.items.map((it, i) => (
          <span key={i} className="lv-item">
            <span className="lv-item__qty">×{it.qty}</span> {it.name}
          </span>
        ))}
      </div>
      {d.note && <div className="lv-note">« {d.note} »</div>}
      <div className="lv-actions">
        <button className="lv-btn--ghost">Détails</button>
        <button className="lv-btn--primary" onClick={onAccept}>Accepter</button>
      </div>
    </article>
  );
}

// ─── Mini map (placeholder SVG) ─────────────────────────────────────────────
// Remplacez ce composant par votre intégration Mapbox/Leaflet si besoin.
// Props attendues : { from?: {lat,lng}, to?: {lat,lng} } (non utilisées ici).
export function MiniMap() {
  return (
    <div className="lv-map">
      <svg viewBox="0 0 360 140" width="100%" height="140" preserveAspectRatio="xMidYMid slice">
        <rect width="360" height="140" fill="#eef3ec"/>
        <path d="M0 100 Q 90 80 180 95 T 360 60"   fill="none" stroke="#d2dccf" strokeWidth="18" strokeLinecap="round"/>
        <path d="M70 0 L 90 140"                    stroke="#d2dccf" strokeWidth="12"/>
        <path d="M270 0 L 250 140"                  stroke="#d2dccf" strokeWidth="10"/>
        <path d="M280 0 L 330 140"                  stroke="#dde5d9" strokeWidth="8"/>
        <path d="M55 120 Q 130 80 220 90 T 330 40"  fill="none" stroke="var(--lv-g-700)" strokeWidth="3" strokeLinecap="round"/>
        <g transform="translate(55 120)"><circle r="8" fill="#fff" stroke="var(--lv-g-800)" strokeWidth="2.5"/></g>
        <g transform="translate(330 40)"><circle r="12" fill="var(--lv-g-800)"/><circle r="4" fill="#fff"/></g>
      </svg>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ title, sub, action }) {
  return (
    <div className="lv-empty">
      <div className="lv-empty__icon"><IconBoxLarge /></div>
      <div className="lv-empty__title">{title}</div>
      {sub && <div className="lv-empty__sub">{sub}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ children }) {
  return <div className="lv-toast">{children}</div>;
}

// re-export some icons for convenience in views.jsx
export { IconPhone, IconRefresh, IconStarLarge, IconPin };
