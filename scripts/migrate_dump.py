#!/usr/bin/env python3
"""
Migration: local MariaDB dump → Railway MySQL
Usage:  python3 scripts/migrate_dump.py /path/to/dump.gz > migration.sql
"""
import gzip, re, sys, textwrap

DUMP_FILE = sys.argv[1] if len(sys.argv) > 1 else None
if not DUMP_FILE:
    print("Usage: python3 migrate_dump.py /path/to/dump.gz", file=sys.stderr)
    sys.exit(1)

# ── Toutes les tables DÉJÀ PRÉSENTES sur Railway ────────────────────────────
# Ces tables ne seront JAMAIS droppées ni recréées.
RAILWAY_TABLES = {
    "achat_items", "achats", "admin_users",
    "boutique_clients", "boutique_mouvements", "boutique_stock",
    "categories", "clients", "coupons",
    "delivery_zones", "devis", "entrepots",
    "factures", "finance_entries", "fournisseurs",
    "livraisons", "livraisons_ventes", "livreurs",
    "order_events", "orders", "product_variants",
    "produit_stocks", "produits", "produits_liés",
    "reviews", "settings", "stock_mouvements",
    "utilisateurs", "whatsapp_messages",
}

# ── Cas 1 : tables à importer avec mapping de colonnes ──────────────────────
# dump_col → railway_col (None = ignorer)
COLUMN_MAPS = {
    # categories: Railway a created_at en plus (DEFAULT NOW() → OK)
    "categories": {
        "id": "id", "nom": "nom", "description": "description",
    },
    # utilisateurs: Railway n'a pas commission / date_modification
    "utilisateurs": {
        "id": "id", "nom": "nom", "email": "email",
        "telephone": "telephone", "mot_de_passe": "mot_de_passe",
        "poste": "poste", "actif": "actif", "date_creation": "date_creation",
        "commission": None, "date_modification": None,
    },
    # clients: schémas très différents — on mappe le maximum
    "clients": {
        "id": "id", "nom": "nom", "telephone": "telephone",
        "email": "email", "adresse": "adresse",
        "note": "notes", "date_creation": "created_at",
        # colonnes dump sans équivalent Railway
        "type": None, "solde": None, "utilisateur_id": None,
    },
    # fournisseurs: Railway a contact au lieu de code_reference + solde
    "fournisseurs": {
        "id": "id", "nom": "nom", "telephone": "telephone",
        "email": "email", "adresse": "adresse", "note": "note",
        "date_creation": "created_at",
        "code_reference": None, "solde": None, "utilisateur_id": None,
    },
    # coupons: colonnes différentes
    "coupons": {
        "id": "id", "code": "code", "valeur": "valeur",
        "actif": "actif", "date_creation": "created_at",
        "date_fin": "expires_at",
        "type_remise": "type", "montant_min": "min_order",
        "usage_max": "uses_limit", "usage_actuel": "uses_count",
        # sans équivalent
        "description": None, "usage_par_client": None, "date_debut": None,
        "date_modification": None,
    },
}

# ── Cas 2 : tables Railway existantes avec schéma INCOMPATIBLE ──────────────
# → importées sous un nom alternatif (suffixe _local)
RENAME_AS_LOCAL = {
    "achats":      "achats_local",       # schéma enrichi vs Railway simplifié
    "achat_lignes":"achat_lignes_local",  # Railway a achat_items (différent)
    "livraisons":  "livraisons_local",    # Railway livraisons = facture-based
    "livreurs":    "livreurs_local",      # Railway livreurs = nom/telephone/code
    "avis":        "avis_local",          # Railway reviews = colonnes différentes
}

# ── Cas 3 : tables à ignorer complètement ───────────────────────────────────
SKIP_TABLES = {
    "admin_settings",        # Railway utilise settings (key/value)
    "activites",             # log interne non utilisé
    "password_reset_tokens", # non utilisé
    "website_utilisateurs",  # auth non utilisé (localStorage)
    "commissions",           # non utilisé
    "produits_commerciaux",  # non utilisé
    "grilles_tarifaires",    # non utilisé
}

# ────────────────────────────────────────────────────────────────────────────

