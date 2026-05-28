#!/usr/bin/env bash

# =============================================================================
# deploy_frontend.sh — Rebuild & restart ONLY the frontend container.
#
# ✅ SAFE: never touches database volumes or any other service.
# ⚠️  NEVER use `docker compose down -v` — that deletes ALL data volumes.
# =============================================================================

set -e

COMPOSE="docker compose -f deploy/docker-compose.prod.yml"
ENV_FILE="deploy/.env"

echo "=========================================================="
echo "  Tumaini AI — Frontend-Only Safe Deploy"
echo "=========================================================="

# Ensure .env is present at project root (where compose env_file reads from)
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found! Create it from the template first."
    exit 1
fi
cp "$ENV_FILE" .env
echo "  ✓ Environment file ready"

# Build only the frontend image from latest source
echo "[1/2] Building frontend image..."
$COMPOSE --env-file "$ENV_FILE" build frontend

# Restart only the frontend container — all other services & data UNTOUCHED
echo "[2/2] Restarting frontend container (all data volumes are SAFE)..."
$COMPOSE --env-file "$ENV_FILE" up -d --no-deps frontend

echo ""
echo "=========================================================="
echo "  ✅ Frontend deployed! All data is intact."
echo "=========================================================="
