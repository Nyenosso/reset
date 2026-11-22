#!/usr/bin/env bash
# Test het databaseschema + Row Level Security tegen een tijdelijke lokale PostgreSQL.
# Vereist PostgreSQL-binaries (initdb/pg_ctl/psql). Gebruik: bash scripts/test-rls.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}"
[ -x "$PGBIN/initdb" ] || PGBIN="$(dirname "$(command -v initdb)")"
DIR="$(mktemp -d)"
RUN=""
if [ "$(id -u)" = "0" ]; then chown postgres "$DIR"; RUN="runuser -u postgres --"; fi
cleanup() { $RUN "$PGBIN/pg_ctl" -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
$RUN "$PGBIN/initdb" -D "$DIR/data" -A trust -U postgres >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$DIR/data" -o "-k $DIR -p 54329 -c listen_addresses=''" -l "$DIR/log" start >/dev/null
PSQL=("$PGBIN/psql" -h "$DIR" -p 54329 -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$ROOT/supabase/tests/auth_stub.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261122000000_fightlab_schema.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261122000000_fightlab_schema.sql" # idempotent
"${PSQL[@]}" -f "$ROOT/supabase/tests/rls_test.sql"
