/* ============================================================
   DetailDrawer — read-only "fiche" for any entity kind.
   Delete/Archive buttons wire to config.onDeleteRow / onArchiveRow.
   ============================================================ */
import React from "react";
import { Drawer } from "./shell";
import { Icons, money, cap } from "./icons";
import { useConfig } from "./UIProvider";
import type { UIApi, DetailModel } from "./types";

function defaultBuildDetail(kind: string, row: any): DetailModel {
  const color   = (row.swatch || row.color) ?? "#3B6A8F";
  const initial = row.initial ?? row.init ?? (row.name || row.ref || "?").slice(0, 2);
  const header  = { color, initial, name: row.name ?? row.ref, sub: row.sku ?? row.country ?? row.location ?? "", status: row.status as string | null };
  let stats: [string, string | number][] = [];
  let rows:  [string, string | number][] = [];

  switch (kind) {
    case "product":
      stats = [["Stock", `${row.stock}/${row.target}`], ["Prix HT", `${money(row.price)} F`], ["Marge", `${row.margin ?? 0}%`]];
      rows  = [["Catégorie", row.cat], ["Marque", row.brand], ["Valeur en stock", `${money((row.price ?? 0) * (row.stock ?? 0))} F`], ["Référence", row.sku]];
      break;
    case "supplier":
      stats = [["Produits", row.products ?? 0], ["Total achats", `${money(row.total ?? 0)} F`], ["Délai", `${row.delay ?? "—"} j`]];
      rows  = [["Pays", row.country ?? "—"], ["Statut", row.status ?? "—"]];
      break;
    case "brand":
      stats = [["Produits", row.products ?? 0], ["CA stock", `${money(row.revenue ?? 0)} F`], ["Marge", `${row.margin ?? 0}%`]];
      rows  = [["Pays", row.country ?? "—"], ["Statut", row.status ?? "—"]];
      break;
    case "category":
      stats = [["Produits", row.products ?? 0], ["Valeur", `${((row.revenue ?? 0) / 1000).toFixed(0)}k F`], ["Sous-cat.", row.subcats ?? 0]];
      rows  = [["Statut", "Actif"]];
      break;
    case "warehouse":
      stats = [["Références", row.products ?? 0], ["Occupé", money(row.occupied ?? 0)], ["Capacité", money(row.capacity ?? 0)]];
      rows  = [["Localisation", row.location ?? "—"], ["Disponible", `${money((row.capacity ?? 0) - (row.occupied ?? 0))} unités`]];
      break;
    case "po":
      header.name = row.ref; header.sub = row.supplier;
      stats = [["Produits", row.products ?? 0], ["Montant", `${money(row.amount ?? 0)} F`], ["Statut", row.status ?? "—"]];
      rows  = [["Fournisseur", row.supplier ?? "—"], ["Date", row.date ?? "—"]];
      break;
    case "variant":
      stats = [["Type", row.type ?? "—"], ["Valeurs", row.values?.length ?? 0], ["Produits", row.products ?? 0]];
      rows  = [["Valeurs", (row.values ?? []).join(" · ")]];
      break;
    case "alert":
      stats = [["Seuil", row.threshold ?? 0], ["Cible", row.targetType ?? "—"], ["Statut", row.active ? "Active" : "En pause"]];
      rows  = [["Cible", row.target ?? "—"], ["Canaux", (row.channels ?? []).join(" · ")], ["Déclenchée", row.triggered ? "Oui" : "Non"]];
      break;
    default:
      rows = Object.entries(row)
        .filter(([k]) => !["swatch", "color", "initial", "init"].includes(k))
        .slice(0, 6)
        .map(([k, v]) => [cap(k), String(v)]);
  }
  return { header, stats, rows };
}

interface DetailDrawerProps { kind: string; row: any; onClose: () => void; ui: UIApi; }

export function DetailDrawer({ kind, row, onClose, ui }: DetailDrawerProps) {
  const config = useConfig();
  const detail = config.buildDetail?.(kind, row) ?? defaultBuildDetail(kind, row);
  const { header, stats, rows } = detail;

  const labels = config.detailLabels ?? {
    product: "produit", supplier: "fournisseur", brand: "marque",
    category: "catégorie", warehouse: "entrepôt", po: "bon d'achat",
    variant: "groupe", alert: "alerte",
  };

  const statusCls =
    header.status === "Actif" ? "actif" :
    header.status === "Rupture" ? "rupture" : "brouillon";

  return (
    <Drawer
      eyebrow={`${config.name ?? "App"} · Détail`}
      title="Fiche"
      serif={labels[kind] ?? kind}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => { onClose(); ui.openForm(kind, "edit", row); }}>
            <Icons.edit size={14} /> Modifier
          </button>
          {kind === "product" && (
            <button className="btn" onClick={() => { onClose(); ui.openForm("adjustment", "create", { product: row.name }); }}>
              <Icons.adj size={14} /> Ajuster
            </button>
          )}
          <button className="btn pri" onClick={onClose}>Fermer</button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="thumb" style={{ background: header.color, width: 52, height: 52, borderRadius: 12, fontSize: 18 }}>
          {header.initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.01em" }}>{header.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted-2)", fontFamily: "Geist Mono, monospace", marginTop: 3 }}>{header.sub}</div>
        </div>
        {header.status && (
          <span className={`st ${statusCls}`}><span className="d" />{header.status}</span>
        )}
      </div>

      {stats.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 10 }}>
          {stats.map(([l, val]) => (
            <div key={l} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "Geist Mono, monospace", letterSpacing: "-.02em" }}>{val}</div>
              <div style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-2)", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "4px 16px" }}>
        {rows.map(([k, val]) => (
          <div key={k} className="ux-kv">
            <span className="k">{k}</span>
            <span className="v">{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="chip" onClick={() => { onClose(); ui.toast("Élément dupliqué"); }}>
          <Icons.copy size={12} /> Dupliquer
        </button>
        <button className="chip" onClick={() => {
          onClose();
          ui.confirmArchive(labels[kind] ?? kind, header.name, {
            onConfirm: () => config.onArchiveRow?.(kind, row),
          });
        }}>
          <Icons.archive size={12} /> Archiver
        </button>
        <button className="chip" style={{ color: "var(--danger)", borderColor: "var(--danger-bg)" }}
          onClick={() => {
            onClose();
            ui.confirmDelete(labels[kind] ?? kind, header.name, {
              onConfirm: () => config.onDeleteRow?.(kind, row),
            });
          }}>
          <Icons.trash size={12} /> Supprimer
        </button>
      </div>
    </Drawer>
  );
}
