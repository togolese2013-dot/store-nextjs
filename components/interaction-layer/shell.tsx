/* ============================================================
   Shell primitives — Drawer + Modal
   ============================================================ */
import React, { type ReactNode } from "react";
import { Icons } from "./icons";

/* ---- Drawer (right-side panel) ---------------------------- */
export interface DrawerProps {
  eyebrow?: string;
  title: string;
  /** rendered in italic/serif after the title */
  serif?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}
export function Drawer({ eyebrow, title, serif, onClose, footer, children, wide }: DrawerProps) {
  return (
    <div
      className="ux-drawer"
      style={wide ? { width: 560 } : undefined}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="ux-dh">
        <div>
          {eyebrow && <div className="eyb" style={{ marginBottom: 6 }}>{eyebrow}</div>}
          <div className="ux-dh-t">
            {title}
            {serif && <span className="serif"> {serif}</span>}
          </div>
        </div>
        <button className="ux-x" onClick={onClose}><Icons.close /></button>
      </div>
      <div className="ux-db">{children}</div>
      {footer && <div className="ux-df">{footer}</div>}
    </div>
  );
}

/* ---- Modal (centred dialog) ------------------------------- */
export interface ModalProps {
  title: string;
  sub?: string;
  onClose: () => void;
  footer?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  tone?: "danger" | "default";
}
export function Modal({ title, sub, onClose, footer, children, icon, tone }: ModalProps) {
  const isDanger = tone === "danger";
  return (
    <div className="ux-modal" onMouseDown={(e) => e.stopPropagation()}>
      <div style={{ padding: "20px 22px 0", display: "flex", gap: 13, alignItems: "flex-start" }}>
        {icon && (
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            display: "grid", placeItems: "center",
            background: isDanger ? "var(--danger-bg)" : "var(--accent-bg)",
            color:      isDanger ? "var(--danger)"    : "var(--accent)",
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.015em" }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
        </div>
        <button className="ux-x" style={{ marginLeft: 0 }} onClick={onClose}><Icons.close /></button>
      </div>
      {children && <div style={{ padding: "16px 22px 0" }}>{children}</div>}
      {footer && <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "18px 22px 20px" }}>{footer}</div>}
    </div>
  );
}
