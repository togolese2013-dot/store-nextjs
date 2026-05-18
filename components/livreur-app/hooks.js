// hooks.js — useLivreur : state + actions, branché à l'API.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STEP_ORDER = ["pickup", "enroute", "arrived"];

/**
 * Hook principal. À utiliser dans LivreurDashboard.
 *
 * @param {object} opts
 * @param {import('./api').Adapter} opts.api
 * @param {number} [opts.refreshIntervalMs=45000]  polling pour "disponibles"
 */
export function useLivreur({ api, refreshIntervalMs = 45000 }) {
  const [driver, setDriver]       = useState(null);
  const [shop, setShop]           = useState(null);
  const [stats, setStats]         = useState(null);
  const [available, setAvailable] = useState([]);
  const [ongoing, setOngoing]     = useState(null);
  const [history, setHistory]     = useState([]);
  const [online, setOnlineState]  = useState(true);
  const [tab, setTab]             = useState("dispo");
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ─── initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    let off = false;
    Promise.all([
      api.getDriver(), api.getShop(), api.getStats(),
      api.listAvailable(), api.getOngoing(), api.listHistory(),
    ]).then(([d, s, st, av, on, hist]) => {
      if (off) return;
      setDriver(d); setShop(s); setStats(st);
      setAvailable(av); setOngoing(on); setHistory(hist);
      setLoading(false);
    }).catch((e) => { if (!off) { setError(e); setLoading(false); } });
    return () => { off = true; };
  }, [api]);

  // ─── auto toast dismiss ──────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── polling for available deliveries while online ───────────────────────
  const pollRef = useRef();
  useEffect(() => {
    if (!online || ongoing) return;          // pas de poll en course
    const tick = async () => {
      try { setAvailable(await api.listAvailable()); } catch {}
    };
    pollRef.current = setInterval(tick, refreshIntervalMs);
    return () => clearInterval(pollRef.current);
  }, [api, online, ongoing, refreshIntervalMs]);

  // ─── actions ─────────────────────────────────────────────────────────────
  const setOnline = useCallback(async (next) => {
    setOnlineState(next);
    try { await api.setOnline(next); }
    catch (e) {
      setOnlineState(!next);                  // rollback optimiste
      setToast("Impossible de changer le statut");
    }
  }, [api]);

  const refresh = useCallback(async () => {
    try { setAvailable(await api.listAvailable()); }
    catch { setToast("Échec de l'actualisation"); }
  }, [api]);

  const accept = useCallback(async (delivery) => {
    const prevAvail = available, prevOngoing = ongoing;
    // optimiste
    setAvailable((xs) => xs.filter((x) => x.id !== delivery.id));
    setOngoing({ ...delivery, step: "pickup" });
    setTab("ongoing");
    try {
      const updated = await api.accept(delivery.id);
      setOngoing({ ...delivery, ...updated, step: updated.step ?? "pickup" });
      setToast(`Course #${delivery.id} acceptée`);
    } catch (e) {
      setAvailable(prevAvail);
      setOngoing(prevOngoing);
      setToast("Course indisponible");
    }
  }, [api, available, ongoing]);

  const advance = useCallback(async () => {
    if (!ongoing) return;
    const i = STEP_ORDER.indexOf(ongoing.step);
    if (i < STEP_ORDER.length - 1) {
      const next = STEP_ORDER[i + 1];
      setOngoing({ ...ongoing, step: next });
      try { await api.advance(ongoing.id); } catch {}
    } else {
      // termine
      try { await api.advance(ongoing.id); } catch {}
      setStats((s) => s ? ({
        ...s,
        deliveries: s.deliveries + 1,
        earnings: s.earnings + Math.round(ongoing.amount * 0.12),
        tips: s.tips + (ongoing.tip || 0),
      }) : s);
      setHistory((h) => [{
        id: ongoing.id,
        date: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
        client: ongoing.client,
        address: ongoing.address,
        amount: ongoing.amount,
        status: "Livrée",
      }, ...h]);
      setOngoing(null);
      setTab("history");
      setToast("Livraison terminée");
    }
  }, [api, ongoing]);

  const call = useCallback(async () => {
    if (!ongoing) return;
    try { await api.call(ongoing.id); } catch {}
  }, [api, ongoing]);

  return {
    // state
    driver, shop, stats, available, ongoing, history,
    online, tab, toast, loading, error,
    // setters
    setTab, setOnline, setToast,
    // actions
    accept, advance, refresh, call,
  };
}
