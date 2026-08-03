/* ============================================================
   SchemaForm — renders any entity form from a schema definition.
   Calls config.onSubmit(kind, mode, values) on save.
   ============================================================ */
import React, { useState, useCallback } from "react";
import { Drawer } from "./shell";
import {
  Field, Segmented, Select, PriceInput, TagInput,
  ColorSelect, Channels, Toggle, ImageDrop, ImageDropMulti, Lines,
  type OrderLine,
} from "./fields";
import { cap } from "./icons";
import { useConfig } from "./UIProvider";
import type { EntitySchema, FormMode } from "./types";

const ACCENT_COLORS = ["#1F3D6E", "#2D6A4F", "#C8962A", "#B8501A", "#5C4A88", "#3B6A8F", "#7A2C3A", "#3A2F25"];

/* ── Variant Options Inline ────────────────────────────────── */
interface VOption  { nom: string; valeurs: string[]; allValeurs: string[] }
interface VCombo   { key: string; combo: Record<string,string>; prix: string; stock: string }
interface VValue   { selectedOptions: VOption[]; combinations: VCombo[] }

function buildCombos(opts: VOption[], prev: VCombo[]): VCombo[] {
  if (!opts.length) return [];
  const prevMap = new Map(prev.map(c => [c.key, c]));
  const combos = opts.reduce<Record<string,string>[]>((acc, opt) => {
    if (!acc.length) return opt.valeurs.map(v => ({ [opt.nom]: v }));
    return acc.flatMap(e => opt.valeurs.map(v => ({ ...e, [opt.nom]: v })));
  }, []);
  return combos.map(combo => {
    const key = Object.entries(combo).sort().map(([k,v])=>`${k}:${v}`).join('|');
    const p = prevMap.get(key);
    return { key, combo, prix: p?.prix ?? '', stock: p?.stock ?? '' };
  });
}

