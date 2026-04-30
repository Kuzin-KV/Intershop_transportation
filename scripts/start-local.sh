#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python3}"
NPM_BIN="${NPM_BIN:-npm}"

cd "$PROJECT_ROOT"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Python not found: $PYTHON_BIN"
  exit 1
fi

if ! command -v "$NPM_BIN" >/dev/null 2>&1; then
  echo "npm not found: $NPM_BIN"
  exit 1
fi

echo "Preparing local database..."
bash "$PROJECT_ROOT/scripts/setup-local.sh"

echo "Installing backend dependencies..."
"$PYTHON_BIN" -m pip install -r "$PROJECT_ROOT/backend/requirements-local.txt"

echo "Starting local API on http://127.0.0.1:8000 ..."
"$PYTHON_BIN" "$PROJECT_ROOT/backend/local_api.py" &
API_PID=$!

sleep 1

echo "Starting frontend on http://127.0.0.1:5173 ..."
"$NPM_BIN" run dev -- --host 127.0.0.1 &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping services..."
  kill "$API_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM
wait
