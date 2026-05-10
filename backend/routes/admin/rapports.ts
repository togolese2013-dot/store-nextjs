import express from "express";
import { getSession } from "../../lib/auth";
import { db as pool } from "@/lib/db";
import mysql from "mysql2/promise";

const router = express.Router();

// ─── Period filter helper ─────────────────────────────────────────────────────

function periodClause(col: string, periode: string): string {
  switch (periode) {
    case "aujourd_hui":   return `DATE(${col}) = CURDATE()`;
    case "cette_semaine": return `YEARWEEK(${col}, 1) = YEARWEEK(NOW(), 1)`;
    case "ce_mois":       return `YEAR(${col}) = YEAR(NOW()) AND MONTH(${col}) = MONTH(NOW())`;
    case "ce_trimestre":  return `QUARTER(${col}) = QUARTER(NOW()) AND YEAR(${col}) = YEAR(NOW())`;
    case "cette_annee":   return `YEAR(${col}) = YEAR(NOW())`;
    default:              return "1=1";
  }
}

// ─── GET /api/admin/rapports ──────────────────────────────────────────────────

router.get("/api/admin/rapports", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const type       = (req.query.type       as string) || "ventes";
  const periode    = (req.query.periode    as string) || "ce_mois";
  const statut     = (req.query.statut     as string) || "all";
  const utilisateur = (req.query.utilisateur as string) || "all";

  try {
    let rows: mysql.RowDataPacket[] = [];
    let utilisateurs: { id: number; nom: string }[] = [];

    // Fetch utilisateurs list (for filter dropdown)
    const [uRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, nom FROM admin_users WHERE actif = 1 ORDER BY nom`
    );
    utilisateurs = uRows as { id: number; nom: string }[];

    const pc = periodClause;

    // ── VENTES ───────────────────────────────────────────────────────────────
    if (type === "ventes") {
      const conditions: string[] = [pc("f.created_at", periode)];
      const params: unknown[] = [];
      if (statut !== "all") {
        if (statut === "paye") {
          conditions.push("f.statut_paiement = 'paye_total'");
        } else {
          conditions.push("f.statut = ?");
          params.push(statut);
        }
      }
      if (utilisateur !== "all") {
        conditions.push("f.admin_id = ?");
        params.push(Number(utilisateur));
      }
      const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT f.id, f.reference, f.created_at, f.client_nom,
                CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web'
                     ELSE COALESCE(au.nom, util.nom) END AS vendeur,
                f.total,
                CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS montant_paye,
                f.total - CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS reste,
                f.statut_paiement, f.statut
         FROM factures f
         LEFT JOIN admin_users au   ON au.id   = f.admin_id
         LEFT JOIN utilisateurs util ON util.id = f.admin_id
         ${where}
         ORDER BY f.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── ACHATS ───────────────────────────────────────────────────────────────
    else if (type === "achats") {
      const conditions: string[] = [pc("a.date_achat", periode)];
      const params: unknown[] = [];
      if (statut !== "all") { conditions.push("a.statut = ?"); params.push(statut); }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT a.id,
                a.reference,
                a.date_achat   AS created_at,
                f.nom          AS client_nom,
                a.fournisseur_id AS vendeur,
                a.montant_total AS total,
                a.montant_total AS montant_paye,
                0               AS reste,
                a.statut        AS statut_paiement,
                a.statut
         FROM achats a
         LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
         ${where}
         ORDER BY a.date_achat DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── DEPENSES ─────────────────────────────────────────────────────────────
    else if (type === "depenses") {
      const conditions: string[] = ["fe.type = 'depense'", pc("fe.date_entree", periode)];
      const params: unknown[] = [];
      if (utilisateur !== "all") { conditions.push("fe.admin_id = ?"); params.push(Number(utilisateur)); }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                fe.description AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── RENTREES ─────────────────────────────────────────────────────────────
    else if (type === "rentrees") {
      const conditions: string[] = ["fe.type = 'rentree'", pc("fe.date_entree", periode)];
      const params: unknown[] = [];
      if (utilisateur !== "all") { conditions.push("fe.admin_id = ?"); params.push(Number(utilisateur)); }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                fe.description AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── COMBINE (dépenses + rentrées) ─────────────────────────────────────────
    else if (type === "combine") {
      const conditions: string[] = ["fe.type IN ('depense','rentree')", pc("fe.date_entree", periode)];
      const params: unknown[] = [];
      if (utilisateur !== "all") { conditions.push("fe.admin_id = ?"); params.push(Number(utilisateur)); }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                CONCAT('[', UPPER(fe.type), '] ', COALESCE(fe.description, '')) AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── FINANCIER (tous types finance) ────────────────────────────────────────
    else if (type === "financier") {
      const conditions: string[] = [pc("fe.date_entree", periode)];
      const params: unknown[] = [];
      if (utilisateur !== "all") { conditions.push("fe.admin_id = ?"); params.push(Number(utilisateur)); }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                CONCAT('[', UPPER(fe.type), '] ', COALESCE(fe.description, '')) AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── MOBILE MONEY ──────────────────────────────────────────────────────────
    else if (type === "mobile_money") {
      const conditions: string[] = [
        "f.mode_paiement IN ('moov_money','tmoney','mobile_money')",
        pc("f.created_at", periode),
      ];
      const params: unknown[] = [];
      if (statut !== "all") {
        conditions.push("f.statut_paiement = ?");
        params.push(statut === "paye" ? "paye_total" : statut);
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT f.id, f.reference, f.created_at, f.client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                f.total,
                CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS montant_paye,
                f.total - CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS reste,
                f.statut_paiement, f.statut
         FROM factures f
         LEFT JOIN admin_users au    ON au.id   = f.admin_id
         LEFT JOIN utilisateurs util ON util.id = f.admin_id
         ${where}
         ORDER BY f.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── CLIENTS ───────────────────────────────────────────────────────────────
    else if (type === "clients") {
      const conditions: string[] = [pc("bc.created_at", periode)];
      const params: unknown[] = [];
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT bc.id,
                CONCAT('CLI-', LPAD(bc.id, 4, '0')) AS reference,
                bc.created_at,
                bc.nom    AS client_nom,
                bc.telephone AS vendeur,
                COALESCE(bc.solde, 0) AS total,
                COALESCE(bc.solde, 0) AS montant_paye,
                0 AS reste,
                bc.type_client AS statut_paiement,
                bc.type_client AS statut
         FROM boutique_clients bc
         ${where}
         ORDER BY bc.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── PRODUITS ──────────────────────────────────────────────────────────────
    else if (type === "produits") {
      const conditions: string[] = [pc("p.created_at", periode)];
      const params: unknown[] = [];
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT p.id,
                CONCAT('PRD-', LPAD(p.id, 4, '0')) AS reference,
                p.created_at,
                p.nom AS client_nom,
                c.nom AS vendeur,
                p.prix AS total,
                p.prix AS montant_paye,
                0 AS reste,
                CASE WHEN p.stock > 0 THEN 'en_stock' ELSE 'rupture' END AS statut_paiement,
                CASE WHEN p.stock > 0 THEN 'en_stock' ELSE 'rupture' END AS statut
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ${where}
         ORDER BY p.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── STOCK ─────────────────────────────────────────────────────────────────
    else if (type === "stock") {
      const conditions: string[] = [pc("sm.created_at", periode)];
      const params: unknown[] = [];
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT sm.id,
                CONCAT('STK-', LPAD(sm.id, 4, '0')) AS reference,
                sm.created_at,
                p.nom AS client_nom,
                sm.type AS vendeur,
                sm.quantite AS total,
                sm.quantite AS montant_paye,
                0 AS reste,
                sm.type AS statut_paiement,
                sm.type AS statut
         FROM stock_boutique_mouvements sm
         LEFT JOIN products p ON p.id = sm.product_id
         ${where}
         ORDER BY sm.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    }

    // ── ACTIVITES (toutes sources fusionnées) ─────────────────────────────────
    else if (type === "activites") {
      const pVentes  = pc("f.created_at",    periode);
      const pFinance = pc("fe.date_entree",  periode);
      const pAchats  = pc("a.date_achat",    periode);
      const [r] = await pool.execute<mysql.RowDataPacket[]>(
        `(SELECT f.reference, f.created_at, f.client_nom,
                 COALESCE(au.nom, util.nom) AS vendeur,
                 f.total, f.statut
          FROM factures f
          LEFT JOIN admin_users au ON au.id = f.admin_id
          LEFT JOIN utilisateurs util ON util.id = f.admin_id
          WHERE ${pVentes})
         UNION ALL
         (SELECT fe.reference, fe.date_entree AS created_at,
                 CONCAT('[',UPPER(fe.type),'] ',COALESCE(fe.description,'')) AS client_nom,
                 COALESCE(au2.nom, util2.nom) AS vendeur,
                 fe.montant AS total, fe.type AS statut
          FROM finance_entries fe
          LEFT JOIN admin_users au2 ON au2.id = fe.admin_id
          LEFT JOIN utilisateurs util2 ON util2.id = fe.admin_id
          WHERE ${pFinance})
         UNION ALL
         (SELECT a.reference, a.date_achat AS created_at,
                 frs.nom AS client_nom, NULL AS vendeur,
                 a.montant_total AS total, a.statut
          FROM achats a
          LEFT JOIN fournisseurs frs ON frs.id = a.fournisseur_id
          WHERE ${pAchats})
         ORDER BY created_at DESC
         LIMIT 500`
      );
      rows = r as mysql.RowDataPacket[];
    }

    res.json({ rows, utilisateurs });
  } catch (err) {
    console.error("[rapports]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

export default router;
