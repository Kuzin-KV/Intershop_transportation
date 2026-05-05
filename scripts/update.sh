#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"

echo "==> Updating project in: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

echo "==> Fetching latest changes from origin/$BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Installing frontend dependencies"
npm install

echo "==> Installing backend dependencies"
python3 -m pip install -r backend/requirements-local.txt

echo "==> Applying DB setup/migrations"
bash scripts/setup-local.sh

echo "==> Building frontend"
npm run build

echo "==> Restarting services"
sudo systemctl restart intershop-backend intershop-frontend
sudo systemctl reload nginx

echo "==> Checking service status"
sudo systemctl --no-pager --full status intershop-backend intershop-frontend

echo "==> Done. Project updated successfully."
