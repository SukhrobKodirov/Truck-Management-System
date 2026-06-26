#!/usr/bin/env bash
# =============================================================================
# health_check.sh — Monitor Truck Management System health
# Alerts via email or Slack webhook if any endpoint is down.
#
# Usage:
#   ./scripts/health_check.sh
#
# Cron (every 5 minutes):
#   */5 * * * * /opt/truck-management/scripts/health_check.sh >> /var/log/truckms-health.log 2>&1
# =============================================================================

set -euo pipefail

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [health]"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:80}"
ALERT_EMAIL="${ALERT_EMAIL:-}"          # e.g. admin@yourdomain.com
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"      # Slack incoming webhook URL
FAIL_COUNT=0

# ── Check function ────────────────────────────────────────────────────────────
check_endpoint() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [[ "$STATUS" == "$expected" ]]; then
    echo "${LOG_PREFIX} ✓ ${name} — HTTP ${STATUS}"
  else
    echo "${LOG_PREFIX} ✗ ${name} — HTTP ${STATUS} (expected ${expected})"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILURES+=("${name}: HTTP ${STATUS}")
  fi
}

# ── Checks ────────────────────────────────────────────────────────────────────
FAILURES=()
check_endpoint "API health"    "${BACKEND_URL}/health"
check_endpoint "API loads"     "${BACKEND_URL}/api/loads/"
check_endpoint "Frontend"      "${FRONTEND_URL}"

# ── Alert if any failures ─────────────────────────────────────────────────────
if [[ $FAIL_COUNT -gt 0 ]]; then
  MSG="🚨 TruckMS Alert — ${FAIL_COUNT} check(s) failed on $(hostname) at $(date):"
  for f in "${FAILURES[@]}"; do MSG="${MSG}\n  • ${f}"; done

  echo -e "${LOG_PREFIX} ALERT: ${MSG}"

  # Email alert
  if [[ -n "$ALERT_EMAIL" ]] && command -v mail &>/dev/null; then
    echo -e "$MSG" | mail -s "TruckMS Health Alert" "$ALERT_EMAIL"
    echo "${LOG_PREFIX} Email alert sent to ${ALERT_EMAIL}"
  fi

  # Slack alert
  if [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\": \"${MSG}\"}" "$SLACK_WEBHOOK" > /dev/null
    echo "${LOG_PREFIX} Slack alert sent"
  fi

  # Try auto-restart if Docker is available
  if command -v docker &>/dev/null; then
    echo "${LOG_PREFIX} Attempting container restart..."
    cd "$(dirname "$0")/.."
    docker compose restart && echo "${LOG_PREFIX} Containers restarted"
  fi

  exit 1
fi

echo "${LOG_PREFIX} All systems healthy ✓"
