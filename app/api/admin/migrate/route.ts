import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// One-time migration endpoint — delete after use.
// Protected by RESET_SECRET env var.

const MIGRATIONS: { name: string; sql: string }[] = [
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
      updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_statut     (statut),
      KEY idx_client     (client_nom),
      KEY idx_created_at (created_at)
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
      updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_statut     (statut),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "livraisons",
    sql: `CREATE TABLE IF NOT EXISTS livraisons (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      reference     VARCHAR(50)  NOT NULL UNIQUE,
      facture_id    INT          DEFAULT NULL,
      client_nom    VARCHAR(255) NOT NULL,
      client_tel    VARCHAR(50)  DEFAULT NULL,
      adresse       TEXT         DEFAULT NULL,
      statut        ENUM('en_attente','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente',
      livreur       VARCHAR(255) DEFAULT NULL,
      note          TEXT         DEFAULT NULL,
      livree_le     TIMESTAMP    DEFAULT NULL,
      created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_statut     (statut),
      KEY idx_facture_id (facture_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "factures_cols_v2",
    sql: `ALTER TABLE factures
      ADD COLUMN IF NOT EXISTS avec_livraison       TINYINT(1)      DEFAULT 0,
      ADD COLUMN IF NOT EXISTS adresse_livraison    VARCHAR(500)    NULL,
      ADD COLUMN IF NOT EXISTS contact_livraison    VARCHAR(255)    NULL,
      ADD COLUMN IF NOT EXISTS lien_localisation    VARCHAR(500)    NULL,
      ADD COLUMN IF NOT EXISTS mode_paiement        VARCHAR(50)     NULL,
      ADD COLUMN IF NOT EXISTS statut_paiement      VARCHAR(50)     NULL,
      ADD COLUMN IF NOT EXISTS montant_acompte      DECIMAL(12,2)   NULL`,
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
      motif        VARCHAR(500)  DEFAULT NULL,
      ref_commande VARCHAR(100)  DEFAULT NULL,
      admin_id     INT           DEFAULT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_produit    (produit_id),
      KEY idx_type       (type),
      KEY idx_created_at (created_at)
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
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_nom       (nom),
      INDEX idx_telephone (telephone),
      INDEX idx_solde     (solde),
      INDEX idx_created   (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "livreurs",
    sql: `CREATE TABLE IF NOT EXISTS livreurs (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      nom        VARCHAR(255)  NOT NULL,
      telephone  VARCHAR(50)   NULL,
      code_acces VARCHAR(30)   NOT NULL UNIQUE,
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
    name: "produits_images_json",
    sql: `ALTER TABLE produits ADD COLUMN IF NOT EXISTS images_json JSON NULL`,
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
    name: "orders_client_id",
    sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id INT NULL`,
  },
  {
    name: "orders_entrepot_id",
    sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS entrepot_id INT NULL`,
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
  {
    name: "finance_entries_mode_paiement",
    sql: `ALTER TABLE finance_entries
      ADD COLUMN IF NOT EXISTS mode_paiement ENUM('especes','moov_money','tmoney','virement_bancaire') DEFAULT 'especes'`,
  },
];

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    const expected = process.env.RESET_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Secret invalide." }, { status: 403 });
    }

    const results: { name: string; status: "ok" | "error"; error?: string }[] = [];

    for (const migration of MIGRATIONS) {
      try {
        await db.execute(migration.sql);
        results.push({ name: migration.name, status: "ok" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Ignore "already exists" errors — migration is idempotent
        if (msg.includes("Duplicate column") || msg.includes("already exists")) {
          results.push({ name: migration.name, status: "ok" });
        } else {
          results.push({ name: migration.name, status: "error", error: msg });
        }
      }
    }

    const errors = results.filter((r) => r.status === "error");
    return NextResponse.json({ ok: errors.length === 0, results, errors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
