#!/usr/bin/env bash
# =============================================================================
# setup_crons.sh — Install all cron jobs for Truck Management System
# Run once on your server after deploy.
# =============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="${PROJECT_DIR}/scripts"

# Make all scripts executable
chmod +x "${SCRIPTS_DIR}"/*.sh

echo "Installing cron jobs for TruckMS..."

# Write cron jobs — preserves any existing crontab entries
(crontab -l 2>/dev/null || true; cat <<EOF

# ── TruckMS scheduled tasks ───────────────────────────────────────────────────
# Daily backup at 2:00 AM (with S3 upload if configured)
0 2 * * * ${SCRIPTS_DIR}/backup.sh --s3 >> /var/log/truckms-backup.log 2>&1

# Health check every 5 minutes
*/5 * * * * ${SCRIPTS_DIR}/health_check.sh >> /var/log/truckms-health.log 2>&1

# Weekly backup cleanup — ensure old logs don't fill disk (runs Sundays 3am)
0 3 * * 0 find /var/log -name "truckms-*.log" -size +50M -delete
# ─────────────────────────────────────────────────────────────────────────────
EOF
) | crontab -

echo "Cron jobs installed ✓"
echo ""
echo "Verify with: crontab -l"
echo "View backup logs: tail -f /var/log/truckms-backup.log"
echo "View health logs: tail -f /var/log/truckms-health.log"
