/* ============================================================
   Overlays — Export, Import, AI drawer, History, Notifications,
   Command palette, Filter panel.
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Drawer } from "./shell";
import { Modal } from "./shell";
import { Field, Segmented, ImageDrop } from "./fields";
import { Icons } from "./icons";
import { useConfig } from "./UIProvider";
import type { UIApi, AiSuggestion, NotifItem, HistoryEvent, PaletteNavItem } from "./types";

/* ── DEFAULT DATA ─────────────────────────────────────────── */
const DEFAULT_AI: AiSuggestion[] = [
  { ic: "alert",    tone: "danger", t: "Réapprovisionner 3 produits critiques",    d: "Bissap séché, Savon noir et Kente royal sont sous le seuil. Générer les bons d'achat ?", cta: "Générer les bons" },
  { ic: "box",      tone: "accent", t: "Optimiser les prix de 12 produits",         d: "Marge sous 40% détectée sur la catégorie Textile. Suggestion : +6% en moyenne.",        cta: "Voir le détail" },
  { ic: "folder",   tone: "ok",     t: "5 produits non classés",                    d: "Classer automatiquement par similarité de nom et de marque.",                           cta: "Classer" },
  { ic: "sparkles", tone: "accent", t: "Descriptions manquantes",                   d: "18 produits sans description. Rédiger automatiquement à partir des attributs.",         cta: "Rédiger" },
];
const DEFAULT_NOTIFS: NotifItem[] = [
  { dot: "var(--danger)", t: "Rupture de stock — Savon noir",  d: "Stock à 0. Réapprovisionnement requis.", time: "il y a 12 min" },
  { dot: "var(--warn)",   t: "Stock bas — Bissap séché",        d: "4 unités restantes (seuil 10).",         time: "il y a 1 h" },
  { dot: "var(--ok)",     t: "Bon d'achat reçu — BC-2026-039", d: "9 produits ajoutés au stock.",           time: "il y a 3 h" },
  { dot: "var(--accent)", t: "Nouveau fournisseur validé",      d: "Lomé Négoce est désormais actif.",       time: "hier" },
];
const DEFAULT_HISTORY: HistoryEvent[] = [
  { label: "+156 Karité Pure · stock importé",     time: "Aujourd'hui, 10h14", author: "K. Diallo",  dot: "#2D6A4F" },
  { label: "Kente Royal passé en brouillon",        time: "Aujourd'hui, 09h02", author: "A. Mensah",  dot: "#8A8278" },
  { label: "Savane Bio — nouvelle marque ajoutée",  time: "Hier, 16h34",        author: "K. Diallo",  dot: "#3B6A8F" },
  { label: "Ajustement stock Bissap séché −10",     time: "Hier, 09h12",        author: "M. Koné",    dot: "#C9601E" },
  { label: "Export catalogue CSV · 248 produits",   time: "Il y a 2 jours",     author: "K. Diallo",  dot: "#5C4A88" },
];
const DEFAULT_PALETTE_NAV: PaletteNavItem[] = [
  { l: "Vue d'ensemble", pg: "overview",   ic: "box" },
  { l: "Produits",       pg: "produits",   ic: "box" },
  { l: "Catégories",     pg: "categories", ic: "folder" },
  { l: "Marques",        pg: "marques",    ic: "box" },
  { l: "Fournisseurs",   pg: "fournisseurs", ic: "box" },
  { l: "Bons d'achat",   pg: "bons-achat", ic: "file" },
  { l: "Entrepôts",      pg: "entrepots",  ic: "box" },
  { l: "Ajustements",    pg: "ajustements", ic: "adj" },
  { l: "Alertes stock",  pg: "alertes",    ic: "alert" },
];

/* ── EXPORT MODAL ─────────────────────────────────────────── */
interface ExportModalProps { scope: string; onClose: () => void; toast: (m: string) => void; }
export function ExportModal({ scope, onClose, toast }: ExportModalProps) {
  const [fmt, setFmt]   = useState("CSV");
  const [range, setRange] = useState("Tout");
  return (
    <Modal
      icon={<Icons.download size={18} />}
      title={`Exporter — ${scope}`}
      sub="Choisissez le format et la portée des données à exporter."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn pri" onClick={() => { onClose(); toast(`Export ${fmt} lancé — vous recevrez un email`); }}>
            <Icons.download size={14} /> Exporter
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Format"><Segmented value={fmt} onChange={setFmt} options={["CSV", "Excel", "PDF"]} /></Field>
        <Field label="Portée"><Segmented value={range} onChange={setRange} options={["Tout", "Filtré", "Sélection"]} /></Field>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12.5, color: "var(--muted)" }}>
          <Icons.file size={16} />
          <span>{scope.toLowerCase()}-export.{fmt.toLowerCase()} · ~248 lignes</span>
        </div>
      </div>
    </Modal>
  );
}