function VariantOptionsInline({ value, onChange, variantGroups }: {
  value: VValue;
  onChange: (v: VValue) => void;
  variantGroups: { id: number; nom: string; valeurs: string[] }[];
}) {
  const { selectedOptions = [], combinations = [] } = value ?? {};

  const update = useCallback((opts: VOption[], combos?: VCombo[]) => {
    onChange({ selectedOptions: opts, combinations: combos ?? buildCombos(opts, combinations) });
  }, [combinations, onChange]);

  function addGroup(g: { nom: string; valeurs: string[] }) {
    if (selectedOptions.find(o => o.nom === g.nom)) return;
    const next = [...selectedOptions, { nom: g.nom, valeurs: [...g.valeurs], allValeurs: [...g.valeurs] }];
    update(next);
  }

  function removeOption(nom: string) {
    const next = selectedOptions.filter(o => o.nom !== nom);
    update(next);
  }

  function toggleVal(optNom: string, val: string) {
    const next = selectedOptions.map(o => {
      if (o.nom !== optNom) return o;
      const has = o.valeurs.includes(val);
      return { ...o, valeurs: has ? o.valeurs.filter(v => v !== val) : [...o.valeurs, val] };
    });
    update(next);
  }

  function updateCombo(key: string, field: 'prix'|'stock', val: string) {
    const nextCombos = combinations.map(c => c.key === key ? { ...c, [field]: val } : c);
    onChange({ selectedOptions, combinations: nextCombos });
  }

  const available = variantGroups.filter(g => !selectedOptions.find(o => o.nom === g.nom));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {selectedOptions.map(opt => (
        <div key={opt.nom} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-2,#f9f9f7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--fg)' }}>{opt.nom}</span>
            <button type="button" onClick={() => removeOption(opt.nom)}
              style={{ fontSize: 13, lineHeight: 1, color: 'var(--muted-2,#aaa)', cursor: 'pointer', background: 'none', border: 'none', padding: '0 4px' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {opt.allValeurs.map(v => {
              const on = opt.valeurs.includes(v);
              return (
                <button key={v} type="button" onClick={() => toggleVal(opt.nom, v)} style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${on ? 'var(--accent,#C9601E)' : 'var(--border,#e5e5e5)'}`,
                  background: on ? 'var(--accent,#C9601E)' : 'var(--surface,#fff)',
                  color: on ? '#fff' : 'var(--muted,#888)',
                  transition: 'all .12s',
                }}>{v}</button>
              );
            })}
          </div>
        </div>
      ))}

      {available.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {available.map(g => (
            <button key={g.id} type="button" onClick={() => addGroup(g)} style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: '1px dashed var(--border,#e5e5e5)', background: 'none', color: 'var(--muted,#888)',
            }}>+ {g.nom}</button>
          ))}
        </div>
      )}

      {combinations.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted-2,#aaa)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Combinaisons ({combinations.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {combinations.map(row => (
              <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 8, background: 'var(--bg-2,#f9f9f7)', border: '1px solid var(--border,#e5e5e5)' }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>
                  {Object.values(row.combo).join(' / ')}
                </span>
                <input type="number" value={row.prix} onChange={e => updateCombo(row.key,'prix',e.target.value)}
                  placeholder="Prix" style={{ width: 80, padding: '3px 7px', borderRadius: 6, border: '1px solid var(--border,#e5e5e5)', fontSize: 11.5, outline: 'none', background: 'var(--surface,#fff)' }} />
                <input type="number" value={row.stock} onChange={e => updateCombo(row.key,'stock',e.target.value)}
                  placeholder="Qté" style={{ width: 52, padding: '3px 7px', borderRadius: 6, border: '1px solid var(--border,#e5e5e5)', fontSize: 11.5, outline: 'none', background: 'var(--surface,#fff)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOptions.length === 0 && variantGroups.length === 0 && (
        <p style={{ fontSize: 11.5, color: 'var(--muted-2,#aaa)', fontStyle: 'italic' }}>
          Créez des groupes dans Magasin → Variantes pour les utiliser ici.
        </p>
      )}
    </div>
  );
}

function defaultsFor(schema: EntitySchema): Record<string, any> {
  const o: Record<string, any> = {};
  schema.fields.forEach((f) => {
    if (f.t === "tags" || f.t === "values" || f.t === "channels" || f.t === "images") o[f.k] = [];
    else if (f.t === "lines") o[f.k] = [{ product: "", qty: 1 }];
    else if (f.t === "toggle") o[f.k] = true;
    else if (f.t === "seg") o[f.k] = f.options?.[0] ?? "";
    else if (f.t === "color") o[f.k] = ACCENT_COLORS[0];
    else if (f.t === "variant-options") o[f.k] = { selectedOptions: [], combinations: [] };
    else o[f.k] = "";
  });
  return o;
}

function mapIncoming(kind: string, data: any): Record<string, any> {
  if (!data) return {};
  if (kind === "product")   return { name: data.name, sku: data.sku, status: data.status, cat: data.cat === '—' ? '' : (data.cat ?? ''), brand: data.brand === '—' ? '' : (data.brand ?? ''), price: data.price, cost: data.cost, stock: data.stock, target: data.target, image: data.imageUrl ?? '', images: data.images ?? [], variants: [] };
  if (kind === "supplier")  return { name: data.name, country: data.country === '—' ? '' : (data.country ?? ''), status: data.status ?? 'Actif', delay: data.delay ?? 0, notes: "" };
  if (kind === "brand")     return { name: data.name, country: data.country, status: data.status, logo: data.logo };
  if (kind === "category")  return { name: data.name, subcats: data.subcats, color: data.color };
  if (kind === "variant")   return { name: data.name, type: data.type, values: data.values };
  if (kind === "warehouse") return { name: data.name, location: data.location, capacity: data.capacity, color: data.color };
  if (kind === "alert")     return { name: data.name, targetType: data.targetType ?? 'Produit', target: data.target ?? '', threshold: data.threshold ?? 5, channels: data.channels ?? [], active: data.active ?? false };
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
      case "image":  return <ImageDrop value={val} onChange={(v) => set(f.k, v)} />;
      case "images": return <ImageDropMulti value={val ?? []} onChange={(v) => set(f.k, v)} />;
      case "lines":  return <Lines value={val ?? []} onChange={(v: OrderLine[]) => set(f.k, v)} productOptions={productOptions} />;
      case "variant-options": {
        const vGroups = (db.VARIANT_GROUPS ?? []) as { id: number; nom: string; valeurs: string[] }[];
        return <VariantOptionsInline value={val as VValue} onChange={v => set(f.k, v)} variantGroups={vGroups} />;
      }
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
