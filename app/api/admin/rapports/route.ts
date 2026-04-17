import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

function getPeriodeCondition(periode: string): string {
  switch (periode) {
    case "aujourd_hui":   return "DATE(f.created_at) = CURDATE()";
    case "cette_semaine": return "YEARWEEK(f.created_at, 1) = YEARWEEK(CURDATE(), 1)";
    case "ce_mois":       return "YEAR(f.created_at) = YEAR(CURDATE()) AND MONTH(f.created_at) = MONTH(CURDATE())";
    case "ce_trimestre":  return "YEAR(f.created_at) = YEAR(CURDATE()) AND QUARTER(f.created_at) = QUARTER(CURDATE())";
    case "cette_annee":   return "YEAR(f.created_at) = YEAR(CURDATE())";
    default:              return "1=1";
  }
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const periode     = searchParams.get("periode")     ?? "ce_mois";
  const utilisateur = searchParams.get("utilisateur") ?? "all";
  const statut      = searchParams.get("statut")      ?? "all";

  const conditions: string[] = [getPeriodeCondition(periode)];
  const params: unknown[] = [];

  if (utilisateur !== "all") {
    conditions.push("f.admin_id = ?");
    params.push(Number(utilisateur));
  }
  if (statut !== "all") {
    conditions.push("f.statut = ?");
    params.push(statut);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT f.id, f.reference, f.created_at, f.client_nom,
            COALESCE(u.nom, 'N/A') AS vendeur,
            f.total, f.statut_paiement, f.montant_acompte, f.statut
     FROM factures f
     LEFT JOIN utilisateurs u ON u.id = f.admin_id
     ${where}
     ORDER BY f.created_at DESC`,
    params
  );

  const [users] = await db.query<mysql.RowDataPacket[]>(
    "SELECT id, nom FROM utilisateurs WHERE actif = 1 ORDER BY nom"
  );

  const mapped = (rows as mysql.RowDataPacket[]).map(r => {
    let montant_paye = 0;
    if (r.statut_paiement === "paye" || r.statut === "paye") {
      montant_paye = Number(r.total);
    } else if (r.statut_paiement === "acompte") {
      montant_paye = Number(r.montant_acompte ?? 0);
    }
    return {
      id:              r.id,
      reference:       r.reference,
      created_at:      r.created_at,
      client_nom:      r.client_nom,
      vendeur:         r.vendeur,
      total:           Number(r.total),
      montant_paye,
      reste:           Number(r.total) - montant_paye,
      statut_paiement: r.statut_paiement,
      statut:          r.statut,
    };
  });

  return NextResponse.json({ rows: mapped, utilisateurs: users });
}
