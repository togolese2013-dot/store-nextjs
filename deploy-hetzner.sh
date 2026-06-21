#!/usr/bin/env bash
# ─── Deploy to Hetzner (afrisika.com) ─────────────────────────────
# Usage: ./deploy-hetzner.sh
# Requires: SSH key access to root@178.105.157.67

set -e

HOST="root@178.105.157.67"
APP_DIR="/opt/afrisika"
BRANCH="saas"

echo ""
echo "Deploy → Hetzner (afrisika.com)"
echo "────────────────────────────────────"

# 1. Push local branch
echo "> git push origin $BRANCH..."
git push origin "$BRANCH"

# 2. SSH: pull + build + copy static + restart
echo "> SSH → $HOST"
ssh "$HOST" bash -s <<EOF
  set -e
  cd "$APP_DIR"
  git pull origin "$BRANCH"
  BACKEND_URL=http://127.0.0.1:3002 npm run build
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/static
  cp -rf public .next/standalone/public
  pm2 startOrRestart ecosystem.config.js --update-env
  echo "done."
EOF

echo ""
echo "Deployed! → https://afrisika.com"
echo ""
