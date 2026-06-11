/* ============================================================
   Public barrel — import everything from "@/components/interaction-layer"
   ============================================================ */

export { UIProvider, useUI, useConfig } from "./UIProvider";
export { RowMenu } from "./RowMenu";
export { Pager }   from "./Pager";
export { Drawer }  from "./shell";
export { Modal }   from "./shell";
export { Field, Segmented, Select, PriceInput, TagInput,
         ColorSelect, Channels, Toggle, ImageDrop, Lines } from "./fields";
export { Icons, Icon, COLORS, money, cap } from "./icons";

export type {
  AppConfig, UIApi, EntitySchema, FieldSpec, FieldType,
  DetailModel, DetailHeader, MenuItem, Align, ConfirmOptions,
  FormMode, AiSuggestion, NotifItem, HistoryEvent,
  PaletteNavItem, PaletteAction, SearchGroup, FilterGroup,
  IconName, IconComponent, IconProps,
} from "./types";
