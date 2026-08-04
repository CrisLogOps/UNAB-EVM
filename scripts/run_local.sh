#!/usr/bin/env bash
# Arranque local orientativo (API + Dashboard).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Root: $ROOT"
echo "1) Activar venv e iniciar API:  cd backend && uvicorn app.main:app --reload --port 8000"
echo "2) Activar venv e iniciar UI:   cd frontend && streamlit run app.py"
