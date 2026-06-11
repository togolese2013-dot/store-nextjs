/* ============================================================
   RowMenu — the "⋯" button + dropdown attached to any table row.
   Delete/Archive wire to config.onDeleteRow / onArchiveRow.
   ============================================================ */
import React from "react";
import { useUI } from "./UIProvider";
import { Icons } from "./icons";

interface RowMenuProps {
  kind: string;
  row: any;
  name?: string;
}

export function RowMenu({ kind, row, name }: RowMenuProps) {
  const ui = useUI();
  const config = ui.config;
  const labels = config.rowLabels ?? {
    product:    "le produit",
    supplier:   "le fournisseur",
    brand:      "la marque",
    category:   "la catégorie",
    warehouse:  "l'entrepôt",
    po:         "le bon d'achat",
    variant:    "le groupe",
    alert:      "l'alerte",
    adjustment: "l'ajustement",
  };

  const lbl = labels[kind] ?? "l'élément";
  const dn  = name ?? row?.name ?? row?.ref ?? "";

  const items = [
    { label: "Voir les détails", icon: "eye"     as const, onClick: () => ui.openDetail(kind, row) },
    { label: "Modifier",         icon: "edit"    as const, onClick: () => ui.openForm(kind, "edit", row) },
    { label: "Dupliquer",        icon: "copy"    as const, onClick: () => ui.toast("Élément dupliqué") },
    { sep: true as const },
    { label: "Archiver",         icon: "archive" as const, onClick: () => ui.confirmArchive(lbl, dn, { onConfirm: () => config.onArchiveRow?.(kind, row) }) },
    { label: "Supprimer",        icon: "trash"   as const, danger: true, onClick: () => ui.confirmDelete(lbl, dn, { onConfirm: () => config.onDeleteRow?.(kind, row) }) },
  ];

  return (
    <button className="rm" onClick={(e) => ui.menu(e, items, "right")}>
      <Icons.more size={16} />
    </button>
  );
}
