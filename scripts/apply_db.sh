#!/usr/bin/env bash
# Aplica migraciones y seed contra Postgres local (Docker) o DATABASE_URL (Supabase hosted).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${DATABASE_URL:-postgresql://postgres:openevm@localhost:54322/postgres}"

echo "Aplicando esquema MVP en: ${URL%%@*}@…"
psql "$URL" -v ON_ERROR_STOP=1 -f "$ROOT/database/migrations/001_mvp.sql"
psql "$URL" -v ON_ERROR_STOP=1 -f "$ROOT/database/seeds/002_mvp_demo.sql"
echo "Listo. Tablas: mvp_tenants, mvp_snapshots, mvp_projects, mvp_kickoffs, mvp_knowledge."
