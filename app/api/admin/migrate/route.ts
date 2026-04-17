import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// One-time migration endpoint — delete after use.
// Protected by RESET_SECRET env var.

// Check if a column exists before ALTER TABLE
async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(table: string, column: string, definition: string) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

const TABLE_MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: "factures",
    sql: `CREATE TABLE IF NOT EXISTS factures (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      reference     VARCHAR(50)  NOT NULL UNIQUE,
      client_nom    VARCHAR(255) NOT NULL,
      client_tel    VARCHAR(50)  DEFAULT NULL,
      client_email  VARCHAR(255) DEFAULT NULL,
      items         JSON         NOT NULL,
      sous_total    DECIMAL(15,2) NOT NULL DEFAULT 0,
      remise        DECIMAL(15,2) NOT NULL DEFAULT 0,
      total         DECIMAL(15,2) NOT NULL DEFAULT 0,
      statut        ENUM('brouillon','valide','paye','annule') NOT NULL DEFAULT 'brouillon',
      note          TEXT         DEFAULT NULL,
      admin_id      INT          DEFAULT NULL,
      created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "devis",
    sql: `CREATE TABLE IF NOT EXISTS devis (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      reference     VARCHAR(50)  NOT NULL UNIQUE,
      client_nom    VARCHAR(255) NOT NULL,
      client_tel    VARCHAR(50)  DEFAULT NULL,
      client_email  VARCHAR(255) DEFAULT NULL,
      items         JSON         NOT NULL,
      sous_total    DECIMAL(15,2) NOT NULL DEFAULT 0,
      remise        DECIMAL(15,2) NOT NULL DEFAULT 0,
      total         DECIMAL(15,2) NOT NULL DEFAULT 0,
      statut        ENUM('brouillon','envoye','accepte','refuse','expire') NOT NULL DEFAULT 'brouillon',
      valide_jusqu  DATE         DEFAULT NULL,
      note          TEXT         DEFAULT NULL,
      admin_id      INT          DEFAULT NULL,
      created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "livraisons",
    sql: `CREATE TABLE IF NOT EXISTS livraisons (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      reference  VARCHAR(50)  NOT NULL UNIQUE,
      facture_id INT          DEFAULT NULL,
      client_nom VARCHAR(255) NOT NULL,
      client_tel VARCHAR(50)  DEFAULT NULL,
      adresse    TEXT         DEFAULT NULL,
      statut     ENUM('en_attente','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente',
      livreur    VARCHAR(255) DEFAULT NULL,
      note       TEXT         DEFAULT NULL,
      livree_le  TIMESTAMP    DEFAULT NULL,
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "boutique_stock",
    sql: `CREATE TABLE IF NOT EXISTS boutique_stock (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      produit_id   INT NOT NULL,
      quantite     INT NOT NULL DEFAULT 0,
      seuil_alerte INT NOT NULL DEFAULT 5,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_produit (produit_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "boutique_mouvements",
    sql: `CREATE TABLE IF NOT EXISTS boutique_mouvements (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      produit_id   INT NOT NULL,
      type         ENUM('entree','sortie','retrait','ajustement') NOT NULL,
      quantite     INT NOT NULL,
      motif        VARCHAR(500) DEFAULT NULL,
      ref_commande VARCHAR(100) DEFAULT NULL,
      admin_id     INT          DEFAULT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "boutique_stock_seed",
    sql: `INSERT INTO boutique_stock (produit_id, quantite)
      SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
      FROM produits
      ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)`,
  },
  {
    name: "boutique_clients",
    sql: `CREATE TABLE IF NOT EXISTS boutique_clients (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      nom          VARCHAR(255) NOT NULL,
      telephone    VARCHAR(20),
      email        VARCHAR(150),
      localisation VARCHAR(255),
      type_client  ENUM('particulier','professionnel') NOT NULL DEFAULT 'particulier',
      solde        DECIMAL(15,2) NOT NULL DEFAULT 0,
      notes        TEXT,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "livreurs",
    sql: `CREATE TABLE IF NOT EXISTS livreurs (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      nom        VARCHAR(255) NOT NULL,
      telephone  VARCHAR(50)  NULL,
      code_acces VARCHAR(30)  NOT NULL UNIQUE,
      statut     ENUM('disponible','indisponible') NOT NULL DEFAULT 'disponible',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "livraisons_ventes",
    sql: `CREATE TABLE IF NOT EXISTS livraisons_ventes (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      reference         VARCHAR(60)  NOT NULL UNIQUE,
      facture_id        INT          NULL,
      client_nom        VARCHAR(255) NOT NULL,
      client_tel        VARCHAR(50)  NULL,
      adresse           VARCHAR(500) NULL,
      contact_livraison VARCHAR(255) NULL,
      lien_localisation VARCHAR(500) NULL,
      livreur_id        INT          NULL,
      livreur           VARCHAR(255) NULL,
      statut            ENUM('en_attente','acceptee','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente',
      note              TEXT         NULL,
      livree_le         DATETIME     NULL,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "clients_crm",
    sql: `CREATE TABLE IF NOT EXISTS clients (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      telephone  VARCHAR(30)  NOT NULL,
      nom        VARCHAR(120) DEFAULT '',
      email      VARCHAR(120) DEFAULT '',
      adresse    TEXT,
      ville      VARCHAR(80)  DEFAULT '',
      tags       JSON,
      statut     ENUM('normal','vip','blacklist') DEFAULT 'normal',
      notes      TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_telephone (telephone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "entrepots",
    sql: `CREATE TABLE IF NOT EXISTS entrepots (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      nom         VARCHAR(120) NOT NULL,
      adresse     TEXT,
      telephone   VARCHAR(30)  DEFAULT '',
      responsable VARCHAR(120) DEFAULT '',
      actif       TINYINT(1)   DEFAULT 1,
      sort_order  INT          DEFAULT 0,
      created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "produit_stocks",
    sql: `CREATE TABLE IF NOT EXISTS produit_stocks (
      produit_id  INT NOT NULL,
      entrepot_id INT NOT NULL,
      stock       INT DEFAULT 0,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (produit_id, entrepot_id),
      INDEX idx_entrepot (entrepot_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

// Columns to add conditionally (no IF NOT EXISTS support on this MySQL version)
const COLUMN_MIGRATIONS: { name: string; table: string; column: string; definition: string }[] = [
  { name: "factures.avec_livraison",    table: "factures", column: "avec_livraison",    definition: "TINYINT(1) DEFAULT 0" },
  { name: "factures.adresse_livraison", table: "factures", column: "adresse_livraison", definition: "VARCHAR(500) NULL" },
  { name: "factures.contact_livraison", table: "factures", column: "contact_livraison", definition: "VARCHAR(255) NULL" },
  { name: "factures.lien_localisation", table: "factures", column: "lien_localisation", definition: "VARCHAR(500) NULL" },
  { name: "factures.mode_paiement",     table: "factures", column: "mode_paiement",     definition: "VARCHAR(50) NULL" },
  { name: "factures.statut_paiement",   table: "factures", column: "statut_paiement",   definition: "VARCHAR(50) NULL" },
  { name: "factures.montant_acompte",   table: "factures", column: "montant_acompte",   definition: "DECIMAL(12,2) NULL" },
  { name: "produits.images_json",       table: "produits", column: "images_json",       definition: "JSON NULL" },
  { name: "orders.client_id",           table: "orders",   column: "client_id",         definition: "INT NULL" },
  { name: "orders.entrepot_id",         table: "orders",   column: "entrepot_id",       definition: "INT NULL" },
  { name: "finance_entries.mode_paiement", table: "finance_entries", column: "mode_paiement", definition: "VARCHAR(50) DEFAULT 'especes'" },
];

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    const expected = process.env.RESET_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Secret invalide." }, { status: 403 });
    }

    const results: { name: string; status: "ok" | "skipped" | "error"; error?: string }[] = [];

    // Run CREATE TABLE migrations
    for (const m of TABLE_MIGRATIONS) {
      try {
        await db.execute(m.sql);
        results.push({ name: m.name, status: "ok" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ name: m.name, status: "error", error: msg });
      }
    }

    // Run conditional column migrations
    for (const m of COLUMN_MIGRATIONS) {
      try {
        const exists = await columnExists(m.table, m.column);
        if (exists) {
          results.push({ name: m.name, status: "skipped" });
        } else {
          await addColumnIfMissing(m.table, m.column, m.definition);
          results.push({ name: m.name, status: "ok" });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ name: m.name, status: "error", error: msg });
      }
    }

    const errors = results.filter((r) => r.status === "error");
    return NextResponse.json({ ok: errors.length === 0, results, errors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