/* ── IMPORT MODAL ─────────────────────────────────────────── */
interface ImportModalProps { scope: string; onClose: () => void; toast: (m: string) => void; }
export function ImportModal({ scope, onClose, toast }: ImportModalProps) {
  return (
    <Modal
      icon={<Icons.upload size={18} />}
      title={`Importer — ${scope}`}
      sub="Importez en masse depuis un fichier CSV ou Excel. Les colonnes seront mappées automatiquement."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn pri" onClick={() => { onClose(); toast("Import analysé — 0 erreur détectée"); }}>
            Lancer l'import
          </button>
        </>
      }
    >
      <ImageDrop label="CSV, XLSX · 5 Mo max" />
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Besoin d'un gabarit ?</span>
        <button className="btn sm" onClick={() => toast("Modèle CSV téléchargé")}><Icons.download size={13} /> Modèle CSV</button>
      </div>
    </Modal>
  );
}

/* ── AI SUGGESTIONS DRAWER ───────────────────────────────── */
interface AIDrawerProps { onClose: () => void; toast: (m: string) => void; }
export function AIDrawer({ onClose, toast }: AIDrawerProps) {
  const config = useConfig();
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/ai/suggestions", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur serveur"); return; }
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions as AiSuggestion[]);
      } else {
        setSuggestions(config.ai ?? DEFAULT_AI);
      }
    } catch {
      setError("Erreur réseau");
      setSuggestions(config.ai ?? DEFAULT_AI);
    } finally { setLoading(false); }
  }, [config.ai]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const tones: Record<string, [string, string]> = {
    danger: ["var(--danger-bg)", "var(--danger)"],
    accent: ["var(--accent-bg)", "var(--accent)"],
    ok:     ["var(--ok-bg)",     "var(--ok)"],
  };
  const Icon = Icons;

  return (
    <Drawer
      eyebrow={`${config.name ?? "App"} · Assistant`}
      title="Suggestions"
      serif="IA"
      onClose={onClose}
      footer={
        <button className="btn pri" style={{ width: "100%", justifyContent: "center" }}
          disabled={loading}
          onClick={() => fetchSuggestions()}>
          <Icon.sparkles size={14} />
          {loading ? "Analyse en cours…" : "Régénérer les suggestions"}
        </button>
      }
    >
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p className="sub" style={{ margin: 0 }}>Analyse de votre boutique en cours…</p>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 13, padding: 16, height: 88, opacity: 0.5 + i * 0.1,
              backgroundImage: "linear-gradient(90deg, var(--bg-2) 0%, var(--border) 50%, var(--bg-2) 100%)",
              backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--danger)" }}>
          {error}
        </div>
      ) : (
        <>
          <p className="sub" style={{ margin: 0 }}>{suggestions.length} actions recommandées par l&apos;assistant.</p>
          {suggestions.map((s, i) => {
            const [bg, c] = tones[s.tone] ?? tones.accent;
            const Ic = Icons[s.ic] ?? Icons.sparkles;
            return (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 13, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: bg, color: c }}><Ic size={17} /></div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-.01em" }}>{s.t}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{s.d}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, paddingLeft: 45 }}>
                  <button className="btn sm pri" onClick={() => { onClose(); toast(s.cta); }}>{s.cta}</button>
                  <button className="btn sm" onClick={() => { setSuggestions(prev => prev.filter((_, j) => j !== i)); toast("Suggestion ignorée"); }}>Ignorer</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </Drawer>
  );
}

/* ── HISTORY DRAWER ──────────────────────────────────────── */
interface HistoryDrawerProps { title?: string; events?: HistoryEvent[]; onClose: () => void; }
export function HistoryDrawer({ title, events, onClose }: HistoryDrawerProps) {
  const config = useConfig();
  const list = events ?? config.history ?? DEFAULT_HISTORY;
  return (
    <Drawer
      eyebrow={`${config.name ?? "App"} · Journal`}
      title="Historique"
      serif={title ?? ""}
      onClose={onClose}
      footer={<button className="btn" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Fermer</button>}
    >
      <div style={{ position: "relative", paddingLeft: 6 }}>
        {list.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 13, paddingBottom: 18, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, background: e.dot ?? "var(--accent)", flexShrink: 0, marginTop: 3 }} />
              {i < list.length - 1 && <div style={{ width: 1.5, flex: 1, background: "var(--border)", marginTop: 4 }} />}
            </div>
            <div style={{ paddingBottom: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{e.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-2)", marginTop: 3 }}>{e.time} · {e.author ?? "Système"}</div>
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

/* ── NOTIFICATIONS PANEL (rendered in a popover) ─────────── */
interface NotifPanelProps { onClose: () => void; toast: (m: string) => void; }
export function NotifPanel({ onClose, toast }: NotifPanelProps) {
  const config = useConfig();
  const list = config.notifs ?? DEFAULT_NOTIFS;
  return (
    <div style={{ width: 360, maxWidth: "92vw" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Notifications</span>
        <button onClick={() => { onClose(); toast("Tout marqué comme lu"); }} style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>Tout lire</button>
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {list.map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 11, padding: "13px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
            onClick={() => { onClose(); toast("Notification ouverte"); }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: n.dot, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{n.t}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>{n.d}</div>
              <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 4 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FILTER PANEL (rendered in a popover) ────────────────── */
interface FilterPanelProps { onClose: () => void; toast: (m: string) => void; }
export function FilterPanel({ onClose, toast }: FilterPanelProps) {
  const config = useConfig();
  const groups = config.filters ?? [
    { t: "Statut",          opts: ["Actif", "Brouillon", "Rupture", "Archivé"] },
    { t: "Niveau de stock", opts: ["En stock", "Stock bas", "Rupture"] },
  ];
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const tog = (g: string, o: string) => setSel((p) => ({ ...p, [g + o]: !p[g + o] }));
  const count = Object.values(sel).filter(Boolean).length;
  return (
    <div style={{ width: 280 }}>
      <div style={{ padding: "13px 15px", borderBottom: "1px solid var(--border)", fontSize: 13.5, fontWeight: 600 }}>Filtres</div>
      <div style={{ maxHeight: 340, overflowY: "auto", padding: "4px 6px" }}>
        {groups.map((g) => (
          <div key={g.t} style={{ padding: "8px 9px" }}>
            <div className="ux-section-t" style={{ marginBottom: 7 }}>{g.t}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {g.opts.map((o) => {
                const on = sel[g.t + o];
                return (
                  <button key={o} onClick={() => tog(g.t, o)} style={{ padding: "5px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`, background: on ? "var(--accent-bg)" : "var(--surface)", color: on ? "var(--accent)" : "var(--ink-2)" }}>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: "12px 15px", borderTop: "1px solid var(--border)" }}>
        <button className="btn sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setSel({})}>Réinitialiser</button>
        <button className="btn sm pri" style={{ flex: 1, justifyContent: "center" }}
          onClick={() => { onClose(); toast(count ? `${count} filtre${count > 1 ? "s" : ""} appliqué${count > 1 ? "s" : ""}` : "Filtres effacés"); }}>
          Appliquer
        </button>
      </div>
    </div>
  );
}

/* ── COMMAND PALETTE ─────────────────────────────────────── */
interface CommandPaletteProps { onClose: () => void; navigate: (pg: string) => void; ui: UIApi; }
export function CommandPalette({ onClose, navigate, ui }: CommandPaletteProps) {
  const config = useConfig();
  const [q, setQ]             = useState("");
  const [aiAnswer, setAiAnswer]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setAiAnswer(""); }, [q]);

  const isAiMode  = q.startsWith("?");
  const aiQuestion = isAiMode ? q.slice(1).trim() : "";
  const ql = isAiMode ? "" : q.toLowerCase();

  const askAI = useCallback(async () => {
    if (!aiQuestion || aiLoading) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const res  = await fetch("/api/admin/ai/query", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: aiQuestion }),
      });
      const data = await res.json();
      setAiAnswer(res.ok ? (data.answer ?? "Pas de réponse.") : (data.error ?? "Erreur serveur."));
    } catch { setAiAnswer("Erreur réseau."); }
    finally { setAiLoading(false); }
  }, [aiQuestion, aiLoading]);

  const navList = config.paletteNav ?? DEFAULT_PALETTE_NAV;
  const pages   = navList.filter((p) => p.l.toLowerCase().includes(ql));

  const baseActions = config.paletteActions
    ? config.paletteActions(ui)
    : [
        { l: "Créer un produit",           ic: "plus"     as const, run: () => ui.openForm("product")    },
        { l: "Créer un bon d'achat",        ic: "plus"     as const, run: () => ui.openForm("po")         },
        { l: "Nouvel ajustement de stock",  ic: "adj"      as const, run: () => ui.openForm("adjustment") },
        { l: "Exporter le catalogue",       ic: "download" as const, run: () => ui.openExport("Produits") },
      ];
  const actions = baseActions.filter((a) => !ql || a.l.toLowerCase().includes(ql));

  const sg = config.searchGroup ? config.searchGroup(ui) : { title: "Résultats", items: [] };
  const results = (sg.items ?? []).filter((r) => !ql || r.label.toLowerCase().includes(ql) || (r.sub ?? "").toLowerCase().includes(ql)).slice(0, 6);

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) =>
    React.Children.count(children) ? (
      <div style={{ padding: "6px 8px" }}>
        <div className="ux-section-t" style={{ padding: "6px 10px" }}>{title}</div>
        {children}
      </div>
    ) : null;

  const Row = ({ iconName, label, sub, onClick }: { iconName: string; label: string; sub?: string; onClick: () => void }) => {
    const Ic = Icons[iconName as keyof typeof Icons];
    return (
      <button className="ux-mi" style={{ padding: "9px 10px" }} onClick={onClick}>
        <span className="ic">{Ic ? <Ic size={16} /> : null}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: "var(--muted-2)", fontFamily: "var(--font-geist-mono, monospace)" }}>{sub}</span>}
      </button>
    );
  };

  return (
    <div className="ux-palette" onMouseDown={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
        {isAiMode
          ? <span style={{ color: "var(--accent)", flexShrink: 0, display: "grid", placeItems: "center" }}><Icons.sparkles size={18} /></span>
          : <span style={{ flexShrink: 0, display: "grid", placeItems: "center" }}><Icons.search size={18} /></span>
        }
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && isAiMode) askAI(); }}
          placeholder={isAiMode ? "Posez votre question à l'IA…" : "Rechercher · ou taper ? pour interroger l'IA"}
          style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 15 }}
        />
        {isAiMode && aiQuestion && (
          <button
            onClick={askAI} disabled={aiLoading}
            style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: "var(--accent)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1, fontFamily: "inherit" }}
          >
            {aiLoading ? "…" : "↵ Envoyer"}
          </button>
        )}
        <span className="k">Esc</span>
      </div>

      <div style={{ maxHeight: "52vh", overflowY: "auto", padding: 6 }}>
        {isAiMode ? (
          <div style={{ padding: "10px 12px" }}>
            {!aiQuestion && !aiAnswer && (
              <div style={{ padding: "18px 12px", color: "var(--muted-2)", fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 500, marginBottom: 8, color: "var(--muted)" }}>Exemples de questions :</div>
                {["? ventes aujourd'hui", "? produit le plus vendu ce mois", "? combien de clients au total", "? stock critique"].map(ex => (
                  <button key={ex} className="ux-mi" style={{ width: "100%", textAlign: "left", fontSize: 12.5, padding: "7px 10px" }}
                    onClick={() => setQ(ex)}>
                    <span className="ic"><Icons.sparkles size={14} /></span>
                    <span>{ex.slice(2)}</span>
                  </button>
                ))}
              </div>
            )}
            {(aiLoading || aiAnswer) && (
              <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icons.sparkles size={12} /> Assistant IA
                </div>
                {aiLoading ? (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", color: "var(--muted-2)", fontSize: 13 }}>
                    <span style={{ animation: "ux-fade .5s infinite alternate" }}>●</span>
                    <span style={{ animation: "ux-fade .5s .2s infinite alternate" }}>●</span>
                    <span style={{ animation: "ux-fade .5s .4s infinite alternate" }}>●</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)" }}>{aiAnswer}</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <Sec title="Actions rapides">
              {actions.map((a) => <Row key={a.l} iconName={a.ic} label={a.l} onClick={() => { onClose(); a.run(); }} />)}
            </Sec>
            <Sec title="Pages">
              {pages.map((p) => <Row key={p.pg} iconName={p.ic} label={p.l} onClick={() => { onClose(); navigate(p.pg); }} />)}
            </Sec>
            <Sec title={sg.title}>
              {results.map((r, i) => <Row key={i} iconName={r.icon ?? "box"} label={r.label} sub={r.sub} onClick={() => { onClose(); r.onClick?.(); }} />)}
            </Sec>
            {!pages.length && !results.length && !actions.length && (
              <div style={{ padding: 26, textAlign: "center", color: "var(--muted-2)", fontSize: 13 }}>
                Aucun résultat pour « {q} » — tapez <strong>?</strong> pour demander à l&apos;IA
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
