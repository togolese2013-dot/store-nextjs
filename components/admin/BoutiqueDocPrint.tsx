"use client";

import { X, Printer } from "lucide-react";

export interface PrintItem {
  nom: string;
  reference?: string;
  qty: number;
  prix: number;
  total: number;
}

export interface BoutiqueDocPrintProps {
  type: "facture" | "proforma";
  format: "A5" | "A4";
  reference: string;
  date: string;
  client_nom: string;
  client_tel?: string | null;
  items: PrintItem[];
  sous_total: number;
  remise?: number;
  total: number;
  // facture
  mode_paiement?: string | null;
  statut_paiement?: string | null;
  adresse_livraison?: string | null;
  // proforma
  valide_jusqu?: string | null;
  note?: string | null;
  onClose: () => void;
}

const MODES: Record<string, string> = {
  especes:           "Espèces",
  moov_money:        "Moov Money",
  tmoney:            "TMoney",
  virement_bancaire: "Virement bancaire",
  mix_by_yas:        "Mix by Yas",
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function triggerPrint(format: "A5" | "A4") {
  document.getElementById("boutique-print-style")?.remove();
  const s = document.createElement("style");
  s.id = "boutique-print-style";
  s.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #boutique-print-zone { visibility: visible !important; position: fixed !important; inset: 0 !important; background: white !important; z-index: 99999 !important; overflow: visible !important; }
      #boutique-print-zone * { visibility: visible !important; }
      .no-print { display: none !important; }
      @page { size: ${format} portrait; margin: 10mm; }
    }
  `;
  document.head.appendChild(s);
  window.print();
  setTimeout(() => s.remove(), 2000);
}

// Hexagon SVG logo placeholder
function HexLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <polygon
        points="30,2 56,16 56,44 30,58 4,44 4,16"
        fill="black"
      />
      <text x="30" y="37" textAnchor="middle" fontSize="20" fontWeight="900" fill="white" fontFamily="serif">T</text>
    </svg>
  );
}

export default function BoutiqueDocPrint({
  type, format, reference, date, client_nom, client_tel,
  items, sous_total, remise = 0, total,
  mode_paiement, statut_paiement, adresse_livraison,
  valide_jusqu, note, onClose,
}: BoutiqueDocPrintProps) {
  const isA4 = format === "A4";

  const fs = {
    invoiceTitle: isA4 ? 52 : 38,
    body:         isA4 ? 13 : 10,
    label:        isA4 ? 11 : 9,
    small:        isA4 ? 10 : 8,
    th:           isA4 ? 11 : 9,
    td:           isA4 ? 12 : 10,
    hPad:         isA4 ? 44 : 28,
    vPad:         isA4 ? 36 : 22,
    cellPad:      isA4 ? "10px 14px" : "7px 10px",
    gap:          isA4 ? 20 : 13,
    logoSize:     isA4 ? 56 : 42,
    totalW:       isA4 ? 260 : 185,
    docW:         isA4 ? "210mm" : "148mm",
    docMinH:      isA4 ? "297mm" : "210mm",
  };

  const taxAmount = 0; // no tax configured

  return (
    <>
      {/* Overlay — screen only */}
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" style={{ backdropFilter: "blur(6px)" }}>

        {/* Action bar */}
        <div className="no-print absolute top-5 right-5 flex items-center gap-2 z-10">
          <button
            onClick={() => triggerPrint(format)}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-bold shadow-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </button>
          <button
            onClick={onClose}
            className="p-2.5 bg-white hover:bg-slate-100 rounded-xl shadow-xl transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Document wrapper — scrollable on screen */}
        <div className="overflow-auto max-h-full" style={{ maxWidth: fs.docW }}>

          {/* ══════════════════════════════════════
              DOCUMENT — same markup printed & previewed
          ══════════════════════════════════════ */}
          <div
            id="boutique-print-zone"
            style={{
              width: fs.docW,
              minHeight: fs.docMinH,
              background: "white",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              boxShadow: "0 25px 60px rgba(0,0,0,.4)",
              display: "flex",
              flexDirection: "column",
              padding: `${fs.vPad}px ${fs.hPad}px`,
              boxSizing: "border-box",
              gap: fs.gap,
            }}
          >
            {/* ── Header: logo left + Invoice title right ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              {/* Logo + company */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <HexLogo size={fs.logoSize} />
                <div>
                  <div style={{ fontSize: isA4 ? 15 : 11, fontWeight: 700, color: "#000", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>
                    TOGOLESE SHOP
                  </div>
                  <div style={{ fontSize: fs.small, color: "#666", fontFamily: "sans-serif", marginTop: 2 }}>
                    Lomé, Togo
                  </div>
                  <div style={{ fontSize: fs.small, color: "#666", fontFamily: "sans-serif" }}>
                    store.togolese.fr
                  </div>
                </div>
              </div>

              {/* Invoice title */}
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: fs.invoiceTitle,
                  fontWeight: 900,
                  color: "#000",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                  fontFamily: "'Georgia', serif",
                }}>
                  {type === "facture" ? "Invoice" : "Proforma"}
                </div>
              </div>
            </div>

            {/* ── Thin rule ── */}
            <div style={{ height: 1, background: "#e0e0e0" }} />

            {/* ── Billed to + Invoice info ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              {/* Billed to */}
              <div>
                <div style={{ fontSize: fs.small, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 5, fontFamily: "sans-serif" }}>
                  Billed to:
                </div>
                <div style={{ fontSize: fs.body + 1, fontWeight: 700, color: "#000", fontFamily: "sans-serif" }}>
                  {client_nom}
                </div>
                {client_tel && (
                  <div style={{ fontSize: fs.label, color: "#444", marginTop: 2, fontFamily: "sans-serif" }}>
                    {client_tel}
                  </div>
                )}
                {adresse_livraison && (
                  <div style={{ fontSize: fs.label, color: "#444", marginTop: 2, fontFamily: "sans-serif" }}>
                    {adresse_livraison}
                  </div>
                )}
              </div>

              {/* Invoice No. + Date */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: fs.label, color: "#999", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "sans-serif" }}>
                  Invoice No.
                </div>
                <div style={{ fontSize: fs.body, fontWeight: 700, color: "#000", marginTop: 2, fontFamily: "sans-serif" }}>
                  {reference}
                </div>
                <div style={{ fontSize: fs.label, color: "#999", textTransform: "uppercase", letterSpacing: "1px", marginTop: 8, fontFamily: "sans-serif" }}>
                  Date
                </div>
                <div style={{ fontSize: fs.body, fontWeight: 700, color: "#000", marginTop: 2, fontFamily: "sans-serif" }}>
                  {fmtDate(date)}
                </div>
                {valide_jusqu && (
                  <>
                    <div style={{ fontSize: fs.label, color: "#999", textTransform: "uppercase", letterSpacing: "1px", marginTop: 8, fontFamily: "sans-serif" }}>
                      Valable jusqu'au
                    </div>
                    <div style={{ fontSize: fs.body, fontWeight: 700, color: "#000", marginTop: 2, fontFamily: "sans-serif" }}>
                      {fmtDate(valide_jusqu)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Items table ── */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  <th style={{ padding: fs.cellPad, textAlign: "left",   fontSize: fs.th, fontWeight: 700, color: "#000", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.8px" }}>Item</th>
                  <th style={{ padding: fs.cellPad, textAlign: "center", fontSize: fs.th, fontWeight: 700, color: "#000", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.8px", width: isA4 ? 60 : 44 }}>Qty</th>
                  <th style={{ padding: fs.cellPad, textAlign: "right",  fontSize: fs.th, fontWeight: 700, color: "#000", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.8px", width: isA4 ? 110 : 82 }}>Unit Price</th>
                  <th style={{ padding: fs.cellPad, textAlign: "right",  fontSize: fs.th, fontWeight: 700, color: "#000", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.8px", width: isA4 ? 110 : 82 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e8e8e8" }}>
                    <td style={{ padding: fs.cellPad }}>
                      <div style={{ fontSize: fs.td, fontWeight: 600, color: "#000", fontFamily: "sans-serif" }}>{item.nom}</div>
                      {item.reference && (
                        <div style={{ fontSize: fs.small, color: "#999", marginTop: 1, fontFamily: "sans-serif" }}>{item.reference}</div>
                      )}
                    </td>
                    <td style={{ padding: fs.cellPad, textAlign: "center", fontSize: fs.td, color: "#333", fontFamily: "sans-serif" }}>{item.qty}</td>
                    <td style={{ padding: fs.cellPad, textAlign: "right",  fontSize: fs.td, color: "#333", fontFamily: "sans-serif" }}>{fmt(item.prix)}</td>
                    <td style={{ padding: fs.cellPad, textAlign: "right",  fontSize: fs.td, fontWeight: 700, color: "#000", fontFamily: "sans-serif" }}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Subtotal / Tax / Total ── */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: fs.totalW }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: isA4 ? "5px 14px" : "4px 10px", fontSize: fs.label, color: "#555", fontFamily: "sans-serif" }}>
                  <span>Subtotal</span>
                  <span>{fmt(sous_total)} FCFA</span>
                </div>
                {remise > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: isA4 ? "5px 14px" : "4px 10px", fontSize: fs.label, color: "#888", fontFamily: "sans-serif" }}>
                    <span>Remise</span>
                    <span>− {fmt(remise)} FCFA</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", padding: isA4 ? "5px 14px" : "4px 10px", fontSize: fs.label, color: "#555", fontFamily: "sans-serif" }}>
                  <span>Tax</span>
                  <span>{fmt(taxAmount)} FCFA</span>
                </div>
                <div style={{ height: 1, background: "#000", margin: "4px 0" }} />
                {/* Solid black total bar */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: isA4 ? "11px 14px" : "8px 10px",
                  background: "#000",
                  marginTop: 2,
                }}>
                  <span style={{ fontSize: isA4 ? 13 : 10, fontWeight: 800, color: "white", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.8px" }}>Total</span>
                  <span style={{ fontSize: isA4 ? 15 : 11, fontWeight: 900, color: "white", fontFamily: "sans-serif" }}>{fmt(total)} FCFA</span>
                </div>
              </div>
            </div>

            {/* ── Thank you ── */}
            <div style={{ textAlign: "center", padding: isA4 ? "8px 0" : "5px 0" }}>
              <span style={{
                fontSize: isA4 ? 22 : 16,
                color: "#000",
                fontFamily: "'Georgia', cursive, serif",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "0.5px",
              }}>
                Thank You!
              </span>
            </div>

            {/* ── Thin rule ── */}
            <div style={{ height: 1, background: "#e0e0e0" }} />

            {/* ── Payment Information + Signature ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
              {/* Payment info block */}
              <div>
                <div style={{ fontSize: fs.small, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 8, fontFamily: "sans-serif" }}>
                  Payment Information
                </div>
                <div style={{ fontSize: fs.label, color: "#444", lineHeight: 1.9, fontFamily: "sans-serif" }}>
                  {mode_paiement && (
                    <div><span style={{ color: "#999" }}>Mode :</span> {MODES[mode_paiement] ?? mode_paiement}</div>
                  )}
                  {statut_paiement && (
                    <div>
                      <span style={{ color: "#999" }}>Statut :</span>{" "}
                      {statut_paiement === "paye_total" ? "Payé en totalité"
                        : statut_paiement === "acompte" ? "Acompte versé"
                        : "En attente"}
                    </div>
                  )}
                  <div><span style={{ color: "#999" }}>Tél :</span> +228 90 52 79 12</div>
                  <div><span style={{ color: "#999" }}>Site :</span> store.togolese.fr</div>
                </div>
              </div>

              {/* Signature block */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: fs.small, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: isA4 ? 28 : 18, fontFamily: "sans-serif" }}>
                  Signature
                </div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 6 }}>
                  <div style={{ fontSize: fs.label, fontWeight: 700, color: "#000", fontFamily: "sans-serif" }}>
                    Togolese Shop
                  </div>
                  <div style={{ fontSize: fs.small, color: "#666", fontFamily: "sans-serif", marginTop: 2 }}>
                    Lomé, Togo
                  </div>
                </div>
              </div>
            </div>

            {/* ── Note ── */}
            {note && (
              <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 10 }}>
                <div style={{ fontSize: fs.small, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4, fontFamily: "sans-serif" }}>Note</div>
                <div style={{ fontSize: fs.label, color: "#444", lineHeight: 1.5, fontFamily: "sans-serif" }}>{note}</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
