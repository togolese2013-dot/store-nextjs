import { apiGet } from "@/lib/api";
import type { LivreurInscription } from "@/lib/admin-db";
import LivreurInscriptionsManager from "@/components/admin/LivreurInscriptionsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demandes livreurs — Admin" };

export default async function LivreursAdminPage() {
  let items: LivreurInscription[] = [];
  try {
    const data = await apiGet<{ items: LivreurInscription[] }>("/api/admin/livreur-inscriptions");
    items = data.items;
  } catch {
    // render empty, client will show empty state
  }

  const pending = items.filter(i => i.statut === "en_attente").length;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Demandes livreurs</h1>
          {pending > 0 && (
            <span style={{
              padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a",
            }}>
              {pending} en attente
            </span>
          )}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>
          Validez ou refusez les demandes d'inscription des nouveaux livreurs.
        </p>
      </div>

      <LivreurInscriptionsManager initialItems={items} />
    </div>
  );
}
