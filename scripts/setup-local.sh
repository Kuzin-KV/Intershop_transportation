#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA="t_p68114469_cross_platform_logis"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGSUPERUSER="${PGSUPERUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"

export PGPASSWORD

PSQL=(psql -h "$PGHOST" -p "$PGPORT" -U "$PGSUPERUSER" -v ON_ERROR_STOP=1)

echo "Preparing local database..."
"${PSQL[@]}" -d postgres -f "$PROJECT_ROOT/scripts/init_local_db.sql"
"${PSQL[@]}" -d logistics_local -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA} AUTHORIZATION logistics_user; ALTER SCHEMA ${SCHEMA} OWNER TO logistics_user;"

TABLE_EXISTS="$("${PSQL[@]}" -d logistics_local -t -A -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${SCHEMA}' AND table_name = 'users');")"
if [[ "${TABLE_EXISTS//[[:space:]]/}" != "t" ]]; then
  echo "Applying migrations..."
  while IFS= read -r -d '' migration; do
    "${PSQL[@]}" -d logistics_local -f "$migration"
  done < <(find "$PROJECT_ROOT/db_migrations" -maxdepth 1 -type f -name 'V*.sql' -print0 | sort -z)
fi

"${PSQL[@]}" -d logistics_local -c "GRANT USAGE ON SCHEMA ${SCHEMA} TO logistics_user; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${SCHEMA} TO logistics_user; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${SCHEMA} TO logistics_user; ALTER DEFAULT PRIVILEGES IN SCHEMA ${SCHEMA} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO logistics_user; ALTER DEFAULT PRIVILEGES IN SCHEMA ${SCHEMA} GRANT USAGE, SELECT ON SEQUENCES TO logistics_user;"

echo "Local DB is ready."
