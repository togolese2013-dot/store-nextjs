// LivreurDashboard.jsx — composant root.
//
// Usage minimal :
//   import LivreurDashboard from "@/components/livreur-app/LivreurDashboard";
//   import { mockApi } from "@/components/livreur-app/api";
//   <LivreurDashboard api={mockApi} />
//
// En production, passez votre propre `api` (voir api.js + README).
"use client";

import { useMemo } from "react";
import { useLivreur } from "./hooks";
import { mockApi } from "./api";
import { Header, StatsRow, TabBar, Toast } from "./ui";
import { AvailableView, OngoingView, HistoryView, ProfileView } from "./views";

/**
 * @param {object} props
 * @param {import('./api').Adapter} [props.api]    Votre adaptateur. Par défaut: mockApi.
 * @param {boolean} [props.highlightFirst=true]   Badge "Nouvelle" sur la 1ʳᵉ course.
 * @param {boolean} [props.showMap=true]          Mini-carte dans la course en cours.
 * @param {boolean} [props.compact=false]         Cartes denses.
 * @param {number}  [props.refreshIntervalMs]     Polling. Défaut: 45000 ms.
 */
export default function LivreurDashboard({
  api = mockApi,
  highlightFirst = true,
  showMap = true,
  compact = false,
  refreshIntervalMs,
}) {
  const lv = useLivreur({ api, refreshIntervalMs });

  const counts = useMemo(() => ({
    dispo:   lv.available?.length || 0,
    ongoing: lv.ongoing ? 1 : 0,
  }), [lv.available, lv.ongoing]);

  if (lv.loading) {
    return <div className="livreur-root"><div className="lv-loading">Chargement…</div></div>;
  }
  if (lv.error) {
    return (
      <div className="livreur-root">
        <div className="lv-loading">
          Impossible de charger l'espace livreur.
          <br />
          <span style={{ color: "var(--lv-danger)" }}>{String(lv.error.message || lv.error)}</span>
        </div>
      </div>
    );
  }

  const { driver, shop, stats, available, ongoing, history, online, tab, toast } = lv;
  const hasNotif = online && (available?.length || 0) > 0;

  return (
    <div className="livreur-root">
      <Header
        driver={driver}
        shop={shop}
        online={online}
        onToggleOnline={lv.setOnline}
        hasNotif={hasNotif}
      />

      <div className="lv-scroll">
        <StatsRow stats={stats} />

        {tab === "dispo" && (
          <AvailableView
            online={online}
            list={available}
            onAccept={lv.accept}
            onRefresh={lv.refresh}
            highlightFirst={highlightFirst}
            compact={compact}
          />
        )}

        {tab === "ongoing" && (
          <OngoingView
            ongoing={ongoing}
            shop={shop}
            onAdvance={lv.advance}
            onCall={lv.call}
            onGoToAvailable={() => lv.setTab("dispo")}
            showMap={showMap}
          />
        )}

        {tab === "history" && <HistoryView items={history} />}
        {tab === "profil"  && <ProfileView driver={driver} />}
      </div>

      <TabBar tab={tab} onChange={lv.setTab} counts={counts} />

      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}
