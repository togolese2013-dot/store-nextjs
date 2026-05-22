"use client";

import { X, Printer } from "lucide-react";

export interface ProformaItem {
  nom: string;
  reference?: string;
  qty: number;
  prix: number;
  total: number;
}

export interface ProformaDocPrintProps {
  reference: string;
  date: string;
  client_nom: string;
  client_tel?: string | null;
  items: ProformaItem[];
  sous_total: number;
  remise?: number;
  total: number;
  valide_jusqu?: string | null;
  note?: string | null;
  onClose: () => void;
}

const INDIGO  = "#1e3a8a";
const INDIGO2 = "#1e40af";
const AMBER   = "#d97706";
const LIGHT   = "#eff6ff";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function triggerPrint() {
  document.getElementById("proforma-print-style")?.remove();
  const s = document.createElement("style");
  s.id = "proforma-print-style";
  s.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #proforma-print-zone { visibility: visible !important; position: fixed !important; inset: 0 !important; background: white !important; z-index: 99999 !important; overflow: visible !important; }
      #proforma-print-zone * { visibility: visible !important; }
      .no-print { display: none !important; }
      @page { size: A4 portrait; margin: 0; }
    }
  `;
  document.head.appendChild(s);
  window.print();
  setTimeout(() => s.remove(), 2000);
}

function CircleLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill={INDIGO} />
      <text x="24" y="31" textAnchor="middle" fontSize="22" fontWeight="900" fill="white" fontFamily="sans-serif">T</text>
    </svg>
  );
}

export default function ProformaDocPrint({
  reference, date, client_nom, client_tel,
  items, sous_total, remise = 0, total,
  valide_jusqu, note, onClose,
}: ProformaDocPrintProps) {
  return (
    <>
      {/* ── Action bar ── */}
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" style={{ backdropFilter: "blur(6px)" }}>
        <div className="no-print absolute top-5 right-5 flex items-center gap-2 z-10">
          <button
            onClick={triggerPrint}
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold shadow-xl transition-colors"
            style={{ background: INDIGO }}
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </button>
          <button onClick={onClose} className="p-2.5 bg-white hover:bg-slate-100 rounded-xl shadow-xl transition-colors">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* ── Document ── */}
        <div className="overflow-auto max-h-full" style={{ maxWidth: "210mm" }}>
          <div
            id="proforma-print-zone"
            style={{
              width: "210mm",
              minHeight: "297mm",
              background: "white",
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              boxShadow: "0 25px 60px rgba(0,0,0,.45)",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >

            {/* ══ TOP ACCENT BAR ══ */}
            <div style={{ height: 6, background: `linear-gradient(90deg, ${INDIGO} 0%, ${AMBER} 100%)` }} />

            {/* ══ HEADER ══ */}
            <div style={{ padding: "32px 44px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              {/* Left: logo + company name + address */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <CircleLogo />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: INDIGO, letterSpacing: "1px", textTransform: "uppercase" }}>
                    Togolese Shop
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Lomé, Togo</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>togolese.tg</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>+228 90 52 79 12</div>
                </div>
              </div>
              {/* Right: PROFORMA title */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: INDIGO, letterSpacing: "-2px", lineHeight: 1, textTransform: "uppercase" }}>
                  Proforma
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", marginTop: 4 }}>
                  Devis · Offre commerciale
                </div>
              </div>
            </div>

            {/* ══ 3-COLUMN INFO BAND ══ */}
            <div style={{
              margin: "0 44px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              border: `1px solid ${INDIGO}`,
              borderRadius: 8,
              overflow: "hidden",
            }}>
              {/* Col 1: CLIENT */}
              <div style={{ padding: "16px 18px", borderRight: `1px solid ${INDIGO}` }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>
                  Client
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: INDIGO }}>{client_nom}</div>
                {client_tel && (
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{client_tel}</div>
                )}
              </div>

              {/* Col 2: ÉMETTEUR */}
              <div style={{ padding: "16px 18px", borderRight: `1px solid ${INDIGO}`, background: LIGHT }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>
                  Émetteur
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: INDIGO }}>Togolese Shop</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>togolese.tg</div>
                <div style={{ fontSize: 11, color: "#475569" }}>+228 90 52 79 12</div>
                <div style={{ fontSize: 11, color: "#475569" }}>Lomé, Togo</div>
              </div>

              {/* Col 3: INFOS DOC */}
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>
                  Infos document
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>N° <span style={{ fontWeight: 800, color: INDIGO }}>{reference}</span></div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Émis le <span style={{ fontWeight: 700, color: "#1e293b" }}>{fmtDate(date)}</span></div>
                {valide_jusqu && (
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    Valable jusqu'au{" "}
                    <span style={{ fontWeight: 700, color: AMBER }}>{fmtDate(valide_jusqu)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ══ ITEMS TABLE ══ */}
            <div style={{ margin: "24px 44px 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: INDIGO }}>
                    <th style={{ padding: "11px 14px", textAlign: "left",   fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "1.2px" }}>Description</th>
                    <th style={{ padding: "11px 14px", textAlign: "right",  fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "1.2px", width: 110 }}>Prix unit.</th>
                    <th style={{ padding: "11px 14px", textAlign: "center", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "1.2px", width: 60 }}>Qté</th>
                    <th style={{ padding: "11px 14px", textAlign: "right",  fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "1.2px", width: 110 }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : LIGHT, borderBottom: "1px solid #dbeafe" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{item.nom}</div>
                        {item.reference && (
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1, fontFamily: "monospace" }}>{item.reference}</div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right",  fontSize: 12, color: "#475569" }}>{fmt(item.prix)} F</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, color: "#475569", fontWeight: 700 }}>{item.qty}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right",  fontSize: 12, fontWeight: 800, color: INDIGO }}>{fmt(item.total)} F</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ══ TOTALS ══ */}
            <div style={{ display: "flex", justifyContent: "flex-end", margin: "16px 44px 0" }}>
              <div style={{ minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 14px", fontSize: 12, color: "#64748b" }}>
                  <span>Sous-total</span>
                  <span>{fmt(sous_total)} FCFA</span>
                </div>
                {remise > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 14px", fontSize: 12, color: AMBER, fontWeight: 600 }}>
                    <span>Remise</span>
                    <span>− {fmt(remise)} FCFA</span>
                  </div>
                )}
                <div style={{ height: 1, background: "#dbeafe", margin: "4px 0" }} />
                {/* Total box */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px",
                  background: INDIGO,
                  borderRadius: 6,
                  marginTop: 4,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "1px" }}>Total</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "white" }}>{fmt(total)} FCFA</span>
                </div>
              </div>
            </div>

            {/* ══ SPACER ══ */}
            <div style={{ flex: 1 }} />

            {/* ══ CONDITIONS / NOTE FOOTER ══ */}
            <div style={{ margin: "24px 44px 0" }}>
              {/* Signature line */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                <div style={{ width: 180, textAlign: "center" }}>
                  <div style={{ borderTop: `2px solid ${INDIGO}`, paddingTop: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: INDIGO, textTransform: "uppercase", letterSpacing: "1px" }}>Signature & Cachet</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ BOTTOM BAND ══ */}
            <div style={{ background: INDIGO, padding: "16px 44px", marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>
                    Conditions & Validité
                  </div>
                  <div style={{ fontSize: 10, color: "#bfdbfe", lineHeight: 1.6 }}>
                    {valide_jusqu
                      ? `Ce devis est valable jusqu'au ${fmtDate(valide_jusqu)}. Passé ce délai, les prix sont susceptibles de changer.`
                      : "Ce devis est soumis à conditions. Contactez-nous pour toute question."
                    }
                    {note && (
                      <span style={{ display: "block", marginTop: 4, color: "white", fontWeight: 600 }}>{note}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 24 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>Contact</div>
                  <div style={{ fontSize: 10, color: "#bfdbfe", lineHeight: 1.8 }}>
                    <div>+228 90 52 79 12</div>
                    <div>togolese.tg</div>
                    <div>Lomé, Togo</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ BOTTOM ACCENT BAR ══ */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${AMBER} 0%, ${INDIGO} 100%)` }} />

          </div>
        </div>
      </div>
    </>
  );
}
