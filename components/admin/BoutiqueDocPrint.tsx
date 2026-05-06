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
    day: "2-digit", month: "2-digit", year: "numeric",
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
      @page { size: ${format} portrait; margin: 8mm; }
    }
  `;
  document.head.appendChild(s);
  window.print();
  setTimeout(() => s.remove(), 2000);
}

export default function BoutiqueDocPrint({
  type, format, reference, date, client_nom, client_tel,
  items, sous_total, remise = 0, total,
  mode_paiement, statut_paiement, adresse_livraison,
  valide_jusqu, note, onClose,
}: BoutiqueDocPrintProps) {
  const isA4 = format === "A4";

  const s = {
    docW:       isA4 ? "210mm" : "148mm",
    docMinH:    isA4 ? "297mm" : "210mm",
    hPad:       isA4 ? 40 : 24,
    vPad:       isA4 ? 32 : 20,
    title:      isA4 ? 24 : 17,
    shopName:   isA4 ? 18 : 13,
    label:      isA4 ? 11 : 9,
    body:       isA4 ? 13 : 10,
    small:      isA4 ? 10 : 8,
    th:         isA4 ? 11 : 9,
    td:         isA4 ? 12 : 10,
    cellPad:    isA4 ? "8px 12px" : "5px 8px",
    gap:        isA4 ? 16 : 10,
    radius:     isA4 ? 10 : 7,
    logoBox:    isA4 ? 48 : 36,
    totalW:     isA4 ? 240 : 170,
    refFontSize: isA4 ? 12 : 9,
  };

  return (
    <>
      {/* Overlay — screen only */}
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" style={{ backdropFilter: "blur(6px)" }}>

        {/* Action bar */}
        <div className="no-print absolute top-5 right-5 flex items-center gap-2 z-10">
          <button
            onClick={() => triggerPrint(format)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-xl transition-colors"
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
        <div className="overflow-auto max-h-full" style={{ maxWidth: s.docW }}>

          {/* ══════════════════════════════════════
              DOCUMENT — same markup printed & previewed
          ══════════════════════════════════════ */}
          <div
            id="boutique-print-zone"
            style={{
              width: s.docW,
              minHeight: s.docMinH,
              background: "white",
              fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
              boxShadow: "0 25px 60px rgba(0,0,0,.35)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* ── Header amber ── */}
            <div style={{
              background: "linear-gradient(135deg, #b45309 0%, #f59e0b 60%, #fbbf24 100%)",
              padding: `${isA4 ? 18 : 13}px ${s.hPad}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: s.logoBox, height: s.logoBox,
                  background: "rgba(255,255,255,.18)",
                  borderRadius: s.radius,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid rgba(255,255,255,.3)",
                }}>
                  <span style={{ fontSize: isA4 ? 22 : 16, fontWeight: 900, color: "white", letterSpacing: -1 }}>T</span>
                </div>
                <div>
                  <div style={{ fontSize: s.shopName, fontWeight: 800, color: "white", letterSpacing: "-0.4px" }}>TOGOLESE SHOP</div>
                  <div style={{ fontSize: s.small, color: "rgba(255,255,255,.8)", marginTop: 2 }}>Lomé, Togo</div>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: s.small, color: "rgba(255,255,255,.85)", lineHeight: 1.7 }}>
                <div>+228 90 52 79 12</div>
                <div>store.togolese.fr</div>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: `${s.vPad}px ${s.hPad}px`, flex: 1, display: "flex", flexDirection: "column", gap: s.gap }}>

              {/* Title row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    fontSize: s.title, fontWeight: 900, color: "#0f172a",
                    letterSpacing: "-0.6px", lineHeight: 1,
                  }}>
                    {type === "facture" ? "FACTURE" : "PROFORMA"}
                  </div>
                  <div style={{ fontSize: s.refFontSize, color: "#64748b", marginTop: 4, fontFamily: "monospace" }}>
                    Réf. {reference}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: s.label, color: "#64748b", lineHeight: 1.8 }}>
                  <div>Date : <strong style={{ color: "#0f172a" }}>{fmtDate(date)}</strong></div>
                  {valide_jusqu && (
                    <div>Valable jusqu'au : <strong style={{ color: "#0f172a" }}>{fmtDate(valide_jusqu)}</strong></div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#e2e8f0" }} />

              {/* Client block */}
              <div style={{ background: "#f8fafc", borderRadius: s.radius, padding: isA4 ? "12px 16px" : "8px 12px" }}>
                <div style={{ fontSize: s.small, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.9px", marginBottom: 5 }}>
                  Facturer à
                </div>
                <div style={{ fontSize: s.body + 1, fontWeight: 700, color: "#0f172a" }}>{client_nom}</div>
                {client_tel && <div style={{ fontSize: s.label, color: "#64748b", marginTop: 3 }}>{client_tel}</div>}
                {adresse_livraison && (
                  <div style={{ fontSize: s.label, color: "#64748b", marginTop: 3 }}>📍 {adresse_livraison}</div>
                )}
              </div>

              {/* Items table */}
              <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: s.radius, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    <th style={{ padding: s.cellPad, textAlign: "left",   fontSize: s.th, fontWeight: 600, color: "white" }}>Désignation</th>
                    <th style={{ padding: s.cellPad, textAlign: "center", fontSize: s.th, fontWeight: 600, color: "white", width: isA4 ? 48 : 34 }}>Qté</th>
                    <th style={{ padding: s.cellPad, textAlign: "right",  fontSize: s.th, fontWeight: 600, color: "white", width: isA4 ? 96 : 72 }}>Prix unit.</th>
                    <th style={{ padding: s.cellPad, textAlign: "right",  fontSize: s.th, fontWeight: 600, color: "white", width: isA4 ? 96 : 72 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: s.cellPad }}>
                        <div style={{ fontSize: s.td, fontWeight: 600, color: "#0f172a" }}>{item.nom}</div>
                        {item.reference && (
                          <div style={{ fontSize: s.small, color: "#94a3b8", marginTop: 1 }}>{item.reference}</div>
                        )}
                      </td>
                      <td style={{ padding: s.cellPad, textAlign: "center", fontSize: s.td, color: "#475569" }}>{item.qty}</td>
                      <td style={{ padding: s.cellPad, textAlign: "right",  fontSize: s.td, color: "#475569" }}>{fmt(item.prix)}</td>
                      <td style={{ padding: s.cellPad, textAlign: "right",  fontSize: s.td, fontWeight: 700, color: "#0f172a" }}>{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: s.totalW }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: isA4 ? "5px 12px" : "4px 8px", fontSize: s.label, color: "#64748b" }}>
                    <span>Sous-total</span>
                    <span>{fmt(sous_total)} FCFA</span>
                  </div>
                  {remise > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: isA4 ? "5px 12px" : "4px 8px", fontSize: s.label, color: "#ef4444" }}>
                      <span>Remise</span>
                      <span>− {fmt(remise)} FCFA</span>
                    </div>
                  )}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    padding: isA4 ? "9px 12px" : "7px 8px",
                    fontSize: isA4 ? 14 : 11, fontWeight: 800,
                    color: "white",
                    background: "linear-gradient(90deg, #b45309, #f59e0b)",
                    borderRadius: s.radius - 2,
                    marginTop: 4,
                  }}>
                    <span>TOTAL TTC</span>
                    <span>{fmt(total)} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Payment info — facture only */}
              {type === "facture" && (mode_paiement || statut_paiement) && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {mode_paiement && (
                    <div style={{ background: "#f1f5f9", borderRadius: s.radius, padding: isA4 ? "9px 14px" : "6px 10px" }}>
                      <div style={{ fontSize: s.small, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Mode de paiement</div>
                      <div style={{ fontSize: s.label + 1, fontWeight: 600, color: "#0f172a", marginTop: 3 }}>
                        {MODES[mode_paiement] ?? mode_paiement}
                      </div>
                    </div>
                  )}
                  {statut_paiement && (
                    <div style={{
                      background: statut_paiement === "paye_total" ? "#f0fdf4" : "#fff7ed",
                      border: `1px solid ${statut_paiement === "paye_total" ? "#bbf7d0" : "#fed7aa"}`,
                      borderRadius: s.radius,
                      padding: isA4 ? "9px 14px" : "6px 10px",
                    }}>
                      <div style={{ fontSize: s.small, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Statut paiement</div>
                      <div style={{ fontSize: s.label + 1, fontWeight: 700, color: statut_paiement === "paye_total" ? "#16a34a" : "#d97706", marginTop: 3 }}>
                        {statut_paiement === "paye_total" ? "✓ Payé" : statut_paiement === "acompte" ? "Acompte versé" : "En attente"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              {note && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: s.radius, padding: isA4 ? "10px 14px" : "7px 10px" }}>
                  <div style={{ fontSize: s.small, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Note</div>
                  <div style={{ fontSize: s.label, color: "#78350f", lineHeight: 1.5 }}>{note}</div>
                </div>
              )}

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Footer */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: isA4 ? 14 : 10, textAlign: "center" }}>
                <div style={{ fontSize: isA4 ? 13 : 10, fontWeight: 700, color: "#d97706" }}>
                  Merci de votre confiance !
                </div>
                <div style={{ fontSize: s.small, color: "#94a3b8", marginTop: 3 }}>
                  Togolese Shop · store.togolese.fr · +228 90 52 79 12
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
