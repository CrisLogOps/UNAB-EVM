#!/usr/bin/env bash
# Placeholder reemplazado: usar scripts/apply_db.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/scripts/apply_db.sh"
