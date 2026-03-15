#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# nn-audio  |  Database Backup Script
#
# Usage:
#   ./scripts/backup.sh                   # backs up to ./backups/
#   ./scripts/backup.sh /path/to/dir      # backs up to custom dir
#
# Requires: pg_dump, gzip
# Reads:    DATABASE_URL  env var  (or pass --url "postgresql://...")
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
BACKUP_DIR="${1:-$(dirname "$0")/../backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="nn_audio_backup_${TIMESTAMP}.sql.gz"
KEEP_DAYS=30          # local backups older than this are deleted

# ── Parse DATABASE_URL ────────────────────────────────────────────────────────
DB_URL="${DATABASE_URL:-}"
if [[ -z "$DB_URL" ]]; then
  # Try loading from .env in backend dir
  ENV_FILE="$(dirname "$0")/../.env"
  if [[ -f "$ENV_FILE" ]]; then
    export $(grep -v '^#' "$ENV_FILE" | grep DATABASE_URL | xargs)
    DB_URL="${DATABASE_URL:-}"
  fi
fi

if [[ -z "$DB_URL" ]]; then
  echo "❌  DATABASE_URL is not set. Export it or put it in backend/.env"
  exit 1
fi

# ── Create backup dir ─────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Run pg_dump ───────────────────────────────────────────────────────────────
OUTFILE="${BACKUP_DIR}/${FILENAME}"
echo "📦  Dumping database..."
pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  --format=plain \
  | gzip > "$OUTFILE"

SIZE=$(du -sh "$OUTFILE" | cut -f1)
echo "✅  Backup saved: $OUTFILE ($SIZE)"

# ── Prune old local backups ───────────────────────────────────────────────────
echo "🧹  Removing local backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -name "nn_audio_backup_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete

echo ""
echo "────────────────────────────────────────────"
echo " Backup complete: ${FILENAME}"
echo " Location:        ${BACKUP_DIR}"
echo "────────────────────────────────────────────"
