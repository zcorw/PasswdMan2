#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env next to backup script: $ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing docker-compose.yml next to backup script: $COMPOSE_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

POSTGRES_DB="${POSTGRES_DB:-passwdman2}"
POSTGRES_USER="${POSTGRES_USER:-passwdman2}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

cd "$SCRIPT_DIR"

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
BACKUP_FILE="$BACKUP_DIR/passwdman2-postgres-$TIMESTAMP.dump"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting backup."
echo "Backup target: $BACKUP_FILE"

docker compose exec -T postgres pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -Fc \
  > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"

find "$BACKUP_DIR" \
  -name "passwdman2-postgres-*.dump" \
  -type f \
  -mtime +"$BACKUP_RETENTION_DAYS" \
  -delete

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup completed."
