#!/usr/bin/env bash

# =============================================================================
# launch.sh — Full Tumaini AI Production Deploy Script
#
# ⚠️  CRITICAL RULES — NEVER BREAK THESE:
# ─────────────────────────────────────────────────────────────────────────────
#  1. NEVER use `docker compose down -v` — -v deletes ALL database volumes
#     (all user data, CVs, jobs, shortlists permanently destroyed).
#  2. `up -d --build` is SAFE — it rebuilds images and restarts containers
#     WITHOUT touching persistent data volumes.
#  3. For frontend-only changes, use: bash deploy/deploy_frontend.sh
# =============================================================================

set -e

COMPOSE="docker compose -f deploy/docker-compose.prod.yml"
ENV_FILE="deploy/.env"

echo "=========================================================="
echo "  Tumaini AI — Full Production Deploy"
echo "=========================================================="

# ── Step 1: Ensure .env exists in BOTH locations compose looks ──────────────
echo "[1/5] Setting up environment variables..."

# The deploy/.env is the canonical secret store on the server.
# docker-compose.prod.yml looks for ../.env (= project root) AND .env (deploy/).
# We copy to the project root so the env_file directive always finds it.

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found!"
    echo "  Create it with your secrets. Example values are in .env.template"
    exit 1
fi

# Always keep root .env in sync with deploy/.env so compose env_file picks it up
cp "$ENV_FILE" .env
echo "  ✓ Environment file ready"

# ── Step 2: Build + start all containers (volumes are NEVER touched) ─────────
echo "[2/5] Building images and starting containers (data volumes are SAFE)..."
$COMPOSE --env-file "$ENV_FILE" up -d --build

# ── Step 3: Wait for identity DB to be healthy ───────────────────────────────
echo "[3/5] Waiting for databases to be healthy..."
MAX_WAIT=60
WAITED=0
until $COMPOSE --env-file "$ENV_FILE" exec -T identity-db \
    pg_isready -U "${POSTGRES_USER:-tumaini}" -d auth_db > /dev/null 2>&1; do
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo "ERROR: identity-db did not become healthy in ${MAX_WAIT}s"
        exit 1
    fi
done
echo "  ✓ Databases healthy"

# ── Step 4: Run identity migrations ──────────────────────────────────────────
echo "[4/5] Running database migrations..."
$COMPOSE --env-file "$ENV_FILE" exec -T -w /app/services/identity identity \
    python -m alembic upgrade head
echo "  ✓ Migrations applied"

# ── Step 5: Seed admin user (idempotent — safe to run every time) ────────────
echo "[5/6] Seeding admin user (skipped if already exists)..."
docker cp services/identity/seed_admin.py \
    "$(docker compose -f deploy/docker-compose.prod.yml ps -q identity):/app/services/identity/seed_admin.py"
$COMPOSE --env-file "$ENV_FILE" exec -T -w /app/services/identity identity \
    python seed_admin.py
echo "  ✓ Admin user ready (admin@tumaini.ai)"

# ── Step 6: Seed demo jobs (idempotent — skips if jobs already exist) ────────
echo "[6/6] Seeding demo jobs (skipped if jobs already exist)..."
docker cp services/job/seed_jobs.py \
    "$(docker compose -f deploy/docker-compose.prod.yml ps -q job):/app/services/job/seed_jobs.py"
$COMPOSE --env-file "$ENV_FILE" exec -T -w /app/services/job job \
    python seed_jobs.py
echo "  ✓ Demo jobs ready"

# ── Caddy reload (optional) ───────────────────────────────────────────────────
if [ -f "deploy/Caddyfile" ] && command -v caddy &>/dev/null; then
    echo "[+] Refreshing Caddy proxy..."
    cp deploy/Caddyfile /etc/caddy/Caddyfile
    systemctl reload caddy
    echo "  ✓ Caddy reloaded"
fi

echo ""
echo "=========================================================="
echo "  ✅ Deployment complete! Tumaini AI is live."
echo "  Login: admin@tumaini.ai / AdminPassword123!"
echo "=========================================================="
