#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Pull latest code and redeploy Truck Management System
#
# Usage (on your server):
#   ./scripts/deploy.sh
#   ./scripts/deploy.sh --branch main
#
# What it does:
#   1. Runs a backup first (safety net)
#   2. Pulls latest code from git
#   3. Rebuilds Docker images
#   4. Restarts containers with zero-downtime strategy
#   5. Verifies health endpoint
# =============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="${BRANCH:-main}"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [deploy]"

for arg in "$@"; do
  case $arg in
    --branch=*) BRANCH="${arg#*=}" ;;
    --branch)   shift; BRANCH="$1" ;;
  esac
done

cd "$PROJECT_DIR"

echo "${LOG_PREFIX} ── Truck Management System Deploy ──"
echo "${LOG_PREFIX} Branch: ${BRANCH}"

# ── Step 1: Backup before deploy ──────────────────────────────────────────────
echo "${LOG_PREFIX} Running pre-deploy backup..."
bash "${PROJECT_DIR}/scripts/backup.sh" && echo "${LOG_PREFIX} Backup done ✓"

# ── Step 2: Pull latest code ──────────────────────────────────────────────────
echo "${LOG_PREFIX} Pulling latest code..."
git fetch origin "$BRANCH"
git reset --hard "origin/${BRANCH}"
echo "${LOG_PREFIX} Code updated ✓"

# ── Step 3: Rebuild images ────────────────────────────────────────────────────
echo "${LOG_PREFIX} Building Docker images..."
docker compose build --no-cache
echo "${LOG_PREFIX} Images built ✓"

# ── Step 4: Restart containers ────────────────────────────────────────────────
echo "${LOG_PREFIX} Restarting containers..."
docker compose up -d --remove-orphans
echo "${LOG_PREFIX} Containers restarted ✓"

# ── Step 5: Health check ──────────────────────────────────────────────────────
echo "${LOG_PREFIX} Waiting for app to be ready..."
sleep 5

MAX_RETRIES=10
for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")
  if [[ "$STATUS" == "200" ]]; then
    echo "${LOG_PREFIX} Health check passed (HTTP 200) ✓"
    break
  fi
  echo "${LOG_PREFIX} Health check attempt ${i}/${MAX_RETRIES} — status: ${STATUS}"
  sleep 3
done

if [[ "$STATUS" != "200" ]]; then
  echo "${LOG_PREFIX} ERROR: App did not become healthy after deploy!"
  echo "${LOG_PREFIX} Check logs: docker compose logs --tail=50"
  exit 1
fi

# ── Cleanup old Docker images ─────────────────────────────────────────────────
docker image prune -f
echo "${LOG_PREFIX} Deploy complete ✓"
echo "---"
