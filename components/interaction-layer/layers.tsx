/* ============================================================
   Positioned layers — anchored dropdown menus & popovers.
   MenuLayer and PopLayer are rendered inside the UI catch div
   (fixed overlay that closes on outside click).
   ============================================================ */
import React, { type ReactNode } from "react";
import { Icons } from "./icons";
import type { MenuItem, Align } from "./types";

/* ---- Position helper -------------------------------------- */
export function anchoredStyle(
  rect: DOMRect,
  align: Align,
  width = 220
): React.CSSProperties {
  const margin = 6;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const style: React.CSSProperties = { position: "fixed" };

  if (align === "right") {
    style.right = Math.max(8, vw - rect.right);
  } else {
    style.left = Math.min(rect.left, vw - width - 8);
  }

  if (rect.bottom + 300 > vh && rect.top > 320) {
    style.bottom = vh - rect.top + margin;
  } else {
    style.top = rect.bottom + margin;
  }

  return style;
}

/* ---- Dropdown menu ---------------------------------------- */
interface MenuLayerProps {
  rect: DOMRect;
  align: Align;
  items: MenuItem[];
  onClose: () => void;
}
export function MenuLayer({ rect, align, items, onClose }: MenuLayerProps) {
  return (
    <div
      className="ux-menu"
      style={anchoredStyle(rect, align, 210)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((it, i) =>
        it.sep ? (
          <div key={i} className="ux-msep" />
        ) : (
          <button
            key={i}
            className={`ux-mi${it.danger ? " danger" : ""}`}
            onClick={() => { onClose(); it.onClick?.(); }}
          >
            {it.icon && (
              <span className="ic">
                {React.createElement(Icons[it.icon], { size: 15 })}
              </span>
            )}
            <span style={{ flex: 1 }}>{it.label}</span>
          </button>
        )
      )}
    </div>
  );
}

/* ---- Generic popover (used for notifications, filters) ---- */
interface PopLayerProps {
  rect: DOMRect;
  align: Align;
  width?: number;
  render: (close: () => void) => ReactNode;
  onClose: () => void;
}
export function PopLayer({ rect, align, width, render, onClose }: PopLayerProps) {
  return (
    <div
      className="ux-pop"
      style={{ ...anchoredStyle(rect, align, width ?? 360), width }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {render(onClose)}
    </div>
  );
}

/* ---- Toast strip ------------------------------------------ */
interface Toast { id: number; msg: string; }
export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="ux-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="ux-toast">
          <span className="dot"><Icons.check size={11} /></span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
