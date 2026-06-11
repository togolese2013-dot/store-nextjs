/* ============================================================
   Interaction layer — shared type contracts
   ============================================================ */
import React, { type ReactNode, type CSSProperties } from "react";

/* ---- Icons ------------------------------------------------ */
export type IconName =
  | "close" | "check" | "chevD" | "eye" | "edit" | "copy" | "archive"
  | "trash" | "download" | "upload" | "file" | "sparkles" | "search"
  | "arrowR" | "cog" | "user" | "logout" | "store" | "swap" | "alert"
  | "bell" | "plus" | "box" | "adj" | "folder" | "pin" | "more";

export interface IconProps { size?: number; }
export type IconComponent = (props: IconProps) => React.ReactElement;

/* ---- Form schema ------------------------------------------ */
export type FieldType =
  | "text" | "number" | "textarea" | "price" | "seg" | "select"
  | "tags" | "values" | "color" | "channels" | "toggle" | "image" | "lines";

export interface FieldSpec {
  k: string;
  l: string;
  t: FieldType;
  ph?: string;
  options?: string[];
  full?: boolean;
  mono?: boolean;
  hint?: string;
}

export interface EntitySchema {
  label: string;
  title: string;
  eyebrow: string;
  fields: FieldSpec[];
}

export type SchemaMap = Record<string, EntitySchema>;

/* ---- Detail drawer ---------------------------------------- */
export interface DetailHeader {
  color: string;
  initial: string;
  name: string;
  sub?: string;
  status?: string | null;
}
export interface DetailModel {
  header: DetailHeader;
  stats: Array<[string, string | number]>;
  rows: Array<[string, string | number]>;
}

/* ---- Config-supplied content ------------------------------ */
export interface AiSuggestion {
  ic: IconName;
  tone: "danger" | "accent" | "ok";
  t: string;
  d: string;
  cta: string;
}
export interface NotifItem { dot: string; t: string; d: string; time: string; }
export interface HistoryEvent { label: string; time: string; author?: string; dot?: string; }
export interface PaletteNavItem { l: string; pg: string; ic: IconName; }
export interface PaletteAction { l: string; ic: IconName; run: () => void; }
export interface SearchResult { label: string; sub?: string; icon?: IconName; onClick?: () => void; }
export interface SearchGroup { title: string; items: SearchResult[]; }
export interface FilterGroup { t: string; opts: string[]; }

/* ---- The per-app config ----------------------------------- */
export interface AppConfig {
  name: string;
  data?: () => Record<string, any>;
  schemas?: () => SchemaMap;
  detailLabels?: Record<string, string>;
  rowLabels?: Record<string, string>;
  buildDetail?: (kind: string, row: any) => DetailModel | null;
  paletteNav?: PaletteNavItem[];
  paletteActions?: (ui: UIApi) => PaletteAction[];
  searchGroup?: (ui: UIApi) => SearchGroup;
  notifs?: NotifItem[];
  ai?: AiSuggestion[];
  history?: HistoryEvent[];
  filters?: FilterGroup[];
  /** Called when a form is submitted (create or edit). Return a promise to show loading. */
  onSubmit?: (kind: string, mode: FormMode, values: Record<string, any>) => Promise<void> | void;
  /** Called when a row is confirmed-deleted via the detail drawer or RowMenu. */
  onDeleteRow?: (kind: string, row: any) => Promise<void> | void;
  /** Called when a row is confirmed-archived. */
  onArchiveRow?: (kind: string, row: any) => Promise<void> | void;
}

/* ---- Menu / popover --------------------------------------- */
export interface MenuItem {
  label?: string;
  icon?: IconName;
  onClick?: () => void;
  danger?: boolean;
  sep?: boolean;
}
export type Align = "left" | "right";

export interface ConfirmOptions {
  tone?: "danger";
  icon?: ReactNode;
  title: string;
  sub?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
}

/* ---- The imperative API exposed via useUI() --------------- */
export type FormMode = "create" | "edit";

export interface UIApi {
  openForm: (kind: string, mode?: FormMode, data?: any) => void;
  openDetail: (kind: string, row: any) => void;
  openAI: () => void;
  openHistory: (title?: string, events?: HistoryEvent[]) => void;
  openExport: (scope: string) => void;
  openImport: (scope: string) => void;
  openPalette: () => void;
  menu: (e: React.MouseEvent, items: MenuItem[], align?: Align) => void;
  popover: (
    e: React.MouseEvent,
    render: (close: () => void) => ReactNode,
    opts?: { align?: Align; width?: number }
  ) => void;
  notifications: (e: React.MouseEvent) => void;
  filters: (e: React.MouseEvent) => void;
  confirm: (opts: ConfirmOptions) => void;
  confirmDelete: (label: string, name: string, opts?: { onConfirm?: () => void }) => void;
  confirmArchive: (label: string, name: string, opts?: { onConfirm?: () => void }) => void;
  toast: (msg: string) => void;
  navigate: (pg: string) => void;
  config: AppConfig;
}

export type Style = CSSProperties;
