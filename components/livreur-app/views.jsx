// views.jsx — Available / Ongoing / History / Profile.
"use client";

import { useState } from "react";
import { DeliveryCard, EmptyState, MiniMap, IconPhone, IconRefresh, IconStarLarge, IconPin } from "./ui";

// ─── Available ──────────────────────────────────────────────────────────────
export function AvailableView({ online, list, onAccept, onRefresh, highlightFirst = true, compact = false }) {
  const [spinning, setSpinning] = useState(false);
  const refresh = async () => {
    setSpinning(true);
    try { await onRefresh?.(); } finally { setTimeout(() => setSpinning(false), 700); }
  };

  if (!online) return <EmptyState title="Vous êtes hors ligne" sub="Passez en ligne pour recevoir des courses." />;
  if (list.length === 0) return <EmptyState title="Aucune livraison disponible" sub="Actualisation auto toutes les 45 s." />;

  return (
    <>
      <div className="lv-sec">
        <span className="lv-sec__title">{list.length} courses disponibles</span>
        <button className="lv-sec__btn" onClick={refresh}>
          <IconRefresh spinning={spinning} /> Actualiser
        </button>
      </div>
      {list.map((d, i) => (
        <DeliveryCard
          key={d.id}
          delivery={d}
          onAccept={() => onAccept(d)}
          highlight={i === 0 && highlightFirst}
          compact={compact}
          index={i}
        />
      ))}
      <div style={{ textAlign: "center", padding: "12px 0 4px", fontSize: 11, color: "var(--lv-ink-300)" }}>
        ↓ Tirez pour actualiser
      </div>
    </>
  );
}

// ─── Ongoing ────────────────────────────────────────────────────────────────
const ONGOING_STEPS = [
  { id: "pickup",  label: "Récupérer la commande",  detail: (o, shop) => `${shop.name} · ${shop.address.split(",")[0]}` },
  { id: "enroute", label: "En route vers le client", detail: (o) => o.address },
  { id: "arrived", label: "Arrivé · confirmer la livraison", detail: (o) => o.client },
];

export function OngoingView({ ongoing, shop, onAdvance, onCall, onGoToAvailable, showMap = true }) {
  if (!ongoing) {
    return (
      <>
        <EmptyState
          title="Pas de course en cours"
          sub="Acceptez une livraison disponible pour la voir ici."
          action={<button className="lv-btn--ghost lv-btn--full" onClick={onGoToAvailable}>Voir les disponibles</button>}
        />
      </>
    );
  }

  const idx  = ONGOING_STEPS.findIndex((s) => s.id === ongoing.step);
  const last = idx === ONGOING_STEPS.length - 1;

  return (
    <>
      <div className="lv-sec">
        <span className="lv-sec__title">Course en cours</span>
        <span style={{ fontSize: 11, color: "var(--lv-ink-400)" }}>#{ongoing.id}</span>
      </div>

      <article className="lv-card" style={{ paddingTop: showMap ? 0 : 14, overflow: "hidden" }}>
        {showMap && <MiniMap />}

        <div style={{ padding: "14px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div>
              <div className="lv-card__client">{ongoing.client}</div>
              <div className="lv-card__addr"><IconPin /> <span>{ongoing.address}</span></div>
            </div>
            <div className="lv-card__amount lv-num">
              {ongoing.amount.toLocaleString("fr-FR")}
              <span className="lv-card__amount-unit">F</span>
            </div>
          </div>

          <ol className="lv-steps">
            {ONGOING_STEPS.map((s, i) => {
              const done = i < idx;
              const active = i === idx;
              const cls = `lv-step${done ? " lv-step--done" : active ? " lv-step--active" : ""}`;
              return (
                <li key={s.id} className={cls}>
                  <span className="lv-step__dot">{done ? "✓" : i + 1}</span>
                  <div>
                    <div className="lv-step__label">{s.label}</div>
                    <div className="lv-step__detail">{s.detail(ongoing, shop)}</div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="lv-actions">
            <button className="lv-btn--ghost" onClick={onCall}>
              <IconPhone /> <span style={{ marginLeft: 6 }}>Appeler</span>
            </button>
            <button className="lv-btn--primary" onClick={onAdvance}>
              {last ? "Terminer" : "Étape suivante"}
            </button>
          </div>
        </div>
      </article>
    </>
  );
}

// ─── History ────────────────────────────────────────────────────────────────
export function HistoryView({ items }) {
  if (!items.length) return <EmptyState title="Aucun historique" sub="Vos livraisons termineront ici." />;
  return (
    <>
      <div className="lv-sec"><span className="lv-sec__title">Historique</span></div>
      <div className="lv-card">
        {items.map((it) => (
          <div key={it.id} className="lv-row">
            <div>
              <div className="lv-row__name">{it.client}</div>
              <div className="lv-row__meta">{it.date} · {it.address}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lv-row__amt lv-num">{it.amount.toLocaleString("fr-FR")} F</div>
              <div className={`lv-row__status ${it.status === "Livrée" ? "lv-row__status--ok" : "lv-row__status--bad"}`}>{it.status}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Profile ────────────────────────────────────────────────────────────────
export function ProfileView({ driver }) {
  const prefs = [
    { id: "notif",   label: "Notifications nouvelles courses", defaultOn: true },
    { id: "route",   label: "Itinéraire optimisé",             defaultOn: true },
    { id: "battery", label: "Mode économie batterie",          defaultOn: false },
  ];
  return (
    <>
      <div className="lv-sec"><span className="lv-sec__title">Profil</span></div>
      <div className="lv-card">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="lv-avatar lv-avatar--lg">{driver.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{driver.name}</div>
            <div style={{ fontSize: 12, color: "var(--lv-ink-400)" }}>{driver.vehicle}</div>
            <div style={{ fontSize: 12, color: "var(--lv-g-700)", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <IconStarLarge /> {driver.rating} · {driver.deliveriesTotal} livraisons
            </div>
          </div>
        </div>
      </div>

      <div className="lv-sec"><span className="lv-sec__title">Préférences</span></div>
      <div className="lv-card">
        {prefs.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0", fontSize: 13.5,
              borderTop: i === 0 ? "none" : "1px solid var(--lv-ink-100)",
            }}
          >
            <span>{p.label}</span>
            <PrefToggle defaultOn={p.defaultOn} />
          </div>
        ))}
      </div>
    </>
  );
}

function PrefToggle({ defaultOn }) {
  const [on, set] = useState(defaultOn);
  return (
    <button onClick={() => set(!on)} className={`lv-toggle${on ? " lv-toggle--on" : ""}`} aria-pressed={on}>
      <span className="lv-toggle__dot" />
    </button>
  );
}