def read_dump(path):
    open_fn = gzip.open if path.endswith(".gz") else open
    with open_fn(path, "rt", encoding="utf-8", errors="replace") as f:
        return f.read()

def split_dump(sql):
    """Retourne [(table, create_sql, insert_sql), ...]"""
    results = []
    tables = re.findall(r"DROP TABLE IF EXISTS `(\w+)`", sql)
    for table in tables:
        # CREATE: du DROP jusqu'à ENGINE=...;
        cm = re.search(
            rf"DROP TABLE IF EXISTS `{re.escape(table)}`.*?ENGINE=\w+[^;]*;",
            sql, re.DOTALL)
        create = cm.group(0).strip() if cm else ""
        # INSERT: LOCK … UNLOCK
        im = re.search(
            rf"LOCK TABLES `{re.escape(table)}` WRITE;.*?UNLOCK TABLES;",
            sql, re.DOTALL)
        insert = im.group(0).strip() if im else ""
        results.append((table, create, insert))
    return results

def clean_create(sql, new_name=None):
    """Prépare CREATE TABLE pour MySQL 8."""
    sql = re.sub(r"/\*M!999999\\- enable the sandbox mode \*/\s*", "", sql)
    sql = re.sub(r"CREATE TABLE `(\w+)`", r"CREATE TABLE IF NOT EXISTS `\1`", sql)
    if new_name:
        sql = re.sub(r"DROP TABLE IF EXISTS `\w+`",  f"DROP TABLE IF EXISTS `{new_name}`", sql)
        sql = re.sub(r"CREATE TABLE IF NOT EXISTS `\w+`", f"CREATE TABLE IF NOT EXISTS `{new_name}`", sql)
    # GENERATED ALWAYS AS → DEFAULT NULL
    sql = re.sub(
        r"(`\w+`\s+[\w()]+\s+GENERATED ALWAYS AS\s*\([^)]+\)\s*STORED)",
        lambda m: re.sub(r"\s+GENERATED ALWAYS AS\s*\([^)]+\)\s*STORED",
                         " DEFAULT NULL", m.group(0)),
        sql, flags=re.IGNORECASE)
    # corriger virgule orpheline avant )
    sql = re.sub(r",(\s*\n\s*\))", r"\1", sql)
    return sql.strip()

def parse_create_columns(create_sql):
    """Retourne la liste ordonnée des colonnes du CREATE TABLE."""
    cols = []
    for line in create_sql.split("\n"):
        s = line.strip()
        if not s.startswith("`"):
            continue
        if re.match(r"`(?:PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FULLTEXT)", s, re.IGNORECASE):
            continue
        m = re.match(r"`(\w+)`", s)
        if m:
            cols.append(m.group(1))
    return cols

def remove_col(tuple_str, index):
    """Retire la valeur à la position index (0-based) d'un tuple SQL."""
    inner = tuple_str[1:-1]
    parts, depth, current, in_q, qc, esc = [], 0, "", False, None, False
    for ch in inner:
        if esc:
            current += ch; esc = False; continue
        if ch == '\\' and in_q:
            current += ch; esc = True; continue
        if in_q:
            current += ch
            if ch == qc: in_q = False
        elif ch in ("'", '"'):
            in_q = True; qc = ch; current += ch
        elif ch == '(' and not in_q:
            depth += 1; current += ch
        elif ch == ')' and not in_q:
            depth -= 1; current += ch
        elif ch == ',' and depth == 0 and not in_q:
            parts.append(current.strip()); current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current.strip())
    if index < len(parts):
        del parts[index]
    return "(" + ", ".join(parts) + ")"

