"use client";

import { useState } from "react";
import type { LivreurInscription } from "@/lib/admin-db";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "";

function formatDate(d: string) {
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Badge({ statut }: { statut: LivreurInscription["statut"] }) {
  const styles: Record<string, React.CSSProperties> = {
    en_attente: { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" },
    approuve:   { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    rejete:     { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" },
  };
  const labels = { en_attente: "En attente", approuve: "Approuvé", rejete: "Rejeté" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, ...styles[statut] }}>
      {labels[statut]}
    </span>
  );
}

interface Props {
  initialItems: LivreurInscription[];
}

export default function LivreurInscriptionsManager({ initialItems }: Props) {
  const [items,    setItems]    = useState<LivreurInscription[]>(initialItems);
  const [filter,   setFilter]   = useState<string>("en_attente");
  const [loading,  setLoading]  = useState<number | null>(null);
  const [modal,    setModal]    = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [note,     setNote]     = useState("");
  const [error,    setError]    = useState("");

  const filtered = filter === "all" ? items : items.filter(i => i.statut === filter);

  async function handleAction(id: number, action: "approve" | "reject") {
    setModal({ id, action });
    setNote("");
    setError("");
  }

  async function confirmAction() {
    if (!modal) return;
    setLoading(modal.id);
    setError("");
    try {
      const endpoint = modal.action === "approve"
        ? `${BACKEND}/api/admin/livreur-inscriptions/${modal.id}/approve`
        : `${BACKEND}/api/admin/livreur-inscriptions/${modal.id}/reject`;
      const res = await fetch(endpoint, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur.");
        return;
      }
      setItems(prev => prev.map(i =>
        i.id === modal.id
          ? { ...i, statut: modal.action === "approve" ? "approuve" : "rejete", note_admin: note || null }
          : i
      ));
      setModal(null);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(null);
    }
  }

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer",
    border: active ? "none" : "1px solid #e5e7eb",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#374151",
  });

  const counts = {
    en_attente: items.filter(i => i.statut === "en_attente").length,
    approuve:   items.filter(i => i.statut === "approuve").length,
    rejete:     items.filter(i => i.statut === "rejete").length,
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "en_attente", label: `En attente (${counts.en_attente})` },
          { key: "approuve",   label: `Approuvés (${counts.approuve})` },
          { key: "rejete",     label: `Rejetés (${counts.rejete})` },
          { key: "all",        label: `Tous (${items.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={filterBtnStyle(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#9ca3af", fontSize: 14 }}>
          Aucune demande{filter !== "all" ? " dans cette catégorie" : ""}.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Nom", "Téléphone", "Plaque", "CNI", "Statut", "Date", "Note admin", "Actions"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.nom}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>{item.telephone}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>{item.numero_plaque ?? "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {item.carte_identite_url ? (
                      <a href={item.carte_identite_url} target="_blank" rel="noreferrer">
                        <img
                          src={item.carte_identite_url}
                          alt="CNI"
                          style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb", cursor: "pointer" }}
                        />
                      </a>
                    ) : (
                      <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}><Badge statut={item.statut} /></td>
                  <td style={{ padding: "10px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(item.created_at)}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.note_admin ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {item.statut === "en_attente" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleAction(item.id, "approve")}
                          disabled={loading === item.id}
                          style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", cursor: "pointer",
                          }}
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleAction(item.id, "reject")}
                          disabled={loading === item.id}
                          style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", cursor: "pointer",
                          }}
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "28px 24px",
            width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.15)",
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
              {modal.action === "approve" ? "Approuver la demande" : "Refuser la demande"}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280" }}>
              {modal.action === "approve"
                ? "Un compte livreur sera créé. L'identifiant de connexion sera le numéro de téléphone."
                : "La demande sera refusée. Le candidat pourra soumettre une nouvelle demande."}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={modal.action === "approve" ? "Message de bienvenue, instructions…" : "Raison du refus…"}
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1px solid #d1d5db", fontSize: 14, resize: "vertical",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setModal(null)}
                style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                onClick={confirmAction}
                disabled={loading === modal.id}
                style={{
                  padding: "9px 18px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: modal.action === "approve" ? "#166534" : "#b91c1c",
                  color: "#fff",
                  opacity: loading === modal.id ? 0.7 : 1,
                }}
              >
                {loading === modal.id ? "En cours…" : modal.action === "approve" ? "Confirmer l'approbation" : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
