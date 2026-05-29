#!/usr/bin/env bash
# ─── Deploy to Hetzner (afrisika.com) ─────────────────────────────
# Usage: ./deploy-hetzner.sh
# Requires: SSH key access to root@178.105.157.67

set -e

HOST="root@178.105.157.67"
APP_DIR="/opt/afrisika"
COMPOSE_FILE="docker-compose.prod.yml"
BRANCH="saas"

echo ""
echo "🚀  Deploy → Hetzner (afrisika.com)"
echo "────────────────────────────────────"

# 1. Push local saas branch first
echo "▸ git push origin $BRANCH..."
git push origin "$BRANCH"

# 2. SSH: pull + rebuild
echo "▸ SSH → $HOST"
ssh "$HOST" bash -s <<EOF
  set -e
  cd "$APP_DIR"
  echo "  pulling $BRANCH..."
  git pull origin "$BRANCH"
  echo "  rebuilding containers..."
  docker compose -f "$COMPOSE_FILE" down
  docker compose -f "$COMPOSE_FILE" up -d --build
  echo "  done."
EOF

echo ""
echo "✅  Deployed! → https://afrisika.com"
echo ""
