#!/usr/bin/env bash
# Desarrollo: plataforma completa en Docker (Postgres + API + Next.js).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ss -ltn 2>/dev/null | grep -q ':3000 '; then
  echo "El puerto 3000 está ocupado (suele ser npm run dev en el host)."
  echo "Detén ese proceso para que Docker monte la plataforma en :3000, o usa el compose igual en :3000 tras liberarlo."
fi

echo "Levantando desarrollo local: db + api + web"
docker compose up -d --build

echo "Esperando API…"
for _ in $(seq 1 40); do
  if curl -sf http://localhost:8000/health >/dev/null; then
    break
  fi
  sleep 1
done
curl -s http://localhost:8000/health || true
echo

if ! curl -sf http://localhost:8000/api/v1/mvp/status >/dev/null; then
  echo "Aplicando migraciones al Postgres local…"
  DATABASE_URL="${DATABASE_URL:-postgresql://postgres:openevm@localhost:54322/postgres}" \
    "$ROOT/scripts/apply_db.sh"
fi

echo
echo "Desarrollo local"
echo "  Plataforma: http://localhost:3000/demo"
echo "  API:        http://localhost:8000/health"
echo "  Postgres:   localhost:54322"
echo
echo "Producción (Supabase, validación de terceros):"
echo "  export SUPABASE_DB_URL='postgresql://…supabase…'"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
echo "  Guía: docs/local-mvp.md"
