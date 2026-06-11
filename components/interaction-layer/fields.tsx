/* ============================================================
   Form field primitives — drop-in controls for SchemaForm.
   All styled via CSS classes from ui-core.css.
   ============================================================ */
import React, { useState, type ReactNode, type KeyboardEvent } from "react";
import { Icons, COLORS } from "./icons";
import type { Style } from "./types";

/* ---- Layout wrapper --------------------------------------- */
interface FieldProps { label?: string; hint?: string; full?: boolean; children: ReactNode; }
export function Field({ label, hint, full, children }: FieldProps) {
  const style: Style = full ? { gridColumn: "1 / -1" } : {};
  return (
    <div className="ux-field" style={style}>
      {label && <label className="ux-label">{label}</label>}
      {children}
      {hint && <span className="ux-hint">{hint}</span>}
    </div>
  );
}

/* ---- Segmented control (radio-style tabs) ----------------- */
interface SegmentedProps { value: string; onChange: (v: string) => void; options: string[]; }
export function Segmented({ value, onChange, options }: SegmentedProps) {
  return (
    <div className="ux-seg">
      {options.map((o) => (
        <button key={o} type="button" className={value === o ? "on" : ""} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---- Native <select> with a chevron overlay --------------- */
interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}
export function Select({ value, onChange, options, placeholder }: SelectProps) {
  return (
    <div style={{ position: "relative" }}>
      <select
        className="ux-in"
        style={{ appearance: "none", WebkitAppearance: "none", paddingRight: 30, cursor: "pointer" }}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>{placeholder ?? "Sélectionner…"}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
        <Icons.chevD size={14} />
      </span>
    </div>
  );
}

/* ---- Numeric input with currency suffix ------------------- */
interface PriceInputProps { value: string | number; onChange: (v: string) => void; suffix?: string; }
export function PriceInput({ value, onChange, suffix = "F" }: PriceInputProps) {
  return (
    <div style={{ position: "relative" }}>
      <input className="ux-in mono" type="number" value={value} onChange={(e) => onChange(e.target.value)} style={{ paddingRight: 28 }} />
      <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 12, fontFamily: "Geist Mono, monospace" }}>{suffix}</span>
    </div>
  );
}

/* ---- Tag / multi-value input (Enter or comma to add) ------ */
interface TagInputProps { value: string[]; onChange: (v: string[]) => void; placeholder?: string; }
export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [t, setT] = useState("");
  const add = () => {
    const v = t.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setT("");
  };
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
  };
  return (
    <div className="ux-in" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: 7, minHeight: 40 }}>
      {value.map((v) => (
        <span key={v} className="ux-tag-rm">
          {v}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== v))}><Icons.close size={12} /></button>
        </span>
      ))}
      <input
        value={t}
        onChange={(e) => setT(e.target.value)}
        onKeyDown={handleKey}
        placeholder={value.length ? "" : placeholder}
        style={{ border: 0, outline: 0, background: "transparent", flex: 1, minWidth: 80, fontSize: 13, padding: "2px 4px" }}
      />
    </div>
  );
}

/* ---- Color swatch picker ---------------------------------- */
interface ColorSelectProps { value: string; onChange: (v: string) => void; }
export function ColorSelect({ value, onChange }: ColorSelectProps) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {COLORS.map((c) => (
        <button key={c} type="button" className={`ux-color ${value === c ? "on" : ""}`} style={{ background: c }} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

/* ---- Notification channel toggles (Email/SMS/WhatsApp) ---- */
interface ChannelsProps { value: string[]; onChange: (v: string[]) => void; }
export function Channels({ value, onChange }: ChannelsProps) {
  const all = ["Email", "SMS", "WhatsApp"] as const;
  const map: Record<string, { bg: string; c: string }> = {
    Email:    { bg: "var(--accent-bg)", c: "var(--accent)" },
    SMS:      { bg: "var(--warn-bg)",   c: "var(--warn)" },
    WhatsApp: { bg: "var(--ok-bg)",     c: "var(--ok)" },
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {all.map((ch) => {
        const on = value.includes(ch);
        return (
          <button key={ch} type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== ch) : [...value, ch])}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)", fontSize: 12.5, fontWeight: 500, background: on ? map[ch].bg : "var(--surface)", color: on ? map[ch].c : "var(--muted)" }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, display: "grid", placeItems: "center", background: on ? map[ch].c : "transparent", border: on ? "0" : "1.4px solid var(--border-strong)", color: "#fff" }}>
              {on && <Icons.check size={10} />}
            </span>
            {ch}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Boolean toggle --------------------------------------- */
interface ToggleProps { value: boolean; onChange: (v: boolean) => void; }
export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <div onClick={() => onChange(!value)} style={{ cursor: "pointer", width: 38, height: 22, borderRadius: 99, background: value ? "var(--accent)" : "var(--border-strong)", position: "relative", transition: "background .2s" }}>
      <div style={{ position: "absolute", top: 3, left: value ? 18 : 3, width: 16, height: 16, borderRadius: 99, background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
    </div>
  );
}

/* ---- Drag-and-drop image upload placeholder --------------- */
export function ImageDrop({ label }: { label?: string }) {
  return (
    <div className="ux-drop">
      <Icons.upload size={20} />
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-2)" }}>Glissez une image ou cliquez</div>
      <div style={{ fontSize: 11 }}>{label ?? "PNG, JPG · 2 Mo max · 1:1 recommandé"}</div>
    </div>
  );
}

/* ---- Order-line list (product + qty rows) ----------------- */
export interface OrderLine { product: string; qty: number | string; }
interface LinesProps { value: OrderLine[]; onChange: (v: OrderLine[]) => void; productOptions: string[]; }
export function Lines({ value, onChange, productOptions }: LinesProps) {
  const set = (i: number, k: keyof OrderLine, v: string) =>
    onChange(value.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {value.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 64px 30px", gap: 8, alignItems: "center" }}>
          <Select value={r.product} onChange={(v) => set(i, "product", v)} options={productOptions} placeholder="Produit…" />
          <input className="ux-in mono" type="number" value={r.qty} onChange={(e) => set(i, "qty", e.target.value)} style={{ textAlign: "center" }} />
          <button type="button" className="ux-x" style={{ width: 30, height: 30, marginLeft: 0 }} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Icons.close size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { product: "", qty: 1 }])}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, color: "var(--accent)", padding: "6px 4px" }}>
        <Icons.plus size={13} /> Ajouter une ligne
      </button>
    </div>
  );
}
