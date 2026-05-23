"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trophy, Plus, Trash2, Settings, Users, RotateCcw, Send, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";

interface TombolaSession {
  id: number;
  nom: string;
  statut: "draft" | "active" | "termine";
  min_montant: number;
  min_participants: number;
  prize_description: string | null;
  winner_facture_id: number | null;
  winner_nom: string | null;
  winner_tel: string | null;
  winner_montant: number | null;
  winner_reference: string | null;
  notifie: boolean;
  created_at: string;
  completed_at: string | null;
}

interface TombolaParticipant {
  facture_id: number;
  reference: string;
  client_nom: string;
  client_tel: string | null;
  total: number;
  created_at: string;
}

const SEGMENT_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#ea580c",
  "#ca8a04", "#16a34a", "#0891b2", "#dc2626",
  "#9333ea", "#0284c7", "#15803d", "#b45309",
];

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " F";
}

// ─── Spinning Wheel ────────────────────────────────────────────────────────────

function SpinWheel({
  participants,
  spinning,
  winnerIndex,
  onSpinEnd,
}: {
  participants: TombolaParticipant[];
  spinning: boolean;
  winnerIndex: number | null;
  onSpinEnd: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animRef = useRef<number | null>(null);

  const n = participants.length;

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas || n === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 4;
    const segDeg = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < n; i++) {
      const start = rot + i * segDeg - Math.PI / 2;
      const end   = start + segDeg;

      // Segment
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + segDeg / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      const fontSize = Math.max(9, Math.min(13, 200 / n));
      ctx.font = `bold ${fontSize}px sans-serif`;
      const label = participants[i].client_nom.length > 14
        ? participants[i].client_nom.slice(0, 13) + "…"
        : participants[i].client_nom;
      ctx.fillText(label, radius - 8, 4);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pointer (triangle at top)
    const px = cx;
    const py = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 10, py + 22);
    ctx.lineTo(px + 10, py + 22);
    ctx.closePath();
    ctx.fillStyle = "#1e293b";
    ctx.fill();
  }, [n, participants]);

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [drawWheel]);

  useEffect(() => {
    if (!spinning || winnerIndex === null || n === 0) return;

    const segRad = (2 * Math.PI) / n;
    const winnerCenter = (winnerIndex + 0.5) * segRad;
    // Pointer at top (π/2 offset already handled by -π/2 in draw)
    // Need winner center at top: rotation such that winnerCenter + finalRot = 0 (mod 2π)
    const targetFinal = (2 * Math.PI - winnerCenter) + 8 * 2 * Math.PI;
    const startRot = rotationRef.current;
    const totalDelta = targetFinal - (startRot % (2 * Math.PI));

    const duration = 7000;
    const startTime = performance.now();

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 4);
    }

    function frame(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOut(t);
      const currentRot = startRot + totalDelta * eased;
      rotationRef.current = currentRot;
      setRotation(currentRot);
      drawWheel(currentRot);

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        onSpinEnd();
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [spinning, winnerIndex, n, drawWheel, onSpinEnd]);

  // Keep rotation ref in sync
  useEffect(() => { rotationRef.current = rotation; }, [rotation]);

  if (n === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-full shadow-2xl"
      />
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const colors = ["#4f46e5", "#f59e0b", "#10b981", "#ec4899", "#3b82f6", "#f97316"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-3 opacity-90 animate-confetti"
          style={{
            left:             `${Math.random() * 100}%`,
            top:              `-${Math.random() * 20 + 5}%`,
            backgroundColor:  colors[i % colors.length],
            transform:        `rotate(${Math.random() * 360}deg)`,
            animationDuration:`${Math.random() * 2 + 2}s`,
            animationDelay:   `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TombolaManager() {
  const [sessions, setSessions] = useState<TombolaSession[]>([]);
  const [selected, setSelected] = useState<TombolaSession | null>(null);
  const [participants, setParticipants] = useState<TombolaParticipant[]>([]);
  const [participantsReady, setParticipantsReady] = useState(false);
  const [tab, setTab] = useState<"config" | "participants" | "roue">("config");
  const [loading, setLoading] = useState(true);
  const [loadingPart, setLoadingPart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [currentWinner, setCurrentWinner] = useState<TombolaParticipant | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nom: "",
    min_montant: "50000",
    min_participants: "10",
    prize_description: "",
  });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/tombola");
    const json = await res.json();
    setSessions(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const fetchParticipants = useCallback(async (sessionId: number) => {
    setLoadingPart(true);
    const res = await fetch(`/api/admin/tombola/${sessionId}/participants`);
    const json = await res.json();
    setParticipants(json.data ?? []);
    setParticipantsReady(json.ready ?? false);
    setLoadingPart(false);
  }, []);

  function selectSession(s: TombolaSession) {
    setSelected(s);
    setTab("config");
    setForm({
      nom:               s.nom,
      min_montant:       String(s.min_montant),
      min_participants:  String(s.min_participants),
      prize_description: s.prize_description ?? "",
    });
    setCurrentWinner(null);
    setWinnerIndex(null);
    setSpinning(false);
    setShowConfetti(false);
    setError("");
    fetchParticipants(s.id);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/tombola", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id:                selected.id,
        nom:               form.nom,
        min_montant:       Number(form.min_montant),
        min_participants:  Number(form.min_participants),
        prize_description: form.prize_description || null,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      await fetchSessions();
      await fetchParticipants(selected.id);
    } else {
      setError(json.error ?? "Erreur sauvegarde");
    }
    setSaving(false);
  }

  async function handleCreate() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/tombola", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom:               form.nom || "Tombola",
        min_montant:       Number(form.min_montant) || 50000,
        min_participants:  Number(form.min_participants) || 10,
        prize_description: form.prize_description || null,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setShowCreate(false);
      await fetchSessions();
    } else {
      setError(json.error ?? "Erreur création");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette tombola ?")) return;
    await fetch(`/api/admin/tombola/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    fetchSessions();
  }

  function handleSpin() {
    if (!participantsReady || participants.length === 0 || spinning) return;
    const idx = Math.floor(Math.random() * participants.length);
    setWinnerIndex(idx);
    setCurrentWinner(participants[idx]);
    setSpinning(true);
    setShowConfetti(false);
  }

  async function handleSpinEnd() {
    setSpinning(false);
    setShowConfetti(true);
    if (!selected || !currentWinner) return;
    // Lock winner in DB
    await fetch(`/api/admin/tombola/${selected.id}/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winner_facture_id: currentWinner.facture_id }),
    });
    await fetchSessions();
    setTimeout(() => setShowConfetti(false), 5000);
  }

  async function handleNotify() {
    if (!selected) return;
    setNotifying(true);
    const res = await fetch(`/api/admin/tombola/${selected.id}/notify`, {
      method: "POST",
    });
    const json = await res.json();
    if (json.ok) {
      await fetchSessions();
    } else {
      setError(json.error ?? "Erreur WhatsApp");
    }
    setNotifying(false);
  }

  const isTermine = selected?.statut === "termine";
  const canSpin   = participantsReady && !spinning && !isTermine;

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full min-h-0">
      {showConfetti && <Confetti />}

      {/* ── Left: session list ── */}
      <div className="md:w-72 flex-shrink-0 flex flex-col gap-3">
        <button
          onClick={() => {
            setShowCreate(v => !v);
            setForm({ nom: "", min_montant: "50000", min_participants: "10", prize_description: "" });
            setError("");
          }}
          className="flex items-center gap-2 justify-center w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
        >
          <Plus size={15} /> Nouvelle tombola
        </button>

        {showCreate && (
          <div className="bg-white rounded-xl border border-indigo-200 p-4 flex flex-col gap-3 shadow-sm">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Créer</p>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Nom de la tombola"
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              style={{ fontSize: "16px" }}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">Montant min (F)</label>
                <input
                  type="number"
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                  value={form.min_montant}
                  onChange={e => setForm(f => ({ ...f, min_montant: e.target.value }))}
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">Nb min</label>
                <input
                  type="number"
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                  value={form.min_participants}
                  onChange={e => setForm(f => ({ ...f, min_participants: e.target.value }))}
                  style={{ fontSize: "16px" }}
                />
              </div>
            </div>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Lot à gagner (ex: Smartphone)"
              value={form.prize_description}
              onChange={e => setForm(f => ({ ...f, prize_description: e.target.value }))}
              style={{ fontSize: "16px" }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Créer"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Aucune tombola</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => selectSession(s)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                  selected?.id === s.id
                    ? "bg-indigo-50 border-indigo-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{s.nom}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ≥ {formatPrice(s.min_montant)} · {s.min_participants} participants
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      s.statut === "termine"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.statut === "active"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {s.statut === "termine" ? "Terminé" : s.statut === "active" ? "Actif" : "Brouillon"}
                    </span>
                    {s.statut === "draft" && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                        className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {s.statut === "termine" && s.winner_nom && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700">
                    <Trophy size={11} /> {s.winner_nom}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: session detail ── */}
      {selected ? (
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{selected.nom}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {participants.length} participant{participants.length > 1 ? "s" : ""} éligibles
                {" · "}objectif : {selected.min_participants}
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full md:w-64">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{participants.length}/{selected.min_participants}</span>
                <span>{Math.min(100, Math.round((participants.length / selected.min_participants) * 100))}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:           `${Math.min(100, (participants.length / selected.min_participants) * 100)}%`,
                    backgroundColor: participantsReady ? "#10b981" : "#6366f1",
                  }}
                />
              </div>
              {participantsReady && (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <Check size={11} /> Prêt à lancer !
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-6">
            {(["config", "participants", "roue"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === t
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "config" ? <><Settings size={13} className="inline mr-1.5" />Config</> : null}
                {t === "participants" ? <><Users size={13} className="inline mr-1.5" />Participants ({participants.length})</> : null}
                {t === "roue" ? <><RotateCcw size={13} className="inline mr-1.5" />Roue</> : null}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Config tab ── */}
            {tab === "config" && (
              <div className="max-w-lg flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nom de la tombola</label>
                  <input
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    disabled={isTermine}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Montant minimum (F)</label>
                    <input
                      type="number"
                      className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={form.min_montant}
                      onChange={e => setForm(f => ({ ...f, min_montant: e.target.value }))}
                      disabled={isTermine}
                      style={{ fontSize: "16px" }}
                    />
                    <p className="text-xs text-slate-400 mt-1">Factures payées ≥ ce montant</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Nb participants minimum</label>
                    <input
                      type="number"
                      className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={form.min_participants}
                      onChange={e => setForm(f => ({ ...f, min_participants: e.target.value }))}
                      disabled={isTermine}
                      style={{ fontSize: "16px" }}
                    />
                    <p className="text-xs text-slate-400 mt-1">Seuil pour activer la roue</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Lot à gagner</label>
                  <input
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Ex : Smartphone Samsung A55, Bon d'achat 50 000 F..."
                    value={form.prize_description}
                    onChange={e => setForm(f => ({ ...f, prize_description: e.target.value }))}
                    disabled={isTermine}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {!isTermine && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Enregistrer
                  </button>
                )}

                {/* Winner card if termine */}
                {isTermine && selected.winner_nom && (
                  <div className="mt-2 p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy size={20} className="text-amber-500" />
                      <span className="font-bold text-amber-800 text-base">Gagnant</span>
                    </div>
                    <p className="font-bold text-slate-800 text-lg">{selected.winner_nom}</p>
                    {selected.winner_tel && <p className="text-slate-600 text-sm mt-0.5">{selected.winner_tel}</p>}
                    {selected.winner_reference && <p className="text-slate-500 text-xs mt-1">Facture : {selected.winner_reference}</p>}
                    {selected.winner_montant && (
                      <p className="text-slate-500 text-xs">Montant : {formatPrice(selected.winner_montant)}</p>
                    )}
                    {selected.prize_description && (
                      <p className="mt-2 text-sm font-semibold text-amber-700">Lot : {selected.prize_description}</p>
                    )}
                    <button
                      onClick={handleNotify}
                      disabled={notifying || selected.notifie}
                      className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                        selected.notifie
                          ? "bg-emerald-100 text-emerald-700 cursor-default"
                          : "bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                      }`}
                    >
                      {notifying ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {selected.notifie ? "WhatsApp envoyé ✓" : "Notifier par WhatsApp"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Participants tab ── */}
            {tab === "participants" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    {loadingPart ? "Chargement…" : `${participants.length} factures éligibles (payées ≥ ${formatPrice(selected.min_montant)})`}
                  </p>
                  <button
                    onClick={() => fetchParticipants(selected.id)}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={11} /> Actualiser
                  </button>
                </div>

                {loadingPart ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune facture éligible pour le moment</p>
                    <p className="text-xs mt-1">Critère : payée en totalité ≥ {formatPrice(selected.min_montant)}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs text-slate-500 text-left">
                          <th className="pb-2 font-semibold">#</th>
                          <th className="pb-2 font-semibold">Client</th>
                          <th className="pb-2 font-semibold">Référence</th>
                          <th className="pb-2 font-semibold text-right">Montant</th>
                          <th className="pb-2 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, i) => (
                          <tr key={p.facture_id} className="border-b border-slate-50 hover:bg-slate-50/60">
                            <td className="py-2 pr-3">
                              <span
                                className="inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                                style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td className="py-2 pr-3">
                              <p className="font-medium text-slate-800">{p.client_nom}</p>
                              {p.client_tel && <p className="text-xs text-slate-400">{p.client_tel}</p>}
                            </td>
                            <td className="py-2 pr-3 text-slate-500 text-xs">{p.reference}</td>
                            <td className="py-2 pr-3 text-right font-semibold text-slate-800">{formatPrice(p.total)}</td>
                            <td className="py-2 text-slate-400 text-xs whitespace-nowrap">
                              {new Date(p.created_at).toLocaleDateString("fr-FR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Roue tab ── */}
            {tab === "roue" && (
              <div className="flex flex-col items-center gap-6">
                {!participantsReady && !isTermine && (
                  <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-amber-800">Roue non disponible</p>
                    <p className="text-xs text-amber-700 mt-1">
                      {participants.length}/{selected.min_participants} participants atteints.
                      Encore {selected.min_participants - participants.length} facture{selected.min_participants - participants.length > 1 ? "s" : ""} nécessaire{selected.min_participants - participants.length > 1 ? "s" : ""}.
                    </p>
                  </div>
                )}

                {isTermine && selected.winner_nom ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
                      <Trophy size={40} className="text-amber-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Gagnant tiré</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{selected.winner_nom}</p>
                      {selected.winner_tel && <p className="text-slate-500 text-sm">{selected.winner_tel}</p>}
                      {selected.prize_description && (
                        <p className="mt-2 text-sm font-semibold text-amber-700 bg-amber-50 px-4 py-1.5 rounded-full inline-block">
                          🎁 {selected.prize_description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {participants.length > 0 && (
                      <SpinWheel
                        participants={participants}
                        spinning={spinning}
                        winnerIndex={winnerIndex}
                        onSpinEnd={handleSpinEnd}
                      />
                    )}

                    {currentWinner && !spinning && (
                      <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center animate-fade-in">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">🎉 Gagnant !</p>
                        <p className="text-xl font-bold text-slate-800">{currentWinner.client_nom}</p>
                        <p className="text-sm text-slate-500">{currentWinner.reference} · {formatPrice(currentWinner.total)}</p>
                      </div>
                    )}

                    <button
                      onClick={handleSpin}
                      disabled={!canSpin}
                      className={`mt-2 px-8 py-3 rounded-2xl text-white font-bold text-base transition shadow-lg ${
                        canSpin
                          ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl active:scale-95"
                          : "bg-slate-300 cursor-not-allowed"
                      } ${spinning ? "animate-pulse" : ""}`}
                    >
                      {spinning ? "La roue tourne…" : "🎰 Lancer la roue !"}
                    </button>

                    {!canSpin && !spinning && participantsReady && (
                      <p className="text-xs text-slate-400">Tombola déjà terminée</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <Trophy size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Sélectionne ou crée une tombola</p>
          </div>
        </div>
      )}
    </div>
  );
}