def remap_insert(insert_sql, table, src_cols, col_map, new_table=None):
    """
    Transforme un INSERT positionnel en INSERT IGNORE avec colonnes explicites,
    en appliquant le mapping col_map.
    Colonnes mappées à None sont retirées.
    """
    target = new_table or table
    # Colonnes destination (dans l'ordre src, filtrées et renommées)
    dst_cols = []
    src_indices_to_keep = []
    for i, sc in enumerate(src_cols):
        mapped = col_map.get(sc, sc)  # par défaut même nom
        if mapped is None:
            continue
        dst_cols.append(mapped)
        src_indices_to_keep.append(i)

    col_list = ", ".join(f"`{c}`" for c in dst_cols)

    lines = insert_sql.split("\n")
    out = []
    for line in lines:
        stripped = line.strip()
        if f"INSERT INTO `{table}`" in line or f"INSERT IGNORE INTO `{table}`" in line:
            line = f"INSERT IGNORE INTO `{target}` ({col_list}) VALUES"
            out.append(line)
        elif re.match(r"^\(", stripped):
            # Retirer les colonnes non voulues (de droite à gauche pour ne pas décaler)
            indices_to_remove = sorted(
                [i for i in range(len(src_cols)) if i not in src_indices_to_keep],
                reverse=True
            )
            t = line.rstrip().rstrip(",").rstrip(";")
            # Trouver le tuple
            def transform(m):
                s = m.group(0)
                for idx in indices_to_remove:
                    s = remove_col(s, idx)
                return s
            line = re.sub(r"\([^()]*(?:\([^()]*\)[^()]*)*\)", transform, t)
            # Remettre la virgule/point-virgule
            if stripped.endswith(";") or stripped.endswith(");"):
                line += ";"
            else:
                line += ","
            out.append(line)
        elif re.match(r"LOCK TABLES", line):
            out.append(f"LOCK TABLES `{target}` WRITE;")
        elif f"`{table}` DISABLE KEYS" in line:
            out.append(f"/*!40000 ALTER TABLE `{target}` DISABLE KEYS */;")
        elif f"`{table}` ENABLE KEYS" in line:
            out.append(f"/*!40000 ALTER TABLE `{target}` ENABLE KEYS */;")
        else:
            out.append(line)
    return "\n".join(out)

def simple_insert_ignore(insert_sql, table, new_table=None):
    """INSERT IGNORE sans changement de colonnes."""
    target = new_table or table
    return (insert_sql
        .replace(f"INSERT INTO `{table}`",         f"INSERT IGNORE INTO `{target}`")
        .replace(f"LOCK TABLES `{table}` WRITE",   f"LOCK TABLES `{target}` WRITE")
        .replace(f"`{table}` DISABLE KEYS",        f"`{target}` DISABLE KEYS")
        .replace(f"`{table}` ENABLE KEYS",         f"`{target}` ENABLE KEYS"))

def produits_block(create_sql, insert_sql):
    """Migration produits via table temporaire (image → image_url, sans stock_actuel)."""
    src_cols = parse_create_columns(create_sql)
    stock_actuel_idx = src_cols.index("stock_actuel") if "stock_actuel" in src_cols else -1

    # Table temporaire sans GENERATED
    tmp = create_sql
    tmp = re.sub(r"DROP TABLE IF EXISTS `produits`",        "DROP TABLE IF EXISTS `produits_import_tmp`", tmp)
    tmp = re.sub(r"CREATE TABLE `produits`",                "CREATE TABLE IF NOT EXISTS `produits_import_tmp`", tmp)
    tmp = re.sub(r"\s*`stock_actuel`[^\n]+GENERATED ALWAYS AS[^\n]+,?\n", "\n", tmp)
    tmp = re.sub(r"\s*CONSTRAINT `\w+` FOREIGN KEY[^\n]+\n", "\n", tmp)
    tmp = re.sub(r",(\s*\n\s*\))", r"\1", tmp)

    # INSERT dans table tmp (retrait de stock_actuel)
    ins = simple_insert_ignore(insert_sql, "produits", "produits_import_tmp")
    if stock_actuel_idx >= 0:
        lines = ins.split("\n")
        out = []
        for line in lines:
            if re.match(r"\s*\(", line):
                def rm(m): return remove_col(m.group(0), stock_actuel_idx)
                line = re.sub(r"\([^()]*(?:\([^()]*\)[^()]*)*\)", rm, line)
            out.append(line)
        ins = "\n".join(out)

    # Colonnes Railway produits exactes (obtenues via SHOW COLUMNS sur Railway)
    # Railway n'a PAS: prix_achat, stock_minimum, date_modification, unite_id, stock_actuel
    RAILWAY_PRODUITS_COLS = [
        "id", "reference", "nom", "description", "categorie_id",
        "prix_unitaire", "stock_boutique", "remise", "neuf", "actif",
        "image_url", "variations_json", "date_creation", "stock_magasin",
    ]
    # Mapping dump → railway (colonnes disponibles dans produits_import_tmp)
    src_available = set(src_cols) - {"stock_actuel", "unite_id"}
    select_parts, dst_parts = [], []
    for rc in RAILWAY_PRODUITS_COLS:
        src_col = "image" if rc == "image_url" else rc
        if src_col in src_available:
            select_parts.append(f"`{src_col}`" + (" AS `image_url`" if rc == "image_url" else ""))
            dst_parts.append(f"`{rc}`")
    dst_list = ", ".join(dst_parts)
    src_list = ", ".join(select_parts)

    return f"""\
-- ════════════════════════════════════════════════════════════════════════
-- PRODUITS : import via table temporaire (image→image_url, sans stock_actuel)
-- ════════════════════════════════════════════════════════════════════════

-- 1. Table temporaire
{tmp.strip()}

-- 2. Données brutes
{ins.strip()}

-- 3. Migration vers produits Railway
INSERT IGNORE INTO `produits` ({dst_list})
SELECT {src_list}
FROM `produits_import_tmp`;

-- 4. Nettoyage
DROP TABLE IF EXISTS `produits_import_tmp`;
"""

# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("Reading dump...", file=sys.stderr)
    sql   = read_dump(DUMP_FILE)
    blocks = split_dump(sql)
    print(f"Found {len(blocks)} tables.", file=sys.stderr)

    print(textwrap.dedent("""\
        -- ════════════════════════════════════════════════════════════════════════
        -- MIGRATION : togol2600657 → Railway MySQL
        -- Généré automatiquement — import sécurisé (INSERT IGNORE partout)
        -- ════════════════════════════════════════════════════════════════════════
        SET NAMES utf8mb4;
        SET TIME_ZONE='+00:00';
        SET FOREIGN_KEY_CHECKS=0;
        SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

    """))

    for (table, create, insert) in blocks:

        if table in SKIP_TABLES:
            print(f"-- ⏭  SKIP `{table}`\n", file=sys.stderr)
            print(f"-- IGNORÉ: `{table}`\n"); continue

        # ── produits ──
        if table == "produits":
            print(f"-- ✅ produits (migration spéciale)", file=sys.stderr)
            print(produits_block(create, insert)); continue

        # ── tables à renommer ──
        local_name = RENAME_AS_LOCAL.get(table)
        if local_name:
            print(f"-- ✅ `{table}` → `{local_name}` (renommé)", file=sys.stderr)
            print(f"-- ─── `{table}` sauvegardé sous `{local_name}` ───")
            if create: print(clean_create(create, new_name=local_name))
            if insert: print(simple_insert_ignore(insert, table, local_name))
            print(); continue

        # ── tables Railway avec mapping de colonnes ──
        if table in COLUMN_MAPS:
            col_map  = COLUMN_MAPS[table]
            src_cols = parse_create_columns(create)
            print(f"-- ✅ `{table}` INSERT IGNORE avec mapping colonnes", file=sys.stderr)
            print(f"-- ─── `{table}` (données existantes préservées) ───")
            if insert:
                print(remap_insert(insert, table, src_cols, col_map))
            print(); continue

        # ── autres tables Railway existantes (skip silencieux) ──
        if table in RAILWAY_TABLES:
            print(f"-- ⏭  SKIP `{table}` (existe Railway, schéma incompatible)", file=sys.stderr)
            print(f"-- IGNORÉ: `{table}` (table Railway gérée par l'application)\n"); continue

        # ── nouvelles tables ──
        print(f"-- ✅ NOUVELLE `{table}`", file=sys.stderr)
        print(f"-- ─── `{table}` ───")
        if create: print(clean_create(create))
        if insert: print(simple_insert_ignore(insert, table))
        print()

    print(textwrap.dedent("""\
        -- ════════════════════════════════════════════════════════════════════════
        -- FIN DE MIGRATION
        -- ════════════════════════════════════════════════════════════════════════
        SET FOREIGN_KEY_CHECKS=1;
    """))
    print("Done.", file=sys.stderr)

if __name__ == "__main__":
    main()
