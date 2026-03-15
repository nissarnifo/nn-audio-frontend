#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# nn-audio  |  Database Restore Script
#
# Usage:
#   ./scripts/restore.sh ./backups/nn_audio_backup_2024-01-01_00-00-00.sql.gz
#
# ⚠️  THIS WILL DROP AND RECREATE ALL TABLES — run only when you mean to restore
# Requires: psql, gunzip
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_FILE="${1:-}"

# ── Validate input ────────────────────────────────────────────────────────────
if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: ./scripts/restore.sh <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh "$(dirname "$0")/../backups/"*.sql.gz 2>/dev/null || echo "  (none found in ./backups/)"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "❌  File not found: $BACKUP_FILE"
  exit 1
fi

# ── Parse DATABASE_URL ────────────────────────────────────────────────────────
DB_URL="${DATABASE_URL:-}"
if [[ -z "$DB_URL" ]]; then
  ENV_FILE="$(dirname "$0")/../.env"
  if [[ -f "$ENV_FILE" ]]; then
    export $(grep -v '^#' "$ENV_FILE" | grep DATABASE_URL | xargs)
    DB_URL="${DATABASE_URL:-}"
  fi
fi

if [[ -z "$DB_URL" ]]; then
  echo "❌  DATABASE_URL is not set."
  exit 1
fi

# ── Confirm ───────────────────────────────────────────────────────────────────
echo ""
echo "⚠️  WARNING: This will restore the database from:"
echo "   $BACKUP_FILE"
echo ""
echo "   Target DB: $DB_URL"
echo ""
read -p "   Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "Aborted."
  exit 0
fi

# ── Restore ───────────────────────────────────────────────────────────────────
echo ""
echo "🔄  Restoring database..."
gunzip -c "$BACKUP_FILE" | psql "$DB_URL"

echo ""
echo "✅  Restore complete from: $BACKUP_FILE"
echo "   Run 'npx prisma migrate deploy' if schema migrations are needed."
