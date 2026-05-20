#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env next to restore script: $ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing docker-compose.yml next to restore script: $COMPOSE_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
POSTGRES_DB="${POSTGRES_DB:-passwdman2}"
POSTGRES_USER="${POSTGRES_USER:-passwdman2}"

BACKUP_FILE="${1:-}"
TEST_CONTAINER="${RESTORE_TEST_CONTAINER:-passwdman2-restore-test-db}"
TEST_DB="${RESTORE_TEST_DB:-passwdman2_restore_test}"
TEST_USER="${RESTORE_TEST_USER:-$POSTGRES_USER}"
TEST_PASSWORD="${RESTORE_TEST_PASSWORD:-restore_test_password}"
TEST_PORT="${RESTORE_TEST_PORT:-15432}"

if [ -z "$BACKUP_FILE" ]; then
  BACKUP_FILE="$(
    find "$BACKUP_DIR" \
      -maxdepth 1 \
      -name "passwdman2-postgres-*.dump" \
      -type f \
      | sort \
      | tail -n 1
  )"
fi

if [ -z "$BACKUP_FILE" ]; then
  echo "No backup files found in: $BACKUP_DIR" >&2
  echo "Usage: $0 [/path/to/passwdman2-postgres-YYYYmmddTHHMMSSZ.dump]" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file does not exist: $BACKUP_FILE" >&2
  echo "Usage: $0 [/path/to/passwdman2-postgres-YYYYmmddTHHMMSSZ.dump]" >&2
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -Fxq "$TEST_CONTAINER"; then
  echo "Restore test container is already running: $TEST_CONTAINER" >&2
  echo "Stop it first with: docker stop $TEST_CONTAINER" >&2
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq "$TEST_CONTAINER"; then
  docker rm "$TEST_CONTAINER" >/dev/null
fi

echo "Starting isolated restore test container: $TEST_CONTAINER"
docker run -d \
  --name "$TEST_CONTAINER" \
  -e POSTGRES_DB="$TEST_DB" \
  -e POSTGRES_USER="$TEST_USER" \
  -e POSTGRES_PASSWORD="$TEST_PASSWORD" \
  -p "$TEST_PORT:5432" \
  postgres:16-alpine >/dev/null

cleanup() {
  if [ "${KEEP_RESTORE_TEST_CONTAINER:-false}" != "true" ]; then
    docker stop "$TEST_CONTAINER" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "Waiting for test PostgreSQL to become ready."
until docker exec "$TEST_CONTAINER" pg_isready -U "$TEST_USER" -d "$TEST_DB" >/dev/null 2>&1; do
  sleep 1
done

echo "Restoring backup into isolated test database."
docker exec -i "$TEST_CONTAINER" pg_restore \
  -U "$TEST_USER" \
  -d "$TEST_DB" \
  --clean \
  --if-exists \
  < "$BACKUP_FILE"

echo "Restore completed. Verifying restored tables."
docker exec "$TEST_CONTAINER" psql \
  -U "$TEST_USER" \
  -d "$TEST_DB" \
  -v ON_ERROR_STOP=1 \
  -c "\\dt"

docker exec "$TEST_CONTAINER" psql \
  -U "$TEST_USER" \
  -d "$TEST_DB" \
  -v ON_ERROR_STOP=1 \
  -c "select count(*) as users_count from users;"

echo "Restore test passed using backup: $BACKUP_FILE"

if [ "${KEEP_RESTORE_TEST_CONTAINER:-false}" = "true" ]; then
  echo "Test container kept running: $TEST_CONTAINER"
  echo "Stop it manually with: docker stop $TEST_CONTAINER"
fi
