#!/usr/bin/env bash
# ============================================================
# backup-db-local.sh — Local MySQL backup for Togolese Shop
# Usage: ./scripts/backup-db-local.sh [output_dir]
# Default output: ~/Desktop/backups-db/
# ============================================================

set -euo pipefail

# --- Config (reads from .env.local if present) ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [[ -f "$ENV_FILE" ]]; then
  export $(grep -E '^(DB_HOST|DB_PORT|DB_USER|DB_PASSWORD|DB_NAME)=' "$ENV_FILE" | xargs)
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:?DB_USER not set}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD not set}"
DB_NAME="${DB_NAME:?DB_NAME not set}"

# --- Output directory ---
OUTPUT_DIR="${1:-$HOME/Desktop/backups-db}"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"
OUTPUT_PATH="$OUTPUT_DIR/$FILENAME"

# --- Backup ---
echo "🗄️  Backup: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "📁 Destination: $OUTPUT_PATH"
echo ""

mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$DB_NAME" \
  | gzip > "$OUTPUT_PATH"

SIZE=$(du -sh "$OUTPUT_PATH" | cut -f1)
echo "✅ Backup terminé — $FILENAME ($SIZE)"
echo ""

# --- Nettoyage automatique : garder les 10 derniers backups ---
KEEP=10
COUNT=$(ls -1 "$OUTPUT_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
if [[ $COUNT -gt $KEEP ]]; then
  TO_DELETE=$((COUNT - KEEP))
  echo "🧹 Suppression des $TO_DELETE plus anciens backups (garde $KEEP)..."
  ls -1t "$OUTPUT_DIR"/${DB_NAME}_*.sql.gz | tail -n "$TO_DELETE" | xargs rm -f
fi

echo "📦 Backups disponibles dans $OUTPUT_DIR :"
ls -lh "$OUTPUT_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | awk '{print "   " $5 "  " $9}'
