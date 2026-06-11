/* ============================================================
   SchemaForm — renders any entity form from a schema definition.
   Calls config.onSubmit(kind, mode, values) on save.
   ============================================================ */
import React, { useState } from "react";
import { Drawer } from "./shell";
import {
  Field, Segmented, Select, PriceInput, TagInput,
  ColorSelect, Channels, Toggle, ImageDrop, Lines,
  type OrderLine,
} from "./fields";
import { cap } from "./icons";
import { useConfig } from "./UIProvider";
import type { EntitySchema, FormMode } from "./types";

const ACCENT_COLORS = ["#1F3D6E", "#2D6A4F", "#C8962A", "#B8501A", "#5C4A88", "#3B6A8F", "#7A2C3A", "#3A2F25"];

function defaultsFor(schema: EntitySchema): Record<string, any> {
  const o: Record<string, any> = {};
  schema.fields.forEach((f) => {
    if (f.t === "tags" || f.t === "values" || f.t === "channels") o[f.k] = [];
    else if (f.t === "lines") o[f.k] = [{ product: "", qty: 1 }];
    else if (f.t === "toggle") o[f.k] = true;
    else if (f.t === "seg") o[f.k] = f.options?.[0] ?? "";
    else if (f.t === "color") o[f.k] = ACCENT_COLORS[0];
    else o[f.k] = "";
  });
  return o;
}

function mapIncoming(kind: string, data: any): Record<string, any> {
  if (!data) return {};
  if (kind === "product")   return { name: data.name, sku: data.sku, status: data.status, cat: data.cat, brand: data.brand, price: data.price, stock: data.stock, target: data.target, variants: [] };
  if (kind === "supplier")  return { name: data.name, country: data.country, status: data.status, delay: data.delay, notes: "" };
  if (kind === "brand")     return { name: data.name, country: data.country, status: data.status };
  if (kind === "category")  return { name: data.name, subcats: data.subcats, color: data.color };
  if (kind === "variant")   return { name: data.name, type: data.type, values: data.values };
  if (kind === "warehouse") return { name: data.name, location: data.location, capacity: data.capacity, color: data.color };
  if (kind === "alert")     return { name: data.name, targetType: data.targetType, target: data.target, threshold: data.threshold, channels: data.channels, active: data.active };
  return { ...data };
}

interface SchemaFormProps {
  kind: string;
  mode: FormMode;
  data?: any;
  onClose: () => void;
  toast: (msg: string) => void;
}

export function SchemaForm({ kind, mode, data, onClose, toast }: SchemaFormProps) {
  const config = useConfig();
  const schemas = config.schemas?.() ?? {};
  const sc = schemas[kind];

  if (!sc) {
    console.error(`[SchemaForm] No schema found for kind "${kind}". Register it in AppConfig.schemas().`);
    return null;
  }

  const [values, setValues] = useState<Record<string, any>>(() => ({
    ...defaultsFor(sc),
    ...mapIncoming(kind, data),
  }));
  const [saving, setSaving] = useState(false);

  const set = (k: string, val: any) => setValues((prev) => ({ ...prev, [k]: val }));
  const db = config.data?.() ?? {};
  const productOptions: string[] = (db.PRODUCTS ?? []).map((p: any) => p.name as string);

  const renderField = (f: (typeof sc.fields)[number]) => {
    const val = values[f.k];
    switch (f.t) {
      case "seg":      return <Segmented value={val} onChange={(v) => set(f.k, v)} options={f.options ?? []} />;
      case "select":   return <Select value={val} onChange={(v) => set(f.k, v)} options={f.options ?? []} placeholder="Sélectionner…" />;
      case "price":    return <PriceInput value={val} onChange={(v) => set(f.k, v)} />;
      case "number":   return <input className="ux-in mono" type="number" value={val} onChange={(e) => set(f.k, e.target.value)} />;
      case "textarea": return <textarea className="ux-in" value={val} onChange={(e) => set(f.k, e.target.value)} placeholder={f.ph} />;
      case "tags":
      case "values":   return <TagInput value={val ?? []} onChange={(v) => set(f.k, v)} placeholder={f.ph} />;
      case "color":    return <ColorSelect value={val} onChange={(v) => set(f.k, v)} />;
      case "channels": return <Channels value={val ?? []} onChange={(v) => set(f.k, v)} />;
      case "toggle":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Toggle value={!!val} onChange={(v) => set(f.k, v)} />
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {val ? "La règle sera active dès sa création" : "La règle restera en pause"}
            </span>
          </div>
        );
      case "image":  return <ImageDrop />;
      case "lines":  return <Lines value={val ?? []} onChange={(v: OrderLine[]) => set(f.k, v)} productOptions={productOptions} />;
      default:
        return <input className={`ux-in${f.mono ? " mono" : ""}`} value={val} onChange={(e) => set(f.k, e.target.value)} placeholder={f.ph} />;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await config.onSubmit?.(kind, mode, { ...values, _raw: data });
    } finally {
      setSaving(false);
    }
    onClose();
    const suffix = /(vente|marque|cat|alerte|variante)/.test(sc.label) ? "e" : "";
    toast(mode === "edit" ? "Modifications enregistrées" : `${cap(sc.label)} créé${suffix}`);
  };

  return (
    <Drawer
      eyebrow={`${config.name ?? "App"} · ${sc.eyebrow}`}
      title={mode === "edit" ? "Modifier " : "Nouveau "}
      serif={mode === "edit" ? `le ${sc.title}` : sc.title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>Annuler</button>
          <button className="btn pri" onClick={handleSave} disabled={saving}>
            {saving ? "…" : mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </>
      }
    >
      <div className="ux-grid2">
        {sc.fields.map((f) => (
          <Field key={f.k} label={f.l} hint={f.hint} full={f.full}>
            {renderField(f)}
          </Field>
        ))}
      </div>
    </Drawer>
  );
}
