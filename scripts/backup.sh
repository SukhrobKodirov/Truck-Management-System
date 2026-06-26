#!/usr/bin/env bash
# =============================================================================
# backup.sh — Truck Management System backup script
# Backs up the SQLite DB and .env to /var/backups/truckms/
# Keeps last 7 daily backups. Optionally syncs to AWS S3.
#
# Usage:
#   ./scripts/backup.sh
#   ./scripts/backup.sh --s3   (also upload to S3)
#
# Cron (daily at 2am):
#   0 2 * * * /opt/truck-management/scripts/backup.sh >> /var/log/truckms-backup.log 2>&1
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/truckms}"
DB_FILE="${PROJECT_DIR}/backend/truckms.db"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="truckms_backup_${TIMESTAMP}"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [backup]"
UPLOAD_S3=false

# ── Parse flags ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  [[ "$arg" == "--s3" ]] && UPLOAD_S3=true
done

# ── Setup ─────────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "$BACKUP_PATH"

echo "${LOG_PREFIX} Starting backup → ${BACKUP_PATH}"

# ── Back up SQLite database ───────────────────────────────────────────────────
if [[ -f "$DB_FILE" ]]; then
  # Use SQLite's online backup to avoid corruption during a live write
  sqlite3 "$DB_FILE" ".backup '${BACKUP_PATH}/truckms.db'"
  echo "${LOG_PREFIX} Database backed up ✓"
else
  # If running in Docker, copy from volume via container
  echo "${LOG_PREFIX} Local DB not found, trying Docker volume..."
  docker cp truckms_backend:/app/truckms.db "${BACKUP_PATH}/truckms.db" 2>/dev/null \
    && echo "${LOG_PREFIX} Database copied from Docker container ✓" \
    || echo "${LOG_PREFIX} WARNING: Could not find database file"
fi

# ── Back up .env ──────────────────────────────────────────────────────────────
if [[ -f "${PROJECT_DIR}/.env" ]]; then
  cp "${PROJECT_DIR}/.env" "${BACKUP_PATH}/.env.bak"
  echo "${LOG_PREFIX} .env backed up ✓"
fi

# ── Compress ──────────────────────────────────────────────────────────────────
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"
echo "${LOG_PREFIX} Compressed → ${BACKUP_NAME}.tar.gz ✓"

# ── Rotate old backups (keep last N days) ─────────────────────────────────────
find "$BACKUP_DIR" -name "truckms_backup_*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "${LOG_PREFIX} Rotated backups older than ${RETENTION_DAYS} days ✓"

# ── S3 Upload (optional) ──────────────────────────────────────────────────────
if [[ "$UPLOAD_S3" == true ]]; then
  if [[ -z "${AWS_S3_BUCKET:-}" ]]; then
    echo "${LOG_PREFIX} ERROR: AWS_S3_BUCKET not set. Skipping S3 upload."
  else
    aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
      "s3://${AWS_S3_BUCKET}/truckms-backups/${BACKUP_NAME}.tar.gz" \
      && echo "${LOG_PREFIX} Uploaded to s3://${AWS_S3_BUCKET}/truckms-backups/ ✓" \
      || echo "${LOG_PREFIX} ERROR: S3 upload failed"
  fi
fi

echo "${LOG_PREFIX} Backup complete ✓"
echo "---"
